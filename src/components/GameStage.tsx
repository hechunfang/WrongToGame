import React, { useState, useEffect, useRef } from "react";
import { Clock, Star, AlertCircle, HelpCircle, Trophy, Sparkles, Volume2 } from "lucide-react";
import { DiagnosticResult, Mole } from "../types";
import { decorateMathQuestion, getFormulaEquiv } from "../utils/mathDecorator";

const MOLE_THEMES: Record<string, { body: string; ears: string; innerEars: string }> = {
  yellow: { body: "from-yellow-300 via-amber-400 to-amber-500", ears: "bg-amber-500", innerEars: "bg-yellow-250 animate-pulse" },
  pink: { body: "from-pink-300 via-rose-400 to-rose-500", ears: "bg-rose-500", innerEars: "bg-pink-100" },
  cyan: { body: "from-cyan-300 via-sky-400 to-sky-500", ears: "bg-sky-500", innerEars: "bg-cyan-100" },
  orange: { body: "from-orange-300 via-amber-400 to-orange-500", ears: "bg-orange-500", innerEars: "bg-orange-100" },
  purple: { body: "from-purple-300 via-indigo-400 to-purple-500", ears: "bg-purple-500", innerEars: "bg-purple-200" },
  green: { body: "from-green-400 via-emerald-400 to-emerald-500", ears: "bg-emerald-500", innerEars: "bg-pink-300" },
  rose: { body: "from-rose-400 via-pink-400 to-rose-500", ears: "bg-rose-500", innerEars: "bg-pink-100" }
};

const getDetectiveStory = (correctC: string, wrongC: string, correctW: string, wrongW: string) => {
  const normCorrectC = correctC || "甘";
  const normWrongC = wrongC || "干";
  const normCorrectW = correctW || "甘甜";
  const normWrongW = wrongW || "干甜";

  if (normCorrectW.includes("甘甜") || normCorrectC === "甘") {
    return {
      title: "💧 水井干枯危机！",
      npc: "村长爷爷",
      avatar: "👨‍🦳",
      text: "不好了！错别字小恶魔施展了黑魔法，把原本甘美的“甘甜”水泉改写成了“干甜”的水，导致全村的水井干枯啦！小侦探快拿起放大镜，在上方锁定写错的字“干”，并装填正确“甘”字炮弹彻底净化小恶魔吧！",
      wrongSentence: "村里的井水竟然变干甜了",
    };
  }

  if (normCorrectW.includes("温暖") || normCorrectC === "温") {
    return {
      title: "☀️ 结冰的温暖太阳",
      npc: "太阳小仙子",
      avatar: "☀️",
      text: "大事不好了！小恶魔在天空控制台里，把“温暖”写成了“湿暖”，结果太阳神殿被冰块冻封了！快揪出那个冒牌的错字“湿”，发射正确的“温”字能量球，融化冰雪！",
      wrongSentence: "太阳应该散发湿暖的光芒",
    };
  }

  if (normCorrectW.includes("拨打") || normCorrectC === "拨") {
    return {
      title: "🐰 求救连线的萝卜危机",
      npc: "消防队长大象",
      avatar: "🐘",
      text: "火急命令！小恶魔把消防队求助热线上的“拨打”改写成了“拔打”。结果森林里起火时，求救电话线全变成了拔萝卜，消防车无法出动！快找出那个混进去的错别字“拔”，并装填“拨”字弹药恢复通信！",
      wrongSentence: "遇到危险请立即拔打电话",
    };
  }

  if (normCorrectW.includes("检查") || normCorrectC === "检") {
    return {
      title: "🚀 冒烟的火箭推进器",
      npc: "宇航员熊熊",
      avatar: "🐻‍🚀",
      text: "警报！飞船起飞前夕，错字恶魔把火箭启动清单中的“检查”写成了“拣查”，导致动力自检失败并冒起了黑烟！小侦探，快找出那个捣乱的错误“拣”字锁定它，装弹“检”字把它净化！",
      wrongSentence: "飞船正在进行最后一轮拣查",
    };
  }

  if (normCorrectC.includes("chéng") || normCorrectW.includes("橙")) {
    return {
      title: "🍊 变灰的超级甜橙",
      npc: "松鼠萌萌",
      avatar: "🐿️",
      text: "大灾难！错词恶魔把金黄诱人的橙子魔改成“céng子”，导致整个果园的大甜橙由于发音不准全变成了坚硬的灰色水泥！快抓出念错发音的“céng”，射出“chéng”拼音炮弹恢复果园吧！",
      wrongSentence: "树上结出了一颗变灰的céng子",
    };
  }

  return {
    title: "🧚‍♀️ 拯救汉字魔法小镇！",
    npc: "汉字守护精灵",
    avatar: "🧚‍♀️",
    text: `警告！错别字大魔王在小镇搞破坏，把神圣的词语“${normCorrectW}”魔法扭曲成了“${normWrongW}”，导致魔法路标错乱晃动！请侦探赶快锁定写错的那个字/拼音“${normWrongC}”，然后选择正确净化子弹“${normCorrectC}”净化怪兽！`,
    wrongSentence: `咒语变了：变成了【${normWrongW}】`,
  };
};

const UNSPLASH_SCENE_MAP: Record<string, string> = {
  friend: "1511632765486-a01980e01a18",
  bicycle: "1485965120184-e220f721d03e",
  dog: "1543466835-00a7907e9de1",
  puppy: "1543466835-00a7907e9de1",
  cat: "1514888286974-6c03e2ca1dba",
  apple: "1560806887-1e4cd0b6cbd6",
  school: "1580582932707-520aed937b7b",
  book: "1512820790803-83ca734da794",
  family: "1511895426328-dc8714191300",
  sun: "1528605248644-14dd04022da1",
  icecream: "1501443710935-77b7d701fc7d",
};

const getSceneImageUrl = (keyword?: string) => {
  const normalized = (keyword || "friend").toLowerCase().replace(/\s+/g, "");
  const photoId = UNSPLASH_SCENE_MAP[normalized] || UNSPLASH_SCENE_MAP.friend;
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=480&h=320&q=85`;
};

const ENGLISH_ORAL_POOL = [
  {
    type: "english_oral",
    target_topic: "交通与出行 (Transportation)",
    target_display: "大声朗读句子，和 AI 小助手练习口语磨耳朵吧！",
    correct_sequence: ["bicycle", "ride", "sunny"],
    grid_items: [],
    english_scene_sentence: "He rides a bright red bicycle in the park.",
    english_scene_translation: "他在公园里骑着一辆鲜红色的自行车。",
    english_scene_image: "bicycle",
    question_display: "He rides a bright red bicycle in the park.",
    correct_answer: "He rides a bright red bicycle in the park."
  },
  {
    type: "english_oral",
    target_topic: "可爱萌宠 (Lovely Pets)",
    target_display: "听听它的发音，然后跟着大声读读看吧！",
    correct_sequence: ["puppy", "dog", "cute"],
    grid_items: [],
    english_scene_sentence: "The cute puppy loves playing on the green grass.",
    english_scene_translation: "这只可爱的小狗喜欢在绿油油的草地上玩耍。",
    english_scene_image: "dog",
    question_display: "The cute puppy loves playing on the green grass.",
    correct_answer: "The cute puppy loves playing on the green grass."
  },
  {
    type: "english_oral",
    target_topic: "甜蜜冰淇淋 (Sweet Dessert)",
    target_display: "冰淇淋真好吃！跟读句子吧！",
    correct_sequence: ["ice cream", "sweet", "summer"],
    grid_items: [],
    english_scene_sentence: "I like eating sweet chocolate ice cream in hot summer.",
    english_scene_translation: "我喜欢在炎热的夏天吃甜甜的巧克力冰淇淋。",
    english_scene_image: "icecream",
    question_display: "I like eating sweet chocolate ice cream in hot summer.",
    correct_answer: "I like eating sweet chocolate ice cream in hot summer."
  },
  {
    type: "english_oral",
    target_topic: "快乐校园 (Happy School)",
    target_display: "我们去上学啦！口语跟读练习：",
    correct_sequence: ["school", "friends", "happy"],
    grid_items: [],
    english_scene_sentence: "We go to school and meet our happy classmates.",
    english_scene_translation: "我们去上学并遇见我们快乐的同班同学。",
    english_scene_image: "school",
    question_display: "We go to school and meet our happy classmates.",
    correct_answer: "We go to school and meet our happy classmates."
  },
  {
    type: "english_oral",
    target_topic: "金光闪闪的大太阳 (Warm Sun)",
    target_display: "太阳公公出来啦！太阳例句跟读：",
    correct_sequence: ["sun", "warm", "shines"],
    grid_items: [],
    english_scene_sentence: "The golden sun shines brightly in the blue sky.",
    english_scene_translation: "金灿灿的太阳在蔚蓝的天空中明朗地照耀着。",
    english_scene_image: "sun",
    question_display: "The golden sun shines brightly in the blue sky.",
    correct_answer: "The golden sun shines brightly in the blue sky."
  },
  {
    type: "english_oral",
    target_topic: "读书小屋 (Reading Corner)",
    target_display: "看书能让我们学到新知识！跟读练习：",
    correct_sequence: ["book", "read", "story"],
    grid_items: [],
    english_scene_sentence: "She reads an interesting story book every night.",
    english_scene_translation: "她每晚阅读一本有趣的童话故事书。",
    english_scene_image: "book",
    question_display: "She reads an interesting story book every night.",
    correct_answer: "She reads an interesting story book every night."
  },
  {
    type: "english_oral",
    target_topic: "温馨家庭 (My Warm Family)",
    target_display: "我爱我的家！跟读练习：",
    correct_sequence: ["family", "love", "home"],
    grid_items: [],
    english_scene_sentence: "I have a lovely family and we live in a warm house.",
    english_scene_translation: "我有一个可爱的家庭，我们住在一个温暖的房子里。",
    english_scene_image: "family",
    question_display: "I have a lovely family and we live in a warm house.",
    correct_answer: "I have a lovely family and we live in a warm house."
  }
];

interface GameStageProps {
  diagnostic: DiagnosticResult;
  onFinish: (score: number) => void;
}

export default function GameStage({ diagnostic, onFinish }: GameStageProps) {
  const [currentQuestion, setCurrentQuestion] = useState<DiagnosticResult>(diagnostic);

  useEffect(() => {
    setCurrentQuestion(diagnostic);
    setSpeakingState("idle");
  }, [diagnostic]);

  // Gracefully adapt fields from currentQuestion with fallbacks
  const gameType = currentQuestion.type || "math";
  const isChineseGame = gameType === "chinese_pinyin";
  const targetTopic = currentQuestion.target_topic || "特训关卡";
  const targetDisplay = currentQuestion.target_display || currentQuestion.question_display || "找出正确答案！";
  const correctSeq = currentQuestion.correct_sequence || [currentQuestion.correct_answer || ""];
  const gridItems = currentQuestion.grid_items || [
    currentQuestion.correct_answer || "",
    ...(currentQuestion.wrong_answers || [])
  ];

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correctCount, setCorrectCount] = useState(0);

  // Math & Pinyin whack-a-mole states
  const [moles, setMoles] = useState<Mole[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, active: false, value: "", isCorrect: false }))
  );

  // Chinese word matching (Lianliankan) states
  const [selectedWords, setSelectedWords] = useState<number[]>([]);
  const [solvedWordIndexes, setSolvedWordIndexes] = useState<number[]>([]);

  // English spelling states
  const [spelledLetters, setSpelledLetters] = useState<string[]>([]);
  // Store which indexes on the grid are currently used/inactive for spelling
  const [usedLetterIndexes, setUsedLetterIndexes] = useState<number[]>([]);

  // English oral states
  const [speakingState, setSpeakingState] = useState<"idle" | "listening" | "success">("idle");

  const [feedback, setFeedback] = useState<string>("加油！消灭所有错题漏洞！");
  const [feedbackType, setFeedbackType] = useState<"neutral" | "success" | "error">("neutral");
  const [activeEffect, setActiveEffect] = useState<"correct" | "wrong" | null>(null);

  const effectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinishedRef = useRef(false);

  // Game 2: 错别字大侦探 states
  const [bossHp, setBossHp] = useState(3);
  const [detectiveTargetLocked, setDetectiveTargetLocked] = useState(false);
  const [selectedAmmo, setSelectedAmmo] = useState<string | null>(null);
  const [wrongCharRounds, setWrongCharRounds] = useState<string[]>([]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [firedChar, setFiredChar] = useState("");

  // Setup rounds of mock distractors for 错别字大侦探
  useEffect(() => {
    if (gameType !== "chinese_pinyin" && gameType !== "chinese_words") return;

    let correctC = "";
    if (Array.isArray(correctSeq)) {
      if (Array.isArray(correctSeq[0])) {
        correctC = String(correctSeq[0][0] || "检");
      } else {
        correctC = String(correctSeq[0] || "甘");
      }
    } else {
      correctC = String(correctSeq || "甘");
    }

    const distractors = gridItems.filter(item => item !== correctC);
    
    // Ensure we have at least 3 distractors, fill with generic ones if scarce
    const defaultDistractors = ["错", "假", "空", "偏", "乱"];
    const mergedDistractors = [...distractors];
    while (mergedDistractors.length < 3) {
      const added = defaultDistractors.find(d => !mergedDistractors.includes(d) && d !== correctC) || "✕";
      mergedDistractors.push(added);
    }
    
    // Choose 3 distinct distractors for the 3 boss rounds
    setWrongCharRounds(mergedDistractors.slice(0, 3));
    setCurrentRoundIdx(0);
    setBossHp(3);
    setDetectiveTargetLocked(false);
    setSelectedAmmo(null);
    setFeedback("🔍 请小侦探拿起放大镜，在上方寻找写错的字，点击它锁定弱点吧！");
    setFeedbackType("neutral");
  }, [currentQuestion, gameType]);

  // Audio pronunciation player using browser Native Web Speech synthesis
  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      setFeedback("⚠️ 您的浏览器不支持语音播放，已为您跳过");
      setFeedbackType("error");
      return;
    }

    try {
      window.speechSynthesis.cancel();

      let textToSpeak = "";
      let lang = "zh-CN";
      let rate = 0.75; // Slower child-friendly speed

      const answer = currentQuestion.correct_answer || (Array.isArray(correctSeq) ? correctSeq.join("") : "");

      if (gameType === "chinese_pinyin") {
        lang = "zh-CN";
        let character = "";
        const match = targetDisplay.match(/[‘'“\"「『]([^‘'“\"」』])[’'”\"」』]/);
        if (match && match[1]) {
          character = match[1];
        } else {
          const cnCharMatch = targetDisplay.match(/[\u4e00-\u9fa5]/);
          if (cnCharMatch) {
            character = cnCharMatch[0];
          }
        }

        if (character) {
          textToSpeak = `${character}，拼音读：${answer}`;
        } else {
          textToSpeak = answer;
        }
      } else if (gameType === "english_spelling") {
        lang = "en-US";
        if (currentQuestion.english_scene_sentence) {
          textToSpeak = `${currentQuestion.correct_answer || "friend"}. ${currentQuestion.english_scene_sentence}`;
        } else {
          textToSpeak = answer;
        }
      } else if (gameType === "english_oral") {
        lang = "en-US";
        textToSpeak = currentQuestion.english_scene_sentence || answer;
      } else {
        return; // Other diagnostic views do not speak
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.onstart = () => {
        setFeedback(`🔊 正在发音播放中：${textToSpeak}`);
        setFeedbackType("success");
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech Synthesis error:", err);
    }
  };

  const speakWordOnly = (word: string) => {
    if (!window.speechSynthesis) {
      setFeedback("⚠️ 您的浏览器不支持语音播放，已为您跳过");
      setFeedbackType("error");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.75;
      utterance.onstart = () => {
        setFeedback(`🔊 正在播放单词标准发音：${word}`);
        setFeedbackType("success");
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech Synthesis error:", err);
    }
  };

  const speakSentence = (sentence: string) => {
    if (!window.speechSynthesis) {
      setFeedback("⚠️ 您的浏览器不支持语音播放，已为您跳过");
      setFeedbackType("error");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = "en-US";
      utterance.rate = 0.75;
      utterance.onstart = () => {
        setFeedback(`🔊 正在播报全句：${sentence}`);
        setFeedbackType("success");
      };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech Synthesis error:", err);
    }
  };

  // Auto speak on mount or diagnostic transitions
  useEffect(() => {
    if (gameType === "chinese_pinyin" || gameType === "english_spelling" || gameType === "english_oral") {
      const timer = setTimeout(() => {
        handleSpeak();
      }, 700);
      return () => {
        clearTimeout(timer);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [currentQuestion, gameType]);

  // Sound effects using Web Audio API
  const playSound = (type: "correct" | "wrong" | "popup" | "finish") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === "correct") {
        // Bell chime cascading C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
          gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + index * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.08);
          osc.stop(ctx.currentTime + index * 0.08 + 0.3);
        });
      } else if (type === "wrong") {
        // Comic descending cartoon buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "popup") {
        // Bubble pop sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "finish") {
        // Fanfare chord
        const fanfare = [523.25, 783.99, 659.25, 1046.50];
        fanfare.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
          gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.12);
          gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + index * 0.12 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + index * 0.12);
          osc.stop(ctx.currentTime + index * 0.12 + 0.4);
        });
      }
    } catch (e) {
      // Audio context block is bypassed silently
    }
  };

  // Trigger game finish
  useEffect(() => {
    if ((timeLeft <= 0 || correctCount >= 3) && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      playSound("finish");
      onFinish(score);
    }
  }, [timeLeft, correctCount, score, onFinish]);

  // Clock Countdown Loop
  useEffect(() => {
    const clock = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(clock);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Mode 1: Whack-a-Mole loop (for Math)
  useEffect(() => {
    if (gameType !== "math") return;

    let spawnTimeout: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;

    // Longer stay duration and quiet intervals for Pinyin to prevent rushing and ensure clarity ("语文的拼音不要太快 要有所停留")
    const stayDuration = 1800; // time moles remain above ground to read
    const downInterval = 1000; // brief restful gap between rounds

    const spawnMole = () => {
      if (timeLeft <= 0) return;

      // Spawn 1 or 2 moles
      const numToSpawn = Math.random() > 0.8 ? 2 : 1;
      const targetIndices: number[] = [];
      while (targetIndices.length < numToSpawn) {
        const randIdx = Math.floor(Math.random() * 9);
        if (!targetIndices.includes(randIdx)) {
          targetIndices.push(randIdx);
        }
      }

      setMoles((prev) =>
        prev.map((m, idx) => {
          if (targetIndices.includes(idx)) {
            const isCorrect = Math.random() < 0.5; // 50% chance of correct formula/pinyin
            let val = "";
            if (isCorrect) {
              val = correctSeq[0] as string;
            } else {
              // Get item from grid items that is not answer
              const nonAnswers = gridItems.filter((i) => i !== correctSeq[0]);
              val = nonAnswers[Math.floor(Math.random() * nonAnswers.length)] || "✕";
            }

            // Moles display simple fallback numbers as requested to keep font size large and clear.
            // No formula decoration on mole.
            
            const colorKeys = ["yellow", "pink", "cyan", "orange", "purple", "green", "rose"];
            const randomColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];

            return {
              ...m,
              active: true,
              value: val,
              isCorrect,
              color: randomColor,
            };
          }
          return m;
        })
      );

      playSound("popup");

      // Schedule hiding the moles after stayDuration
      hideTimeout = setTimeout(() => {
        setMoles((prev) => prev.map((m) => ({ ...m, active: false })));

        // Schedule next spawn after downInterval
        spawnTimeout = setTimeout(spawnMole, downInterval);
      }, stayDuration);
    };

    // First spawn delay
    spawnTimeout = setTimeout(spawnMole, 600);

    return () => {
      clearTimeout(spawnTimeout);
      clearTimeout(hideTimeout);
    };
  }, [timeLeft, gameType, correctSeq, gridItems]);

  const triggerOverlayEffect = (type: "correct" | "wrong") => {
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }
    setActiveEffect(type);
    effectTimeoutRef.current = setTimeout(() => {
      setActiveEffect(null);
      setFeedbackType("neutral");
    }, 850);
  };

  // Interactive Whittling Handlers
  // A. Whack Mole (Math & Pinyin)
  const handleWhack = (clickedMole: Mole) => {
    if (!clickedMole.active) return;

    // Immediately hide the whacked mole
    setMoles((prev) =>
      prev.map((m) => (m.id === clickedMole.id ? { ...m, active: false } : m))
    );

    if (clickedMole.isCorrect) {
      playSound("correct");
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
      setFeedback("💥 答对啦，你真棒！+10分");
      setFeedbackType("success");
      triggerOverlayEffect("correct");
    } else {
      playSound("wrong");
      setScore((s) => Math.max(0, s - 5));
      setTimeLeft((t) => Math.max(0, t - 3));
      setFeedback(`😵 漏油！"${clickedMole.value}" 不是正确项扣5分，时间-3s！`);
      setFeedbackType("error");
      triggerOverlayEffect("wrong");
    }
  };

  // B. Word Matching Game (Chinese_words)
  const handleWordClick = (index: number) => {
    if (solvedWordIndexes.includes(index)) return;

    // Toggle select
    if (selectedWords.includes(index)) {
      setSelectedWords((prev) => prev.filter((i) => i !== index));
      return;
    }

    const currentSelection = [...selectedWords, index];
    setSelectedWords(currentSelection);

    if (currentSelection.length === 2) {
      const idx1 = currentSelection[0];
      const idx2 = currentSelection[1];
      const val1 = gridItems[idx1];
      const val2 = gridItems[idx2];

      // Check if sequence has the pair [val1, val2] or [val2, val1]
      let isPairCorrect = false;

      // Note correctSeq can be string[][] e.g. [["检", "查"], ["拨", "打"]]
      const pairs = correctSeq as any[];
      for (const pair of pairs) {
        if (Array.isArray(pair)) {
          if (
            (pair[0] === val1 && pair[1] === val2) ||
            (pair[0] === val2 && pair[1] === val1)
          ) {
            isPairCorrect = true;
            break;
          }
        }
      }

      if (isPairCorrect) {
        playSound("correct");
        setScore((s) => s + 20);
        setCorrectCount((c) => c + 1);
        setSolvedWordIndexes((prev) => [...prev, idx1, idx2]);
        setFeedback(`💯 连对啦！【${val1}】和【${val2}】抱成团！+20分`);
        setFeedbackType("success");
        triggerOverlayEffect("correct");
        setSelectedWords([]);

        // Reshuffle or revive if all pairs completed
        const updatedSolved = [...solvedWordIndexes, idx1, idx2];
        const allPotentialPairsNum = pairs.flat().length;
        if (updatedSolved.length >= Math.min(gridItems.length, allPotentialPairsNum)) {
          setTimeout(() => {
            setSolvedWordIndexes([]);
            setFeedback("🌱 太棒了！下一轮字卡已刷新！");
          }, 1000);
        }
      } else {
        playSound("wrong");
        setScore((s) => Math.max(0, s - 5));
        setTimeLeft((t) => Math.max(0, t - 3));
        setFeedback(`❌ 哎呀！【${val1}】和【${val2}】不能组成正确词语哦，时间-3s！`);
        setFeedbackType("error");
        triggerOverlayEffect("wrong");
        setSelectedWords([]);
      }
    }
  };

  // C. English spelling clicks
  const handleLetterClick = (index: number, letter: string) => {
    if (usedLetterIndexes.includes(index)) return;

    // Check if the clicked letter is the next in order
    const nextRequiredLetter = correctSeq[spelledLetters.length] as string;

    if (letter.toLowerCase() === nextRequiredLetter.toLowerCase()) {
      // Correct character
      playSound("popup");
      const updatedLetters = [...spelledLetters, letter];
      setSpelledLetters(updatedLetters);
      setUsedLetterIndexes((prev) => [...prev, index]);
      setFeedback(`✨ 拼对字母 "${letter.toUpperCase()}"！继续冲！`);

      if (updatedLetters.length === correctSeq.length) {
        // Full Word Spelled Successfully!
        setTimeout(() => {
          playSound("correct");
          setScore((s) => s + 30);
          setCorrectCount((c) => c + 1);
          setFeedback(`👑 极速通关！单词【${correctSeq.join("").toUpperCase()}】完全拼对！+30分`);
          setFeedbackType("success");
          triggerOverlayEffect("correct");
          // Clear
          setSpelledLetters([]);
          setUsedLetterIndexes([]);
        }, 150);
      }
    } else {
      // Out of order spelling strike
      playSound("wrong");
      setScore((s) => Math.max(0, s - 5));
      setTimeLeft((t) => Math.max(0, t - 3));
      setFeedback(`❌ 字母顺序不对哦！拼写提示: "${nextRequiredLetter.toUpperCase()}"，重来试试！`);
      setFeedbackType("error");
      triggerOverlayEffect("wrong");
      // Reset spelling progress
      setSpelledLetters([]);
      setUsedLetterIndexes([]);
    }
  };

  // D. English Oral Practice Event Handlers
  const handleTriggerOralMic = () => {
    if (speakingState === "listening" || speakingState === "success") return;
    playSound("popup");
    setSpeakingState("listening");
    setFeedback("🎙️ 正在监测您的语音输入，请大声、清晰地朗读例句...");
    setFeedbackType("neutral");

    // Natural oral latency simulation for kids voice scoring
    setTimeout(() => {
      playSound("correct");
      setSpeakingState("success");
      setFeedback("💮 太棒啦！跟读契合度 99%！发音饱满、语调标准（少儿 A+ 级评定）！");
      setFeedbackType("success");
      triggerOverlayEffect("correct");
    }, 2000);
  };

  const handleConfirmOralSuccess = () => {
    playSound("correct");
    setScore((s) => s + 20);
    const nextCount = correctCount + 1;
    setCorrectCount(nextCount);
    setSpeakingState("idle");

    if (nextCount >= 3) {
      setFeedback("👑 恭喜你！消灭了全部 3 句口语特训漏洞！英语发音棒棒哒！🎉");
      setFeedbackType("success");
      triggerOverlayEffect("correct");
      setTimeout(() => {
        onFinish(score + 20);
      }, 1500);
    } else {
      // Pick next oral sentence from the pool that isn't the current one!
      const availableNext = ENGLISH_ORAL_POOL.filter(
        (item) => item.english_scene_sentence !== currentQuestion.english_scene_sentence
      );
      const nextSentence = availableNext[Math.floor(Math.random() * availableNext.length)] || ENGLISH_ORAL_POOL[0];

      setCurrentQuestion({
        ...currentQuestion,
        target_topic: nextSentence.target_topic,
        target_display: nextSentence.target_display,
        correct_sequence: nextSentence.correct_sequence,
        grid_items: nextSentence.grid_items,
        english_scene_sentence: nextSentence.english_scene_sentence,
        english_scene_translation: nextSentence.english_scene_translation,
        english_scene_image: nextSentence.english_scene_image,
        question_display: nextSentence.question_display,
        correct_answer: nextSentence.correct_answer,
      });

      setFeedback("✨ AI 老师已经为您准备好了全新的精美口语绘景句子，大声读吧！");
      setFeedbackType("neutral");
    }
  };

  // Game 2: 错别字大侦探 Event Handlers
  const handleTyposTap = (char: string) => {
    if (bossHp <= 0 || isShooting) return;
    
    let correctC = "";
    if (Array.isArray(correctSeq)) {
      if (Array.isArray(correctSeq[0])) {
        correctC = String(correctSeq[0][0] || "检");
      } else {
        correctC = String(correctSeq[0] || "甘");
      }
    } else {
      correctC = String(correctSeq || "甘");
    }

    const currentWrongC = wrongCharRounds[currentRoundIdx] || "干";

    if (char === currentWrongC) {
      playSound("popup");
      setDetectiveTargetLocked(true);
      setFeedback(`🎯 目标锁定成功！小恶魔的软肋就是错别字“${currentWrongC}”！请点击下方弹药库中正确的“${correctC}”字能量球将它净化！`);
      setFeedbackType("success");
    } else {
      playSound("wrong");
      setFeedback(`🤔 这个“${char}”字写得端端正正没有破绽哦！请拿出放大镜再找找别的错别字吧！`);
      setFeedbackType("error");
    }
  };

  const handleShootAmmo = (ammo: string) => {
    if (isShooting || bossHp <= 0) return;

    let correctC = "";
    if (Array.isArray(correctSeq)) {
      if (Array.isArray(correctSeq[0])) {
        correctC = String(correctSeq[0][0] || "检");
      } else {
        correctC = String(correctSeq[0] || "甘");
      }
    } else {
      correctC = String(correctSeq || "甘");
    }

    const currentWrongC = wrongCharRounds[currentRoundIdx] || "干";

    if (!detectiveTargetLocked) {
      setFeedback(`🔍 请小侦探先拿放大镜，在上方锁定错误的“${currentWrongC}”字（点击它）哦！`);
      setFeedbackType("error");
      playSound("wrong");
      return;
    }

    if (ammo === correctC) {
      // Correct character chosen!
      setFiredChar(ammo);
      setIsShooting(true);
      playSound("popup"); // whoosh sound
      setFeedback(`🚀 净化能量装填中... 正在发射正确字弹“${ammo}”！`);
      setFeedbackType("success");

      // After projectile flight complete
      setTimeout(() => {
        setIsShooting(false);
        playSound("correct");
        setScore((s) => s + 25);
        
        // This is a correct action
        setCorrectCount((c) => c + 1);
        setBossHp((prev) => Math.max(0, prev - 1));
        triggerOverlayEffect("correct");

        // Attempt to guess correct word
        let corrWord = "甘甜";
        const wordMatch = targetDisplay.match(/‘([^’]+)’/) || targetDisplay.match(/“([^”]+)”/) || targetDisplay.match(/【([^】]+)】/);
        if (wordMatch && wordMatch[1]) {
          corrWord = wordMatch[1];
        } else {
          const pieces = (diagnostic.correct_answer || "").split("/");
          if (pieces[0] && pieces[0].length >= 2) {
            corrWord = pieces[0];
          }
        }

        const nextHp = bossHp - 1;
        setFeedback(`💥 强力净化！“${correctC}”消灭了错字分身，【${corrWord}】重归清秀！`);
        setFeedbackType("success");

        setTimeout(() => {
          if (nextHp > 0) {
            // Next round
            setCurrentRoundIdx((prev) => prev + 1);
            setDetectiveTargetLocked(false);
            setFeedback("👹 吼！大魔王不甘心，召唤了新的错字分身，快带上放大镜寻找它的新破绽！");
            setFeedbackType("neutral");
          } else {
            // Level cleared!
            setFeedback("🏆 荣耀胜利！大魔王被彻底净化，整条街道的课本都变干净漂亮啦！");
            setFeedbackType("success");
          }
        }, 1500);

      }, 600); // 600ms match animation duration

    } else {
      // Wrong character ammo chosen!
      playSound("wrong");
      setScore((s) => Math.max(0, s - 5));
      setTimeLeft((t) => Math.max(0, t - 3));
      setFeedback(`❌ 哎呀！“${ammo}”字弹药和错字是一伙的，产生了能量反弹！时间-3秒！`);
      setFeedbackType("error");
      triggerOverlayEffect("wrong");
    }
  };

  // Creative maths decoration
  let headingQuestion = targetDisplay;
  if (gameType === "math" && diagnostic.target_topic && diagnostic.question_display && diagnostic.correct_answer) {
    const conceptual = decorateMathQuestion(diagnostic.target_topic, diagnostic.question_display, diagnostic.correct_answer);
    headingQuestion = conceptual.creativeQuestion;
  }

  // Define headers and theme coloring based on current game type - fully optimized for protective eye-care greens
  const themeStyles = {
    math: {
      bg: "from-emerald-600 to-teal-700",
      accent: "bg-green-100 text-emerald-950",
      gridBg: "bg-emerald-50/50"
    },
    chinese_pinyin: {
      bg: "from-green-600 to-emerald-700",
      accent: "bg-green-100 text-emerald-950",
      gridBg: "bg-green-50/60"
    },
    chinese_words: {
      bg: "from-emerald-700 to-green-800",
      accent: "bg-emerald-100 text-emerald-950",
      gridBg: "bg-emerald-50/50"
    },
    english_spelling: {
      bg: "from-teal-600 to-emerald-700",
      accent: "bg-teal-150 text-teal-950",
      gridBg: "bg-teal-50"
    },
    english_oral: {
      bg: "from-violet-600 to-indigo-700",
      accent: "bg-violet-100 text-violet-950",
      gridBg: "bg-violet-50/50"
    }
  }[gameType] || {
    bg: "from-emerald-600 to-teal-700",
    accent: "bg-green-100 text-emerald-950",
    gridBg: "bg-emerald-50/50"
  };

  return (
    <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-4 select-none animate-fade-in" id="gamestage-root">
      {/* 1. HUD: Time, Score, and Target Progress */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 border-4 border-slate-800 p-3 rounded-2xl shadow-[0_3px_0_#1e293b]">
        {/* Timer Bar */}
        <div className="flex-1 flex items-center gap-1.5 flex-row">
          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 animate-pulse" />
          <div className="flex-1 h-3 bg-slate-205 border-2 border-slate-700 rounded-full overflow-hidden relative shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${
                timeLeft > 10 ? "bg-emerald-500" : "bg-red-500 animate-pulse"
              }`}
              style={{ width: `${(timeLeft / 30) * 100}%` }}
            ></div>
          </div>
          <span className="font-mono text-[11px] font-black text-slate-800 w-8 text-right">
            {timeLeft}s
          </span>
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-1 bg-yellow-350 border-2 border-slate-850 px-2 py-0.5 rounded-xl shadow-sm text-slate-900 font-extrabold text-[10px] sm:text-xs">
          <Star className="w-3 h-3 fill-current text-slate-900" />
          <span>得分: <span className="font-mono text-[11px]">{score}</span></span>
        </div>

        {/* Progress Target */}
        <div className="flex items-center gap-1 bg-emerald-100 border-2 border-slate-850 px-2 py-0.5 rounded-xl shadow-sm text-emerald-950 font-extrabold text-[10px] sm:text-xs">
          <Trophy className="w-3 h-3 fill-current text-emerald-950" />
          <span>清除: <span className="font-mono text-[11px]">{correctCount}</span>/3</span>
        </div>
      </div>

      {/* Chinese Game: Game 2 - 错别字大侦探 (Role playing detective mode) */}
      {isChineseGame ? (
        <div className="space-y-4 flex flex-col flex-1" id="chinese-detective-game">
          {(() => {
            // Attempt to extract correct character and guess correct word
            let correctC = "";
            if (Array.isArray(correctSeq)) {
              if (Array.isArray(correctSeq[0])) {
                correctC = String(correctSeq[0][0] || "检");
              } else {
                correctC = String(correctSeq[0] || "甘");
              }
            } else {
              correctC = String(correctSeq || "甘");
            }

            let corrWord = "甘甜";
            const wordMatch = targetDisplay.match(/‘([^’]+)’/) || targetDisplay.match(/“([^”]+)”/) || targetDisplay.match(/【([^】]+)】/);
            if (wordMatch && wordMatch[1]) {
              corrWord = wordMatch[1];
            } else {
              const pieces = (diagnostic.correct_answer || "").split("/");
              if (pieces[0] && pieces[0].length >= 2) {
                corrWord = pieces[0];
              }
            }

            const currentWrongC = wrongCharRounds[currentRoundIdx] || "干";
            const story = getDetectiveStory(
              correctC,
              currentWrongC,
              corrWord,
              corrWord.includes(correctC) ? corrWord.replace(correctC, currentWrongC) : `${currentWrongC}${corrWord.substring(1)}`
            );

            // Splitting logic
            const targetIdx = corrWord.indexOf(correctC);
            const prefix = targetIdx >= 0 ? corrWord.substring(0, targetIdx) : "";
            const suffix = targetIdx >= 0 ? corrWord.substring(targetIdx + correctC.length) : corrWord.substring(1);

            return (
              <>
                {/* Story and Boss health bar */}
                <div className="bg-emerald-50 border-4 border-slate-800 p-4 rounded-3xl shadow-[0_4px_0_#064e3b] flex flex-col md:flex-row gap-4 items-center relative overflow-hidden">
                  <div className="absolute right-[-15px] bottom-[-15px] text-7xl opacity-5">🕵️‍♂️</div>
                  {/* Character Avatar */}
                  <div className="flex flex-col items-center flex-shrink-0 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-amber-500 border-4 border-slate-800 rounded-full flex items-center justify-center text-3xl shadow-md animate-bounce" style={{ animationDuration: '3s' }}>
                      {story.avatar}
                    </div>
                    <span className="mt-1.5 text-xs font-black text-slate-900 bg-yellow-300 border-2 border-slate-800 px-2.5 py-0.5 rounded-full shadow-sm">
                      {story.npc}
                    </span>
                  </div>
                  {/* Chat Bubble content */}
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-[10px] text-emerald-950 bg-emerald-100 border border-emerald-350 py-0.5 px-2 rounded-lg">
                        📖 侦探特训剧情：{story.title}
                      </span>
                      
                      {/* Boss HP Bar */}
                      <div className="flex items-center gap-1 bg-slate-905 border-2 border-slate-800 px-2.5 py-0.5 rounded-xl shadow-md text-white">
                        <span className="text-[9px] text-red-400 font-extrabold uppercase mr-1">Boss生命值:</span>
                        <span className="text-xs font-bold flex gap-0.5 tracking-wider">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <span
                              key={i}
                              className={`transition-all duration-300 transform ${
                                i < bossHp ? "scale-110 filter drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]" : "opacity-20 grayscale scale-90"
                              }`}
                            >
                              👿
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-955 font-black leading-relaxed">
                      {story.text}
                    </p>
                  </div>
                </div>

                {/* The Microscope / Typo Demon detector stage */}
                <div className="border-4 border-slate-900 bg-emerald-950/15 p-5 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center shadow-inner min-h-[160px]">
                  {/* Grid radar effect visual */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/5 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-emerald-500/20 animate-laser pointer-events-none"></div>

                  {/* Fired Projectile Animation overlay */}
                  {isShooting && (
                    <div className="absolute bottom-4 z-40 transition-all text-center animate-projectile text-emerald-955">
                      <div className="bg-gradient-to-br from-emerald-400 via-green-400 to-yellow-300 border-4 border-slate-800 text-slate-900 font-extrabold text-2xl w-14 h-14 rounded-full flex items-center justify-center animate-spin shadow-2xl">
                        {firedChar}
                      </div>
                    </div>
                  )}

                  {/* Boss / Typo Monster Model */}
                  <div className="flex flex-col items-center relative z-10 animate-float">
                    {/* Active target scope */}
                    {detectiveTargetLocked && (
                      <div className="absolute -inset-4 border-4 border-dashed border-red-500 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '10s' }}></div>
                    )}

                    {/* Cute typo demon */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-red-400 via-rose-500 to-red-650 border-4 border-slate-900 rounded-full flex flex-col items-center justify-center shadow-[0_6px_0_#991b1b]">
                      {/* Little Cute Demon Horns */}
                      <div className="absolute -top-3 left-4 w-4 h-6 bg-red-850 border-2 border-slate-900 rounded-full -rotate-12"></div>
                      <div className="absolute -top-3 right-4 w-4 h-6 bg-red-850 border-2 border-slate-900 rounded-full rotate-12"></div>
                      
                      {/* Little Demon Wings */}
                      <div className="absolute -left-6 top-6 w-8 h-8 bg-red-800 border-2 border-slate-900 rounded-l-[40px] rounded-t-[10px] -rotate-12 origin-right animate-pulse"></div>
                      <div className="absolute -right-6 top-6 w-8 h-8 bg-red-800 border-2 border-slate-900 rounded-r-[40px] rounded-t-[10px] rotate-12 origin-left animate-pulse"></div>

                      {/* Angry but cute eyes */}
                      <div className="flex gap-4 mt-1">
                        <div className="w-5 h-5 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-red-650 rounded-full"></div>
                        </div>
                        <div className="w-5 h-5 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-red-650 rounded-full"></div>
                        </div>
                      </div>

                      {/* Distressed mouth */}
                      <div className="w-4 h-1.5 bg-slate-900 rounded-full mt-1.5"></div>
                      
                      {/* Status Label badge above */}
                      <div className="absolute -top-6 bg-slate-900 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-slate-705 shadow-md">
                        {detectiveTargetLocked ? "🎯 LOCK / 已锁定" : "👾 错字恶魔"}
                      </div>
                    </div>

                    {/* Display wrong sentence containing clickable culprit */}
                    <div className="mt-4 bg-white border-4 border-slate-900 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-[0_4px_0_#0f172a] select-none text-center">
                      <span className="text-slate-800 font-extrabold text-sm sm:text-base">
                        {story.wrongSentence.split("【")[0]}
                      </span>
                      
                      {/* Clickable culprit wrong char */}
                      <button
                        onClick={() => handleTyposTap(currentWrongC)}
                        className={`px-3 py-1 text-xl sm:text-2xl font-black rounded-xl border-2 transition-all cursor-pointer relative ${
                          detectiveTargetLocked
                            ? "bg-red-500 border-rose-650 text-white animate-bounce shadow-md scale-105"
                            : "bg-red-5 border-dashed border-red-400 text-red-600 hover:scale-105 hover:bg-yellow-55 active:scale-95 animate-pulse"
                        }`}
                      >
                        {currentWrongC}
                        
                        {/* Indicator line */}
                        <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[9px] font-black tracking-tight whitespace-nowrap bg-red-600 text-white px-1.5 py-0.2 rounded border border-red-800 shadow">
                          {detectiveTargetLocked ? "🎯 已锁定" : "🔍 点击找错"}
                        </span>
                      </button>

                      <span className="text-slate-800 font-extrabold text-sm sm:text-base">
                        {story.wrongSentence.split("】")[1]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Highlights Audio read button for spoken support */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSpeak}
                    className="flex items-center gap-1.5 bg-yellow-350 hover:bg-yellow-250 text-slate-900 font-extrabold text-xs px-3.5 py-1.5 rounded-2xl border-4 border-slate-900 shadow-[0_2.5px_0_#0f172a] active:translate-y-[1px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                    <span>🔊 听正确读音</span>
                  </button>
                </div>

                {/* The Word Ammo list (弹药库) */}
                <div className="bg-emerald-500/10 border-4 border-slate-800 rounded-2xl p-3 shadow-inner">
                  <div className="text-center font-black text-xs text-emerald-950 uppercase tracking-wider mb-2">
                    💥 弹药能量库（选正确汉字弹药打向怪物）
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {gridItems.map((ammo, idx) => {
                      return (
                        <button
                          key={idx}
                          onClick={() => handleShootAmmo(ammo)}
                          className="aspect-square bg-white border-4 border-slate-900 rounded-2xl text-slate-900 hover:bg-emerald-50 active:scale-95 text-center flex flex-col items-center justify-center transition-all p-1.5 relative shadow-[0_3px_0_#1e293b] hover:shadow-[0_4px_0_#1e293b] active:translate-y-[1.5px] active:shadow-none cursor-pointer"
                          style={{ minHeight: "80px" }}
                        >
                          <span className="text-xl sm:text-2xl font-black select-none leading-none">{ammo}</span>
                          <span className="text-[8px] text-slate-400 font-bold mt-1 uppercase">字词能量</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* 2. Target Question Banner */}
          <div className={`bg-gradient-to-br ${themeStyles.bg} rounded-3xl border-4 border-slate-800 p-4 shadow-[0_4px_0_#1E293B] relative overflow-hidden`}>
            <div className="absolute right-[-10px] top-[-10px] opacity-10 text-6xl">🎈</div>
            <div className={`absolute -top-3.5 left-6 ${themeStyles.accent} font-black text-[10px] px-2.5 py-0.5 rounded-full border-2 border-slate-800 flex items-center gap-1`}>
              <Sparkles className="w-3 h-3 fill-current" /> 脑力特训任务
            </div>
            
            <p className="text-white text-base font-black text-center mt-1.5 leading-normal tracking-wide">
              {headingQuestion}
            </p>

            {/* Conceptual visual repeated-addition or explanation sub-banner for Math */}
            {gameType === "math" && diagnostic.question_display && (
              <div className="mt-2.5 bg-black/40 border-2 border-white/10 rounded-2xl py-2 px-3 text-center flex flex-col items-center justify-center gap-0.5">
                <span className="text-[10px] text-emerald-300 font-extrabold tracking-widest">💡 算术解析提示</span>
                <span className="text-lg sm:text-2xl font-black text-yellow-300 font-mono tracking-wide animate-pulse">
                  {getFormulaEquiv(diagnostic.question_display, "?")}
                </span>
              </div>
            )}

            {/* Spelling HUD display representation & click-to-speak interactive word card */}
            {gameType === "english_spelling" && (
              <div className="mt-3 bg-slate-900/40 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2.5 shadow-inner">
                {/* Clickable Word Pronunciation Indicator */}
                <button
                  id="english-spelling-interactive-word-badge"
                  onClick={() => {
                    const word = currentQuestion.correct_answer || correctSeq.join("");
                    speakWordOnly(word);
                  }}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 border-4 border-slate-800 rounded-xl px-4 py-2 shadow-[0_3px_0_#1e293b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-slate-900 group"
                  title="点击听标准发音"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-md select-none">
                      拼写词
                    </span>
                    <span className="text-base font-black tracking-wide font-sans text-slate-900">
                      {(currentQuestion.correct_answer || correctSeq.join("")).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 text-yellow-300 border border-slate-900 rounded-md px-2 py-0.5 text-[9px] font-black group-hover:scale-105 transition-transform">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-yellow-300 fill-yellow-300" />
                    <span>点击标准播音</span>
                  </div>
                </button>

                {/* Blanks of spelled letters */}
                <div 
                  onClick={() => {
                    const word = currentQuestion.correct_answer || correctSeq.join("");
                    speakWordOnly(word);
                  }}
                  className="flex justify-center gap-2 cursor-pointer select-none group py-1"
                  title="点击大声读出这个单词"
                >
                  {correctSeq.map((letter, idx) => (
                    <div
                      key={idx}
                      className={`w-8 h-8 rounded-xl border-2 border-slate-800 flex items-center justify-center font-black text-sm transition-all group-hover:scale-105 ${
                        idx < spelledLetters.length
                          ? "bg-amber-400 text-slate-900 scale-105 shadow-sm"
                          : "bg-slate-950/60 text-slate-400 border-dashed"
                      }`}
                    >
                      {idx < spelledLetters.length ? spelledLetters[idx].toUpperCase() : "_"}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scenic illustration & example sentence for English Spelling or Oral Game */}
            {((gameType === "english_spelling" || gameType === "english_oral") || currentQuestion.english_scene_sentence) && (
              <div className="mt-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2.5 space-y-2.5">
                {/* Image Container with high contrast border */}
                <div className="relative w-full h-36 bg-slate-900 border-4 border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <img 
                    src={getSceneImageUrl(currentQuestion.english_scene_image || currentQuestion.correct_answer || "friend")} 
                    alt="English scenery study visual"
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                    id={`english-scene-img-${currentQuestion.english_scene_image || currentQuestion.correct_answer || "friend"}`}
                  />
                  <div className="absolute right-2 bottom-2 bg-indigo-600 border-2 border-slate-800 text-white font-black text-[9px] px-2.5 py-0.5 rounded-full select-none">
                    🎯 绘景图像联想
                  </div>
                </div>

                {/* Sentences/Word meaning display with highlighting */}
                <div 
                  onClick={() => {
                    if (currentQuestion.english_scene_sentence) {
                      speakSentence(currentQuestion.english_scene_sentence);
                    } else {
                      const word = currentQuestion.correct_answer || correctSeq.join("");
                      speakWordOnly(word);
                    }
                  }}
                  className="text-center space-y-1 bg-black/30 hover:bg-black/45 border border-white/10 hover:border-white/20 py-2.5 px-3 rounded-xl cursor-pointer select-none group transition-all"
                  title="点击听全句播音发音"
                >
                  {currentQuestion.english_scene_sentence ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-yellow-300 font-extrabold tracking-wider bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20 group-hover:scale-105 transition-transform">
                        <Volume2 className="w-3.5 h-3.5 animate-pulse text-yellow-300 fill-yellow-300" />
                        <span>点击听整句标准读音</span>
                      </div>
                      <p className="text-sm font-extrabold text-white leading-relaxed font-sans select-text">
                        {(() => {
                          const sentence = currentQuestion.english_scene_sentence || "";
                          const targetWord = (currentQuestion.correct_answer || "").toLowerCase();
                          if (targetWord && sentence.toLowerCase().includes(targetWord)) {
                            const parts = sentence.split(new RegExp(`(${targetWord})`, "gi"));
                            return parts.map((part, i) => 
                              part.toLowerCase() === targetWord 
                                ? <span key={i} className="text-yellow-300 font-extrabold underline decoration-wavy decoration-yellow-400">{part}</span> 
                                : <span key={i}>{part}</span>
                            );
                          }
                          return sentence;
                        })()}
                      </p>
                      {currentQuestion.english_scene_translation && (
                        <p className="text-[11px] text-teal-100 font-bold leading-normal">
                          意: {currentQuestion.english_scene_translation}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-violet-300 font-black tracking-wider bg-violet-950/60 px-2 py-0.5 rounded-md border border-violet-800/40 group-hover:scale-105 transition-transform" id="spelling-card-word-badge">
                        <Volume2 className="w-3 h-3 text-violet-300" />
                        <span>单词对照卡 (点击发音)</span>
                      </div>
                      <p className="text-xs font-black text-white leading-normal mt-0.5">
                        {(() => {
                          const matchInTitle = targetDisplay.match(/【(.*?)】/);
                          if (matchInTitle) return matchInTitle[1];
                          const targetWord = (currentQuestion.correct_answer || "").toLowerCase();
                          const chMap: Record<string, string> = {
                            bicycle: "自行车 (Bicycle)",
                            dog: "小狗 (Dog)",
                            puppy: "可爱小狗 (Puppy)",
                            cat: "猫咪 (Cat)",
                            apple: "苹果 (Apple)",
                            school: "学校 (School)",
                            book: "书籍/故事书 (Book)",
                            family: "温馨家庭 (Family)",
                            sun: "温暖太阳 (Sun)",
                            icecream: "美味冰淇淋 (Ice cream)",
                            friend: "好朋友 (Friend)"
                          };
                          return chMap[targetWord] || targetDisplay || "对应英语概念生动示范";
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-white/80 font-bold text-center mt-2 flex items-center justify-center gap-1 bg-black/30 py-0.5 px-3 rounded-lg border border-white/10 w-fit mx-auto">
              【 关卡要点: {targetTopic} 】
            </p>
          </div>

          {/* 3. Interactive Magic Grid Matrix */}
          <div className={`grid grid-cols-3 gap-3.5 py-1 ${themeStyles.gridBg} rounded-2xl p-3.5 border-4 border-slate-800 relative shadow-inner`}>
            {/* A. Math & Pinyin (Whack a mole format) */}
            {gameType === "math" &&
              moles.map((mole) => {
                const activeTheme = MOLE_THEMES[mole.color || "green"] || MOLE_THEMES.green;
                return (
                  <div
                    key={mole.id}
                    onClick={() => handleWhack(mole)}
                    className="aspect-square bg-emerald-950/20 rounded-2xl border-4 border-slate-800 overflow-hidden relative shadow-inner flex items-end justify-center cursor-pointer group active:scale-95"
                    style={{ minHeight: "92px" }}
                  >
                    <div
                      className={`absolute w-[90%] h-[92%] bg-gradient-to-b ${activeTheme.body} border-t-4 border-r-2 border-l-2 border-slate-800 rounded-t-[40px] transition-all duration-150 flex flex-col justify-start items-center shadow-lg pointer-events-none pt-1`}
                      style={{
                        bottom: mole.active ? "0px" : "-110%",
                        transform: mole.active ? "scale(1)" : "scale(0.8)",
                      }}
                    >
                      {/* Ears */}
                      <div className="absolute -top-2 inset-x-0 flex justify-between px-2.5 pointer-events-none">
                        <div className={`w-5 h-5 ${activeTheme.ears} border-2 border-slate-800 rounded-full flex items-center justify-center`}>
                          <div className={`w-2.5 h-2.5 ${activeTheme.innerEars} rounded-full`}></div>
                        </div>
                        <div className={`w-5 h-5 ${activeTheme.ears} border-2 border-slate-800 rounded-full flex items-center justify-center`}>
                          <div className={`w-2.5 h-2.5 ${activeTheme.innerEars} rounded-full`}></div>
                        </div>
                      </div>

                      {/* Eyes */}
                      <div className="flex gap-4 mt-2 justify-center relative z-10">
                        <div className="w-4 h-4 bg-slate-900 rounded-full flex items-start justify-start p-0.5 relative">
                          <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                        </div>
                        <div className="w-4 h-4 bg-slate-900 rounded-full flex items-start justify-start p-0.5 relative">
                          <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                        </div>
                      </div>

                      {/* Cheeks */}
                      <div className="flex items-center gap-1.5 mt-0.5 relative">
                        <span className="w-2 h-1.5 bg-rose-400 rounded-full block animate-pulse"></span>
                        <div className="w-1.5 h-1 bg-emerald-950 rounded-full"></div>
                        <span className="w-2 h-1.5 bg-rose-400 rounded-full block animate-pulse"></span>
                      </div>

                      {/* Grid Item Content Container held by the Mole */}
                      <div className="bg-slate-950 border-2 border-slate-800 rounded-xl px-2 py-1 mt-1.5 max-w-[95%] text-center shadow-md overflow-hidden min-w-[70px] flex items-center justify-center">
                        <span className={`font-black text-amber-300 font-mono tracking-tighter leading-none block whitespace-nowrap ${
                          mole.value.length > 10 
                            ? 'text-[10px]' 
                            : mole.value.length > 5 
                            ? 'text-xs' 
                            : mole.value.length >= 3 
                            ? 'text-sm sm:text-base' 
                            : 'text-2xl sm:text-3xl scale-110 drop-shadow-[0_2px_0_#000000]'
                        }`}>
                          {mole.value}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-4 bg-emerald-600 border-t-2 border-slate-850 pointer-events-none rounded-b-xl z-20"></div>
                  </div>
                );
              })}

            {/* B. Chinese Word Connective (Lianliankan layout) */}
            {gameType === "chinese_words" &&
              gridItems.map((word, idx) => {
                const isSolved = solvedWordIndexes.includes(idx);
                const isSelected = selectedWords.includes(idx);
                return (
              <button
                key={idx}
                disabled={isSolved}
                onClick={() => handleWordClick(idx)}
                className={`aspect-square rounded-2xl border-4 text-center flex flex-col items-center justify-center transition-all p-2 relative shadow-md ${
                  isSolved
                    ? "bg-slate-200 border-slate-400 text-slate-400 opacity-60 scale-95"
                    : isSelected
                    ? "bg-yellow-100 border-amber-500 scale-105 ring-4 ring-yellow-400 ring-offset-2"
                    : "bg-white hover:bg-emerald-50 active:scale-95 border-slate-800 text-slate-800"
                }`}
                style={{ minHeight: "92px" }}
              >
                {isSolved ? (
                  <div className="text-center">
                    <span className="text-xl block">👑</span>
                    <span className="text-xs font-black text-slate-400">{word}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl font-black">{word}</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5">汉字卡</span>
                  </>
                )}
              </button>
            );
          })}

        {/* C. English spelling clicks */}
        {gameType === "english_spelling" &&
          gridItems.map((letter, idx) => {
            const isUsed = usedLetterIndexes.includes(idx);
            return (
              <button
                key={idx}
                disabled={isUsed}
                onClick={() => handleLetterClick(idx, letter)}
                className={`aspect-square rounded-full border-4 text-center flex flex-col items-center justify-center transition-all p-2 relative shadow-md ${
                  isUsed
                    ? "bg-slate-300 border-slate-400 text-slate-400 opacity-30 scale-90 cursor-not-allowed"
                    : "bg-white hover:bg-violet-100 active:scale-95 border-slate-800 text-slate-800"
                }`}
                style={{ minHeight: "92px" }}
              >
                {isUsed ? (
                   <span className="text-base font-bold text-slate-400">✓</span>
                ) : (
                  <>
                    <span className="text-2xl font-black tracking-tight">{letter.toUpperCase()}</span>
                    <span className="text-[8px] text-slate-400 font-bold">英文字母</span>
                  </>
                )}
              </button>
            );
          })}

        {/* D. English oral follow-along speaking panel */}
        {gameType === "english_oral" && (
          <div id="english_oral_matrix" className="col-span-3 bg-white border-4 border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center space-y-4 shadow-inner">
            <div className="flex flex-col items-center space-y-3 w-full">
              <div className="min-h-[56px] flex items-center justify-center w-full px-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                {speakingState === "idle" && (
                  <span className="text-slate-550 font-extrabold text-xs flex items-center gap-1.5 animate-pulse">
                    💡 准备好后，快点击紫色麦克风跟读上面的句子吧！
                  </span>
                )}
                {speakingState === "listening" && (
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-violet-600 font-extrabold text-xs flex items-center gap-1.5 animate-pulse">
                      🎙️ 正在录音收音中，请大声试读例句...
                    </span>
                    <div className="flex gap-1 items-center justify-center">
                      <span className="w-1 h-3.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                      <span className="w-1 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      <span className="w-1 h-4 bg-violet-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0s]"></span>
                    </div>
                  </div>
                )}
                {speakingState === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="text-xl">💮</span>
                    <div className="text-left">
                      <p className="font-extrabold text-sm text-emerald-800">A+ 完美发音！</p>
                      <p className="text-[10px] text-emerald-500 font-bold">发音颗粒度极其细腻 (99分)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSpeak}
                  className="bg-yellow-350 hover:bg-yellow-250 text-slate-900 border-4 border-slate-900 font-black text-xs px-4 py-2.5 rounded-xl shadow-[0_2px_0_#1e293b] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                >
                  🔊 重听发音
                </button>

                <button
                  onClick={handleTriggerOralMic}
                  disabled={speakingState === "listening"}
                  className={`cursor-pointer flex items-center gap-1.5 border-4 border-slate-900 font-black text-xs px-5 py-2.5 rounded-xl shadow-[0_2px_0_#1e293b] active:translate-y-0.5 ${
                    speakingState === "listening"
                      ? "bg-rose-500 text-white"
                      : speakingState === "success"
                      ? "bg-emerald-500 text-slate-900 shadow-none scale-100"
                      : "bg-violet-600 text-white hover:bg-violet-500"
                  }`}
                >
                  {speakingState === "listening" ? "🎧 聆听中" : "🎙️ 点击跟读"}
                </button>
              </div>
            </div>

            {speakingState === "success" && (
              <button
                onClick={handleConfirmOralSuccess}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm py-3 px-4 rounded-xl border-4 border-slate-900 shadow-[0_3px_0_#1e293b] active:translate-y-0.5 active:shadow-none animate-kidPop cursor-pointer flex items-center justify-center gap-1 animate-pulse"
              >
                <span>⭐ 极棒！点击换下一张卡片 ➡️</span>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )}

      {/* 4. Live interactive feedback panel */}
      <div
        className={`text-center py-2.5 px-4 font-black transition-all rounded-xl border-2 ${
          feedbackType === "success"
            ? "bg-emerald-50 border-emerald-500 text-emerald-600 animate-bounce"
            : feedbackType === "error"
            ? "bg-red-50 border-red-500 text-red-500"
            : "bg-slate-50 border-slate-200 text-slate-705"
        }`}
      >
        <p className="text-xs font-extrabold tracking-wide uppercase text-slate-400">特训实况：</p>
        <p className="text-sm mt-0.5">{feedback}</p>
      </div>

      {/* 5. Mini Hint */}
      <div className="text-center text-[10px] text-slate-400 font-bold">
        {gameType === "math" && "提示：仔细检查算出正确答案，看清哪个小地鼠顶着正确答案。"}
        {gameType === "chinese_pinyin" && "提示：仔细分辨声母、韵母及声调。看清小地鼠的字卡并点击。"}
        {gameType === "chinese_words" && "提示：点击两个可以互配成词的汉字卡，它们将抱成团组成正确回答。"}
        {gameType === "english_spelling" && "提示：在字母盘上，按字母顺序一步一个脚印地点击拼出目标英语词汇。"}
        {gameType === "english_oral" && "提示：点击跟读按钮大声朗读，练习发音，发音优秀即可换下一句通关！"}
      </div>

      {/* 6. Styled Pop-up Splash overlay */}
      {activeEffect && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none">
          {activeEffect === "correct" ? (
            <div className="bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white rounded-full p-4 border-8 border-slate-900 shadow-[0_12px_0_#0F172A] flex flex-col items-center justify-center w-60 h-60 animate-kidPop">
              <span className="text-[110px] font-sans font-black leading-none drop-shadow-[0_4px_0_#064e3b]">✔</span>
              <span className="text-xl font-black tracking-tight -mt-4 drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] text-amber-200">
                答对啦，你真棒！
              </span>
              <span className="text-xs font-bold tracking-wider mt-1 drop-shadow-md bg-emerald-950/40 px-3.5 py-0.5 rounded-full border border-emerald-400/40">
                +优质特训经验
              </span>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-rose-500 via-red-500 to-red-600 text-white rounded-full p-4 border-8 border-slate-900 shadow-[0_12px_0_#0F172A] flex flex-col items-center justify-center w-52 h-52 animate-kidPop">
              <span className="text-[100px] font-sans font-black leading-none drop-shadow-[0_4px_0_#991b1b]">✘</span>
              <span className="text-xl font-bold tracking-wider -mt-2 drop-shadow-md bg-red-950/40 px-3.5 py-1 rounded-full border border-red-400/40 animate-kidShake">
                答错了！ -3秒
              </span>
            </div>
          )}
        </div>
      )}

      {/* Animation classes */}
      <style>{`
        @keyframes kidPop {
          0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
          45% { transform: scale(1.2) rotate(8deg); }
          70% { transform: scale(0.95) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes kidShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px) rotate(-1.5deg); }
          75% { transform: translateX(6px) rotate(1.5deg); }
        }
        @keyframes laserScan {
          0%, 100% { top: 0%; opacity: 0.2; }
          50% { top: 100%; opacity: 0.8; }
        }
        @keyframes floatWings {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fireProjectile {
          0% { transform: translateY(120px) scale(1.3); opacity: 1; }
          90% { transform: translateY(-35px) scale(0.65); opacity: 0.8; }
          100% { transform: translateY(-40px) scale(0.3); opacity: 0; }
        }
        .animate-kidPop {
          animation: kidPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-kidShake {
          animation: kidShake 0.18s ease-in-out infinite;
        }
        .animate-laser {
          animation: laserScan 2s linear infinite;
        }
        .animate-float {
          animation: floatWings 1.8s ease-in-out infinite;
        }
        .animate-projectile {
          animation: fireProjectile 0.58s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
    </div>
  );
}
