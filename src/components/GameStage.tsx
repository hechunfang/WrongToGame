import React, { useState, useEffect, useRef } from "react";
import { Clock, Star, AlertCircle, HelpCircle, Trophy } from "lucide-react";
import { DiagnosticResult, Mole } from "../types";

interface GameStageProps {
  diagnostic: DiagnosticResult;
  onFinish: (score: number) => void;
}

export default function GameStage({ diagnostic, onFinish }: GameStageProps) {
  const { target_topic, question_display, correct_answer, wrong_answers } = diagnostic;

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [moles, setMoles] = useState<Mole[]>([
    { id: 0, active: false, value: "", isCorrect: false },
    { id: 1, active: false, value: "", isCorrect: false },
    { id: 2, active: false, value: "", isCorrect: false },
    { id: 3, active: false, value: "", isCorrect: false },
    { id: 4, active: false, value: "", isCorrect: false },
    { id: 5, active: false, value: "", isCorrect: false },
    { id: 6, active: false, value: "", isCorrect: false },
    { id: 7, active: false, value: "", isCorrect: false },
    { id: 8, active: false, value: "", isCorrect: false },
  ]);

  const [feedback, setFeedback] = useState<string>("准备击杀地鼠，看清正确答案！");
  const [feedbackType, setFeedbackType] = useState<"neutral" | "success" | "error">("neutral");

  const molesRef = useRef<Mole[]>(moles);
  molesRef.current = moles;

  // Sound effects emulation using simple WebAudio API oscillation (so we don't need any assets!)
  const playSound = (type: "correct" | "wrong" | "popup") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "correct") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "wrong") {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2); // A2
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "popup") {
        osc.frequency.setValueAtTime(330, ctx.currentTime); // E4
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // A4
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // Audio context block is bypassed silently
    }
  };

  // Timer loop
  useEffect(() => {
    const clock = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(clock);
          onFinish(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(clock);
  }, [score, onFinish]);

  // Mole generation loop
  useEffect(() => {
    let moleTimeout: NodeJS.Timeout;

    const spawnMole = () => {
      if (timeLeft <= 0) return;

      // Select active moles
      // Hide all first
      setMoles((prev) => prev.map((m) => ({ ...m, active: false })));

      // Choose 1, 2 or 3 random holes to activate
      const numToSpawn = Math.random() > 0.6 ? 2 : 1;
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
            // Determine if correct or wrong
            const isCorrect = Math.random() < 0.45; // 45% chance correct answer
            let val = "";
            if (isCorrect) {
              val = correct_answer;
            } else {
              const randWrong = wrong_answers[Math.floor(Math.random() * wrong_answers.length)];
              val = randWrong;
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

      // Set random speed interval between pops (e.g. 1s to 1.6s)
      const delay = Math.random() * 600 + 1000;
      moleTimeout = setTimeout(spawnMole, delay);
    };

    // Begin mole cycle after 1 second countdown
    moleTimeout = setTimeout(spawnMole, 1000);

    return () => clearTimeout(moleTimeout);
  }, [timeLeft, correct_answer, wrong_answers]);

  const handleWhack = (clickedMole: Mole) => {
    if (!clickedMole.active) return;

    // Instantly hide the hit mole
    setMoles((prev) =>
      prev.map((m) => (m.id === clickedMole.id ? { ...m, active: false } : m))
    );

    if (clickedMole.isCorrect) {
      playSound("correct");
      setScore((s) => s + 10);
      setFeedback("💥 太棒啦！消灭正确答案 +10分！");
      setFeedbackType("success");
    } else {
      playSound("wrong");
      setScore((s) => Math.max(0, s - 5));
      setTimeLeft((t) => Math.max(0, t - 3));
      setFeedback(`😵 哎呀！答错了 "${clickedMole.value}" 分数-5 时间-3s！`);
      setFeedbackType("error");
    }

    // Reset feedback text back to normal after a short delay
    setTimeout(() => {
      setFeedbackType("neutral");
    }, 1500);
  };

  return (
    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between" id="game-stage">
      {/* Live scoreboard and countdown bar */}
      <div className="flex justify-between items-center bg-slate-900 border-4 border-slate-800 p-3 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-1.5">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-extrabold text-sm tracking-wide">
            得分: <span className="text-amber-400 text-lg font-mono">{score}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className={`w-5 h-5 ${timeLeft <= 8 ? "text-red-500 animate-pulse" : "text-emerald-400"}`} />
          <span className="font-extrabold text-sm tracking-wide">
            时长: <span className={`text-lg font-mono ${timeLeft <= 8 ? "text-red-500 font-bold" : "text-emerald-400"}`}>{timeLeft}s</span>
          </span>
        </div>
      </div>

      {/* Target Question bubble */}
      <div className="bg-indigo-600 rounded-3xl border-4 border-slate-800 p-4 shadow-[0_4px_0_#1E293B] relative">
        <div className="absolute -top-3.5 left-6 bg-slate-800 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border-2 border-slate-800">
          🎮 终极寻找任务
        </div>
        <p className="text-white text-base font-extrabold text-center mt-1">
          {question_display}
        </p>
        <p className="text-[11px] text-indigo-200 font-bold text-center mt-1.5 flex items-center justify-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-amber-300" /> 专攻薄弱项: {target_topic}
        </p>
      </div>

      {/* Game Grid with Holes */}
      <div className="grid grid-cols-3 gap-3.5 py-1 bg-amber-50 rounded-2xl p-3.5 border-4 border-slate-800 relative shadow-inner">
        {moles.map((mole) => (
          <div
            key={mole.id}
            onClick={() => handleWhack(mole)}
            className="aspect-square bg-amber-950/40 rounded-2xl border-4 border-slate-800 overflow-hidden relative shadow-inner flex items-end justify-center cursor-pointer group active:scale-95"
            style={{ minHeight: "85px" }}
          >
            {/* Mole body */}
            <div
              className={`absolute w-full h-[85%] bg-amber-700 hover:bg-amber-600 border-t-4 border-slate-800 rounded-t-3xl transition-all duration-150 flex flex-col justify-center items-center shadow-lg pointer-events-none`}
              style={{
                bottom: mole.active ? "0px" : "-100%",
                transform: mole.active ? "scale(1)" : "scale(0.8)",
              }}
            >
              {/* Cute Mole face */}
              <div className="flex gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce"></div>
              </div>
              <div className="w-2.5 h-1.5 bg-pink-400 rounded-full mb-1"></div>

              {/* Floating Answer Text */}
              <div className="bg-slate-900 border-2 border-slate-800 rounded-md px-1.5 py-0.5 mt-0.5 shadow-sm">
                <span className="text-xs font-black text-white font-mono tracking-wide">
                  {mole.value}
                </span>
              </div>
            </div>

            {/* Grass/Hole edge decoration */}
            <div className="absolute bottom-0 inset-x-0 h-4 bg-emerald-700/60 border-t-2 border-slate-850 pointer-events-none rounded-b-xl"></div>
          </div>
        ))}
      </div>

      {/* Animated interactive feedback panel */}
      <div
        className={`text-center py-2.5 px-4 font-black transition-all rounded-xl border-2 ${
          feedbackType === "success"
            ? "bg-emerald-50 border-emerald-500 text-emerald-600 animate-bounce"
            : feedbackType === "error"
            ? "bg-red-50 border-red-500 text-red-500 animate-shake"
            : "bg-slate-50 border-slate-200 text-slate-700"
        }`}
      >
        <p className="text-xs font-extrabold tracking-wide uppercase">特训实况：</p>
        <p className="text-sm mt-0.5">{feedback}</p>
      </div>

      {/* Mini Hint */}
      <div className="text-center text-[10px] text-slate-400 font-bold">
        每次打中错答案，将扣除 3s 倒计时哦。
      </div>
    </div>
  );
}
