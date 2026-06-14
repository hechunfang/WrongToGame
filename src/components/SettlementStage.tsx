import React, { useState } from "react";
import { Download, Award, RefreshCw, Send, CheckCircle, Smartphone, ExternalLink, Printer, Sparkles, Loader2, BookOpen, User, Scissors, Star, Check, X } from "lucide-react";
import { DiagnosticResult } from "../types";
import { generateStandaloneHTML } from "../utils/htmlExporter";
import { generateExamHTML } from "../utils/examExporter";
import PrintPreviewModal from "./PrintPreviewModal";

interface SettlementStageProps {
  score: number;
  diagnostic: DiagnosticResult;
  onReset: () => void;
  gameEnabled?: boolean;
  parentPhone?: string;
}

// Strip tones helper for clean comparisons and guides
const cleanTone = (str: string) => {
  return str.replace(/[āáǎà]/g, "a")
            .replace(/[ēéěè]/g, "e")
            .replace(/[īíǐì]/g, "i")
            .replace(/[ōóǒò]/g, "o")
            .replace(/[ūúǔù]/g, "u")
            .replace(/[ǖǘǚǜ]/g, "u")
            .replace(/[ü]/g, "u");
};

const getTargetCharacters = (diagnostic: DiagnosticResult) => {
  const charsSet = new Set<string>();
  
  // 1. Only extract Chinese characters that are actually in correct_answer to focus strictly on the target mistake
  if (diagnostic.correct_answer) {
    for (const char of diagnostic.correct_answer) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        charsSet.add(char);
      }
    }
  }
  
  // 2. Special handling for pinyin case where correct_answer is 'chéng'
  if (charsSet.size === 0 && (diagnostic.correct_answer === "chéng" || (diagnostic.target_topic && diagnostic.target_topic.includes("橙")))) {
    charsSet.add("橙");
  }

  // 3. Fallback to correct_sequence ONLY if we still haven't found any characters (e.g. for sequence matches)
  if (charsSet.size === 0 && Array.isArray(diagnostic.correct_sequence)) {
    diagnostic.correct_sequence.forEach((item) => {
      if (Array.isArray(item)) {
        item.forEach((subItem) => {
          for (const char of String(subItem)) {
            if (/[\u4e00-\u9fa5]/.test(char)) {
              charsSet.add(char);
            }
          }
        });
      } else {
        for (const char of String(item)) {
          if (/[\u4e00-\u9fa5]/.test(char)) {
            charsSet.add(char);
          }
        }
      }
    });
  }
  
  return Array.from(charsSet);
};

const getChineseCompoundWords = (char: string) => {
  const map: Record<string, { word: string; pinyin: string; meaning: string }[]> = {
    "甘": [
      { word: "甘甜", pinyin: "gān tián", meaning: "甜美，例：泉水甘甜、蜂蜜甘甜" },
      { word: "甘苦", pinyin: "gān kǔ", meaning: "比喻生活中的幸福与艰辛" },
      { word: "甘愿", pinyin: "gān yuàn", meaning: "心甘情愿，乐意如此" },
      { word: "不甘心", pinyin: "bù gān xīn", meaning: "心里不服气、不乐意" },
    ],
    "橙": [
      { word: "橙子", pinyin: "chéng zi", meaning: "酸甜多汁的柑橘类水果" },
      { word: "橙色", pinyin: "chéng sè", meaning: "像橙子一样的鲜艳暖色" },
    ],
    "拨": [
      { word: "拨打", pinyin: "bō dǎ", meaning: "手部机械动作，如：拨打电话" },
      { word: "拨弄", pinyin: "bō nòng", meaning: "用手指或工具来回拨动物体" },
    ],
    "拔": [
      { word: "拔草", pinyin: "bá cǎo", meaning: "连根拔除杂草，如：田野拔草" },
      { word: "拔河", pinyin: "bá hé", meaning: "多人对拉一根粗绳比拼力量" },
    ],
    "检": [
      { word: "检查", pinyin: "jiǎn chá", meaning: "查看并对照标准看是否有错" },
      { word: "检测", pinyin: "jiǎn cè", meaning: "通过专门测量查核特定内容" },
    ],
    "查": [
      { word: "查错", pinyin: "chá cuò", meaning: "寻找或核对作业的遗失错漏" },
      { word: "查找", pinyin: "chá zhǎo", meaning: "寻找想要找的目标信息" },
    ],
    "甜": [
      { word: "甜美", pinyin: "tián měi", meaning: "嘴里甘甜润喉，形容美满生活" },
    ],
    "苦": [
      { word: "苦涩", pinyin: "kǔ sè", meaning: "又苦又涩的味道，比喻心情难受" },
    ]
  };
  return map[char] || [];
};

const renderChineseCompoundWordsSection = (diagnostic: DiagnosticResult) => {
  const chars = getTargetCharacters(diagnostic);
  const validCompounds: { char: string; wordList: { word: string; pinyin: string; meaning: string }[] }[] = [];
  chars.forEach((c) => {
    const list = getChineseCompoundWords(c);
    if (list.length > 0) {
      validCompounds.push({ char: c, wordList: list });
    }
  });
  if (validCompounds.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-dashed border-slate-300 space-y-3 text-left">
      <p className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1">
        <span>✍️ 【字词大变身 · 组词连连连】</span>
        <span className="text-[9px] font-medium text-slate-500">（除了生字练写，另外为您精选了组词加深记忆）：</span>
      </p>
      {validCompounds.map((item, mainIdx) => (
        <div key={mainIdx} className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 space-y-2.5">
          <p className="text-[11px] font-bold text-emerald-900 border-b border-emerald-200/50 pb-1 flex items-center gap-1.5">
            <span className="bg-emerald-600 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {mainIdx + 1}
            </span>
            关于生字 <span className="text-red-600 bg-white border border-red-200 px-1.5 py-0.5 rounded font-black text-xs">“{item.char}”</span> 的智能提分词组：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.wordList.map((wd, wIdx) => (
              <div key={wIdx} className="bg-white p-2 rounded-md border border-emerald-200/60 shadow-xs space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-800">{wd.word}</span>
                    <span className="font-mono text-[9px] text-slate-500">[{wd.pinyin}]</span>
                  </div>
                  <span className="text-[9px] text-slate-400">释义: {wd.meaning}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-sans">
                  <span className="text-[9px] font-bold text-slate-400 shrink-0">拼写描红：</span>
                  <div className="flex gap-1.5 overflow-hidden">
                    {Array.from(wd.word).map((charSymbol, charIdx) => (
                      <div key={charIdx} className="w-8 h-8 border border-red-500/40 relative bg-white flex items-center justify-center shrink-0">
                        <div className="absolute inset-y-0 left-1/2 border-l border-dotted border-red-500/25"></div>
                        <div className="absolute inset-x-0 top-1/2 border-t border-dotted border-red-500/25"></div>
                        <span className="text-xs font-black text-slate-300 select-none">
                          {charSymbol}
                        </span>
                      </div>
                    ))}
                    <span className="text-slate-300 text-xs self-center">➡</span>
                    <span className="text-[9px] font-bold text-slate-400 self-center shrink-0">双格临摹：</span>
                    {Array.from(wd.word).map((_, charIdx) => (
                      <div key={`empty-${charIdx}`} className="w-8 h-8 border-2 border-red-500/60 relative bg-white shrink-0">
                        <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderChineseCompoundWordsPrintSection = (diagnostic: DiagnosticResult) => {
  const chars = getTargetCharacters(diagnostic);
  const validCompounds: { char: string; wordList: { word: string; pinyin: string; meaning: string }[] }[] = [];
  chars.forEach((c) => {
    const list = getChineseCompoundWords(c);
    if (list.length > 0) {
      validCompounds.push({ char: c, wordList: list });
    }
  });
  if (validCompounds.length === 0) return null;
  return (
    <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-700 space-y-4 text-left">
      <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
        <span>✍️ 【多维巩固 · 四字熟词临摹栏】请描红并在右侧手工林摹 2 遍：</span>
      </p>
      {validCompounds.map((item, mainIdx) => (
        <div key={mainIdx} className="border border-slate-400 p-4 rounded-xl space-y-4 bg-white">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
            生字 <span className="text-md font-black border-2 border-slate-900 px-2 py-0.5 rounded-md text-red-600 bg-slate-50">“{item.char}”</span> 的核心提分组词积累：
          </p>
          <div className="grid grid-cols-1 gap-4">
            {item.wordList.map((wd, wIdx) => (
              <div key={wIdx} className="border border-gray-300 p-3 rounded-lg space-y-3 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{wd.word}</span>
                    <span className="font-mono text-xs text-gray-500">[{wd.pinyin}]</span>
                  </div>
                  <span className="text-xs text-slate-500 font-sans">释义：{wd.meaning}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-600 shrink-0">拼读描红：</span>
                  <div className="flex gap-2 items-center">
                    {Array.from(wd.word).map((charSymbol, charIdx) => (
                      <div key={charIdx} className="w-10 h-10 border-2 border-red-500/50 relative bg-white flex items-center justify-center">
                        <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/25"></div>
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/25"></div>
                        <span className="text-sm font-bold text-gray-300 select-none">
                          {charSymbol}
                        </span>
                      </div>
                    ))}
                    <span className="text-gray-400 font-bold px-1 shrink-0 text-xs">➡ 临摹手写 2 遍：</span>
                    {[1, 2].map((setNo) => (
                      <div key={setNo} className="flex gap-2 items-center border-l border-dashed border-gray-300 pl-2">
                        {Array.from(wd.word).map((_, charIdx) => (
                          <div key={`empty-${setNo}-${charIdx}`} className="w-10 h-10 border-2 border-red-500/70 relative bg-white">
                            <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function SettlementStage({ score, diagnostic, onReset, gameEnabled, parentPhone }: SettlementStageProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [unlockedDownload, setUnlockedDownload] = useState(false);
  const [joinedWeChat, setJoinedWeChat] = useState(false);
  const [showExporterSuccess, setShowExporterSuccess] = useState(false);
  
  // High fidelity printable A4 popup control
  const [showPrintPreview, setShowPrintPreview] = useState(!gameEnabled);
  const [isCustomPrintModalOpen, setIsCustomPrintModalOpen] = useState(false);

  // Exclusive Personal Exam generation states
  const [showExamCreator, setShowExamCreator] = useState(false);
  const [schoolNameInput, setSchoolNameInput] = useState("北京市朝阳区实验小学");
  const [studentNameInput, setStudentNameInput] = useState("小火伴");
  const [loadingExam, setLoadingExam] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<any | null>(null);
  const [examError, setExamError] = useState("");
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);

  // Dynamic Aliyun OSS public PDF direct download link states
  const [downloadOssUrl, setDownloadOssUrl] = useState<string>("");
  const [isCompilingPDF, setIsCompilingPDF] = useState(false);

  // Call the server API using Gemini for tailored exams, followed by live high density PDF compilation and Hong Kong OSS publishing!
  const handleGeneratePersonalExam = async () => {
    setLoadingExam(true);
    setExamError("");
    setGeneratedExam(null);
    setDownloadOssUrl("");
    try {
      const res = await fetch("/api/generate-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          schoolName: schoolNameInput,
          topic: diagnostic.target_topic,
          type: diagnostic.type,
          correctAnswer: diagnostic.correct_answer
        })
      });
      const parsed = await res.json();
      if (parsed.success && parsed.data) {
        setGeneratedExam(parsed.data);

        // Step 2: Now compile and publish the dynamic PDF file on Hong Kong Aliyun OSS!
        setIsCompilingPDF(true);
        try {
          const pdfRes = await fetch("/api/generate-pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              schoolName: schoolNameInput,
              studentName: studentNameInput,
              topic: diagnostic.target_topic,
              type: diagnostic.type,
              correctAnswer: diagnostic.correct_answer,
              phone: parentPhone || "13800138000",
              examData: parsed.data
            })
          });
          const pdfParsed = await pdfRes.json();
          if (pdfParsed.success && pdfParsed.ossUrl) {
            setDownloadOssUrl(pdfParsed.ossUrl);
          }
        } catch (pdfErr) {
          console.error("Failed to compile direct PDF onto HK OSS:", pdfErr);
        } finally {
          setIsCompilingPDF(false);
        }

      } else {
        setExamError(parsed.error || "智能教研中心排课拥堵，请稍后再次召唤。");
      }
    } catch (err) {
      console.error("Failed to generate personalized exam via Gemini:", err);
      setExamError("未能连上名师AI，请检查网络后再试。");
    } finally {
      setLoadingExam(false);
    }
  };

  // Simulated high-fidelity "PDF" (Packaged HTML layout) download
  const downloadGeneratedExam = () => {
    if (!generatedExam) return;
    try {
      const htmlContent = generateExamHTML(generatedExam, studentNameInput, schoolNameInput, diagnostic.target_topic);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `【${schoolNameInput}】${studentNameInput}_专属错题提分特训卷.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowDownloadSuccess(true);
      setTimeout(() => setShowDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to export personalized exam document", err);
    }
  };

  // Download the prebuilt customized standalone game as HTML!
  const downloadStandaloneGame = () => {
    try {
      const htmlContent = generateStandaloneHTML(diagnostic);
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `错题特训_${diagnostic.target_topic}_打地鼠游戏.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExporterSuccess(true);
    } catch (e) {
      console.error("Failed to trigger automatic H5 game export download", e);
    }
  };

  const handlePrintLockClick = () => {
    setShowPrintPreview(true);
  };

  const triggerNativePrint = () => {
    // Small delay to ensure browser layout is stable
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Generate 3 bespoke parallel questions based on the mistake type
  const getParallelQuestions = () => {
    const qType = diagnostic.type;
    const correctAns = diagnostic.correct_answer || (Array.isArray(diagnostic.correct_sequence) ? "56" : String(diagnostic.correct_sequence));

    if (qType === "math") {
      let multiplier = 7;
      let other = 8;
      // Extract multiplication factor
      const matchTimes = (diagnostic.question_display || "").match(/(\d+)\s*[×*x]\s*(\d+)/i);
      if (matchTimes) {
        multiplier = parseInt(matchTimes[1], 10);
        other = parseInt(matchTimes[2], 10);
      }
      
      return [
        {
          id: 1,
          desc: `请快速心算并写出下面求积算式： ${multiplier} × ${Math.max(1, other - 1)} = ____________`,
          tip: "💡 提分技巧：回想乘法口诀表中，比此题少 1 个被乘数的积，来交叉验证你的结果。"
        },
        {
          id: 2,
          desc: `请快速心算并写出下面求积算式： ${multiplier} × ${other + 1} = ____________`,
          tip: "💡 提分技巧：利用加法结合规律，相当于在原算式基础上，再增加 1 个乘数算式积。"
        },
        {
          id: 3,
          desc: `数感配对挑战： 已知 ${multiplier} × 5 = 35， 且 ${multiplier} × 3 = 21。\n请写出计算过程得： ${multiplier} × (5 + 3) = ${multiplier} × 8 = ______________`,
          tip: "💡 思维跃迁：多在草稿纸上探索加减配合，这能帮我们在高年级快速攻克多位数口算！"
        }
      ];
    } else if (qType === "chinese_pinyin") {
      return [
        {
          id: 1,
          desc: `【读音辨析】 下列汉字中，拼音与“${correctAns}”（例如“橙子”的“橙”）拼音韵母完全相同的是哪一项？请在括号内画对勾。\n(    ) 晨 (chén)     (    ) 成 (chéng)     (    ) 曾 (céng)     (    ) 尘 (chén)`,
          tip: "💡 提分技巧：注意区分前鼻音拼写『-n』与后鼻音拼写『-ng』。后鼻音发音时声带共鸣更为饱满。"
        },
        {
          id: 2,
          desc: `【声调认读与配对】 仔细读一读下列生字，读准二声音调，在括号中补完包含该音调的正确拼音：\n“柳树梢上结出了一颗变金黄色的【 橙 】(             )子。”`,
          tip: "💡 拼读常识：橙(chéng)为第二声(阳平)，发音像缓缓往上爬，嘴型放开，保持气息上扬。"
        },
        {
          id: 3,
          desc: `【拼音韵母连线】 请将左侧发音韵母，与其右侧最匹配的代表字大声读出来并连线：\n  ① -en韵母 (前鼻音)   ★               ★  A. 清(qīng) 凉 / 精(jīng) 彩\n  ② -eng韵母 (后鼻音)  ★               ★  B. 朋(péng) 友 / 乘(chéng) 客\n  ③ -ing韵母 (后鼻音)  ★               ★  C. 门(mén) 口 / 晨(chén) 光`,
          tip: "💡 记忆窍门：大声阅读能让耳朵肌肉产生长期肌肉记忆，对拼音测试题一目了然！"
        }
      ];
    } else if (qType === "chinese_words") {
      const isGan = diagnostic.correct_answer === "甘" || (diagnostic.target_topic && diagnostic.target_topic.includes("甘"));
      if (isGan) {
        return [
          {
            id: 1,
            desc: `【形近字大挑战】 仔细对比“甘”(gān)和“干”(gān/gàn)。请根据词意选择正确的生字填空：\n① 这泉水碧绿清澈，喝起来十分 (      ) 甜。(改错提醒：先前不小心写成了“干甜”哦！)\n② 妈妈为了这个家辛勤 (      ) 活，每天都非常辛苦。`,
            tip: "💡 顺口溜记忆：『甘』字里面有一横，代表甜美在口中；『干』字只有十加一，辛勤劳动出汗水！"
          },
          {
            id: 2,
            desc: `【纠错别字巡逻兵】 仔细阅读下列生字词，选择括号中不小心写错的汉字并纠正：\n“我们要学会在逆境中磨砺自己，品尝生活中的【干苦】。”\n错词中应将 (      ) 改为 (      ) ； 正确的词语应写成：(               )`,
            tip: "💡 辨析点睛：『甘苦』中的『甘』是甜美的意思，表示苦尽甘来。不要混淆写成干燥物用的『干』。"
          },
          {
            id: 3,
            desc: `【偏旁生字大阅兵】 请将括号中的汉字，按照正确的偏旁或字根重新分类工整抄写：\n【打、甘、拨、甜、苦、干】\n① 含有“甘”部件的生字 (通常代表甜美或心意) ➡ (                             ) (                             )\n② 含有“扌”提手偏旁的生字 (通常代表手部的主动操作) ➡ (                             ) (                             )`,
            tip: "💡 字形奥秘：了解偏旁的指示字义能帮我们在日常书写或词语拼写中避开所有混淆错字！"
          }
        ];
      }
      return [
        {
          id: 1,
          desc: `【形近字大挑战】 仔细对比“拨”(bō)和“拔”(bá)。请根据成语解释，选择正确的汉字填入括号中：\n① 下班路上遇到突发危险，请及时 (      ) 拨 紧急安全电话。(改错提醒：之前我们把它写成了“拔打”哦！)\n② 小池塘边的菜地里，小兔子和同伴一起 (      ) 拔 萝卜。`,
          tip: "💡 顺口溜记忆：『拨』字代表拨头发，右侧带尾发丝连；『拔』字代表和朋友拔，右侧有友带白点！"
        },
        {
          id: 2,
          desc: `【纠错别字巡逻兵】 请找出下列句子中不小心写错的【两个汉字】，圈出来并改正写在括号内：\n“学校进行的健康【拣查】已经全部完毕了，大家的身体都很温暖健康。”\n错字一：(      ) 应改为 (      )  ；  错字二：(      ) 应改为 (      )`,
          tip: "💡 辨析点睛：『检查』的『检』代表木结构仪器(木字旁)；『拣』代表手部挑挑拣拣(提手旁)，请勿混淆。"
        },
        {
          id: 3,
          desc: `【部首生字大阅兵】 请将括号中的汉字，按照正确的部首偏旁重新分类，工整抄写在下方：\n【打、检、拨、查、拔、树】\n① “木”字旁 (常代表木质器具或树木)  ➡ (                             ) (                             )\n② “扌”提手旁 (常代表手上的动作 and 操作) ➡ (                             ) (                             )`,
          tip: "💡 字形奥秘：掌握汉字的偏旁就能迅速明白这个汉字代表的动作类型，形近字再也不写错！"
        }
      ];
    } else if (qType === "english_spelling") {
      const word = correctAns.toLowerCase();
      return [
        {
          id: 1,
          desc: `【单词拼写填空】 看着卡片释义，请补充完整缺漏的辅音或元音字母：\n① 朋友：f _ _ _ n d          ② 自行车：b _ c y c _ e          ③ 学校：s c h _ _ l`,
          tip: "💡 得分要点：熟记英语双元音拼读(如friend中'i'在'e'前面)，可以大声读出词根写在练习纸上。"
        },
        {
          id: 2,
          desc: `【字母顺序大搬家】 下面是字母被打乱了的淘气单词，请帮它们恢复正常的拼写顺序：\n① e - r - i - n - d - f  (                ) ➡ 提示：Jim is my classmates' ________ .\n② o - o - k - b        (                ) ➡ 提示：She reads an interesting story ________ .\n③ u - s - n           (                ) ➡ 提示：The golden ________ shines brightly.`,
          tip: "💡 拼读窍门：根据单词的发音节拍(如fri - end)将音节分解写下，单词拼写就是这么容易！"
        },
        {
          id: 3,
          desc: `【趣味连词成句】 请将下列打乱顺序的英文单词，重新组合成句意通顺、拼写标准的句式：\nmeet / and / class / I / friend / my / at / school .\n我的标准回答书写：________________________________________`,
          tip: "💡 语法要点：英语的标准简单句结构通常为：“谁 (主语) + 动作 (谓语) + 目标对象 (宾语)”哦！"
        }
      ];
    } else {
      // English oral case
      return [
        {
          id: 1,
          desc: `【英汉智能互译】 请在下方选择一句与汉语完全相符的正确英语句子大声阅读，并在括号内写下字母。\n“在公园里，他想去见他快乐的校园伙伴吉姆。”\n(     )\n  A. She reads an interesting story book every single day.\n  B. He wants to meet his happy school friend Jim in the park.\n  C. We love playing soccer on the school field together.`,
          tip: "💡 词根记忆：记住 wants to meet 代表想要见面，friend 代表朋友，in the park 代表地点公园。"
        },
        {
          id: 2,
          desc: `【核心句型扩展】 请将主句中的形容词替换为 \"healthy\" (健康的) 和 \"fresh\" (新鲜的)，并重新手写一句漂亮的英文：\n\"I want to eat cold strawberry ice cream.\"\n英文练习线：________________________________________`,
          tip: "💡 写作精要：加入得体的修饰词(形容词)，是让句型变得生动、饱满并取得高分的高级核心技能。"
        },
        {
          id: 3,
          desc: `【语序选择挑战】 判断下列哪一句在地点短语及修饰语的使用顺序上是完全正确的（     ）。\n  A. In the park he meet his school classmates happy.\n  B. He wants to meet his happy school friend Jim in the park.\n  C. He meet Jim in the park school happy friend there.`,
          tip: "💡 结构原理：英语习惯中，时间、地点等限定性副词(如in the park)一般都要放在句子最末尾。"
        }
      ];
    }
  };

  const levelText = score >= 80 ? "满星超凡宗师" : score >= 50 ? "错题消灭达人" : "潜能爆发黑马";
  const medalEmoji = score >= 85 ? "👑" : score >= 50 ? "🏆" : "⭐";
  const parallelQuestions = getParallelQuestions();

  return (
    <>
      {/* 
        This is a master-level CSS media-print inject style.
        It bypasses container shells and backgrounds on-page, 
        ensuring that during printing, ONLY our beautiful A4 worksheet renders.
      */}
      <style>{`
        @media print {
          body, html {
            background: #ffffff !important;
            color: #0d1b2a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Completely hide the H5 smartphone shell and other page decorations */
          #app-root-container, #h5-phone-shell, #phone-status-bar, #main-branding-header, #app-footer-bar, .print\\:hidden, #settlement-stage {
            display: none !important;
          }
          /* Render ONLY the custom worksheet, making it take exactly full page page-breaks */
          #printable-a4-worksheet {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 30px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>

      {/* Main Settlement screen visible inside on-screen container (hidden only when printing) */}
      <div className="p-5 space-y-5 flex-1 flex flex-col justify-between print:hidden" id="settlement-stage">
        {/* Medal Presentation or Diagnostic Report Title */}
        {!gameEnabled ? (
          <div className="text-center space-y-2 bg-emerald-500/10 border-2 border-emerald-500/50 p-4 rounded-2xl animate-fade-in">
            <div className="relative inline-block">
              <span className="text-5xl inline-block animate-pulse">📖</span>
              <span className="absolute -top-1 -right-1 text-xl">✨</span>
            </div>
            <h3 className="cartoon-font text-2xl font-black text-emerald-850 tracking-wide">
              AI 智能提分报告
            </h3>
            <p className="text-xs text-emerald-800 font-extrabold mt-1">
              已为您针对错题薄弱项【{diagnostic.target_topic}】生成举一反三特训材料！
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <span className="text-7xl animate-bounce duration-1000 inline-block">{medalEmoji}</span>
              <span className="absolute -top-1 -right-1 text-2xl animate-pulse">✨</span>
              <span className="absolute -bottom-1 -left-1 text-2xl animate-pulse">🎉</span>
            </div>
            
            <h3 className="cartoon-font text-3xl font-extrabold text-emerald-600 tracking-wide">
              {levelText}！
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              恭喜孩子！专攻薄弱项【{diagnostic.target_topic}】完成！
            </p>
          </div>
        )}

        {/* Performance Statistics Card or Standard Diagnostic Report card */}
        {gameEnabled ? (
          <div className="bg-emerald-50 rounded-2xl border-4 border-slate-800 p-4 space-y-3 relative shadow-inner">
            <div className="text-center">
              <p className="text-xs text-emerald-800 font-bold tracking-wider mb-0.5">本次特训最终得分</p>
              <p className="text-5xl font-black text-emerald-500 cartoon-font tracking-wider select-all">
                {score}
              </p>
            </div>

            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border-2 border-slate-800">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(25, (score / 120) * 100))}%` }}
              ></div>
            </div>

            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-300 text-[11px] text-emerald-950 font-medium leading-relaxed">
              🎯 <span className="font-extrabold text-slate-950">AI智能反馈：</span> 孩子对关键答案 <span className="font-black text-red-500 underline">{diagnostic.correct_answer}</span> 的辨识敏捷度较高！
              继续加油，彻底克服在 {diagnostic.target_topic} 相关脑力练习时的盲点吧！
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-4 border-slate-800 p-4 space-y-3 shadow-md">
            <div className="bg-emerald-50/50 p-3 rounded-xl border-2 border-emerald-200 text-[11px] text-slate-700 leading-relaxed font-sans">
              <span className="font-black text-emerald-800 text-xs block mb-1">🔬 本期诊断弱点反馈：</span>
              分析到本次所测的错因在于<span className="font-bold text-slate-900">“{diagnostic.type === 'math' ? '乘法口诀计算' : diagnostic.type === 'chinese_pinyin' ? '拼音读音分辨' : diagnostic.type === 'chinese_words' ? '书写汉字防错' : '英语口语熟练度'}”</span>。
              我们已自动更新了本页下方的<span className="font-black text-emerald-700 underline">字词描红阵地</span>和临摹手写线，孩子可直接拿起手写笔或双击下方开启打印，进行强化突击练习！
            </div>
          </div>
        )}

        {/* Export Free H5 standalone as Premium reward ONLY if game is enabled */}
        {gameEnabled && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-dashed border-emerald-500 rounded-2xl p-4 text-center space-y-3">
            <div className="space-y-1">
              <span className="inline-block bg-emerald-500/10 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-355">
                🎁 专属尊享特权
              </span>
              <p className="font-extrabold text-slate-800 text-sm">打包下载本关“单文件离线版”游戏</p>
              <p className="text-[10px] text-slate-500 leading-normal">
                打包生成后您可以发送到电脑或无公网设备的平板电脑上，双击文件即可直接开始游戏体验！
              </p>
            </div>

            <button
              onClick={downloadStandaloneGame}
              id="export-h5-button"
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] border-2 border-slate-800 rounded-xl py-2 px-3 text-xs font-black text-white transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" /> 解锁并保存离线版 [ 100% 免费 ]
            </button>

            {showExporterSuccess && (
              <p className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 离线打包游戏已保存至您的下载文件夹！
              </p>
            )}
          </div>
        )}

        {/* Private Traffic conversion block */}
        <div className="bg-slate-900 text-slate-300 rounded-2xl border-4 border-slate-800 p-4 space-y-3.5 text-center">
          <div className="flex items-center gap-2 justify-center border-b border-slate-800 pb-2">
            <Smartphone className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span className="text-xs font-extrabold text-white">微信专属私域特学营</span>
          </div>

          <div className="flex flex-col items-center space-y-1.5">
            <p className="text-[11px] text-slate-300 font-medium">长按二维码添加专属辅导老师微信：</p>
            {/* Faked QR Code with kid icon for private conversions */}
            <div className="bg-white p-2 rounded-xl relative border-2 border-emerald-400">
              <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center relative overflow-hidden">
                 <span className="text-2xl mb-1">🐼</span>
                <p className="text-[8px] text-slate-400 font-black">AI 教育小管家</p>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"></div>
                {/* Fake Scan indicator */}
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 animate-[bounce_2.5s_infinite]"></div>
              </div>
            </div>
            <p className="text-[10px] text-emerald-500 font-black">老师微信号：aimath_helper_09</p>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <button
              onClick={() => setJoinedWeChat(!joinedWeChat)}
              className={`text-[10px] font-black rounded-lg px-2.5 py-1 flex items-center gap-1 border transition-all ${
                joinedWeChat
                  ? "bg-slate-800 border-slate-700 text-slate-500"
                  : "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
              }`}
            >
              {joinedWeChat ? "✓ 已关注添加" : "添加微信号"}
            </button>
          </div>
        </div>

        {/* Primary Action controls with Sparkling Premium Improvement Exam capability */}
        <div className="space-y-3 bg-white p-3 rounded-2xl border-2 border-dashed border-emerald-300">
          <p className="text-[10px] text-emerald-800 font-extrabold text-center flex items-center justify-center gap-1">
            <span>✨ 推荐首选：纸面手写才能真正巩固记忆 ✨</span>
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => {
                setShowExamCreator(true);
                // Pre-generate automatically if they haven't yet or click first time
                if (!generatedExam) {
                  handleGeneratePersonalExam();
                }
              }}
              style={{ boxShadow: "0 6px 0 #b45309" }}
              id="generate-custom-personalized-exam-btn"
              className="w-full bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 active:shadow-none border-4 border-slate-900 text-slate-950 font-black text-sm py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 animate-pulse"
            >
              <Sparkles className="w-5 h-5 text-red-600" />
              一键生成专属提分卷 (带校名配对)
            </button>

            <button
              onClick={handlePrintLockClick}
              style={{ boxShadow: "0 4px 0 #047857" }}
              id="print-worksheet-button"
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 active:shadow-none border-4 border-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              看本页 A4 打印预览 (纯静态款)
            </button>
          </div>

          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 hover:border-slate-800 text-slate-700 font-extrabold text-xs py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重新批改/上传今日其他错题
          </button>
        </div>

        <div className="text-center text-[9px] text-slate-400 font-bold">
          本体验页由 AI 自动生成，所得数据仅用作教学测评。
        </div>
      </div>

      {/* 
        Aesthetic Screen-based Preview Modal.
        Displays standard A4 proportions online before pulling up the printer.
        Helps build huge parental user trust.
      */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex flex-col justify-between p-4 print:hidden md:p-6 overflow-y-auto">
          {/* Header instructions bar inside modal */}
          <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-4 max-w-2xl mx-auto w-full space-y-2 mb-4 text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-black text-emerald-400 flex items-center justify-center sm:justify-start gap-1">
                <span>✨ 专属 A4 智能提分测试卷已配制</span>
              </p>
              <p className="text-[11px] text-slate-400">
                包含：错题靶向练、名师变式举一反三特训、家长批改剪纸答案。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerNativePrint}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 border-2 border-slate-950 transition-all hover:scale-105"
              >
                <Printer className="w-4 h-4" /> 打印 / 保存为 PDF
              </button>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold px-3 py-2 rounded-xl"
              >
                关闭预览
              </button>
            </div>
          </div>

          {/* Scrolling Mock page showing full paper details */}
          <div className="flex-1 w-full max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl border-2 border-slate-400 text-slate-900 shadow-xl overflow-y-auto max-h-[75vh]">
            <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-dashed border-slate-350 pb-2 mb-6">
              🖥️ A4 打印内容预览纸张样式（打印时仅输出下方白纸试卷区域）
            </div>

            {/* Simulated paper container */}
            <div className="space-y-8 font-sans antialiased text-slate-900">
              {/* Paper header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>定制批次：AI-MATH-{new Date().getFullYear()}</span>
                  <span>智能诊断错题提分特约卷</span>
                </div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  【AI智能错题消灭机】个人定制 · 举一反三提分测试卷
                </h1>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-bold font-mono pt-1 text-slate-700">
                  <div className="text-left font-sans">诊断考点：【{diagnostic.target_topic}】</div>
                  <div>学生姓名：_________________</div>
                  <div className="text-right">评定成绩：_________________</div>
                </div>
              </div>

              {/* Part 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-2">
                  <span className="text-[10px] bg-slate-900 text-white font-bold px-1 rounded">第一部分</span>
                  <h3 className="text-xs font-extrabold text-slate-950 tracking-wider">错题靶向训练 (温故知新，深度抄写)</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  孩子在打地鼠特训中完成了该知识点的识别。请在这张专门定制的测试卷上，用心工整地抄写或重做本例原题，帮助大脑建立深层的实体神经腱反射。
                </p>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">原题展示：</span>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {diagnostic.type === "english_spelling" || diagnostic.type === "english_oral" ? (
                        <>考点词汇：【{diagnostic.target_topic}】（标准写法：{diagnostic.correct_answer}）</>
                      ) : (
                        <>{diagnostic.target_display || diagnostic.question_display || "请认真重算或手写拼法。"}</>
                      )}
                    </p>
                  </div>

                  {/* Dynamic grids based on error types */}
                  {diagnostic.type === "math" && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-700">✍️ 写出细致的计算拆解与凑十法步骤：</p>
                      <div className="w-full h-24 border border-dashed border-slate-300 rounded-lg p-2 bg-white relative flex flex-col justify-between">
                        <span className="text-[8px] text-slate-350 font-bold">【此处为考卷草稿推演区域】</span>
                        <div className="space-y-3 py-1 w-full">
                          <div className="border-b border-dotted border-slate-200"></div>
                          <div className="border-b border-dotted border-slate-200"></div>
                        </div>
                        <div className="text-right text-[11px] font-bold text-slate-900">
                          答：最终计算得数 = __________________
                        </div>
                      </div>
                    </div>
                  )}

                  {diagnostic.type === "chinese_pinyin" && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-slate-700">✍️ 读准正确字音，在田字格中工整抄写拼音汉字 3 遍（带声调）：</p>
                      <div className="flex items-center gap-4 py-2 bg-white px-3 rounded-lg border border-slate-200">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold text-slate-400">正确读音</span>
                          <span className="text-xs font-extrabold text-slate-900 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{diagnostic.correct_answer}</span>
                        </div>
                        <span className="text-slate-300 text-xs">➡</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">工整格写：</span>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="w-10 h-10 border-2 border-red-500/60 relative bg-white">
                                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {diagnostic.type === "chinese_words" && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-slate-700">✍️ 抄写偏旁结构，在下侧田字格中练写 3 遍，纠错记忆：</p>
                      <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1.5">
                        {(() => {
                          const cleanWords = Array.isArray(diagnostic.correct_sequence) 
                            ? (diagnostic.correct_sequence as string[][]).flat()
                            : [diagnostic.correct_answer || "检查"];
                          return cleanWords.slice(0, 2).map((wordStr, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-500 w-10 text-right">【{wordStr}】：</span>
                              <div className="flex gap-2">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="w-8 h-8 border-2 border-red-500/50 relative bg-white">
                                    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/25"></div>
                                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/25"></div>
                                    {i === 1 && (
                                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-300 pointer-events-none">
                                        {wordStr[0] || ""}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {(diagnostic.type === "chinese_pinyin" || diagnostic.type === "chinese_words") &&
                    renderChineseCompoundWordsSection(diagnostic)}

                  {(diagnostic.type === "english_spelling" || diagnostic.type === "english_oral") && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-700">✍️ 抄写英文标准书写体（注意基准字母占格），练习抄写：</p>
                      <div className="bg-white p-2 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded">核心单词:</span>
                          <span className="font-extrabold font-mono text-slate-800 text-xs">{diagnostic.correct_answer || "friend"}</span>
                        </div>
                        {/* Fake English Copy lanes */}
                        <div className="space-y-2 py-0.5">
                          {[1].map((lane) => (
                            <div key={lane} className="w-full h-7 flex flex-col justify-between py-0 relative">
                              <div className="absolute top-0 left-0 right-0 border-t border-dashed border-indigo-400/30"></div>
                              <div className="absolute top-[33%] left-0 right-0 border-t border-dashed border-indigo-400/30"></div>
                              <div className="absolute top-[66%] left-0 right-0 border-t-2 border-indigo-500/50"></div>
                              <div className="absolute bottom-0 left-0 right-0 border-t border-indigo-400/30"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Part 2 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-2">
                  <span className="text-[10px] bg-slate-900 text-white font-bold px-1 rounded">第二部分</span>
                  <h3 className="text-xs font-extrabold text-slate-950 tracking-wider">举一反三 · 变式思维提分特训</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  名师AI根据本次薄弱项【{diagnostic.target_topic}】全自动生成类似或进阶的三道强化训练题，巩固记忆，让孩子学会“错一道，学会一类”。
                </p>

                {/* Print parallel questions */}
                <div className="space-y-5">
                  {parallelQuestions.map((q, index) => (
                    <div key={q.id} className="space-y-1.5 text-xs text-slate-800 pl-2">
                      <p className="font-bold leading-normal flex gap-1 items-start">
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 mt-0.5">{index + 1}.</span>
                        <span className="whitespace-pre-line">{q.desc}</span>
                      </p>
                      <p className="text-[10px] text-emerald-600/90 pl-3 leading-relaxed font-medium">
                        {q.tip}
                      </p>
                      {/* Substantial space for answers on paper */}
                      <div className="h-6 border-b border-dotted border-slate-300 w-4/5 ml-3"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part 3 Answer Sheet */}
              <div className="pt-8 border-t-2 border-dashed border-slate-300 space-y-4 page-break mt-12 bg-slate-50/40 p-4 rounded-xl">
                <div className="text-center pb-1">
                  <p className="text-xs font-black tracking-wider text-slate-800">✂️ 家长批改专属：参考答案与智能考点AI评析卡 ✂️</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">（本部分在正式打印后，可以用剪刀剪下作为您的参考指南）</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-350 space-y-3.5">
                  <div className="space-y-3 text-[11px] leading-relaxed text-slate-700">
                    <div>
                      <p className="font-bold text-slate-900">● 第一部分 [错题靶向训练] 正确参考：</p>
                      <p className="pl-2.5 border-l border-slate-400 mt-1">
                        标准参考结果是：<span className="font-bold text-slate-950 underline">{diagnostic.correct_answer || "56"}</span>。
                        {diagnostic.type === "chinese_words" && "注意右字底的结构区别，不写错别字。"}
                        {diagnostic.type === "chinese_pinyin" && "韵母包含字母g，是阳平后鼻音。"}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">● 第二部分 [举一反三·变式训练] 详细答案：</p>
                      <div className="pl-2.5 border-l border-slate-400 mt-1 space-y-1.5 font-medium text-[10px] text-slate-600">
                        {diagnostic.type === "math" && (
                          <>
                            <p><strong>【第1题参考答案】</strong>7 × 7 = 49</p>
                            <p><strong>【第2题参考答案】</strong>7 × 9 = 63</p>
                            <p><strong>【第3题参考答案】</strong>使用分配律算理：7 × 8 = 7 × 5 + 7 × 3 = 35 + 21 = 56。</p>
                          </>
                        )}

                        {diagnostic.type === "chinese_pinyin" && (
                          <>
                            <p><strong>【第1题参考答案】</strong>勾选 <strong>成 (chéng)</strong> 与 <strong>曾 (céng)</strong>。其余字均为前鼻音。</p>
                            <p><strong>【第2题参考答案】</strong>为“<strong>chéng</strong>”（声调写在元音 e 之上）。</p>
                            <p><strong>【第3题参考答案】</strong>连线归纳：前鼻音对应 ‘C. 门、晨’；后鼻音对应 ‘B. 朋、乘’。</p>
                          </>
                        )}

                         {diagnostic.type === "chinese_words" && (
                           <>
                             {(() => {
                               const isGan = diagnostic.correct_answer === "甘" || (diagnostic.target_topic && diagnostic.target_topic.includes("甘"));
                               if (isGan) {
                                 return (
                                   <>
                                     <p><strong>【第1题参考答案】</strong>① 甘甜（选择“甘”，内带一横）；② 干活（选择“干”，十加上横）。</p>
                                     <p><strong>【第2题参考答案】</strong>错字：应将【干苦】改正拼写为【 甘苦 】。本字代表生活甘美与艰苦。</p>
                                     <p><strong>【第3题参考答案】</strong>① 含有“甘”部件：【甘、甜】； ② 含有“扌”提手旁：【打、拨】。</p>
                                   </>
                                 );
                               }
                               return (
                                 <>
                                   <p><strong>【第1题参考答案】</strong>① 拨打电话（“拨”，拨弄头发，带有折尾）；② 拔萝卜（“拔”，代表与朋友/友字旁去拔）。</p>
                                   <p><strong>【第2题参考答案】</strong>错字：【拣查】应写成【 检查 】；【温濡/湿暖】应写成【 温暖 】。</p>
                                   <p><strong>【第3题参考答案】</strong>① 木字旁：【检、查、树】； ② 提手旁：【打、拨、拔】。</p>
                                 </>
                               );
                             })()}
                           </>
                         )}

                        {diagnostic.type === "english_spelling" && (
                          <>
                            <p><strong>【第1题参考答案】</strong>① friend (朋友)   ② bicycle (自行车)   ③ school (学校)。</p>
                            <p><strong>【第2题参考答案】</strong>① friend (朋友拼写)   ② book (书籍)   ③ sun (太阳)。</p>
                            <p><strong>【第3题参考答案】</strong>I meet my friend and class at school. (主谓宾地规范排列拼组)。</p>
                          </>
                        )}

                        {diagnostic.type === "english_oral" && (
                          <>
                            <p><strong>【第1题参考答案】</strong>选择 B。完全对应句词的句意关系。</p>
                            <p><strong>【第2题参考答案】</strong>I want to eat healthy and fresh strawberry ice cream.（填入修饰副词扩写句意）。</p>
                            <p><strong>【第3题参考答案】</strong>选择 B 。符合主-谓-宾-时间地点英语基本规则形式。</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-extrabold text-emerald-800">🌱 AI 学情分析辅导备课：</p>
                      <p className="pl-2 border-l-2 border-emerald-500 italic mt-0.5 text-[10px] text-slate-500 leading-relaxed">
                        “孩子在打地鼠游戏中已经成功的唤醒了对该考点【{diagnostic.target_topic}】的薄弱辨识。在纸上书写可以让眼、口、脑、手形成协调合力，大大加深记忆。建议在明亮安静的房间手写答题，剪去此答案由您亲子阅卷并大声夸奖，小树苗一定会健康茁壮成长！”
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 print:hidden">
            <p className="text-[10px] text-slate-400 font-bold">
              温馨技巧：在随后拉起的打印预览窗口中，『目标打印机』一栏选择【另存为 PDF】即可直接将其保存为高清文档！
            </p>
          </div>
        </div>
      )}

      {/* Invisible true printable container for browser native print layout processing only */}
      <div id="printable-a4-worksheet" className="hidden">
        {/* Title Block */}
        <div className="text-center border-b-4 border-slate-900 pb-3 space-y-1.5 mb-6">
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>定制编码：AI-WORKSHEET-{new Date().getFullYear()}</span>
            <span>AI智能个性化特训教案系列</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-wider">
            【AI智能错题消灭机】个人定制 · 举一反三提分周练
          </h1>
          <div className="grid grid-cols-3 gap-2 text-xs font-bold font-mono pt-2 text-slate-700">
            <div className="text-left font-sans">诊断考点：【{diagnostic.target_topic}】</div>
            <div>学生姓名：_________________</div>
            <div className="text-right">评定成绩：_________________</div>
          </div>
        </div>

        {/* Part 1 Content */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-2">
            <span className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded">第一部分</span>
            <h3 className="text-sm font-extrabold text-slate-950">错题重新演练 (温故而知新)</h3>
          </div>
          <p className="text-xs text-gray-500">
            💡 提示：这是孩子在打地鼠闯关中所针对的薄弱错题。请在下侧专门定制的横线或田字格里工整作答。
          </p>

          <div className="border border-slate-400/80 p-4 rounded-xl space-y-4 bg-white">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">原题呈现：</span>
              <p className="text-sm font-extrabold text-slate-900 mt-1">
                {diagnostic.type === "english_spelling" || diagnostic.type === "english_oral" ? (
                  <>考点词汇：【{diagnostic.target_topic}】（标准写法：{diagnostic.correct_answer}）</>
                ) : (
                  <>{diagnostic.target_display || diagnostic.question_display || "请认真重算或手写拼法。"}</>
                )}
              </p>
            </div>

            {/* Dynamic grids based on error types for print */}
            {diagnostic.type === "math" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-black text-gray-900">✍️ 写出细致的计算拆解与凑十法步骤：</p>
                <div className="w-full h-32 border-2 border-dashed border-gray-400 rounded-lg p-3 bg-white relative flex flex-col justify-between">
                  <span className="text-[10px] text-gray-400 font-bold">【此处为考卷草稿推演区域】</span>
                  <div className="space-y-4 py-2 w-full">
                    <div className="border-b border-dashed border-gray-300"></div>
                    <div className="border-b border-dashed border-gray-300"></div>
                  </div>
                  <div className="text-right text-xs font-bold text-gray-950">
                    答：最终计算得数 = __________________
                  </div>
                </div>
              </div>
            )}

            {diagnostic.type === "chinese_pinyin" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-black text-gray-900">✍️ 读准正确字音，在田字格中工整抄写拼音汉字 3 遍（带声调）：</p>
                <div className="flex items-center gap-4 py-2 bg-white px-3 rounded-lg border border-gray-300">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400">正确读音</span>


                    <span className="text-sm font-extrabold text-slate-900 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{diagnostic.correct_answer}</span>
                  </div>
                  <span className="text-gray-400 font-bold">➡</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-600">楷书描线：</span>
                    <div className="flex gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-12 h-12 border-2 border-red-500/80 relative bg-white">
                          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/50"></div>
                          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/50"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {diagnostic.type === "chinese_words" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-black text-gray-900">✍️ 认清形近字的部首差别，在田字格里认真抄写 3 遍：</p>
                <div className="flex flex-col gap-3.5 bg-white p-3 rounded-lg border border-gray-300">
                  {(() => {
                    const cleanWords = Array.isArray(diagnostic.correct_sequence) 
                      ? (diagnostic.correct_sequence as string[][]).flat()
                      : [diagnostic.correct_answer || "检查"];
                    return cleanWords.map((wordStr, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-700 w-12 text-right font-sans">【{wordStr}】：</span>
                        <div className="flex gap-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-10 h-10 border-2 border-red-500/70 relative bg-white">
                              <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                              {i === 1 && (
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-250 select-none">
                                  {wordStr[0] || ""}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {(diagnostic.type === "chinese_pinyin" || diagnostic.type === "chinese_words") && 
              renderChineseCompoundWordsPrintSection(diagnostic)}

            {(diagnostic.type === "english_spelling" || diagnostic.type === "english_oral") && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-black text-gray-900">✍️ 熟练规范的英文书写占格，在英语手写线上整洁抄写 2 遍：</p>
                <div className="border border-gray-300 p-4 rounded-xl space-y-4">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded">核心单词：</span>
                    <span className="font-extrabold font-mono text-slate-800 text-sm">{diagnostic.correct_answer || "friend"}</span>
                  </div>
                  {/* Absolute four-line wire grids for high contrast printing */}
                  <div className="space-y-5 pt-2">
                    {[1, 2].map((lane) => (
                      <div key={lane} className="w-full text-right text-[9px] text-gray-400">
                        <div className="w-full h-8 flex flex-col justify-between py-0 relative mb-1">
                          <div className="absolute top-0 left-0 right-0 border-t border-dashed border-indigo-400/40"></div>
                          <div className="absolute top-[33%] left-0 right-0 border-t border-dashed border-indigo-400/40"></div>
                          <div className="absolute top-[66%] left-0 right-0 border-t-2 border-indigo-505/50"></div>
                          <div className="absolute bottom-0 left-0 right-0 border-t border-dashed border-indigo-400/40"></div>
                        </div>
                        <span>拼写练习抄写线 #{lane}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Part 2 Content */}
        <div className="space-y-4 mb-10 page-break">
          <div className="flex items-center gap-2 border-l-4 border-slate-900 pl-2">
            <span className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded">第二部分</span>
            <h3 className="text-sm font-extrabold text-slate-950">举一反三 · 变式思维提分特训 (拓展巩固)</h3>
          </div>
          <p className="text-xs text-slate-500">
            💡 提示：本部分是根据薄弱点精挑细选的 3 道极易混淆的进阶变式练习题。请独立作答。
          </p>

          <div className="space-y-6">
            {parallelQuestions.map((q, index) => (
              <div key={q.id} className="space-y-2 text-xs text-slate-900 pl-2">
                <p className="font-extrabold leading-relaxed text-slate-950 flex gap-2 items-start text-sm">
                  <span className="text-gray-400 font-mono flex-shrink-0 mt-0.5">{index + 1}.</span>
                  <span className="whitespace-pre-line">{q.desc}</span>
                </p>
                <p className="text-[10px] text-gray-500 pl-4">
                  {q.tip}
                </p>
                {/* Horizontal dotted rules for answer-writing space on physical paper */}
                <div className="space-y-3 pt-4 ml-4">
                  <div className="border-b border-dotted border-gray-300 w-full"></div>
                  <div className="border-b border-dotted border-gray-300 w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 3 Content (Always forces a neat page break in print mode) */}
        <div className="pt-8 border-t-4 border-dashed border-gray-400 page-break space-y-6 mt-16 bg-white">
          <div className="text-center pb-2">
            <p className="text-xs font-black tracking-widest text-slate-900">---------------------- ✂️ 家长专属答案阅卷指南（请沿着此线剪下） ✂️ ----------------------</p>
            <p className="text-[10px] text-gray-400 mt-1 font-semibold">推荐在打印完成后，用小剪刀剪下单独保存。避免孩子产生作业依赖心理。</p>
          </div>

          <div className="pl-3 border-l-2 border-gray-400 font-medium text-slate-700">
            {diagnostic.type === "math" && (
                    <>
                      <p><strong>第一题答案：</strong>{Math.max(1, 7)} × {(diagnostic.correct_answer ? (parseInt(diagnostic.correct_answer, 10)/7 - 1) : 7)} = {(diagnostic.correct_answer ? (parseInt(diagnostic.correct_answer, 10) - 7) : 42)}</p>
                      <p><strong>第二题答案：</strong>{Math.max(1, 7)} × {(diagnostic.correct_answer ? (parseInt(diagnostic.correct_answer, 10)/7 + 1) : 9)} = {(diagnostic.correct_answer ? (parseInt(diagnostic.correct_answer, 10) + 7) : 56)}</p>
                      <p><strong>第三题答案：</strong>乘法分配律心算分解：7 × 8 = 7 × 5 + 7 × 3 = 35 + 21 = {diagnostic.correct_answer || 56}。</p>
                    </>
                  )}

                  {diagnostic.type === "chinese_pinyin" && (
                    <>
                      <p><strong>第一题答案：</strong>勾选 <strong>成 (chéng)</strong> 与 <strong>曾 (céng)</strong>。它们均为后鼻音韵母，晨与尘发音韵母为前鼻音。</p>
                      <p><strong>第二题答案：</strong>补完拼写为阳平 <strong>chéng</strong>。注意声调标在字母 ‘e’ 的上方。</p>
                      <p><strong>第三题答案：</strong>连线组合：①-C ; ②-B ; ③-A。</p>
                    </>
                  )}

                  {diagnostic.type === "chinese_words" && (
                    <>
                      {(() => {
                        const isGan = diagnostic.correct_answer === "甘" || (diagnostic.target_topic && diagnostic.target_topic.includes("甘"));
                        if (isGan) {
                          return (
                            <>
                              <p><strong>第一题答案：</strong>① 填写【 甘 】（甘甜）。 ② 填写【 干 】（干活）。</p>
                              <p><strong>第二题答案：</strong>将【干苦】写成【 甘苦 】。本字代表生活甘美与困苦。</p>
                              <p><strong>第三题答案：</strong>① “甘”部件加旁组汉字：【甘、甜】； ② “手”或其它部件：【打、拨】。</p>
                            </>
                          );
                        }
                        return (
                          <>
                            <p><strong>第一题答案：</strong>① ( 拨 )打电话。 ② 拼命 ( 拔 )萝卜。形声辨析：利用头发、朋友顺口溜彻底攻克考点偏旁。</p>
                            <p><strong>第二题答案：</strong>错字：【拣查】应批改为【 检查 】；【湿暖】应批改为【 温暖 】。</p>
                            <p><strong>第三题答案：</strong>① 木部偏旁：【检、查、树】； ② 手部偏旁：【打、拨、拔】。</p>
                          </>
                        );
                      })()}
                    </>
                  )}

                  {diagnostic.type === "english_spelling" && (
                    <>
                      <p><strong>第一题答案：</strong>① friend    ② bicycle    ③ school。</p>
                      <p><strong>第二题答案：</strong>① friend    ② book    ③ sun。</p>
                      <p><strong>第三题答案：</strong>I meet my friend and class at school. (主谓宾地规范语法拼组)。</p>
                    </>
                  )}

                  {diagnostic.type === "english_oral" && (
                    <>
                      <p><strong>第一题答案：</strong>选择 B (He wants to meet his happy school friend Jim in the park.)。</p>
                      <p><strong>第二题答案：</strong>I want to eat healthy and fresh strawberry ice cream.（填入副形容词扩写）。</p>
                      <p><strong>第三题答案：</strong>选择 B 项（符合标准的地点、名词和主谓固定书写语序）。</p>
                    </>
                  )}
                </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="font-extrabold text-emerald-800">🌱 AI 智能学情配课与教研分析：</p>
                <p className="text-gray-500 italic mt-0.5 pl-3 border-l-2 border-emerald-500">
                  “亲爱的家长：孩子对该薄弱点【{diagnostic.target_topic}】出现错漏是正常的学前过渡现象。打地鼠游戏已经帮助其开辟了眼脑通识的通路，通过本试卷的『亲子手写批改』可以加倍沉淀。建议孩子独立工整作答。感谢您陪伴孩子消灭薄弱点，走向超凡卓越！”
                </p>
              </div>
            </div>
          </div>

      {/* 
        PREMIUM DYNAMIC EXAM GENERATOR MODAL (GEMINI INTEGRATION)
        Generates bespoke homework based on mistake point and overlays customizable school name & seal.
      */}
      {showExamCreator && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex flex-col justify-between p-4 print:hidden md:p-6 overflow-y-auto font-sans">
          {/* Top Panel Instructions and Customizer */}
          <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-4 max-w-2xl mx-auto w-full space-y-3 text-slate-100 mb-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
                <h2 className="text-sm font-black text-amber-300">名家 AI 专属提分卷定制控制台</h2>
              </div>
              <button
                onClick={() => setShowExamCreator(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config Inputs Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="text-emerald-500">🏫</span> 孩子就读小学校名：
                </label>
                <input
                  type="text"
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="如：北京市北京市海淀外国语实验学校"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                  <span className="text-indigo-400">👶</span> 答题孩子姓名/称谓：
                </label>
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  placeholder="如：麦麦同学 / 小火伴"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2 border-t border-slate-800">
              <div className="text-[10px] text-slate-400">
                当前挂载考点短板：<span className="font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">【{diagnostic.target_topic}】</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePersonalExam}
                  disabled={loadingExam}
                  className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 border border-slate-950/20 active:scale-95 transition-all text-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingExam ? 'animate-spin' : ''}`} />
                  重填并重新生成
                </button>

                {generatedExam && (
                  <div className="flex gap-1.5 items-center">
                    {isCompilingPDF ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                        A4 PDF 极速生成中...
                      </span>
                    ) : downloadOssUrl ? (
                      <a
                        href={downloadOssUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 border-2 border-slate-800 transition-transform active:translate-y-0.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        📥 直接下载 A4 PDF
                      </a>
                    ) : null}

                    <button
                      onClick={downloadGeneratedExam}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-slate-400 active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      保存 HTML
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrolling Mock Practice Sheet Preview on Screen */}
          <div className="flex-1 w-full max-w-2xl mx-auto bg-slate-50 p-5 md:p-8 rounded-2xl border-4 border-slate-800 text-slate-900 shadow-2xl min-h-[50vh] flex flex-col justify-between overflow-y-auto">
            {loadingExam ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-dashed border-amber-500 rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto text-amber-500 w-6 h-6 animate-pulse" />
                </div>
                <div className="text-center space-y-1.5 max-w-sm">
                  <h3 className="font-black text-slate-800 text-sm">特级教研 AI 正在极速命题排卷中...</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    正在分析孩子错误，由少儿脑发育专家根据题库调配“温故筑基-混淆闪辨-实际迁移”三阶强化卷。
                  </p>
                </div>
              </div>
            ) : examError ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12 text-center">
                <span className="text-4xl">😿</span>
                <p className="text-xs font-bold text-red-600 max-w-md">{examError}</p>
                <button
                  onClick={handleGeneratePersonalExam}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-xl border border-slate-950"
                >
                  重试召请 AI 助教
                </button>
              </div>
            ) : generatedExam ? (
              <div className="space-y-6 antialiased leading-relaxed relative bg-white border border-slate-300 p-6 rounded-2xl shadow-inner text-left">
                {/* Simulated Stamp Badge */}
                <div className="absolute top-4 right-4 md:top-8 md:right-8 w-16 h-16 border-2 border-dashed border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 text-[8px] font-bold select-none rotate-12 bg-white/70 opacity-85 z-10">
                  <span className="scale-[0.8] block text-center">★ AI 批改 ★</span>
                  <span className="font-extrabold max-w-[50px] scale-[0.85] text-center shrink-0 block leading-tight">{schoolNameInput.substring(0,6)}</span>
                  <span className="scale-[0.7] block text-center">{new Date().getMonth()+1}/{new Date().getDate()}</span>
                </div>

                {/* Print Title Block */}
                <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>考案编号: AI-MEM-${new Date().getFullYear()}</span>
                    <span>{generatedExam.schoolHeader}</span>
                  </div>
                  <h1 className="text-md sm:text-lg font-black text-slate-900 leading-snug tracking-wide pt-1">
                    {generatedExam.examTitle}
                  </h1>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-bold font-mono pt-1 text-slate-600">
                    <div className="text-left font-sans">诊断考点：【{diagnostic.target_topic}】</div>
                    <div className="text-center">答题人：<span className="underline decoration-slate-300 text-slate-800 font-sans">{studentNameInput}</span></div>
                    <div className="text-right font-sans">阅卷总评：_________________</div>
                  </div>
                </div>

                {/* Welcome Card */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-slate-700 font-sans space-y-1 leading-relaxed">
                  <span className="font-black text-amber-800 flex items-center gap-1">💌 提分密信小贴士：</span>
                  <p className="whitespace-pre-line text-[11px] leading-relaxed text-amber-950">{generatedExam.studentGreeting}</p>
                </div>

                {/* Section 1: Misconception */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-1.5 border-l-4 border-slate-900 pl-2">
                    <span className="text-[9px] bg-slate-900 text-white font-bold px-1 rounded">第一部分</span>
                    <h4 className="text-xs font-extrabold text-slate-950 text-left">思维漏洞深度拆解 (知己知彼，百战不殆)</h4>
                  </div>
                  <p className="text-[11.5px] text-slate-600 text-left leading-relaxed">
                    {generatedExam.misconceptionAnalysis}
                  </p>
                </div>

                {/* Section 2: Tailored Questions */}
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-1.5 border-l-4 border-slate-900 pl-2">
                    <span className="text-[9px] bg-slate-900 text-white font-bold px-1 rounded">第二部分</span>
                    <h4 className="text-xs font-extrabold text-slate-950 text-left">“举一反三”提分过关战阵 (共3道必考强化变式题)</h4>
                  </div>

                  <div className="space-y-4 text-left">
                    {generatedExam.questions?.map((q: any, index: number) => (
                      <div key={q.id} className="space-y-1.5 pl-1">
                        <p className="text-[12px] font-bold text-slate-800 leading-normal flex gap-1.5 items-start">
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 mt-0.5">{index + 1}.</span>
                          <span className="whitespace-pre-line font-semibold text-slate-900">{q.title}</span>
                        </p>
                        
                        {/* Choice list if elements exist */}
                        {q.choices && q.choices.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 py-1">
                            {q.choices.map((choice: string, cIdx: number) => (
                              <label key={cIdx} className="flex items-center gap-2 text-[11px] text-slate-600">
                                <input type="checkbox" disabled className="text-amber-500 focus:ring-amber-400 rounded" />
                                <span>{choice}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg inline-block select-none">
                          {q.hint}
                        </p>
                        {/* Empty spacing for handwriting simulation */}
                        <div className="h-10 border-b border-dotted border-slate-300 w-4/5 ml-4"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent Guide Booklet in Modal with scissor cuts */}
                <div className="pt-6 border-t-2 border-dashed border-slate-300 space-y-3.5 page-break mt-8 bg-amber-50/20 p-4 rounded-xl text-left">
                  <div className="text-center pb-2">
                    <p className="text-xs font-black tracking-widest text-slate-800 flex items-center justify-center gap-1.5">
                      <Scissors className="w-4 h-4 text-slate-500 animate-[pulse_2s_infinite]" />
                      <span>家长专属批改剪纸卡与伴读方案</span>
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">（正式打印此HTML专属卷后，推荐将下侧卡片沿着线条剪下单独保管）</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 space-y-3 font-sans">
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      <strong className="text-amber-800 block text-xs mb-1">👩‍🏫 伴读心理指南：</strong>
                      {generatedExam.parentPrepingGuide}
                    </p>
                    <div className="border-t border-slate-200/80 pt-2.5">
                      <strong className="text-slate-800 text-[11px] block mb-1">🔑 针对性辅导参考答案精要：</strong>
                      <div className="space-y-1.5 pl-1.5 text-[10px] text-slate-500 leading-normal">
                        {generatedExam.questions?.map((q: any, index: number) => (
                          <div key={q.id}>
                            <strong>第 {index + 1} 题密钥：</strong>{q.parentCheckKey}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivational ending */}
                <div className="text-center py-2 italic font-medium text-[11px] text-slate-500 bg-slate-50 rounded-lg">
                  {generatedExam.motivationalQuote}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
                <p className="text-xs text-slate-500">
                  配置尚未就绪，请先在上方定制栏输入您的学校和称呼
                </p>
              </div>
            )}

            {/* Bottom Actions info inside Preview */}
            <div className="text-center pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 font-extrabold flex items-center gap-1 text-left">
                 🛡️ 安全声明：下载资源为环保单文件 HTML，100% 独立离线。
              </span>
              
              {generatedExam && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {isCompilingPDF ? (
                    <span className="w-full sm:w-auto bg-emerald-100 text-emerald-850 font-extrabold text-[11px] px-5 py-2.5 rounded-xl border-2 border-dashed border-emerald-500 flex items-center justify-center gap-1.5 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      A4 PDF 高清构建中...
                    </span>
                  ) : downloadOssUrl ? (
                    <a
                      href={downloadOssUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ boxShadow: "0 4px 0 #1e293b" }}
                      className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs px-5 py-2.5 rounded-xl border-2 border-slate-950 flex items-center justify-center gap-1.5 transition-transform active:translate-y-0.5 block text-center"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      👑 立即保存 A4 纸质 PDF (推荐打印)
                    </a>
                  ) : null}

                  <button
                    onClick={downloadGeneratedExam}
                    style={{ boxShadow: "0 4px 0 #0f766e" }}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl border-2 border-slate-950 flex items-center justify-center gap-1 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Download className="w-4 h-4" />
                    离线单文件 HTML
                  </button>
                  
                  <button
                    onClick={() => setShowExamCreator(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl"
                  >
                    返回
                  </button>
                </div>
              )}
            </div>

            {showDownloadSuccess && (
              <p className="text-[11px] text-center text-emerald-600 font-extrabold mt-3 flex items-center justify-center gap-1 bg-white p-2 border border-emerald-200 rounded-lg shadow-sm animate-bounce">
                <Check className="w-4 h-4 bg-emerald-500 text-white rounded-full p-0.5" />
                恭喜！专属提分试卷已自动导出名为 【{schoolNameInput}】_{studentNameInput}_专属错题提分特训卷.html 的高清文档，请在下载文件夹查收，用任何浏览器打开即可打印！
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
