import React, { useState, useRef, ChangeEvent } from "react";
import { ShieldCheck, Lock, Check, Sparkles, QrCode, Upload, Image as ImageIcon } from "lucide-react";
import { DiagnosticResult } from "../types";

interface PaywallStageProps {
  diagnostic: DiagnosticResult;
  onUnlock: () => void;
  onCancel: () => void;
}

export default function PaywallStage({ diagnostic, onUnlock, onCancel }: PaywallStageProps) {
  const [selectedPlan, setSelectedPlan] = useState<"single" | "lifetime">("single");
  const [showQr, setShowQr] = useState(false);
  const [simulatedPayed, setSimulatedPayed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom local saved QR code image if uploaded
  const [customQr, setCustomQr] = useState<string>(() => {
    return localStorage.getItem("math_wechat_qr") || "";
  });

  const price = selectedPlan === "single" ? "¥2.99" : "¥19.90";
  const desc = selectedPlan === "single" ? "解锁本题特训关卡" : "无限次全科终身特权卡";

  const handlePayClick = () => {
    setShowQr(true);
  };

  const handleConfirmPayment = () => {
    setSimulatedPayed(true);
    setTimeout(() => {
      onUnlock();
    }, 1200);
  };

  // Handle local file uploading of WeChat Pay QR Code
  const handleQrUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCustomQr(reader.result);
          localStorage.setItem("math_wechat_qr", reader.result);
          alert("🎉 收款二维码已本地绑定成功！支付页现在将实时渲染您的真实收款码 ➔");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-5 space-y-5 flex-1 flex flex-col justify-between" id="paywall-stage">
      {/* Header Topic Diagnosis */}
      <div className="space-y-3">
        <div className="text-center">
          <span className="inline-block bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-full mb-1 border-2 border-slate-800">
            🔍 AI 智能批改结果
          </span>
          <h3 className="text-2xl font-black text-slate-800 tracking-wide font-cartoon">
            薄弱点已定位！
          </h3>
        </div>

        <div className="bg-green-50 rounded-2xl border-4 border-slate-800 p-4 space-y-2 relative shadow-inner">
          <div className="flex items-start gap-2.5">
            <span className="text-2xl">🚨</span>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-bold">孩子主要薄弱项</p>
              <p className="text-lg font-black text-slate-800">
                知识点：<span className="text-red-500">{diagnostic.target_topic}</span>
              </p>
            </div>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border-2 border-slate-800 text-xs text-slate-600 font-medium leading-relaxed">
            <span className="font-extrabold text-emerald-700">AI老师点评：</span>
            在该题中，孩子对知识结构掌握稍有偏差，极易在类似内容（如
            {diagnostic.wrong_answers[0]}、{diagnostic.wrong_answers[1]}
            ）中混淆。针对性的绿色健康“打地鼠”答题，能有效强化深度肌肉记忆！
          </div>
        </div>
      </div>

      {/* Target Game preview locked visually */}
      <div className="relative rounded-2xl border-4 border-slate-800 bg-slate-900 p-4 text-center overflow-hidden h-28 flex flex-col justify-center items-center">
        {/* Blurry mole grid inside preview */}
        <div className="absolute inset-0 opacity-20 filter blur-sm grid grid-cols-3 gap-2 p-2">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-emerald-950 rounded-xl h-10 border border-white flex items-end justify-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-t-xl"></div>
            </div>
          ))}
        </div>
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-2.5 py-0.5 rounded-full border-2 border-slate-950 text-xs font-black">
            <Lock className="w-3.5 h-3.5 fill-current" /> 已成功量身定制关卡
          </div>
          <p className="text-white text-sm font-extrabold">{diagnostic.question_display}</p>
        </div>
      </div>

      {/* Pricing options */}
      <div className="space-y-3">
        <p className="text-xs font-extrabold text-slate-505 px-1 flex items-center justify-between">
          <span>🎁 选择学习方案：</span>
          <span className="text-emerald-700">限时折扣中</span>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setSelectedPlan("single"); setShowQr(false); }}
            className={`p-3.5 rounded-xl border-4 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
              selectedPlan === "single"
                ? "bg-green-50 border-emerald-500 shadow-[0_4px_0_#059669]"
                : "bg-white border-slate-800"
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <span className="font-extrabold text-slate-805 text-xs">单题攻克</span>
              {selectedPlan === "single" && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold">本款定制特训</p>
              <p className="text-lg font-black text-slate-800">¥2.99</p>
            </div>
          </button>

          <button
            onClick={() => { setSelectedPlan("lifetime"); setShowQr(false); }}
            className={`p-3.5 rounded-xl border-4 text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
              selectedPlan === "lifetime"
                ? "bg-emerald-50/80 border-emerald-600 shadow-[0_4px_0_#047857]"
                : "bg-white border-slate-800"
            }`}
          >
            <span className="absolute top-0 right-0 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-bl-lg">
              超值
            </span>
            <div className="flex justify-between items-center w-full">
              <span className="font-extrabold text-emerald-950 text-xs">终身全科通</span>
              {selectedPlan === "lifetime" && <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />}
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 font-bold">全站错题无限玩</p>
              <p className="text-lg font-black text-emerald-950">¥19.90</p>
            </div>
          </button>
        </div>
      </div>

      {/* Paywall Modal/Section */}
      <div className="space-y-3">
        {showQr ? (
          <div className="bg-slate-900 text-white rounded-2xl border-4 border-slate-800 p-4 space-y-3 text-center">
            {simulatedPayed ? (
              <div className="py-6 space-y-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white text-lg animate-bounce">
                  ✓
                </div>
                <p className="font-bold text-emerald-400">支付成功！正在解锁特训...</p>
                <p className="text-xs text-slate-400">开启您的打地鼠错题消灭特训吧！</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400">官方通道 个人扫码支付</span>
                  <span className="text-xs text-amber-400 font-black">{price}</span>
                </div>

                {/* Highly authentic WeChat Pay styled container */}
                <div className="bg-[#07c160] p-4 rounded-xl border-2 border-slate-950 text-center relative overflow-hidden flex flex-col items-center">
                  <header className="mb-2 text-white/95 text-xs font-bold tracking-wider flex items-center gap-1.5">
                    <span className="bg-white text-[#07c160] rounded-sm px-0.5 font-sans font-black scale-90">✓</span>
                    推荐使用微信支付
                  </header>

                  <div className="bg-white px-3 py-4 rounded-lg w-full max-w-[190px] flex flex-col items-center shadow-lg">
                    {customQr ? (
                      <div className="relative group/qr">
                        <img 
                          src={customQr} 
                          alt="微信收款二维码" 
                          className="w-36 h-36 object-contain rounded border border-slate-100"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 right-0 bg-slate-900 border border-white hover:bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow cursor-pointer transition-transform group-hover/qr:scale-110"
                        >
                          更换二维码
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-36 h-36 bg-slate-50 hover:bg-slate-100 rounded border-2 border-dashed border-slate-350 flex flex-col justify-center items-center cursor-pointer p-2 text-center group transition-colors"
                      >
                        <Upload className="w-6 h-6 text-[#07c160] animate-bounce mb-1" />
                        <p className="text-[10px] text-slate-700 font-black leading-tight">点击上传收款码</p>
                        <p className="text-[8px] text-slate-400 font-medium mt-0.5">支持微信或支付宝导出的收钱码</p>
                      </div>
                    )}

                    {/* QR Code description text */}
                    <p className="text-[9px] text-slate-700 font-bold mt-2 font-sans flex items-center gap-1 bg-slate-100 py-0.5 px-2 rounded-full">
                      榆木(**芳) <span className="text-emerald-600 stroke-[5]">✓</span>
                    </p>
                  </div>

                  {/* Footer brand checkmark */}
                  <footer className="mt-2 text-white/90 text-[10px] font-sans font-black tracking-normal flex items-center gap-1">
                    <span className="w-3 h-3 bg-white text-[#07c160] rounded-full text-[8px] font-bold flex items-center justify-center">✓</span>
                    微信支付
                  </footer>
                </div>

                {/* Hidden input to receive image uploads */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />

                <p className="text-[10px] text-slate-405 leading-normal">
                  请家长使用微信扫一扫付款。支付后点击下方按钮开启定制游戏！
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setShowQr(false)}
                    className="bg-slate-800 hover:bg-slate-755 text-slate-350 text-xs font-bold py-2.5 rounded-xl border border-slate-700"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black py-2.5 rounded-xl border border-emerald-600 animate-[pulse_1.5s_infinite]"
                  >
                    已支付，点此解锁 ➔
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handlePayClick}
              style={{ boxShadow: "0 6px 0 #1E293B" }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:translate-y-1 active:shadow-none border-4 border-slate-800 text-slate-950 font-black text-lg py-3.5 rounded-xl transition-all font-cartoon flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              立即解锁专属脑力特训卡 ({price})
            </button>
            <button
              onClick={onCancel}
              className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold py-1 transition-all"
            >
              重新上传错题
            </button>
            <button
              onClick={onUnlock}
              className="w-full text-[10px] text-slate-400 hover:text-emerald-600 hover:font-bold block transition-all underline italic font-medium pt-1"
            >
              🔑 管理员测试直通：直接免单进入游戏 ➔
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-5 text-slate-400 text-[10px] font-extrabold border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 绿色防沉迷</span>
        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> 家长资金护航</span>
        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-500" /> 退款承诺保障</span>
      </div>
    </div>
  );
}
