import React, { useState, useEffect, useRef } from "react";
import { Clock, Star, AlertCircle, HelpCircle, Trophy, Sparkles } from "lucide-react";
import { DiagnosticResult, Mole } from "../types";
import { decorateMathQuestion, getFormulaEquiv } from "../utils/mathDecorator";

interface GameStageProps {
  diagnostic: DiagnosticResult;
  onFinish: (score: number) => void;
}

export default function GameStage({ diagnostic, onFinish }: GameStageProps) {
  // Gracefully adapt fields from diagnostic with fallbacks
  const gameType = diagnostic.type || "math";
  const targetTopic = diagnostic.target_topic || "特训关卡";
  const targetDisplay = diagnostic.target_display || diagnostic.question_display || "找出正确答案！";
  const correctSeq = diagnostic.correct_sequence || [diagnostic.correct_answer || ""];
  const gridItems = diagnostic.grid_items || [
    diagnostic.correct_answer || "",
    ...(diagnostic.wrong_answers || [])
  ];

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

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

  const [feedback, setFeedback] = useState<string>("加油！消灭所有错题漏洞！");
  const [feedbackType, setFeedbackType] = useState<"neutral" | "success" | "error">("neutral");
  const [activeEffect, setActiveEffect] = useState<"correct" | "wrong" | null>(null);

  const effectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinishedRef = useRef(false);

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
    if (timeLeft <= 0 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      playSound("finish");
      onFinish(score);
    }
  }, [timeLeft, score, onFinish]);

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

  // Mode 1: Whack-a-Mole loop (for Math & Chinese Pinyin)
  useEffect(() => {
    if (gameType !== "math" && gameType !== "chinese_pinyin") return;

    let spawnTimeout: NodeJS.Timeout;
    let hideTimeout: NodeJS.Timeout;

    // Longer stay duration and quiet intervals for Pinyin to prevent rushing and ensure clarity ("语文的拼音不要太快 要有所停留")
    const stayDuration = gameType === "chinese_pinyin" ? 2800 : 1800; // time moles remain above ground to read
    const downInterval = gameType === "chinese_pinyin" ? 1400 : 1000; // brief restful gap between rounds

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

            // Decorate math formulas if applicable
            if (gameType === "math" && diagnostic.question_display && diagnostic.correct_answer) {
              if (isCorrect) {
                val = getFormulaEquiv(diagnostic.question_display, diagnostic.correct_answer);
              } else {
                val = getFormulaEquiv(diagnostic.question_display, val);
              }
            }

            return {
              ...m,
              active: true,
              value: val,
              isCorrect,
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
    }
  }[gameType] || {
    bg: "from-emerald-600 to-teal-700",
    accent: "bg-green-100 text-emerald-950",
    gridBg: "bg-emerald-50/50"
  };

  return (
    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between relative overflow-hidden" id="game-stage">
      {/* 1. Live Scoreboard */}
      <div className="flex justify-between items-center bg-slate-900 border-4 border-slate-800 p-3 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-1.5 animate-pulse">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-extrabold text-sm tracking-wide">
            得分: <span className="text-amber-400 text-lg font-mono">{score}</span>
          </span>
        </div>

        <div className="bg-slate-850 px-3 py-1 rounded-xl border border-slate-700">
          <span className="font-bold text-xs text-indigo-300">
            {gameType === "math" && "🔢 算术防错"}
            {gameType === "chinese_pinyin" && "✍️ 认读拼音"}
            {gameType === "chinese_words" && "🧩 字词组合"}
            {gameType === "english_spelling" && "🔤 字母拼写"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className={`w-5 h-5 ${timeLeft <= 8 ? "text-red-500 animate-pulse" : "text-emerald-400"}`} />
          <span className="font-extrabold text-sm tracking-wide">
            时长: <span className={`text-lg font-mono ${timeLeft <= 8 ? "text-red-500 font-bold" : "text-emerald-400"}`}>{timeLeft}s</span>
          </span>
        </div>
      </div>

      {/* 2. Target Question Banner */}
      <div className={`bg-gradient-to-br ${themeStyles.bg} rounded-3xl border-4 border-slate-800 p-4 shadow-[0_4px_0_#1E293B] relative overflow-hidden`}>
        <div className="absolute right-[-10px] top-[-10px] opacity-10 text-6xl">🎈</div>
        <div className={`absolute -top-3.5 left-6 ${themeStyles.accent} font-black text-[10px] px-2.5 py-0.5 rounded-full border-2 border-slate-800 flex items-center gap-1`}>
          <Sparkles className="w-3 h-3 fill-current" /> 脑力特训任务
        </div>
        
        <p className="text-white text-base font-black text-center mt-1.5 leading-normal tracking-wide">
          {headingQuestion}
        </p>

        {/* Spelling HUD component for English spellings */}
        {gameType === "english_spelling" && (
          <div className="mt-3 flex justify-center gap-2">
            {correctSeq.map((letter, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-xl border-2 border-slate-800 flex items-center justify-center font-bold text-sm ${
                  idx < spelledLetters.length
                    ? "bg-amber-400 text-slate-900 animate-bounce"
                    : "bg-slate-950/60 text-slate-400 border-dashed"
                }`}
              >
                {idx < spelledLetters.length ? spelledLetters[idx].toUpperCase() : "_"}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-white/80 font-bold text-center mt-2 flex items-center justify-center gap-1 bg-black/30 py-0.5 px-3 rounded-lg border border-white/10 w-fit mx-auto">
          【 关卡要点: {targetTopic} 】
        </p>
      </div>

      {/* 3. Interactive Magic Grid Matrix */}
      <div className={`grid grid-cols-3 gap-3.5 py-1 ${themeStyles.gridBg} rounded-2xl p-3.5 border-4 border-slate-800 relative shadow-inner`}>
        
        {/* A. Math & Pinyin (Whack a mole format) */}
        {(gameType === "math" || gameType === "chinese_pinyin") &&
          moles.map((mole) => (
            <div
              key={mole.id}
              onClick={() => handleWhack(mole)}
              className="aspect-square bg-emerald-950/20 rounded-2xl border-4 border-slate-800 overflow-hidden relative shadow-inner flex items-end justify-center cursor-pointer group active:scale-95"
              style={{ minHeight: "92px" }}
            >
              <div
                className="absolute w-[90%] h-[92%] bg-gradient-to-b from-green-400 via-emerald-400 to-emerald-500 border-t-4 border-r-2 border-l-2 border-slate-800 rounded-t-[40px] transition-all duration-150 flex flex-col justify-start items-center shadow-lg pointer-events-none pt-1"
                style={{
                  bottom: mole.active ? "0px" : "-110%",
                  transform: mole.active ? "scale(1)" : "scale(0.8)",
                }}
              >
                {/* Ears */}
                <div className="absolute -top-2 inset-x-0 flex justify-between px-2.5 pointer-events-none">
                  <div className="w-5 h-5 bg-emerald-500 border-2 border-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-pink-300 rounded-full"></div>
                  </div>
                  <div className="w-5 h-5 bg-emerald-500 border-2 border-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-pink-300 rounded-full"></div>
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
                <div className="bg-slate-950 border-2 border-slate-800 rounded-xl px-1.5 py-0.5 mt-2 max-w-[95%] text-center shadow-md overflow-hidden">
                  <span className={`font-black text-amber-300 font-mono tracking-tighter leading-none block whitespace-nowrap ${
                    mole.value.length > 10 ? 'text-[9px]' : mole.value.length > 5 ? 'text-[11px]' : 'text-xs'
                  }`}>
                    {mole.value}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-4 bg-emerald-600 border-t-2 border-slate-850 pointer-events-none rounded-b-xl z-20"></div>
            </div>
          ))}

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
      </div>

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
        .animate-kidPop {
          animation: kidPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-kidShake {
          animation: kidShake 0.18s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
