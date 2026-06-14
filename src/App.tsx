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
  const [parentPhone, setParentPhone] = useState<string>(() => {
    return localStorage.getItem("parent_phone") || "13800138000";
  });
  const [parentNickname, setParentNickname] = useState<string>(() => {
    return localStorage.getItem("parent_nickname") || "小火伴家长";
  });

  // Persistence stats
  const [practiceCount, setPracticeCount] = useState<number>(() => {
    const phone = localStorage.getItem("parent_phone") || "13800138000";
    if (phone === "15217704049") {
      return 0;
    }
    const saved = localStorage.getItem(`math_practice_count_${phone}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync and reset practiceCount when parent phone changes
  useEffect(() => {
    if (parentPhone === "15217704049") {
      setPracticeCount(0);
      localStorage.setItem("math_practice_count_15217704049", "0");
    } else {
      const saved = localStorage.getItem(`math_practice_count_${parentPhone}`);
      setPracticeCount(saved ? parseInt(saved, 10) : 0);
    }
  }, [parentPhone]);
  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return localStorage.getItem("math_is_paid") === "true";
  });
  const [enableGame, setEnableGame] = useState<boolean>(() => {
    const saved = localStorage.getItem("math_enable_game");
    return saved === "true";
  });

  // Custom Help dialog state
  const [showHelp, setShowHelp] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [logoClicks, setLogoClicks] = useState(0);

  // Db connection tracking info
  const [dbStatus, setDbStatus] = useState<{
    loaded: boolean;
    healthy: boolean;
    host?: string;
    databaseName?: string;
    errorFeedback?: string;
  }>({ loaded: false, healthy: false });

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.database) {
          setDbStatus({
            loaded: true,
            healthy: data.database.healthy,
            host: data.database.host,
            databaseName: data.database.databaseName,
            errorFeedback: data.database.errorFeedback
          });
        }
      })
      .catch((err) => {
        console.error("Failed to query API health status:", err);
      });
  }, [showHelp]);

  // Admin secret easter-egg activator
  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= 5) {
        setIsPaid(true);
        localStorage.setItem("math_is_paid", "true");
        alert("🎉 您已触发管理员隐藏彩蛋！成功激活【终身尊享版】无限次特训练习特权！🌱");
        return 0;
      }
      return nextCount;
    });
  };

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
        body: JSON.stringify({ image: base64Image, phone: parentPhone }),
      });

      if (!response.ok) {
        throw new Error(`请求错题批改 API 失败，状态码: ${response.status}`);
      }

      const payload = await response.json();
      if (payload.success && payload.data) {
        setDiagnostic(payload.data);
        // Play directly if already paid OR still within the first 3 free trial uploads!
        if (isPaid || practiceCount < 3) {
          if (enableGame) {
            setState("game");
          } else {
            setState("settlement");
          }
        } else {
          setState("paywall");
        }
      } else {
        throw new Error(payload.error || "未能获取诊断信息。");
      }
    } catch (err: any) {
      console.error("Diagnostic error caught:", err);
      setErrorText(err.message || "由于网络抖动，无法连接至 AI 批改老师。");
      
      // Smart local fallback to match whatever category the user tried to test
      let defaultDiagnostic: DiagnosticResult = {
        type: "math",
        target_topic: "7的乘法口诀",
        target_display: "找出 7 × 8 的正确答案！",
        correct_sequence: ["56"],
        grid_items: ["54", "56", "49", "64", "63", "58"],
        question_display: "找出 7 × 8 的正确答案！",
        correct_answer: "56",
        wrong_answers: ["54", "49", "64", "63", "58"]
      };

      if (base64Image.includes("橙子") || base64Image.includes("ceng")) {
        defaultDiagnostic = {
          type: "chinese_pinyin",
          target_topic: "前后鼻音分辨",
          target_display: "找出汉字‘橙’的正确拼音！",
          correct_sequence: ["chéng"],
          grid_items: ["chén", "chéng", "céng", "cén", "chěng", "shéng"],
          question_display: "找出汉字‘橙’的正确拼音！",
          correct_answer: "chéng",
          wrong_answers: ["chén", "céng", "cén", "chěng", "shéng"]
        };
      } else if (base64Image.includes("拨打") || base64Image.includes("连连看")) {
        defaultDiagnostic = {
          type: "chinese_words",
          target_topic: "形近字近义词连连看",
          target_display: "连连看：拼出‘检查’与‘拨打’的正确组合！",
          correct_sequence: [["检", "查"], ["拨", "打"]],
          grid_items: ["检", "拔", "拨", "查", "打", "河"],
          question_display: "连连看：拼出‘检查’与‘拨打’的正确组合！",
          correct_answer: "检查/拨打",
          wrong_answers: ["查", "拨", "打", "拔"]
        };
      } else if (base64Image.includes("friend") || base64Image.includes("freind") || base64Image.includes("english") || base64Image.includes("Jim")) {
        defaultDiagnostic = {
          type: "english_spelling",
          target_topic: "常见名词拼写",
          target_display: "按顺序拼出单词：【朋友】(friend)",
          correct_sequence: ["f", "r", "i", "e", "n", "d"],
          grid_items: ["f", "e", "r", "i", "n", "d", "a", "t"],
          question_display: "按顺序拼出单词：【朋友】(friend)",
          correct_answer: "friend",
          wrong_answers: ["e", "r", "i", "n", "a", "t"],
          english_scene_sentence: "He wants to meet his happy school friend Jim in the park.",
          english_scene_translation: "他想在公园里和他快乐的学校朋友吉姆见面。",
          english_scene_image: "friend"
        };
      } else if (base64Image.includes("甘甜") || base64Image.includes("甘字") || base64Image.includes("gan") || base64Image.includes("干甜") || base64Image.includes("gān")) {
        defaultDiagnostic = {
          type: "chinese_words",
          target_topic: "易错字识字：甘 (甘甜/甘苦)",
          target_display: "连连看：拼出‘甘甜’及‘甘苦’的正确汉字！",
          correct_sequence: [["甘", "甜"], ["甘", "苦"]],
          grid_items: ["甘", "甜", "干", "苦", "心", "干"],
          question_display: "请在大地鼠中拼出正确的‘甘甜’和‘甘苦’（注意区分‘甘’与‘干’）！",
          correct_answer: "甘",
          wrong_answers: ["干", "杆", "古", "甜"]
        };
      }

      setDiagnostic(defaultDiagnostic);
      if (isPaid || practiceCount < 3) {
        if (enableGame) {
          setState("game");
        } else {
          setState("settlement");
        }
      } else {
        setState("paywall");
      }
    }
  };

  const handleUnlockAndPlay = () => {
    localStorage.setItem("math_is_paid", "true");
    setIsPaid(true);
    if (enableGame) {
      setState("game");
    } else {
      setState("settlement");
    }
  };

  const handleSelectOral = (payload: DiagnosticResult) => {
    setDiagnostic(payload);
    if (isPaid || practiceCount < 3) {
      if (enableGame) {
        setState("game");
      } else {
        setState("settlement");
      }
    } else {
      setState("paywall");
    }
  };

  const handleGameFinished = (finalScore: number) => {
    setGameScore(finalScore);
    const newCount = practiceCount + 1;
    setPracticeCount(newCount);
    localStorage.setItem(`math_practice_count_${parentPhone}`, String(newCount));
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
              <span className="text-emerald-50">🎯 错题核心练习通道已开启</span>
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
            <div 
              onClick={handleLogoClick}
              title="管理员专属特权：连续点击5次有惊喜！"
              className="bg-emerald-400 p-1.5 rounded-xl border-2 border-slate-800 animate-pulse cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="text-2xl select-none">🌱</span>
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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowHelp(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-xl border-2 border-slate-805 shadow-[0_2px_0_#1E293B] flex items-center justify-center transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
              title="使用指南 & 特权激活"
            >
              <HelpCircle className="w-4 h-4 font-bold" />
            </button>
            <span className="bg-white px-2 py-1 rounded-full text-[10px] font-black text-emerald-800 border-2 border-slate-800 shadow-[0_2px_0_#1E293B]">
              {isPaid ? "👑 尊享版" : "📖 体验专属版"}
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
              onSelectOral={handleSelectOral}
              isAnalyzing={false} 
              practiceCount={practiceCount}
              isPaid={isPaid}
              setIsPaid={setIsPaid}
              enableGame={enableGame}
              setEnableGame={setEnableGame}
              parentPhone={parentPhone}
              setParentPhone={setParentPhone}
              parentNickname={parentNickname}
              setParentNickname={setParentNickname}
            />
          )}

          {state === "diagnosing" && (
            <UploadStage 
              onAnalyze={handleAnalyzeImage} 
              onSelectOral={handleSelectOral}
              isAnalyzing={true} 
              practiceCount={practiceCount}
              isPaid={isPaid}
              setIsPaid={setIsPaid}
              enableGame={enableGame}
              setEnableGame={setEnableGame}
              parentPhone={parentPhone}
              setParentPhone={setParentPhone}
              parentNickname={parentNickname}
              setParentNickname={setParentNickname}
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
              gameEnabled={enableGame}
              parentPhone={parentPhone}
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

        {/* Use Guide & Admin Privilege Modal popup */}
        {showHelp && (
          <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border-4 border-slate-900 p-5 w-full max-w-[390px] shadow-[0_12px_0_rgba(0,0,0,0.15)] relative space-y-4 max-h-[90%] overflow-y-auto">
              <div className="text-center">
                <span className="text-4xl">🌱</span>
                <h3 className="text-xl font-black text-slate-850 mt-1 font-cartoon">错题消灭机 · 练习指南</h3>
              </div>
              
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-sans">
                <p>
                  <strong>💡 什么是错题消灭机？</strong><br />
                  采用多维识错 AI 引擎，秒级识别日常练习中的写错汉字、手写拼音、连线偏旁以及口算错题。为孩子量身定制极富童趣的“彩色打地鼠”消灭特训游戏，在趣味辨析中强化深度记忆，告别视觉疲劳，激发自主探索！
                </p>
                <p>
                  <strong>🎁 练习额度说明</strong><br />
                  为保障高速的高清识图诊断及定制关卡计算开销，普通普通体验用户备有基础体验额度，后面可根据需要加倍。
                </p>
                <div className="bg-emerald-50 border-2 border-emerald-500 p-3 rounded-2xl text-[11px] text-emerald-950 font-medium space-y-1">
                  <p className="font-extrabold">🔑 管理测试员与老师特权卡：</p>
                  <p>
                    如果您是本系统测试员、管理员或学科老师，请在下方直接输入邮箱或简称（如输入邮箱 <span className="underline font-mono">i4ffyy@gmail.com</span> 或管理员简称 <span className="font-bold font-mono">i4ffyy</span>），点击绑定即可一键直接激活成为终身上限不限制的“尊享卡”用户，方便多端流畅测试调试！
                  </p>
                </div>

                {/* Real-time Database Status Diagnostics */}
                <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-2xl text-[11px] text-slate-700 font-medium space-y-1">
                  <p className="font-extrabold text-slate-950 flex items-center gap-1">
                    💾 外部 MySQL 数据库挂载状态：
                  </p>
                  {dbStatus.loaded ? (
                    dbStatus.healthy ? (
                      <div className="space-y-1">
                        <p className="text-emerald-600 font-extrabold flex items-center gap-1">
                          🟢 状态: 已建立连接
                        </p>
                        <p className="text-slate-500 text-[10px]">
                          主机: <code className="bg-slate-100 px-1 border rounded">{dbStatus.host}</code>
                        </p>
                        <p className="text-slate-500 text-[10px]">
                          库名: <code className="bg-slate-100 px-1 border rounded">{dbStatus.databaseName}</code>
                        </p>
                        <p className="text-[10px] text-slate-500">数据将持久化记录保存于外部服务器中。</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-amber-600 font-extrabold flex items-center gap-1">
                          ⚠️ 状态: 未连通 (当前为单机临时模拟模式)
                        </p>
                        <p className="text-slate-500 text-[10px]">
                          尝试的主机: <code className="bg-slate-100 px-1 border rounded">{dbStatus.host || "无"}</code>
                        </p>
                        <p className="text-red-500 text-[10px] font-mono leading-normal bg-red-50/70 p-1.5 rounded-lg border border-red-200 mt-1">
                          反馈信息: {dbStatus.errorFeedback || "连接超时 / 外部服务器拒绝或无端口响应"}
                        </p>
                        <div className="text-[10px] text-slate-500 leading-normal bg-amber-50/50 border border-amber-200 p-2 rounded-lg mt-1 space-y-1">
                          <p className="font-bold text-amber-800">💡 为什么没有写入数据？</p>
                          <p>
                            由于您的数据库服务器（{dbStatus.host || "未知IP"}）拒绝了连接，系统目前正启动<strong>【临时内存保护兜底机制】</strong>以确保应用不崩溃并仍可供用户继续练习。
                          </p>
                          <p className="text-red-600 font-black">
                            请确保您的服务器上有开放 3306 端口，且允许外部 IP 或本机用户连接访问。
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-slate-400">正在嗅探连接状态...</p>
                  )}
                </div>
              </div>

              {/* Activation input */}
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  placeholder="请输入您的邮箱或管理员特权代号..."
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full text-center border-2 border-slate-800 rounded-xl py-2 px-3 text-xs font-mono font-black placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const code = adminCode.trim().toLowerCase();
                      if (code === "i4ffyy" || code === "i4ffyy@gmail.com" || code === "admin") {
                        setIsPaid(true);
                        localStorage.setItem("math_is_paid", "true");
                        alert("🎉 特权验证成功！已免除当前体验额度限制，成功在当前设备开通【永久终身免单畅玩卡】！深度特训特权感谢您的调试！🌱");
                        setShowHelp(false);
                      } else {
                        alert("⚠️ 体验激活卡号不正确。如果是正常用户，您可以先在体验关卡中充分体验 AI 定制打地鼠的魅力！");
                      }
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-slate-900 rounded-xl py-2 text-xs font-black shadow-[0_3px_0_rgba(16,185,129,0.3)] transition-all active:translate-y-[2px]"
                  >
                    立即绑定激活
                  </button>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-800 rounded-xl py-2 px-4 text-xs font-bold"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
