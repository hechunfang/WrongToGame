import { DiagnosticResult } from "../types";
import { decorateMathQuestion } from "./mathDecorator";

export function generateStandaloneHTML(result: DiagnosticResult): string {
  const { target_topic, question_display, correct_answer, wrong_answers } = result;
  
  // Format the answers as a single array for JS insertion
  const allAnswersJSON = JSON.stringify([correct_answer, ...wrong_answers]);
  const correctAnswerJSON = JSON.stringify(correct_answer);

  // Apply decoration to offline game display too
  const conceptual = decorateMathQuestion(target_topic, question_display, correct_answer);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AI消灭错题 - 特训小游戏[${target_topic}]</title>
    <!-- Tailwind CSS v3 CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts for children theme -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #FFFBEB;
            touch-action: manipulation;
        }
        .cartoon-font {
            font-family: 'ZCOOL KuaiLe', cursive, sans-serif;
        }
        .bubble-shadow {
            box-shadow: 0 8px 0 #F59E0B;
        }
        .border-cartoon {
            border: 4px solid #1E293B;
        }
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
    </style>
</head>
<body class="flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md bg-white border-cartoon rounded-3xl overflow-hidden shadow-2xl relative">
        <!-- Sun decoration -->
        <div class="absolute -top-12 -right-12 w-24 h-24 bg-yellow-300 rounded-full border-cartoon animate-pulse"></div>
        
        <!-- Header -->
        <header class="bg-amber-400 border-b-2 border-slate-800 p-5 text-center relative z-10">
            <h1 class="cartoon-font text-3xl font-bold text-slate-800 tracking-wide drop-shadow-sm">
                👑 ${target_topic}消灭战
            </h1>
            <p class="text-xs text-amber-950 font-semibold mt-1">
                AI量身定制 · 萌萌仓鼠特训关卡
            </p>
        </header>

        <!-- Intro Stage -->
        <div id="intro-screen" class="p-6 text-center space-y-6">
            <div class="bg-amber-50 rounded-2xl border-cartoon p-5 text-left">
                <span class="inline-block bg-indigo-500 text-white font-bold text-xs px-2.5 py-1 rounded-full mb-3">
                    知识点薄弱项
                </span>
                <p class="text-xl font-bold text-slate-800 mb-2">▶ ${target_topic}</p>
                <p class="text-sm text-slate-600 leading-relaxed">
                    AI分析了你的错题，发现这个要点还没完全熟悉。快通过可爱的仓鼠拍拍游戏，把它一战粉碎吧！
                </p>
            </div>

            <div class="bg-indigo-50 rounded-2xl border-cartoon p-4">
                <p class="text-xs text-indigo-800 uppercase font-bold tracking-wider mb-1">【本关任务】</p>
                <p class="text-base font-extrabold text-slate-800 leading-normal">${conceptual.creativeQuestion}</p>
                <p class="text-[11px] text-slate-400 mt-1 font-mono">（原题公式: ${question_display}）</p>
            </div>

            <button onclick="startGame()" style="box-shadow: 0 6px 0 #D97706;" class="w-full bg-amber-500 hover:bg-amber-400 active:translate-y-1 active:shadow-none border-cartoon text-slate-900 cartoon-font text-2xl font-bold py-4 px-6 rounded-2xl transition-all">
                🎮 开始仓鼠派对特训
            </button>
        </div>

        <!-- Practice Session / Game Grid -->
        <div id="game-screen" class="hidden p-5 space-y-4 relative overflow-hidden">
            <!-- Interactive Tick/Cross Splash popup for exported H5 offline game -->
            <div id="splash-layer" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none hidden">
                <div id="splash-correct-card" class="bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white rounded-full p-4 border-8 border-slate-900 shadow-[0_12px_0_#0F172A] flex flex-col items-center justify-center w-60 h-60 hidden animate-kidPop">
                    <span class="text-[110px] font-sans font-black leading-none drop-shadow-[0_2px_0_#064e3b]">✔</span>
                    <span class="text-lg font-bold tracking-wider -mt-2 drop-shadow-md bg-emerald-950/40 px-3 py-0.5 rounded-full border border-emerald-400/40">
                        答对啦，你真棒！
                    </span>
                </div>
                <div id="splash-wrong-card" class="bg-gradient-to-br from-rose-500 via-red-500 to-red-600 text-white rounded-full p-4 border-8 border-slate-900 shadow-[0_12px_0_#0F172A] flex flex-col items-center justify-center w-52 h-52 hidden animate-kidPop">
                    <span class="text-[100px] font-sans font-black leading-none drop-shadow-[0_2px_0_#991b1b]">✘</span>
                    <span class="text-lg font-bold tracking-wider -mt-2 drop-shadow-md bg-red-950/40 px-3 py-0.5 rounded-full border border-red-400/40 animate-kidShake">
                        答错了！ -3秒
                    </span>
                </div>
            </div>

            <!-- Score & Ticker -->
            <div class="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-xl border-cartoon">
                <div class="flex items-center gap-1.5">
                    <span class="text-xl">⭐</span>
                    <span class="font-bold text-amber-400">分数: <span id="score-text">0</span></span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-xl">⏱️</span>
                    <span class="font-bold text-emerald-400">时间: <span id="time-text">30</span>s</span>
                </div>
            </div>

            {/* Speech bubble instruction */}
            <div class="bg-indigo-600 text-white p-3 rounded-2xl border-cartoon text-center relative">
                <p class="text-[11px] font-bold text-indigo-200">💡 亲爱的小朋友，请寻找：</p>
                <p class="text-base font-black tracking-wide-sm leading-snug mt-0.5">${conceptual.creativeQuestion}</p>
                <div class="bg-indigo-950/40 rounded py-0.5 text-[10px] text-amber-300 font-bold block w-fit mx-auto px-2 mt-1">
                    （正确答案数字为: ${correct_answer}）
                </div>
            </div>

            <!-- Game Grid Holes -->
            <div class="grid grid-cols-3 gap-3 pt-2">
                <!-- Hole 0 -->
                <div id="hole-0" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(0)">
                    <div id="mole-0" class="absolute w-[90%] h-[92%] bottom-[-100px] bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 rounded-t-[30px] border-t-2 border-r border-l border-slate-800 transition-all duration-200 flex flex-col justify-start items-center shadow-lg pt-1">
                        <!-- Ears -->
                        <div class="absolute -top-1.5 inset-x-0 flex justify-between px-2">
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center animate-bounce">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center animate-bounce">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                        </div>
                        <!-- Sparking Eyes -->
                        <div class="flex gap-2.5 mt-1">
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                        <!-- Cheek & Nose -->
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                            <div class="w-1.5 h-1 bg-amber-900 rounded-full"></div>
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                        </div>
                        <!-- Teeth -->
                        <div class="w-2.5 h-1 bg-white border border-slate-800 rounded-b flex divide-x divide-slate-800 overflow-hidden mt-0.5"></div>
                        <!-- Value text -->
                        <span class="text-xs font-black text-amber-300 px-1 rounded-md bg-slate-950 mt-1 max-w-[90%] truncate font-mono" id="val-0"></span>
                    </div>
                </div>

                <!-- Hole 1 -->
                <div id="hole-1" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(1)">
                    <div id="mole-1" class="absolute w-[90%] h-[92%] bottom-[-100px] bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 rounded-t-[30px] border-t-2 border-r border-l border-slate-800 transition-all duration-200 flex flex-col justify-start items-center shadow-lg pt-1">
                        <div class="absolute -top-1.5 inset-x-0 flex justify-between px-2">
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                        </div>
                        <div class="flex gap-2.5 mt-1">
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                            <div class="w-1.5 h-1 bg-amber-900 rounded-full"></div>
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                        </div>
                        <div class="w-2.5 h-1 bg-white border border-slate-800 rounded-b flex divide-x divide-slate-800 overflow-hidden mt-0.5"></div>
                        <span class="text-xs font-black text-amber-300 px-1 rounded-md bg-slate-950 mt-1 max-w-[90%] truncate font-mono" id="val-1"></span>
                    </div>
                </div>

                <!-- Hole 2 -->
                <div id="hole-2" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(2)">
                    <div id="mole-2" class="absolute w-[90%] h-[92%] bottom-[-100px] bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 rounded-t-[30px] border-t-2 border-r border-l border-slate-800 transition-all duration-200 flex flex-col justify-start items-center shadow-lg pt-1">
                        <div class="absolute -top-1.5 inset-x-0 flex justify-between px-2">
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                        </div>
                        <div class="flex gap-2.5 mt-1">
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                            <div class="w-1.5 h-1 bg-amber-900 rounded-full"></div>
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                        </div>
                        <div class="w-2.5 h-1 bg-white border border-slate-800 rounded-b flex divide-x divide-slate-800 overflow-hidden mt-0.5"></div>
                        <span class="text-xs font-black text-amber-300 px-1 rounded-md bg-slate-950 mt-1 max-w-[90%] truncate font-mono" id="val-2"></span>
                    </div>
                </div>

                <!-- Hole 3 -->
                <div id="hole-3" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(3)">
                    <div id="mole-3" class="absolute w-[90%] h-[92%] bottom-[-100px] bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 rounded-t-[30px] border-t-2 border-r border-l border-slate-800 transition-all duration-200 flex flex-col justify-start items-center shadow-lg pt-1">
                        <div class="absolute -top-1.5 inset-x-0 flex justify-between px-2">
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                        </div>
                        <div class="flex gap-2.5 mt-1">
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                            <div class="w-1.5 h-1 bg-amber-900 rounded-full"></div>
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                        </div>
                        <div class="w-2.5 h-1 bg-white border border-slate-800 rounded-b flex divide-x divide-slate-800 overflow-hidden mt-0.5"></div>
                        <span class="text-xs font-black text-amber-300 px-1 rounded-md bg-slate-950 mt-1 max-w-[90%] truncate font-mono" id="val-3"></span>
                    </div>
                </div>

                <!-- Hole 4 -->
                <div id="hole-4" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(4)">
                    <div id="mole-4" class="absolute w-[90%] h-[92%] bottom-[-100px] bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 rounded-t-[30px] border-t-2 border-r border-l border-slate-800 transition-all duration-200 flex flex-col justify-start items-center shadow-lg pt-1">
                        <div class="absolute -top-1.5 inset-x-0 flex justify-between px-2">
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                        </div>
                        <div class="flex gap-2.5 mt-1">
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                            <div class="w-1.5 h-1 bg-amber-900 rounded-full"></div>
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                        </div>
                        <div class="w-2.5 h-1 bg-white border border-slate-800 rounded-b flex divide-x divide-slate-800 overflow-hidden mt-0.5"></div>
                        <span class="text-xs font-black text-amber-300 px-1 rounded-md bg-slate-950 mt-1 max-w-[90%] truncate font-mono" id="val-4"></span>
                    </div>
                </div>

                <!-- Hole 5 -->
                <div id="hole-5" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(5)">
                    <div id="mole-5" class="absolute w-[90%] h-[92%] bottom-[-100px] bg-gradient-to-b from-amber-400 via-orange-400 to-amber-500 rounded-t-[30px] border-t-2 border-r border-l border-slate-800 transition-all duration-200 flex flex-col justify-start items-center shadow-lg pt-1">
                        <div class="absolute -top-1.5 inset-x-0 flex justify-between px-2">
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                            <div class="w-3.5 h-3.5 bg-amber-500 border border-slate-800 rounded-full flex items-center justify-center">
                                <div class="w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                            </div>
                        </div>
                        <div class="flex gap-2.5 mt-1">
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                            <div class="w-2.5 h-2.5 bg-slate-900 rounded-full relative">
                                <div class="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                            </div>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5">
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                            <div class="w-1.5 h-1 bg-amber-900 rounded-full"></div>
                            <span class="w-1 h-1 bg-rose-400 rounded-full block"></span>
                        </div>
                        <div class="w-2.5 h-1 bg-white border border-slate-800 rounded-b flex divide-x divide-slate-800 overflow-hidden mt-0.5"></div>
                        <span class="text-xs font-black text-amber-300 px-1 rounded-md bg-slate-950 mt-1 max-w-[90%] truncate font-mono" id="val-5"></span>
                    </div>
                </div>
            </div>

            <!-- Feedback ticker -->
            <div id="feedback-panel" class="h-8 mt-2 text-center text-lg font-black cartoon-font text-slate-800">
                准备击杀地鼠！
            </div>
        </div>

        <!-- Result / Settlement State -->
        <div id="result-screen" class="hidden p-6 text-center space-y-6">
            <div class="relative inline-block">
                <span class="text-7xl animate-bounce duration-1000 inline-block">🏆</span>
                <span class="absolute -top-1 -right-1 text-2xl">✨</span>
            </div>
            
            <h2 class="cartoon-font text-3xl font-extrabold text-amber-500">
                仓鼠派对特训小能手！
            </h2>

            <div class="bg-emerald-50 rounded-2xl border-cartoon p-5 space-y-2">
                <p class="text-sm text-slate-500">孩子最终得分</p>
                <p class="text-5xl font-black text-emerald-500 cartoon-font tracking-wider"><span id="final-score">0</span></p>
                <div class="h-2 w-full bg-slate-200 rounded-full mt-3 overflow-hidden">
                    <div class="h-full bg-emerald-500" style="width: 100%"></div>
                </div>
                <p class="text-xs text-emerald-800 font-semibold pt-1">
                    🎉 表现太棒了！已突破 98% 的同届小朋友！
                </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button onclick="resetGame()" class="w-full bg-slate-100 hover:bg-slate-200 border-cartoon text-slate-850 font-bold py-3.5 rounded-xl text-sm active:translate-y-0.5 transition-all">
                    🔄 再练一次
                </button>
                <button onclick="alert('恭喜加入微信私域特训营！请截图并扫描微信群码。')" class="w-full bg-violet-500 hover:bg-violet-400 border-cartoon text-white font-bold py-3.5 rounded-xl text-sm active:translate-y-0.5 transition-all">
                    🎁 领取纸质练习卡
                </button>
            </div>
        </div>

        <!-- Footer information -->
        <footer class="bg-slate-50 border-t border-slate-200 py-3.5 px-4 text-center text-slate-400 text-xs font-semibold">
            AI 智能错题消灭机 H5 终极特训版
        </footer>
    </div>

    <script>
        const answerList = ${allAnswersJSON};
        const correctVal = ${correctAnswerJSON};
        const questionDisplay = ${JSON.stringify(question_display)};
        
        let score = 0;
        let timeLeft = 30;
        let gameTimer = null;
        let popTimer = null;
        let activeMoleId = null;
        let splashTimer = null;

        function playSound(type) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                const ctx = new AudioContextClass();
                
                if (type === "correct") {
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
                // Ignore audio context blocks gracefully
            }
        }

        function getFormulaEquiv(question, value) {
            // 1. Matches multiplication
            const matchMulti = question.match(/(\\d+)\\s*[×*xX]\\s*(\\d+)/);
            if (matchMulti) {
                const num1 = parseInt(matchMulti[1], 10);
                const num2 = parseInt(matchMulti[2], 10);
                if (num1 > 1 && num1 <= 10) {
                    const repeated = Array(num1).fill(num2).join("+");
                    return repeated + " = " + value;
                }
                return num1 + " × " + num2 + " = " + value;
            }

            // 2. Matches addition
            const matchAdd = question.match(/(\\d+)\\s*\\+\\s*(\\d+)/);
            if (matchAdd) {
                return matchAdd[1] + " + " + matchAdd[2] + " = " + value;
            }

            // 3. Matches division
            const matchDiv = question.match(/(\\d+)\\s*[÷/]\\s*(\\d+)/);
            if (matchDiv) {
                return matchDiv[1] + " ÷ " + matchDiv[2] + " = " + value;
            }

            // 4. Matches subtraction
            const matchSub = question.match(/(\\d+)\\s*[-−]\\s*(\\d+)/);
            if (matchSub) {
                return matchSub[1] + " - " + matchSub[2] + " = " + value;
            }

            return value;
        }

        function startGame() {
            document.getElementById('intro-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            
            score = 0;
            timeLeft = 30;
            document.getElementById('score-text').textContent = score;
            document.getElementById('time-text').textContent = timeLeft;
            document.getElementById('feedback-panel').textContent = "发现金牌仓鼠！快点中正确答案！";
            document.getElementById('feedback-panel').className = "h-8 mt-2 text-center text-lg font-black cartoon-font text-slate-800";

            // Count down
            gameTimer = setInterval(() => {
                timeLeft--;
                document.getElementById('time-text').textContent = timeLeft;
                if (timeLeft <= 0) {
                    endGame();
                }
            }, 1000);

            // Pop mole loop
            nextMolePop();
        }

        function nextMolePop() {
            if (timeLeft <= 0) return;
            
            // Hide previous active mole first
            if (activeMoleId !== null) {
                const prevMole = document.getElementById('mole-' + activeMoleId);
                if (prevMole) prevMole.style.bottom = "-100px";
            }

            // Select a random hole
            const nextHole = Math.floor(Math.random() * 6);
            activeMoleId = nextHole;

            const moleElement = document.getElementById('mole-' + nextHole);
            const valElement = document.getElementById('val-' + nextHole);

            // Decide whether correct answer or wrong answer pops up
            // 45% chance correct, 55% wrong answer
            const isCorrectPop = Math.random() < 0.45;
            let displayVal = "";
            if (isCorrectPop) {
                displayVal = correctVal;
            } else {
                const wrongs = answerList.slice(1);
                displayVal = wrongs[Math.floor(Math.random() * wrongs.length)];
            }

            const formatted = getFormulaEquiv(questionDisplay, displayVal);
            valElement.textContent = formatted;
            
            // Dynamic text scaling in H5
            if (formatted.length > 15) {
                valElement.style.fontSize = "9px";
            } else if (formatted.length > 8) {
                valElement.style.fontSize = "11px";
            } else {
                valElement.style.fontSize = "13px";
            }
            
            // Pop up!
            if (moleElement) {
                moleElement.style.bottom = "0px";
                playSound("popup");
            }

            // Schedule the next check
            const delay = Math.random() * 500 + 850; // Every 1-1.3 seconds
            popTimer = setTimeout(nextMolePop, delay);
        }

        function whackMole(holeId) {
            if (timeLeft <= 0 || activeMoleId !== holeId) return;

            const valElement = document.getElementById('val-' + holeId);
            const moleElement = document.getElementById('mole-' + holeId);
            const selectedVal = valElement.textContent;

            const feedback = document.getElementById('feedback-panel');
            const correctFormula = getFormulaEquiv(questionDisplay, correctVal);

            // Splash Elements
            const splashLayer = document.getElementById('splash-layer');
            const splashCorrect = document.getElementById('splash-correct-card');
            const splashWrong = document.getElementById('splash-wrong-card');

            if (splashTimer) {
                clearTimeout(splashTimer);
            }

            if (selectedVal === correctFormula) {
                // Correct whack!
                playSound("correct");
                score += 10;
                document.getElementById('score-text').textContent = score;
                feedback.textContent = "💥 答对啦，你真棒！+10分";
                feedback.className = "h-8 mt-2 text-center text-lg font-black cartoon-font text-emerald-500 animate-bounce";
                
                // Show Correct feedback splash
                if (splashLayer) {
                    splashLayer.classList.remove('hidden');
                    if (splashCorrect) splashCorrect.classList.remove('hidden');
                    if (splashWrong) splashWrong.classList.add('hidden');
                }

                // Hide instantly
                if (moleElement) moleElement.style.bottom = "-100px";
                activeMoleId = null;
            } else {
                // Wrong whack!
                playSound("wrong");
                score = Math.max(0, score - 5);
                timeLeft = Math.max(0, timeLeft - 3);
                document.getElementById('score-text').textContent = score;
                document.getElementById('time-text').textContent = timeLeft;
                feedback.textContent = "😵 哎呀！答错啦！时间减少3秒！";
                feedback.className = "h-8 mt-2 text-center text-lg font-black cartoon-font text-red-500";

                // Show Wrong feedback splash
                if (splashLayer) {
                    splashLayer.classList.remove('hidden');
                    if (splashCorrect) splashCorrect.classList.add('hidden');
                    if (splashWrong) splashWrong.classList.remove('hidden');
                }
            }

            // Hide splash after a short delay
            splashTimer = setTimeout(() => {
                if (splashLayer) splashLayer.classList.add('hidden');
                feedback.className = "h-8 mt-2 text-center text-lg font-black cartoon-font text-slate-800";
            }, 850);
        }

        function endGame() {
            clearInterval(gameTimer);
            clearTimeout(popTimer);
            playSound("finish");
            
            if (activeMoleId !== null) {
                const mole = document.getElementById('mole-' + activeMoleId);
                if (mole) mole.style.bottom = "-100px";
            }

            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.remove('hidden');
            document.getElementById('final-score').textContent = score;
        }

        function resetGame() {
            document.getElementById('result-screen').classList.add('hidden');
            document.getElementById('intro-screen').classList.remove('hidden');
        }
    </script>
</body>
</html>`;
}
