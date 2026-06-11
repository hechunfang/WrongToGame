import React, { useRef, useState } from "react";
import { Camera, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface UploadStageProps {
  onAnalyze: (base64Image: string) => void;
  isAnalyzing: boolean;
  practiceCount: number;
  isPaid: boolean;
}

// Prebaked base64 content for real sheets to let users test instantly
const SAMPLE_MATH_PICS = [
  {
    name: "🔢 数学：7的乘法口诀",
    desc: "示例错题：7 × 8 = 52 (应为 56)",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>数学错题本</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>7 × 8 = 52</text><text x='250' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text></svg>"
  },
  {
    name: "✍️ 语文拼音：橙子(ceng)",
    desc: "前后鼻音错写：将‘橙(chéng)’拼错为‘ceng’",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>一年级拼音作业</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>橙子 == ceng zi</text><text x='280' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text></svg>"
  },
  {
    name: "🧩 语文组词：拨打与检查",
    desc: "错字混淆连连看：分辨‘拨’和‘拔’字",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>二年级形近字生词配对</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>错字连连看拔拨打</text><text x='320' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text></svg>"
  },
  {
    name: "🔤 英语拼写：朋友(friend)",
    desc: "常见拼写混淆：将‘friend’拼错为‘freind’",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>三年级英语单元测验</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>My freind is Jim.</text><text x='325' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text></svg>"
  }
];

export default function UploadStage({ onAnalyze, isAnalyzing, practiceCount, isPaid }: UploadStageProps) {
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

  const scaleAndCompressImage = (file: File, callback: (base64Url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          callback(e.target?.result as string);
          return;
        }

        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Compress container output to lightweight JPEG format
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        callback(compressedBase64);
      };
      img.onerror = () => {
        callback(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    scaleAndCompressImage(file, (compressedBase64) => {
      onAnalyze(compressedBase64);
    });
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
      <div className="bg-green-50/90 rounded-2xl border-4 border-emerald-800/80 p-4 relative overflow-hidden">
        <div className="absolute right-2 top-2 bg-emerald-400 p-1.5 rounded-xl border-2 border-slate-800 animate-spin" style={{ animationDuration: '6s' }}>
          <Sparkles className="w-5 h-5 text-emerald-950" />
        </div>
        <p className="font-extrabold text-emerald-950 text-lg leading-tight">
          💡 打地鼠来巩固错题！
        </p>
        <p className="text-xs text-emerald-800 mt-2 font-medium leading-relaxed">
          家长用手机拍下孩子日常英数语错题，AI诊断薄弱点，即可立刻生成专属“打地鼠小游戏”，引导孩子快乐练题，保护视力，击碎难点！
        </p>
        {/* Added Trial notice */}
        <div className="mt-3 pt-2.5 border-t-2 border-emerald-800/20 flex items-center justify-between">
          <span className="text-xs font-black text-emerald-700 font-cartoon">
            🎁 护眼成长营特权
          </span>
          <span className="text-xs font-extrabold text-emerald-800 bg-white border-2 border-emerald-800 rounded-lg px-2 rounded-md py-0.5 shadow-[0_2px_0_#065f46]">
            {isPaid ? "👑 终身特权版已激活" : "🎯 AI双维精细特训"}
          </span>
        </div>
      </div>

      {isAnalyzing ? (
        /* Cute loading container */
        <div className="p-8 text-center space-y-5 bg-white border-4 border-slate-800 rounded-3xl shadow-[0_8px_0_#059669] py-14 flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-8 border-green-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-xl">🐼</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-slate-800 font-cartoon">量身定制中...</h3>
            <p className="text-sm text-emerald-600 font-mono italic animate-pulse">
              {loadingText}
            </p>
          </div>
          <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden border-2 border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full animate-[shimmer_2s_infinite]" style={{ width: '75%' }}></div>
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
              onChange={handleImageUpload}
              className="hidden"
              id="math-camera-input"
            />
            
            <button
              id="camera-trigger-button"
              onClick={triggerCamera}
              style={{ boxShadow: "0 8px 0 #064e3b" }}
              className="w-full flex flex-col items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 active:translate-y-1 active:shadow-[0_4px_0_#064e3b] border-4 border-slate-800 rounded-2xl py-6 px-4 transition-all text-white group"
            >
              <div className="bg-white p-3 rounded-full border-4 border-slate-800 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-emerald-800" />
              </div>
              <div className="text-center">
                <span className="block font-black text-xl tracking-wide font-cartoon">📸 选图 / 拍照上传今日错题</span>
                <span className="text-xs text-emerald-100 mt-1 block">支持从手机相册选图或使用相机拍照</span>
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
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-600">没有错题？用护眼示例图一秒测试效果👇</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              {SAMPLE_MATH_PICS.map((pic, idx) => (
                <button
                  id={`sample-trigger-button-${idx}`}
                  key={idx}
                  onClick={() => executeSample(pic.data)}
                  className="flex items-center justify-between text-left p-3.5 bg-white hover:bg-emerald-50 active:scale-[0.98] border-2 border-slate-800 rounded-xl transition-all shadow-sm"
                >
                  <div>
                    <span className="block font-extrabold text-sm text-slate-850">{pic.name}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{pic.desc}</span>
                  </div>
                  <span className="bg-emerald-100 group-hover:bg-emerald-200 border border-slate-800 rounded-lg text-xs font-bold px-2 py-1 text-emerald-800 font-mono">
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
