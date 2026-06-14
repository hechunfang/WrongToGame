import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import {
  bootstrapDatabaseSchema,
  getOrCreateUser,
  saveWrongQuestion,
  getWrongQuestionsForUser,
  saveOrCreateEnglishScene,
  savePdfReport,
  getPdfReportsForUser,
  uploadBase64ToOSS,
  uploadBufferToOSS,
  usePromoCode,
  createPromoCode,
  getPromoterStats,
  getDbStatus
} from "./src/utils/cloudStorageAndDb";
import { buildExamPDF } from "./src/utils/pdfGenerator";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request body limits to handle image uploads safely
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini GenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Mock fallback questions database in case API is not configured or fails
const fallbacks = [
  {
    type: "math",
    target_topic: "7的乘法口诀",
    target_display: "找出 7 × 8 的正确答案！",
    correct_sequence: ["56"],
    grid_items: ["54", "56", "49", "64", "63", "42"],
    question_display: "找出 7 × 8 的正确答案！",
    correct_answer: "56",
    wrong_answers: ["54", "49", "64", "63", "58"]
  },
  {
    type: "chinese_pinyin",
    target_topic: "前后鼻音分辨",
    target_display: "找出汉字‘橙’的正确拼音！",
    correct_sequence: ["chéng"],
    grid_items: ["chén", "chéng", "céng", "cén", "chěng", "shéng"],
    question_display: "找出汉字‘橙’的正确拼音！",
    correct_answer: "chéng",
    wrong_answers: ["chén", "céng", "cén", "chěng", "shéng"]
  },
  {
    type: "chinese_words",
    target_topic: "形近字近义词连连看",
    target_display: "连连看：拼出‘检查’与‘拨打’的正确组合！",
    correct_sequence: [["检", "查"], ["拨", "打"]],
    grid_items: ["检", "拔", "拨", "查", "打", "河"],
    question_display: "连连看：拼出‘检查’与‘拨打’的正确组合！",
    correct_answer: "检查/拨打",
    wrong_answers: ["查", "拨", "打", "拔"]
  },
  {
    type: "english_spelling",
    target_topic: "常见名词拼写",
    target_display: "按顺序拼出单词：【朋友】(friend)",
    correct_sequence: ["f", "r", "i", "e", "n", "d"],
    grid_items: ["f", "e", "r", "i", "n", "d", "a", "t"],
    text_reference: "friend",
    question_display: "按顺序拼出单词：【朋友】(friend)",
    correct_answer: "friend",
    wrong_answers: ["e", "r", "i", "n", "a", "t"],
    english_scene_sentence: "He is my best friend.",
    english_scene_translation: "他是我的好朋友。",
    english_scene_image: "friend"
  },
  {
    type: "chinese_words",
    target_topic: "易错字识字：甘 (甘甜/甘苦)",
    target_display: "连连看：拼出‘甘甜’及‘甘苦’的正确汉字！",
    correct_sequence: [["甘", "甜"], ["甘", "苦"]],
    grid_items: ["甘", "甜", "干", "苦", "心", "干"],
    question_display: "请在大地鼠中拼出正确的‘甘甜’和‘甘苦’（注意区分‘甘’与‘干’）！",
    correct_answer: "甘",
    wrong_answers: ["干", "杆", "古", "甜"]
  }
];

// GET API for health checking and troubleshooting
app.get("/api/health", (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: "ok",
    message: "API is awake and running!",
    database: {
      healthy: dbStatus.healthy,
      host: dbStatus.host,
      databaseName: dbStatus.database,
      errorFeedback: dbStatus.lastError || "None"
    }
  });
});

// POST API for question diagnostic using Gemini API
app.post("/api/analyze-question", async (req, res) => {
  try {
    const { image, phone } = req.body;
    const finalPhone = phone || "13800138000";

    if (!image) {
      return res.status(400).json({
        error: "Missing image parameter",
        fallback: fallbacks[0]
      });
    }

    // 1. Resolve parent user account from MySQL
    const user = await getOrCreateUser(finalPhone);

    // 2. Upload raw image to Hong Kong Aliyun OSS
    let rawImageUrl = "";
    try {
      if (typeof image === "string" && image.startsWith("data:image")) {
        const destPath = `wrong_questions/user_${user.id}/raw_${Date.now()}_${Math.floor(Math.random() * 100000)}.jpg`;
        console.log(`[OSS] Uploading base64 image chunk of user ${user.id} to Aliyun OSS...`);
        rawImageUrl = await uploadBase64ToOSS(image, destPath);
      } else {
        // Fallback or static mock reference URL
        rawImageUrl = typeof image === "string" && image.startsWith("http")
          ? image
          : `https://${process.env.OSS_BUCKET || "wrong-questions-bucket"}.oss-cn-hongkong.aliyuncs.com/mocks/sample_wrong_math.jpg`;
      }
      console.log(`[OSS] Uploaded image successfully mapped to: ${rawImageUrl}`);
    } catch (ossErr: any) {
      console.error("⚠️ Aliyun OSS upload failed, proceeding with local mock image:", ossErr.message);
      rawImageUrl = "https://wrong-questions-bucket.oss-cn-hongkong.aliyuncs.com/mocks/fallback_image.jpg";
    }

    // Intercept local sample mock sheets to avoid uploading non-base64 SVG data URLs to Gemini API
    if (typeof image === "string" && !image.startsWith("data:image")) {
      let mockData = fallbacks[0];
      let source = "local_sample_0";

      if (image.includes("7 × 8 = 52")) {
        console.log("Interceded local Sample 0: 7的乘法口诀");
        mockData = fallbacks[0];
        source = "local_sample_0";
      } else if (image.includes("橙子") || image.includes("ceng")) {
        console.log("Interceded local Sample 1: 语文拼音");
        mockData = fallbacks[1];
        source = "local_sample_1";
      } else if (image.includes("拨打") || image.includes("连连看")) {
        console.log("Interceded local Sample 2: 组词连连看");
        mockData = fallbacks[2];
        source = "local_sample_2";
      } else if (image.includes("甘甜") || image.includes("甘字") || image.includes("gan") || image.includes("干甜") || image.includes("gān")) {
        console.log("Interceded local Sample 4: 语文错字甘甜");
        mockData = fallbacks[4];
        source = "local_sample_4";
      } else if (image.includes("friend") || image.includes("freind") || image.includes("english") || image.includes("Jim")) {
        console.log("Interceded local Sample 3: 英语拼写");
        mockData = fallbacks[3];
        source = "local_sample_3";
      } else if (image.startsWith("data:image/svg+xml")) {
        console.log("Interceded custom SVG template, returning math fallback.");
        mockData = fallbacks[0];
        source = "local_sample_svg";
      } else {
        // Any other pure string fallback
        mockData = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        source = "string_image_fallback";
      }

      // Record mock item into history MySQL to allow consistent dashboard tracking
      const mockSubject = mockData.type === "math" ? "数学逻辑" : mockData.type === "english_spelling" ? "英语核心" : "语文素养";
      const mockWrongWord = mockData.correct_answer || "预置错题";
      
      const mockMarkdown = `
# 📝 【AI智能教研室】预置课例解析报告
**错题考点**: ${mockData.target_topic}
**科目类型**: ${mockSubject}

## 🎯 思维漏洞剖析
本题是经典的小学生部编版必遇绊脚石。孩子往往由于瞬时的脑力和视觉疲劳，产生了字符位置偏差或声母偏旁混淆。
通过精心策划的专项练习及亲子游戏能帮助孩子克服短板！
      `.trim();

      await saveWrongQuestion(user.id, mockSubject, rawImageUrl, mockWrongWrongWord(mockWrongWord), mockMarkdown);
      
      return res.json({
        success: true,
        source,
        data: mockData,
        rawImageUrl
      });
    }

    function mockWrongWrongWord(w: any): string {
      return typeof w === "string" ? w : "形近字近义词";
    }

    if (!ai) {
      console.warn("GEMINI_API_KEY not configured. Using high-fidelity local math synthesis fallback.");
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      
      const fallbackSubject = randomFallback.type === "math" ? "数学逻辑" : randomFallback.type === "english_spelling" ? "英语单词" : "语文素质";
      const fallbackWrongWord = randomFallback.correct_answer || "易错点";
      const fallbackMarkdown = `
# 📝 【AI智能教研室】模拟学情分析报告
**错题考点**: ${randomFallback.target_topic}

该分析报告为模拟离线精制版。由于系统未注入 Gemini 密钥，我们根据大纲知识图谱为您调配了该科目的高频强化试题。
      `.trim();

      await saveWrongQuestion(user.id, fallbackSubject, rawImageUrl, mockWrongWrongWord(fallbackWrongWord), fallbackMarkdown);

      return res.json({
        success: true,
        source: "math_generator_offline_db",
        data: randomFallback,
        rawImageUrl
      });
    }

    // Process base64 image data for standard API request
    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.includes("base64,")) {
      const parts = image.split("base64,");
      const match = image.match(/^data:([^;]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
      base64Data = parts[1];
    }

    // Call Gemini 3.5 Flash for image processing (free to use, very fast)
    console.log("Analyzing image with gemini-3.5-flash...");
    const prompt = `你是一位卓越的少儿教育专家与智慧游戏化学特训设计师。在分析用户上传的试卷、作业照片时，请严格遵守以下【通用图片识别与内容纠错协议】：

# 【核心纯净原则 (Strict Pure-Focus Rule)】：
1. 必须100%仅针对本次用户上传图片里【被红笔圈出、划线、打问号、打叉(✖)或写有扣分分数值、批改痕迹的那个具体错点/字词/题型】进行纯净的字元/字符/公式提取。不要限死或绑定某一个特定的学科大类，根据具体的错误迹象分析。
2. 绝对不准混杂、带入任何图片里未出现过的其它无关生僻题目或生词。
3. 诊断和生成的提分内容必须全心全意100%围绕上传错题里的实际考点、字形、拼音或算因公式进行，保持本张提分卷的最高精准度和纯净指引。

# Image Recognition Protocol (通用图片识别与定位)
1. 识别教师批改符号（核心）：
   - 寻找【红笔圈出的地方】或【红笔划线、打问号、画✖叉号】等错误区域，提取其中的具体生词、公式、声调、拼音、简答。
   - 区分“对勾”与“订正痕迹”：即便大勾在，也寻找微弱手写擦拭/修改信息并分析生字。

2. 关注拼音、字形、符号、公式的微小差异：
   - 细节核对：是否多写一划、少写一划，拼音声调是否方向偏转，或者算式数值是否写别了。

3. 模糊与错位补偿：
   - 对部分由于手机拍照产生的模糊或反光字迹，结合上下文去多重核验，并设计出高度关联的相似混淆自适应项。

4. 结构化游戏化设定：
   - type: 根据内容属性设为 "chinese_words", "chinese_pinyin", "english_spelling" 或 "math"。
   - target_topic: 给该错题对应的错因知识点（必须在第一句指出核心要点，例如：“常考易错字词/拼音辨析”或“算式计算纠错”），简洁明确。
   - target_display: 极味儿童化游戏引导语，如：“请找出正确的地鼠！”
   - correct_sequence: 放正解答案字符组成的各个单独字符组成的数组（如 ["甘"] 或拼音字母/数字计算字符）。
   - grid_items: 生成包含 correct_sequence 并带有高度针对性混淆项的 6 至 9 个小扁平字符块，供打地鼠时辨认和挑选。
   - english_scene_sentence: 额外生成一句话语场景简单的配图例句（若适用）。
   - english_scene_translation: 对应例句的中文大意翻译。
   - english_scene_image: 用于场景表示的童趣名词。
   - question_display, correct_answer 和 wrong_answers 做好兼容字段写入定义。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "Must be 'math' or 'chinese_pinyin' or 'chinese_words' or 'english_spelling'"
            },
            target_topic: {
              type: Type.STRING
            },
            target_display: {
              type: Type.STRING
            },
            correct_sequence: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            grid_items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            english_scene_sentence: {
              type: Type.STRING
            },
            english_scene_translation: {
              type: Type.STRING
            },
            english_scene_image: {
              type: Type.STRING
            },
            question_display: {
              type: Type.STRING
            },
            correct_answer: {
              type: Type.STRING
            },
            wrong_answers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["type", "target_topic", "target_display", "correct_sequence", "grid_items"]
        }
      }
    });

    const text = response.text?.trim() || "";
    console.log("Gemini API Response Text:", text);

    try {
      const parsedData = JSON.parse(text);

      // Save valid query output to wrong_questions table
      const subName = parsedData.type === "math" ? "数学逻辑" : parsedData.type === "english_spelling" ? "英语单词" : "语文识字";
      const wrongWord = parsedData.correct_answer || (parsedData.correct_sequence && parsedData.correct_sequence[0]) || "错题知识点";
      
      const aiAnalysisMarkdown = `
# 📝 【AI智能教研室】多模态错题学情靶向剖析
**考点类别**: ${parsedData.target_topic}
**针对类型**: ${subName}

## 🔍 学生漏写与心理溯源
本次错题发生在 **${parsedData.target_topic}** 领域。当小学生在手写完成本次练习时，可能面临偏旁不合拢、拼音声调前后鼻音不敏捷或乘法口诀瞬时记忆偏离的情况。这种记忆“开小差”在部编版低段极富普适度，属于知识构建的自然节点。

## 🛡️ 智能消灭策略
我们已自动为孩子定制了专属的**打地鼠对焦游戏**、以及可由家长直接打印下载的**举一反三特训练习纸**！通过一键消灭死角，能显著增加孩子的学习热忱。
      `.trim();

      await saveWrongQuestion(user.id, subName, rawImageUrl, String(wrongWord), aiAnalysisMarkdown);

      // If english_spelling, register to english_scenes table
      if (parsedData.type === "english_spelling" && parsedData.correct_answer) {
        const sceneImg = `https://${process.env.OSS_BUCKET || "wrong-questions-bucket"}.oss-cn-hongkong.aliyuncs.com/scenes/${parsedData.english_scene_image || "friend"}.jpg`;
        await saveOrCreateEnglishScene(
          parsedData.correct_answer,
          sceneImg,
          parsedData.english_scene_sentence || "A good English sentence.",
          parsedData.english_scene_translation || "一句经典的英文例句翻译。"
        );
      }

      return res.json({
        success: true,
        source: "gemini_diagnosis",
        data: parsedData,
        rawImageUrl
      });
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON, returning generated fallback.", parseError);
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({
        success: true,
        source: "rescue_generator",
        data: randomFallback,
        rawImageUrl
      });
    }
  } catch (error: any) {
    console.error("Error in /api/analyze-question:", error);
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return res.json({
      success: true,
      source: "error_fallback_generator",
      message: error.message || "An error occurred",
      data: randomFallback
    });
  }
});

// POST API for generating a personalized custom exam paper with custom school names & expert advice
app.post("/api/generate-exam", async (req, res) => {
  try {
    const { schoolName, topic, type, correctAnswer } = req.body;
    const finalSchool = schoolName?.trim() || "北京市第一实验小学";
    const finalTopic = topic || "7的乘法口诀";
    const finalType = type || "math";
    const finalAnswer = correctAnswer || "56";

    // 1. Build a local high-fidelity generator that acts as both fallback and default
    const getLocalCustomExam = () => {
      let misconception = "";
      let questionsList: any[] = [];
      let parentGuideStr = "";
      let quote = "";

      if (finalType === "math") {
        misconception = `孩子在运算“${finalTopic}”时易出现瞬时计算偏离。这是因为小学中低年级对算理的条件反射尚未形成。通过将九九乘法与加法递推相结合（比如${finalAnswer}往前推一个7是49，往后数一个7是63），能在脑海中建立多边网状检查机制，从而彻底杜绝马虎！`;
        questionsList = [
          {
            id: 1,
            title: `【第1步 · 基础筑基练】请快速算出比原题更小一级的积，并写出计算式：\n7 × 7 = _________ ，你发现它与原题 7 × 8 有什么规律联系吗？`,
            choices: [],
            hint: "💡 宝贝提示：利用你背得最熟的 7 × 7 = 49 哦！在49的基础上，再多加一个 7，就能交叉验证 7 × 8 的得数啦！",
            parentCheckKey: "标准答案为 49。批改指出：引导孩子把九九乘法看作‘重复连加法’，数感就会突飞猛进！"
          },
          {
            id: 2,
            title: `【第2步 · 混淆闪电战】在下排算式中，哪一个是【完全写错】的得数？请圈出来并订正它的结果：\n  A. 7 × 6 = 42\n  B. 7 × 8 = 54\n  C. 7 × 9 = 63`,
            choices: ["A. 7 × 6 = 42", "B. 7 × 8 = 54 (错误，应为56)", "C. 7 × 9 = 63"],
            hint: "💡 宝贝提示：用手指头在桌上写一写，7个加数加在一起是多大，千万别被同伴写错的答案带偏了哦！",
            parentCheckKey: "标准答案为 B 项写错了（7 × 8 应为 56）。 批改建议：孩子辨析出马虎选项后，请在旁边大声奖励一个大大的赞！"
          },
          {
            id: 3,
            title: `【第3步 · 实践小神童】森林超市准备了 7 排精美卡通笔，每排有 8 支。\n小狐狸买走了其中的 1 排，现在货架上还剩下多少支卡通笔？请列出算式解答。`,
            choices: [],
            hint: "💡 宝贝提示：还剩 7排里面的（7-1）排卡通笔，所以就是 7 × 7 支，快动笔算算看吧！",
            parentCheckKey: "标准答案可列式为：7 × (8 - 1) = 49 支（或 7 × 7 = 49 支）。批改要点：看重应用题的列式思路大于计算结果本身。"
          }
        ];
        parentGuideStr = "乘法不单是死记硬背。本周建议家长和孩子在餐桌或散步时玩‘乘法递加地鼠接力游戏’，如‘我说 7×7=49，你接着加个7是多少：56！’。通过愉快的脑力接力，让孩子学数学信心大增！";
        quote = "“数学思维的飞跃，往往发生在敢于对错题算理进行层层深究的那一瞬间。加油，你是最棒的小数学家！”";
      } else if (finalType === "chinese_pinyin") {
        misconception = `拼音韵母中“${finalTopic}”对拼读敏捷度要求较高。中低年级孩子常常因为舌位不准，分不清楚前鼻音（如-n结尾）和后鼻音（如-ng结尾，需要声带后部共鸣）。这并非不聪明，而是发音肌肉习惯尚未定型，需要在朗读时夸张练习口型。`;
        questionsList = [
          {
            id: 1,
            title: `【第1步 · 读音大阅兵】请大声读一读下列两组汉字拼音，在(  )里画出对应的舌位或写出你的韵母：\n  晨 (chén) ➡ 发音时，舌尖要顶住上齿龈。( 韵母是：________ )\n  成 (chéng) ➡ 发音像宽敞的钟声，声共鸣有力。( 韵母是：________ )`,
            choices: [],
            hint: "💡 宝贝提示：发 -n 时嘴唇往外咧，发 -ng 时喉咙就像吞鸡蛋那样饱满。大声练习两遍吧！",
            parentCheckKey: "答案：chén韵母为 en；chéng韵母为 eng。批改：听孩子的发音是否饱满，给予拥抱肯定。"
          },
          {
            id: 2,
            title: `【第2步 · 啄木鸟纠错】看拼音写词语大挑战中，小熊写了下面句子的拼音，请找出写错拼音的那个词并改正：\n  “树林里的 chéng zi ( 橙子 ) 熟了，金黄金黄的，在 bái fèn ( 白嫩 ) 的树梢上招手。”\n  写错的拼音是：_________________ ， 正确应拼写为：_________________`,
            choices: [],
            hint: "💡 宝贝提示：‘白嫩’的‘嫩’（nèn）千万不要拼成前后鼻音混淆的‘fèn’或‘lèn’哦，仔细拼一拼口型！",
            parentCheckKey: "答案：写错的是 bái fèn（嫩字是后鼻音鼻音 n 与发音差异，应拼为 bái nèn）。批改指引：表扬孩子在形近字和音近字上的闪电眼力！"
          },
          {
            id: 3,
            title: `【第3步 · 句语口诀连连】“橙红橘绿，香飘满园”。请将加点字的正确生字拼音连线：\n  ① 柳梢黄【 橙 】( chéng ) 🌟        🌟  A. 前鼻音韵母 (-en)\n  ② 早起清【 晨 】( chén )  🌟        🌟  B. 后鼻音韵母 (-eng)`,
            choices: [],
            hint: "💡 宝贝提示：‘橙’是后鼻音，发音饱满；‘晨’是前鼻音，发音像风吹草地，轻轻收起。",
            parentCheckKey: "标准答案：①-B ； ②-A。 批改建议：剪下此区域，每天晚上当做拼读过卡小挑战，孩子一定能成拼音大王！"
          }
        ];
        parentGuideStr = "带声调的拼音是拼读的物理基石。家长可以利用孩子学玩的时间，玩‘大声吼拼音’游戏：将 en 与 eng 夸张发声比赛，谁发的声音大又正确，谁就得一颗提分星。激发孩子主动纠音的欲望！";
        quote = "“拼音是开启汉字宝库的魔术钥匙。当我们读准了每个音节，书里的小精灵就会跟我们一起跳舞唱歌啦！”";
      } else if (finalType === "chinese_words") {
        misconception = `汉字“${finalTopic}”中易错的缘由多在“不理解汉字偏旁部首的表意指示”。比如“甘”字包含一口甘甜的美物，代表心意极甜，所以“甘甜/甘苦”里用“甘”；而“干”常指干燥或干活。如果让孩子知道部首含义，形近字就永远不会再写错！`;
        questionsList = [
          {
            id: 1,
            title: `【第1步 · 形近字变魔术】请对比“甘”和“干”，根据意思挑选正确的字填空并临摹：\n  ① 在逆境中磨砺，品尝生活中的 (     ) 苦（代表甜与苦）。\n  ② 爸爸辛勤一整天，在田里 (     ) 农活（代表劳作）。`,
            choices: [],
            hint: "💡 宝贝提示：心里甜、口中甜的‘甘’字饱含内含一横；干燥干活的‘干’字只有十加一哦！",
            parentCheckKey: "标准答案：① 甘； ② 干。批改重点：字能写在田字格中央，端正不超出格子。"
          },
          {
            id: 2,
            title: `【第2步 · 错字小侦探】下面的组词被小淘气故意写错了，请找出写错的那一个并圈出来改正：\n  A. 心甘情愿\n  B. 检查作业\n  C. 拔打电话`,
            choices: ["A. 心甘情愿", "B. 检查作业", "C. 拨打电话"],
            hint: "💡 宝贝提示：打电话呼叫手要动，所以要有‘手’（扌提手旁）代表‘拨弄’。拔萝卜才是和朋友使劲往上拔哦！",
            parentCheckKey: "标准答案：C 项写错了，‘拔打电话’ 应改正为 ‘拨打电话’。批改建议：如果孩子找出来了，立刻发他一个小太阳徽章！"
          },
          {
            id: 3,
            title: `【第3步 · 抄写与双声词临摹】把括号中代表手部动作的加点字部首重新分类并填空：\n  【 打、检、拔、查、拨、树 】\n  ① 含有“扌”提手旁（代表主动操作）的字：(               ) (               )\n  ② 含有“木”字旁（代表用木头工具或树木）的字：(               ) (               )`,
            choices: [],
            hint: "💡 宝贝提示：用眼睛认真观察字体的偏旁。有了提手就是动作，有了木字就是树林，很容易分清楚吧！",
            parentCheckKey: "标准答案：① 打/拔/拨（任选两个）； ② 检/查/树。 批改：表扬孩子结构清晰，字迹整洁！"
          }
        ];
        parentGuideStr = "通过字理识字法教汉字是最有效的手段。孩子错写的字，一般是笔画死记硬背产生了断连。家长可在辅导时把字的演变画成趣图，如“甘”代表嘴里含着一块红糖。趣味汉字课，孩子爱学不累！";
        quote = "“每个汉字都是一段生动智慧的传奇画卷。读懂画中的部首秘密，你就是博古通今的识字小神童！”";
      } else if (finalType === "english_spelling") {
        misconception = `单词 spelling 中对“${finalTopic}”存在瞬时记忆混淆。常见于 friend 单词，由于字母i和e并排发音，常被拼错为 'freind'。这类错误属于典型的元音字母组合字母顺序颠倒，需要利用分音节拼读法则 (fri-end) 引导孩子将长单词拆开并用肌肉记忆写下。`;
        questionsList = [
          {
            id: 1,
            title: `【第1步 · 字母归位拼写】请看着卡片提示把淘气的英文字母拼成正确单词，并在本题英文划线上美观临摹：\n  f - r - i - e - n - d  ➡ 意思是[朋友]， 字母正确复原为：_________________\n  （温馨提示：i 在 e 的前面哦！）`,
            choices: [],
            hint: "💡 宝贝提示：试着把这个词分成两段记忆，前面是 ‘fri’（星期五的前半截），后面是 ‘end’（终点代表天长地久）。拼在一起就是最好的朋友！",
            parentCheckKey: "标准答案为 friend。批改建议：看孩子是否将字母对准四线三格，保持字母大小适中、不悬空。"
          },
          {
            id: 2,
            title: `【第2步 · 音节分类大闯关】下列哪一个单词的元音字母组合在书写时【不合群】？请圈出写错的词：\n  A. My freind Jim is very happy today.\n  B. The green tree is very high and healthy.\n  C. We have a beautiful school in Beijing.`,
            choices: [],
            hint: "💡 宝贝提示：快看 A 选项里的 ‘freind’，i 跑到了 e 的后面，不小心摔跤啦，赶紧扶它改正过来写在旁边！",
            parentCheckKey: "标准答案：A 项中的单词 freind 错了，应拼为 friend。批改：奖励孩子在找茬纠错挑战中过关！"
          },
          {
            id: 3,
            title: `【第3步 · 趣味看图配对句】请根据情境将下面零散的句词积木工整重新组合，拼成通顺语句：\n  [ is ]  [ Jim ]  [ classmates ]  [ best ]  [ my ]  [ . ]\n  你的规范英文书写：________________________________________`,
            choices: [],
            hint: "💡 宝贝提示：英语最喜欢像搭积木一样，把“谁”放在最前面，然后加上“怎么样/是什么”，首字母 J 要大写哦！",
            parentCheckKey: "标准答案：Jim is my best classmates. (或 my best classmate / classmate is Jim)。批改：检查句首字母大写及句尾有无英文实心圆点。"
          }
        ];
        parentGuideStr = "英文拼写是英语基础。辅导时，请不要采取反复抄写20遍的机械惩罚式方法，而是要教孩子‘自然拼读指代法’。在大白纸上用红笔标出元音组合 -ie-，用手指在大白纸上描红描出深层手指肌肉记忆，效果提升！";
        quote = "“English is a fascinating language of musical rhythm. Spell each syllable step-by-step, and you'll write beautiful stories soon!”";
      } else {
        // English oral / general English
        misconception = `句子口语口头翻译中，对中英文在“限定修饰语位置（如时间、地点、形容词短语位置）”的语序习惯产生了母语负迁移。英文通常把大而复杂的地点或修饰性介词短语（如 in the park）放在句子最尾部，而中文习惯放在动作前面。通过在特训中对比，就能彻底理顺句感！`;
        questionsList = [
          {
            id: 1,
            title: `【第1步 · 语序超级对对碰】请仔细对比下面两句英文语序，把最贴合地道英语书写习惯的那句选出来写括号内：\n  “我和好朋友一同去学校。”\n  (      )\n  A. I with my best friend go to school together.\n  B. I go to school with my best friend together.`,
            choices: ["A. 经典中式英语语序", "B. 规范地道英文动词在先语序"],
            hint: "💡 宝贝提示：英语最急性子，说完了‘谁’(I)之后，迫不及待地想要‘先发出动作’(go)哦，所以选跑得最快的主谓句！",
            parentCheckKey: "标准答案为 B。批改要点：引导孩子读出两个句子的语调差距，感知动词在上的顺畅感。"
          },
          {
            id: 2,
            title: `【第2步 · 句子拼装积木】下面的句子积木不小心倒啦，请在英文线上将它按正确顺序连成一句连贯话：\n  [ in the park ]  [ meet ]  [ I ]  [ yesterday ]  [ Jim ] .\n  你的规范小作文答题：________________________________________`,
            choices: [],
            hint: "💡 宝贝提示：地点 (in the park) 和 昨天时间 (yesterday) 都是害羞的小姑娘，在英语世界里最喜欢躲在句子的最后尽头，千万不要请错它们啦！",
            parentCheckKey: "标准答案：I meet Jim in the park yesterday. (或 Yesterday I meet Jim in the park.)。批改：表扬孩子把时间和地点归位正确。"
          },
          {
            id: 3,
            title: `【第3步 · 智能替换连连看】看句型变身，将 \"cold\" (冰冷的) 替换成 \"healthy\" (健康的)，把 \"juice\" (果汁) 替换成 \"milk\" (牛奶)，写一写这句元气满满的新句子吧：\n  \"I love to drink cold strawberry juice.\"\n  ➡ 替换后的英文手写行：________________________________________`,
            choices: [],
            hint: "💡 宝贝提示：直接把对应的单词擦掉换成新词就行啦，拼写要注意字母之间的贴附间距哦！",
            parentCheckKey: "标准答案：I love to drink healthy strawberry milk. 批改重点：每个小单词之间预留一指的呼吸空间，纸面会相当美观！"
          }
        ];
        parentGuideStr = "孩子不敢说英文或句式混杂是因为怕错。请多和孩子玩‘拼装卡片积木游戏’：把主语、动词、宾语、时间地点写在卡片纸上由他拼，通过手脑拼，让英语和母语双核驱动，顺畅无比！";
        quote = "“大声说英语，就像鸟儿在清晨高歌一样欢快。相信自己，你说的每句话都像春天一样动听芬芳！”";
      }

      return {
        examTitle: `【${finalSchool}】定制 · 举一反三学情专项消灭特训提分卷`,
        schoolHeader: `${finalSchool} · AI个性化教研中心独家呈献`,
        studentGreeting: `亲爱的 ${finalSchool} 的小火伴：\n在今天的错题闯关特训中，你像个小勇士一样消灭了众多地鼠！为了巩固胜利果实，老师和AI小博士为你专门调配了这份限时专项提分卷。我们只针对今天的薄弱点【${finalTopic}】发力。相信你拿起手写笔后，稍微动脑就能全部全对，一跃成为真正的‘错题消灭超凡宗师’！`,
        misconceptionAnalysis: misconception,
        questions: questionsList,
        motivationalQuote: quote,
        parentPrepingGuide: parentGuideStr
      };
    };

    if (!ai) {
      console.warn("GEMINI_API_KEY is missing. Rendering highly customized, localized model-like content fallback on-the-fly.");
      const customLocalResult = getLocalCustomExam();
      return res.json({
        success: true,
        source: "local_customized_generator",
        data: customLocalResult
      });
    }

    // Call Gemini with high fidelity schema mapping and strict guidance
    console.log("Calling Gemini 3.5 Flash to generate custom personalized examination sheet dynamically...");
    const systemInstructionPrompt = `你是一位备受家长和学生尊崇的特级小学名师，精通“全国新课标大纲”与“小学生成长发展心理学”。你精通“学情逆水行舟”式教学，能够根据孩子在打地鼠特训中的典型错题，用最富童趣、最富鼓励温和性的口语风格，设计出一份能深度消灭其错题原因、带校名装饰、可供家长裁剪下直接进行亲子批改的专属高阶 A4 定制测试卷。
    
    请严格根据用户请求的数据产生特配：
    1. 学生所在的校名（必须用在 schoolHeader 及 examTitle 中突出其专属高端感，例如：[schoolName] ）
    2. 诊断的知识点（例如 [topic] 如：甘/干形近字辨析）
    3. 短板类型：[type] (math / chinese_pinyin / chinese_words / english_spelling / english_oral 之一)
    4. 正确的答案字词（如 [correctAnswer]）

    你需要返回一份包含丰富教研含金量的 JSON 文本。其中核心板块具体要求如下：
    - examTitle: 霸气的标题，例如包含 “【[schoolName]】精英班专属 · 个性化靶向消灭特训”
    - schoolHeader: 包含校名和教研中心字样
    - studentGreeting: 极其温柔、充满仪式感的小勇士寄语，必须提孩子所在的学校名 [schoolName]，用童言童语激发其对该考点 [topic] 的战胜信心，不要用干巴巴的指令。
    - misconceptionAnalysis: 专门为孩子量身写的、非常深刻感性的“思维盲区大剖析”。指出为什么很多孩子在这里马虎、写错。引导孩子看到是脑回路跟笔画/发音/算理在开玩笑，教他如何识破玩笑。
    - questions: 必须提供恰好 3 道层次不同的训练题：
      * 第1题 [基础变形题]：把原题进行轻微的变性包装（如果是数学换个数、如果是语文换个拼音组词），帮助稳固最基本的正确概念。
      * 第2题 [混淆辨析题]：主动引入最具破坏力的视觉/脑力混淆选项（如形近字把甘甜写成干甜、拼音的前后鼻音、英语freind/friend倒置等），教孩子如何做“小侦探”一眼揪出假冒伪劣地鼠。
      * 第3题 [迁移应用题]：多以童话森林、买玩具、分苹果、写拼音小日记等真实小学生日常场景，考查孩子对这个核心薄弱考点的实际应用能力。
      * 每一题必须有 title（包含题目和答题空等完整描述）、hint（专门面向孩子的通关暗示，含有‘💡 宝贝提示：...’，带有启发性）和 parentCheckKey（专门面向家长的参考指导，包含‘标准答案为...批改指引为...’，用语极度赞赏孩子）。选项choices数组如果没有在题干中合并，可以单独提供，否则留空数组。
    - motivationalQuote: 一句能够激发小孩子无穷求知欲、可以当做座右铭的鼓励金句。
    - parentPrepingGuide: 专门写给家长的心理疏导与亲子陪读攻略。不要使用说教词汇，要给出实操方法，比如怎么玩接龙、发星星奖励，怎么给予温暖的怀抱来建立亲子和谐共同战胜困难的同盟，而不是对成绩不耐烦。

    必须返回 100% 满足所提供 responseSchema 结构的纯 JSON 对象，不要用 markdown 格式包裹！`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `请针对：
          学校 [schoolName]: "${finalSchool}"
          短板考点 [topic]: "${finalTopic}"
          学科类型 [type]: "${finalType}"
          正确答案 [correctAnswer]: "${finalAnswer}"
          进行智能提分卷命题。`
        }
      ],
      config: {
        systemInstruction: systemInstructionPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examTitle: { type: Type.STRING },
            schoolHeader: { type: Type.STRING },
            studentGreeting: { type: Type.STRING },
            misconceptionAnalysis: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  choices: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  hint: { type: Type.STRING },
                  parentCheckKey: { type: Type.STRING }
                },
                required: ["id", "title", "hint", "parentCheckKey"]
              }
            },
            motivationalQuote: { type: Type.STRING },
            parentPrepingGuide: { type: Type.STRING }
          },
          required: ["examTitle", "schoolHeader", "studentGreeting", "misconceptionAnalysis", "questions", "motivationalQuote", "parentPrepingGuide"]
        }
      }
    });

    const text = response.text?.trim() || "";
    console.log("Exam Generation Gemini API JSON response:", text);

    try {
      const parsedData = JSON.parse(text);
      return res.json({
        success: true,
        source: "gemini_exam_generator",
        data: parsedData
      });
    } catch (parseError) {
      console.error("Failed to parse Gemini generated exam as JSON, returning formatted custom fallback.", parseError);
      const customLocalResult = getLocalCustomExam();
      return res.json({
        success: true,
        source: "local_customized_rescue_generator",
        data: customLocalResult
      });
    }
  } catch (error: any) {
    console.error("Error in /api/generate-exam:", error);
    try {
      // In ultimate fail condition, compose safe recovery
      const finalSchool = req.body?.schoolName?.trim() || "北京市第一实验小学";
      return res.json({
        success: true,
        source: "ultimate_error_rescue_generator",
        data: {
          examTitle: `【${finalSchool}】定制 · 错题专项靶向巩固提分周练`,
          schoolHeader: `${finalSchool} · AI个性化学研教研室独家呈献`,
          studentGreeting: `亲爱的 ${finalSchool} 的小朋友：欢迎参加专项提分练！通过今天的练习，你一定会战胜马虎，变成更细心的小学霸！`,
          misconceptionAnalysis: "小孩子在知识过渡时，脑细胞容易发生瞬时的视觉或拼音识别飘逸，这很正常。在纸面上书写描红训练可以建立最顽强的实体神经通路反向核验！",
          questions: [
            {
              id: 1,
              title: "【第一题 · 心眼双查突破练】请大声读一读今日做错的知识单词，并把它工整在下方格子抄写 3 遍：",
              choices: [],
              hint: "💡 宝贝提示：一笔一划、心静气平地画，细心是一定能够成功的秘密法宝！",
              parentCheckKey: "答案：需孩子写字工整、端正。纠正偏旁不合群。"
            },
            {
              id: 2,
              title: "【第二题 · 探照灯捉迷藏例】找出并圈出下列那一组拼音或算式写错了，大声指出真凶：\n(   ) 1. 7 × 8 = 56 \n(   ) 2. 7 × 8 = 54 (错误)\n(   ) 3. 7 × 7 = 49",
              choices: [],
              hint: "💡 宝贝提示：睁大你的智慧大眼睛，真凶往往在假冒伪劣的那一项！",
              parentCheckKey: "标准答案为第2句写错了，应为 56。批改奖励：表扬孩子是一流侦探！"
            }
          ],
          motivationalQuote: "“学习就像爬大山，每战胜一个小泥坑，你就比昨天的自己站得更高、看得更远！”",
          parentPrepingGuide: "表扬比指责能释放200%的脑力！请对孩子的任何一点小进步给予大声、具体的赞美（例如：‘这笔一竖写得太挺拔啦！’），孩子一定会爱上学习！"
        }
      });
    } catch (nestedErr) {
      return res.status(500).json({ error: "Fatal error inside exam generator logic" });
    }
  }
});


// ==========================================
// NEW MYSQL & ALICLOUD OSS EXTENDED APIs
// ==========================================

// GET API: Retrieve historical wrong questions for a specified phone number
app.get("/api/wrong-questions/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await getOrCreateUser(phone);
    const list = await getWrongQuestionsForUser(user.id);
    return res.json({ success: true, list, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET API: Retrieve historical PDF reports for a specified phone number
app.get("/api/pdf-reports/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const user = await getOrCreateUser(phone);
    const reports = await getPdfReportsForUser(user.id);
    return res.json({ success: true, reports, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST API: Create or update parent details (like nicknames)
app.post("/api/update-user", async (req, res) => {
  try {
    const { phone, nickname } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: "Missing mobile phone number" });
    }
    const user = await getOrCreateUser(phone, nickname);
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST API: Redeem/activate promotional code
app.post("/api/redeem-code", async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ success: false, error: "手机号和激活码为必填项！" });
    }
    const result = await usePromoCode(phone, code);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST API: Register promoter activation code
app.post("/api/create-code", async (req, res) => {
  try {
    const { code, promoter_name, vip_days, max_uses, passcode } = req.body;
    if (!code || !promoter_name || !vip_days) {
      return res.status(400).json({ success: false, error: "激活码、推广员名称以及VIP天数为必填项！" });
    }
    const success = await createPromoCode(code, promoter_name, parseInt(vip_days), max_uses ? parseInt(max_uses) : 9999, passcode || "123456");
    return res.json({ success });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST API: Authorized Promoter/Salesperson Login Panel
app.post("/api/promoter/login", async (req, res) => {
  try {
    const { code, passcode } = req.body;
    if (!code || !passcode) {
      return res.status(400).json({ success: false, error: "推广账号(激活码)和登录密匙为必填项！" });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanPass = passcode.trim();

    // Check super admin login
    if (cleanCode === "ADMIN" && cleanPass === "admin888") {
      const stats = await getPromoterStats();
      return res.json({
        success: true,
        role: "admin",
        promoter_name: "超级总管理员",
        code: "ADMIN",
        codes: stats.codes,
        logs: stats.logs
      });
    }

    // Otherwise, fetch all stats and filter by verified promoter
    const stats = await getPromoterStats();
    const promoterCodeObj = stats.codes.find((c: any) => c.code.toUpperCase() === cleanCode);

    if (!promoterCodeObj) {
      return res.status(200).json({ success: false, error: "该推广账号(激活码)不存在！" });
    }

    // Verify passcode
    if (promoterCodeObj.passcode !== cleanPass) {
      return res.json({ success: false, error: "登录密码不正确，请核对您的6位密码！" });
    }

    // Filter activation logs belonging to this promoter only
    const filteredLogs = stats.logs.filter((l: any) => l.code.toUpperCase() === cleanCode);

    return res.json({
      success: true,
      role: "promoter",
      promoter_name: promoterCodeObj.promoter_name,
      code: promoterCodeObj.code,
      // Provide only their own records for strict privacy of other channels
      codes: [promoterCodeObj],
      logs: filteredLogs
    });

  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET API: Retrieve promo code logs and stats (Default general fallback/internal use)
app.get("/api/promoter-stats", async (req, res) => {
  try {
    const stats = await getPromoterStats();
    return res.json({ success: true, ...stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST API: Dynamic A4 PDF Compilation, Aliyun OSS Upload, Local Cleanup, and MySQL tracking
app.post("/api/generate-pdf", async (req, res) => {
  try {
    const { schoolName, studentName, topic, type, correctAnswer, phone, examData } = req.body;
    const finalPhone = phone || "13800138000";
    const finalStudent = studentName?.trim() || "小火伴";
    const finalSchool = schoolName?.trim() || "北京市第一实验小学";
    
    // Resolve user account
    const user = await getOrCreateUser(finalPhone);

    // Prepare full A4 dataset
    let finalExam = examData;
    if (!finalExam) {
      const defaultMIS = `孩子在运算“${topic || '指定考点'}”时易出现瞬时计算偏离或拼写飘逸。这属于对部编版大纲算理拼读尚未建立立体神经检查机制，属于低段常规成长过程。`;
      finalExam = {
        examTitle: `【${finalSchool}】定制 · 举一反三学情专项消灭特训提分卷`,
        schoolHeader: `${finalSchool} · AI个性化教研中心独家呈献`,
        studentGreeting: `亲爱的 ${finalSchool} 的 ${finalStudent} 同学：在今天的错题闯关特训中，你表现得棒极了！为了巩固胜利果实，老师和AI小博士为你专门调配了这份限时专项提分卷。我们只针对今天的薄弱点【${topic || '本次考点'}】发力。加油，你一定可以全部全对！`,
        misconceptionAnalysis: defaultMIS,
        questions: [
          {
            id: 1,
            title: `【第1步 · 基础巩固题】请对错题关联的核心薄弱点 [ ${topic || '基础知识点'} ] 重新抄写并拼读 3 遍，写在下方虚线上：`,
            hint: "💡 宝贝提示：慢工出细活，保持笔画或计算的严谨态度，多感知脑力细节哦！",
            parentCheckKey: "标准答案需抄写美观、端正。批改建议：在最喜欢的字迹下画个大红心鼓励！"
          },
          {
            id: 2,
            title: `【第2步 · 混淆判断大考验】关于考点 [ ${topic || '易错基础'} ]，下列哪一句话或者答案是【完全写错】的得数？请圈出来并改正：`,
            hint: "💡 宝贝提示：睁大我的智慧闪电眼，真凶就藏在答案错误的那些项！",
            parentCheckKey: `标准答案：找出含有 ${correctAnswer || '指定错项'} 的错误句段选择。批改建议：大声奖励一个抱抱！`
          }
        ],
        motivationalQuote: "“学习就像爬大山，每战胜一个小泥坑，你就比昨天的自己站得更高、看得更远！”",
        parentPrepingGuide: "多夸具体的闪光点（例如：字写得整洁、肯思考），亲子共同战胜困难是提升信心的魔法桥梁。",
        studentName: finalStudent,
        schoolName: finalSchool,
        topic: topic || "核心消灭点"
      };
    } else {
      // Fill interactive parameters
      finalExam.studentName = finalStudent;
      finalExam.schoolName = finalSchool;
      finalExam.topic = topic || "核心错题考点";
    }

    console.log(`[PDF compiler] Assembling A4 printable exam paper for user Phone: ${finalPhone}...`);
    
    // Renders the real PDF
    const tempPdfPath = await buildExamPDF(finalExam);
    console.log(`[PDF compiler] Built local temp PDF file: ${tempPdfPath}`);

    // Read the PDF binary buffer
    const fileBuffer = fs.readFileSync(tempPdfPath);

    // Store directly onto Hong Kong Aliyun OSS
    const destinationPath = `pdf_reports/user_${user.id}/exam_${Date.now()}_${Math.floor(Math.random() * 10000)}.pdf`;
    console.log(`[OSS] Uploading compiled PDF buffer to Aliyun OSS destination: ${destinationPath}`);
    const ossUrl = await uploadBufferToOSS(fileBuffer, destinationPath, "application/pdf");

    // UNLINK/DELETE local temporary PDF file immediately!
    try {
      fs.unlinkSync(tempPdfPath);
      console.log(`[Clean Up] Cleared temporary server file: ${tempPdfPath}`);
    } catch (cleanErr: any) {
      console.error("⚠️ Local unlink error:", cleanErr.message);
    }

    // Record in MySQL `pdf_reports` table
    const reportId = await savePdfReport(user.id, finalExam.examTitle, ossUrl);
    console.log(`[MySQL] Registered PDF report ID=${reportId} into pdf_reports table.`);

    return res.json({
      success: true,
      reportId,
      ossUrl,
      reportName: finalExam.examTitle
    });
  } catch (error: any) {
    console.error("❌ Fatal Error in POST /api/generate-pdf:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate specialized PDF document on Aliyun OSS"
    });
  }
});


async function startServer() {
  // Bootstrap MySQL Database Schemas dynamically
  try {
    await bootstrapDatabaseSchema();
  } catch (dbErr: any) {
    console.error("⚠️ [MySQL Startup] Failed to connect/bootstrap tables at start:", dbErr.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
