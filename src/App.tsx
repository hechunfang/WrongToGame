import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle, HelpCircle as InfoIcon, AppWindow, ShieldAlert } from "lucide-react";
import UploadStage from "./components/UploadStage";
import PaywallStage from "./components/PaywallStage";
import GameStage from "./components/GameStage";
import SettlementStage from "./components/SettlementStage";
import { AppState, DiagnosticResult } from "./types";

export default function App() {
  const [state, setState] = useState<AppState>("upload");
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Persistence stats
  const [practiceCount, setPracticeCount] = useState<number>(() => {
    const saved = localStorage.getItem("math_practice_count");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return localStorage.getItem("math_is_paid") === "true";
  });

  // Simple live clock for immersive user environment indicator
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setCurrentTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeImage = async (base64Image: string) => {
    setState("diagnosing");
    setErrorText(null);

    try {
      const response = await fetch("/api/analyze-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`请求错题批改 API 失败，状态码: ${response.status}`);
      }

      const payload = await response.json();
      if (payload.success && payload.data) {
        setDiagnostic(payload.data);
        // Play directly if already paid OR still within the first 10 trial games!
        if (isPaid || practiceCount < 10) {
          setState("game");
        } else {
          setState("paywall");
        }
      } else {
        throw new Error(payload.error || "未能获取诊断信息。");
      }
    } catch (err: any) {
      console.error("Diagnostic error caught:", err);
      setErrorText(err.message || "由于网络抖动，无法连接至 AI 批改老师。");
      // Use standard local high-fidelity generator to let parent proceed flawlessly!
      const defaultDiagnostic: DiagnosticResult = {
        type: "math",
        target_topic: "7的乘法口诀",
        target_display: "找出 7 × 8 的正确答案！",
        correct_sequence: ["56"],
        grid_items: ["54", "56", "49", "64", "63", "58"],
        question_display: "找出 7 × 8 的正确答案！",
        correct_answer: "56",
        wrong_answers: ["54", "49", "64", "63", "58"]
      };
      setDiagnostic(defaultDiagnostic);
      if (isPaid || practiceCount < 10) {
        setState("game");
      } else {
        setState("paywall");
      }
    }
  };

  const handleUnlockAndPlay = () => {
    localStorage.setItem("math_is_paid", "true");
    setIsPaid(true);
    setState("game");
  };

  const handleGameFinished = (finalScore: number) => {
    setGameScore(finalScore);
    const newCount = practiceCount + 1;
    setPracticeCount(newCount);
    localStorage.setItem("math_practice_count", String(newCount));
    setState("settlement");
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-green-50/40 flex items-center justify-center p-0 sm:p-4 md:p-6 transition-colors duration-200 selection:bg-emerald-100 select-none">
      {/* 
        Responsive constraints: Built with strict design fidelity.
        Always centers the layout on screens, matches kids-cartoonish educational aesthetic.
      */}
      <div 
        id="h5-phone-shell"
        className="w-full max-w-[480px] min-h-screen sm:min-h-[820px] bg-white sm:rounded-[36px] sm:border-[8px] sm:border-slate-850 flex flex-col justify-between overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.12)] relative"
      >
        {/* Fake Phone Status bar at the top on wider screens */}
        <div id="phone-status-bar" className="hidden sm:flex justify-between items-center bg-emerald-500 border-b-4 border-slate-800 px-6 py-2 select-none text-white text-xs font-extrabold tracking-wide">
          <div className="flex items-center gap-1.5 font-cartoon">
            {isPaid ? (
              <span className="text-emerald-100 font-extrabold">👑 终身全科特权已解锁</span>
            ) : (
              <span className="text-emerald-50">🎮 免费特训额度 {practiceCount}/10 关</span>
            )}
          </div>
          {/* Dynamic real minute tracker */}
          <span className="font-mono text-emerald-100">{currentTime || "15:30"}</span>
          <div className="flex items-center gap-1.5">
            <span>📶</span>
            <span>⚡ 5G</span>
            <span>🔋 100%</span>
          </div>
        </div>

        {/* Fun Educational Brand Header */}
        <header id="main-branding-header" className="bg-emerald-500 border-b-4 border-slate-800 px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-400 p-1.5 rounded-xl border-2 border-slate-800 animate-pulse">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none tracking-wide font-cartoon flex items-center gap-1">
                AI 智能错题消灭机
              </h1>
              <span className="text-[10px] text-emerald-100 font-extrabold mt-0.5 block">
                拍照识错题 · 变身打地鼠 🎯 (护眼绿化版)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="bg-white px-2 py-1 rounded-full text-[10px] font-black text-emerald-800 border-2 border-slate-800 shadow-[0_2px_0_#1E293B]">
              {isPaid ? "👑 尊享版" : `免费 ${10 - Math.min(10, practiceCount)} 关`}
            </span>
          </div>
        </header>

        {/* Dynamic State views with crisp entries */}
        <main className="flex-1 flex flex-col justify-between bg-white relative">
          
          {errorText && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border-2 border-red-500 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-red-650 flex-shrink-0" />
              <div>
                <p className="font-bold">诊断老师提醒您：</p>
                <p className="mt-0.5">{errorText}</p>
              </div>
            </div>
          )}

          {state === "upload" && (
            <UploadStage 
              onAnalyze={handleAnalyzeImage} 
              isAnalyzing={false} 
              practiceCount={practiceCount}
              isPaid={isPaid}
            />
          )}

          {state === "diagnosing" && (
            <UploadStage 
              onAnalyze={handleAnalyzeImage} 
              isAnalyzing={true} 
              practiceCount={practiceCount}
              isPaid={isPaid}
            />
          )}

          {state === "paywall" && diagnostic && (
            <PaywallStage 
              diagnostic={diagnostic} 
              onUnlock={handleUnlockAndPlay}
              onCancel={() => {
                setState("upload");
                setDiagnostic(null);
              }}
            />
          )}

          {state === "game" && diagnostic && (
            <GameStage 
              diagnostic={diagnostic} 
              onFinish={handleGameFinished}
            />
          )}

          {state === "settlement" && diagnostic && (
            <SettlementStage 
              score={gameScore} 
              diagnostic={diagnostic} 
              onReset={() => {
                setState("upload");
                setDiagnostic(null);
                setGameScore(0);
              }}
            />
          )}
        </main>

        {/* Global Footer Navigation or Credit Line */}
        <footer id="app-footer-bar" className="bg-slate-50 border-t-4 border-slate-850 py-3.5 px-4 text-center text-slate-500 text-[10px] font-extrabold flex items-center justify-center gap-2">
          <span>🛡️ 绿色教育防沉迷守护系统</span>
          <span className="text-slate-350">|</span>
          <span>客服电话：400-880-990</span>
        </footer>
      </div>
    </div>
  );
}
