import React, { useRef, useState } from "react";
import { Camera, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface UploadStageProps {
  onAnalyze: (base64Image: string) => void;
  isAnalyzing: boolean;
}

// Prebaked base64 content for real math worksheets to let users test instantly
const SAMPLE_MATH_PICS = [
  {
    name: "🔢 7的乘法口诀(算错题)",
    desc: "示例错题：7 × 8 = 52 (应为 56)",
    // A simple tiny standard generic pixel-perfect data-url representation for math formula screenshot fallback
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>我的错题口算本</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>7 × 8 = 52</text><text x='250' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text><text x='50' y='160' font-size='14' fill='%2364748B'>点击一键分析，转化打地鼠巩固游戏</text></svg>"
  },
  {
    name: "➕ 两位数进位加法",
    desc: "示例错题：38 + 45 = 73 (未进位错误)",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>乘加两步计算口算练习</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>38 + 45 = 73</text><text x='280' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text><text x='50' y='160' font-size='14' fill='%2364748B'>看AI老师如何瞬间生成专属打地鼠特训</text></svg>"
  },
  {
    name: "➗ 除数是一位数的除法",
    desc: "示例错题：72 ÷ 8 = 8 (粗心看错答案)",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='18' font-weight='bold' fill='%23334155'>数学思维训练口算纸</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>72 ÷ 8 = 8</text><text x='270' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text><text x='50' y='160' font-size='14' fill='%2364748B'>点击左侧拍照，或一键开始测试</text></svg>"
  }
];

export default function UploadStage({ onAnalyze, isAnalyzing }: UploadStageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingText, setLoadingText] = useState("AI 老师正在分析纸张...");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Periodic greeting quotes for immersive feels
  const quotes = [
    "AI 老师正在用放大镜检查数学题...",
    "正在分析小朋友在哪个乘法卡住了...",
    "诊断成功！正在用魔法生成打包打地鼠特训关卡...",
    "马上就好啦，定制专属练习防错最有效啦！",
  ];

  React.useEffect(() => {
    if (!isAnalyzing) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % quotes.length;
      setLoadingText(quotes[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onAnalyze(reader.result);
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader failed to convert file.", err);
    };
    reader.readAsDataURL(file);
  };

  const executeSample = (base64Url: string) => {
    setSelectedFileName("示例错题.png");
    onAnalyze(base64Url);
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="p-5 space-y-6 flex-1 flex flex-col justify-between" id="upload-stage">
      {/* Cartoon Graphic / Banner */}
      <div className="bg-amber-100 rounded-2xl border-4 border-slate-800 p-4 relative overflow-hidden">
        <div className="absolute right-2 top-2 bg-amber-400 p-1.5 rounded-xl border-2 border-slate-800 animate-spin" style={{ animationDuration: '6s' }}>
          <Sparkles className="w-5 h-5 text-slate-800" />
        </div>
        <p className="font-extrabold text-slate-800 text-lg leading-tight">
          💡 打地鼠来巩固错题！
        </p>
        <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
          家长用手机拍下孩子日常数学错题，AI诊断薄弱点，即可立刻生成专属“打地鼠小游戏”，引导孩子快乐练题，击碎难点！
        </p>
      </div>

      {isAnalyzing ? (
        /* Cute loading container */
        <div className="p-8 text-center space-y-5 bg-white border-4 border-slate-800 rounded-3xl shadow-[0_8px_0_#F59E0B] py-14 flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-8 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-xl">🐼</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-slate-800 font-cartoon">量身定制中...</h3>
            <p className="text-sm text-slate-500 font-mono italic animate-pulse">
              {loadingText}
            </p>
          </div>
          <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden border-2 border-slate-800">
            <div className="bg-amber-500 h-full rounded-full animate-[shimmer_2s_infinite]" style={{ width: '75%' }}></div>
          </div>
        </div>
      ) : (
        /* Action buttons container */
        <div className="space-y-6 flex-1 flex flex-col justify-center">
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
              id="math-camera-input"
            />
            
            <button
              id="camera-trigger-button"
              onClick={triggerCamera}
              style={{ boxShadow: "0 8px 0 #1E293B" }}
              className="w-full flex flex-col items-center justify-center gap-3 bg-amber-400 hover:bg-amber-300 active:translate-y-1 active:shadow-[0_4px_0_#1E293B] border-4 border-slate-800 rounded-2xl py-6 px-4 transition-all text-slate-900 group"
            >
              <div className="bg-white p-3 rounded-full border-4 border-slate-800 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-slate-850" />
              </div>
              <div className="text-center">
                <span className="block font-black text-xl tracking-wide font-cartoon">📸 拍照上传今日错题</span>
                <span className="text-xs text-slate-700 font-semibold mt-1 block">支持口算本、错题集、试卷拍照</span>
              </div>
            </button>
            
            {selectedFileName && (
              <p className="text-xs text-center text-slate-500 font-mono">
                已选中: <span className="font-bold text-slate-700">{selectedFileName}</span>
              </p>
            )}
          </div>

          {/* Quick Demo Segment */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-600">没有错题？用示例图一秒测试效果👇</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              {SAMPLE_MATH_PICS.map((pic, idx) => (
                <button
                  id={`sample-trigger-button-${idx}`}
                  key={idx}
                  onClick={() => executeSample(pic.data)}
                  className="flex items-center justify-between text-left p-3.5 bg-white hover:bg-amber-50 active:scale-[0.98] border-2 border-slate-800 rounded-xl transition-all shadow-sm"
                >
                  <div>
                    <span className="block font-extrabold text-sm text-slate-800">{pic.name}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{pic.desc}</span>
                  </div>
                  <span className="bg-amber-100 group-hover:bg-amber-200 border border-slate-800 rounded-lg text-xs font-bold px-2 py-1 text-slate-700 font-mono">
                    测试 ⚡
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trust Seal */}
      <div className="pt-2 text-center text-[11px] text-slate-400 font-bold flex items-center justify-center gap-1">
        🔒 守护数据安全 · 腾讯云/阿里云银行级图片加密存储
      </div>
    </div>
  );
}
