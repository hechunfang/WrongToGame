import React, { useState } from "react";
import { Download, Award, RefreshCw, Send, CheckCircle, Smartphone, ExternalLink } from "lucide-react";
import { DiagnosticResult } from "../types";
import { generateStandaloneHTML } from "../utils/htmlExporter";

interface SettlementStageProps {
  score: number;
  diagnostic: DiagnosticResult;
  onReset: () => void;
}

export default function SettlementStage({ score, diagnostic, onReset }: SettlementStageProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [unlockedDownload, setUnlockedDownload] = useState(false);
  const [joinedWeChat, setJoinedWeChat] = useState(false);
  const [showExporterSuccess, setShowExporterSuccess] = useState(false);

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
    if (!joinedWeChat) {
      alert("🎁 数学字帖下载资格已经预留！请扫描下方私域带教老师微信，领取配套打印工具包。");
    } else {
      alert("❤️ 已为您启动下载，正在生成PDF字帖请稍候...");
    }
  };

  const levelText = score >= 80 ? "满星超凡宗师" : score >= 50 ? "错题消灭达人" : "潜能爆发黑马";
  const medalEmoji = score >= 85 ? "👑" : score >= 50 ? "🏆" : "⭐";

  return (
    <div className="p-5 space-y-5 flex-1 flex flex-col justify-between" id="settlement-stage">
      {/* Medal Presentation Card */}
      <div className="text-center space-y-2">
        <div className="relative inline-block">
          <span className="text-7xl animate-bounce duration-1000 inline-block">{medalEmoji}</span>
          <span className="absolute -top-1 -right-1 text-2xl animate-pulse">✨</span>
          <span className="absolute -bottom-1 -left-1 text-2xl animate-pulse">🎉</span>
        </div>
        
        <h3 className="cartoon-font text-3xl font-extrabold text-amber-500 tracking-wide">
          {levelText}！
        </h3>
        <p className="text-xs text-slate-500 font-bold">
          恭喜孩子！专攻薄弱项【{diagnostic.target_topic}】完成！
        </p>
      </div>

      {/* Performance Statistics Card */}
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

      {/* Export Free H5 standalone as Premium reward */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-dashed border-amber-500 rounded-2xl p-4 text-center space-y-3">
        <div className="space-y-1">
          <span className="inline-block bg-amber-500/10 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
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
          className="w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.98] border-2 border-slate-800 rounded-xl py-2 px-3 text-xs font-black text-slate-900 transition-all flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" /> 解锁并保存离线版 [ 100% 免费 ]
        </button>

        {showExporterSuccess && (
          <p className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 离线打包游戏已保存至您的下载文件夹！
          </p>
        )}
      </div>

      {/* Private Traffic conversion block */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl border-4 border-slate-800 p-4 space-y-3.5 text-center">
        <div className="flex items-center gap-2 justify-center border-b border-slate-800 pb-2">
          <Smartphone className="w-4 h-4 text-violet-400 animate-bounce" />
          <span className="text-xs font-extrabold text-white">微信专属私域特学营</span>
        </div>

        <div className="flex flex-col items-center space-y-1.5">
          <p className="text-[11px] text-slate-300 font-medium">长按二维码添加专属辅导老师微信：</p>
          {/* Faked QR Code with kid icon for private conversions */}
          <div className="bg-white p-2 rounded-xl relative border-2 border-indigo-400">
            <div className="w-24 h-24 bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-2xl mb-1">🐼</span>
              <p className="text-[8px] text-slate-400 font-black">AI 教育小管家</p>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-pink-500/10"></div>
              {/* Fake Scan indicator */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-400 animate-[bounce_2.5s_infinite]"></div>
            </div>
          </div>
          <p className="text-[10px] text-indigo-400 font-black">老师微信号：aimath_helper_09</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          <button
            onClick={() => setJoinedWeChat(!joinedWeChat)}
            className={`text-[10px] font-black rounded-lg px-2.5 py-1 flex items-center gap-1 border transition-all ${
              joinedWeChat
                ? "bg-slate-800 border-slate-700 text-slate-500"
                : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
            }`}
          >
            {joinedWeChat ? "✓ 已关注添加" : "添加微信号"}
          </button>
        </div>
      </div>

      {/* Primary Action controls */}
      <div className="space-y-2">
        <button
          onClick={handlePrintLockClick}
          style={{ boxShadow: "0 6px 0 #1E293B" }}
          className="w-full bg-violet-600 hover:bg-violet-500 active:translate-y-1 active:shadow-none border-4 border-slate-800 text-white font-black text-base py-3 rounded-xl transition-all font-cartoon flex items-center justify-center gap-2"
        >
          <Award className="w-5 h-5 fill-current text-amber-300 animate-pulse" />
          免费生成并打印该错题描红字帖
        </button>

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-400 hover:border-slate-800 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 重新批改/上传今日其他错题
        </button>
      </div>

      <div className="text-center text-[9px] text-slate-400 font-bold">
        本体验页由 AI 自动生成，所得数据仅用作教学测评。
      </div>
    </div>
  );
}
