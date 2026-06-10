import { DiagnosticResult } from "../types";

export function generateStandaloneHTML(result: DiagnosticResult): string {
  const { target_topic, question_display, correct_answer, wrong_answers } = result;
  
  // Format the answers as a single array for JS insertion
  const allAnswersJSON = JSON.stringify([correct_answer, ...wrong_answers]);
  const correctAnswerJSON = JSON.stringify(correct_answer);

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
    </style>
</head>
<body class="flex items-center justify-center min-h-screen p-4">
    <div class="w-full max-w-md bg-white border-cartoon rounded-3xl overflow-hidden shadow-2xl relative">
        <!-- Sun decoration -->
        <div class="absolute -top-12 -right-12 w-24 h-24 bg-yellow-300 rounded-full border-cartoon"></div>
        
        <!-- Header -->
        <header class="bg-amber-400 border-b-2 border-slate-800 p-5 text-center relative z-10">
            <h1 class="cartoon-font text-3xl font-bold text-slate-800 tracking-wide drop-shadow-sm">
                🎯 ${target_topic}消灭战
            </h1>
            <p class="text-xs text-slate-700 font-semibold mt-1">
                AI量身定制 · 打地鼠巩固关卡
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
                    AI分析了你的错题，发现这个要点还没有完全掌握。快通过这次特训关卡，把它一网打尽吧！
                </p>
            </div>

            <div class="bg-amber-100 rounded-2xl border-cartoon p-4">
                <p class="text-xs text-amber-800 uppercase font-bold tracking-wider mb-1">本关任务</p>
                <p class="text-lg font-extrabold text-slate-800">${question_display}</p>
            </div>

            <button onclick="startGame()" style="box-shadow: 0 6px 0 #D97706;" class="w-full bg-amber-500 hover:bg-amber-400 active:translate-y-1 active:shadow-none border-cartoon text-slate-900 cartoon-font text-2xl font-bold py-4 px-6 rounded-2xl transition-all">
                🎮 开始打地鼠特训
            </button>
        </div>

        <!-- Practice Session / Game Grid -->
        <div id="game-screen" class="hidden p-5 space-y-4">
            <!-- Score & Ticker -->
            <div class="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-xl border-cartoon">
                <div class="flex items-center gap-1.5">
                    <span class="text-xl">⭐</span>
                    <span class="font-bold text-amber-400">分数: <span id="score-text">0</span></span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-xl">⏱️</span>
                    <span class="font-bold text-red-400">时间: <span id="time-text">30</span>s</span>
                </div>
            </div>

            <!-- Speech bubble instruction -->
            <div class="bg-indigo-500 text-white p-3 rounded-2xl border-cartoon text-center relative">
                <p class="font-bold text-sm">💡 请打中带有这个答案的地鼠：</p>
                <p class="text-lg font-black tracking-wide">${correct_answer}</p>
                <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-indigo-500 rotate-45 border-r border-b border-slate-800"></div>
            </div>

            <!-- Game Grid Holes -->
            <div class="grid grid-cols-3 gap-3 pt-2">
                <div id="hole-0" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(0)">
                    <div id="mole-0" class="absolute w-20 h-20 bottom-[-80px] bg-amber-600 rounded-t-3xl border-2 border-slate-800 transition-all duration-200 flex flex-col justify-center items-center shadow-lg">
                        <span class="text-lg font-black text-white px-2 rounded-lg bg-slate-950/60" id="val-0"></span>
                    </div>
                </div>
                <div id="hole-1" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(1)">
                    <div id="mole-1" class="absolute w-20 h-20 bottom-[-80px] bg-amber-600 rounded-t-3xl border-2 border-slate-800 transition-all duration-200 flex flex-col justify-center items-center shadow-lg">
                        <span class="text-lg font-black text-white px-2 rounded-lg bg-slate-950/60" id="val-1"></span>
                    </div>
                </div>
                <div id="hole-2" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(2)">
                    <div id="mole-2" class="absolute w-20 h-20 bottom-[-80px] bg-amber-600 rounded-t-3xl border-2 border-slate-800 transition-all duration-200 flex flex-col justify-center items-center shadow-lg">
                        <span class="text-lg font-black text-white px-2 rounded-lg bg-slate-950/60" id="val-2"></span>
                    </div>
                </div>
                <div id="hole-3" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(3)">
                    <div id="mole-3" class="absolute w-20 h-20 bottom-[-80px] bg-amber-600 rounded-t-3xl border-2 border-slate-800 transition-all duration-200 flex flex-col justify-center items-center shadow-lg">
                        <span class="text-lg font-black text-white px-2 rounded-lg bg-slate-950/60" id="val-3"></span>
                    </div>
                </div>
                <div id="hole-4" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(4)">
                    <div id="mole-4" class="absolute w-20 h-20 bottom-[-80px] bg-amber-600 rounded-t-3xl border-2 border-slate-800 transition-all duration-200 flex flex-col justify-center items-center shadow-lg">
                        <span class="text-lg font-black text-white px-2 rounded-lg bg-slate-950/60" id="val-4"></span>
                    </div>
                </div>
                <div id="hole-5" class="relative bg-amber-950/40 rounded-2xl h-24 border-cartoon overflow-hidden shadow-inner flex items-end justify-center cursor-pointer" onclick="whackMole(5)">
                    <div id="mole-5" class="absolute w-20 h-20 bottom-[-80px] bg-amber-600 rounded-t-3xl border-2 border-slate-800 transition-all duration-200 flex flex-col justify-center items-center shadow-lg">
                        <span class="text-lg font-black text-white px-2 rounded-lg bg-slate-950/60" id="val-5"></span>
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
                错题消灭小能手！
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
                <button onclick="alert('恭喜加入微信私域特学营！请截图并扫描微信群码。')" class="w-full bg-violet-500 hover:bg-violet-400 border-cartoon text-white font-bold py-3.5 rounded-xl text-sm active:translate-y-0.5 transition-all">
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
        
        let score = 0;
        let timeLeft = 30;
        let gameTimer = null;
        let popTimer = null;
        let activeMoleId = null;

        function startGame() {
            document.getElementById('intro-screen').classList.add('hidden');
            document.getElementById('result-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            
            score = 0;
            timeLeft = 30;
            document.getElementById('score-text').textContent = score;
            document.getElementById('time-text').textContent = timeLeft;
            document.getElementById('feedback-panel').textContent = "发现地鼠！快点中正确答案！";
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
                if (prevMole) prevMole.style.bottom = "-80px";
            }

            // Select a random hole
            const nextHole = Math.floor(Math.random() * 6);
            activeMoleId = nextHole;

            const moleElement = document.getElementById('mole-' + nextHole);
            const valElement = document.getElementById('val-' + nextHole);

            // Decide whether correct answer or wrong answer pops up
            // 40% chance correct, 60% wrong answer
            const isCorrectPop = Math.random() < 0.45;
            let displayVal = "";
            if (isCorrectPop) {
                displayVal = correctVal;
            } else {
                const wrongs = answerList.slice(1);
                displayVal = wrongs[Math.floor(Math.random() * wrongs.length)];
            }

            valElement.textContent = displayVal;
            
            // Pop up!
            if (moleElement) {
                moleElement.style.bottom = "0px";
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

            if (selectedVal === correctVal) {
                // Correct whack!
                score += 10;
                document.getElementById('score-text').textContent = score;
                feedback.textContent = "💥 太棒了！消灭正确答案 +10分！";
                feedback.className = "h-8 mt-2 text-center text-lg font-black cartoon-font text-emerald-500 animate-bounce";
                
                // Hide instantly
                if (moleElement) moleElement.style.bottom = "-80px";
                activeMoleId = null;
            } else {
                // Wrong whack!
                score = Math.max(0, score - 5);
                timeLeft = Math.max(0, timeLeft - 3);
                document.getElementById('score-text').textContent = score;
                document.getElementById('time-text').textContent = timeLeft;
                feedback.textContent = "😵 哎呀！算错啦 分数-5 时间-3s！";
                feedback.className = "h-8 mt-2 text-center text-lg font-black cartoon-font text-red-500";
            }
        }

        function endGame() {
            clearInterval(gameTimer);
            clearTimeout(popTimer);
            
            if (activeMoleId !== null) {
                const mole = document.getElementById('mole-' + activeMoleId);
                if (mole) mole.style.bottom = "-80px";
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
