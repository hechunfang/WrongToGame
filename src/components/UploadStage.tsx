import React, { useRef, useState, useEffect, ChangeEvent } from "react";
import { Camera, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface UploadStageProps {
  onAnalyze: (base64Image: string) => void;
  onSelectOral: (payload: any) => void;
  isAnalyzing: boolean;
  practiceCount: number;
  isPaid: boolean;
  setIsPaid: (val: boolean) => void;
  enableGame: boolean;
  setEnableGame: (val: boolean) => void;
  parentPhone: string;
  setParentPhone: (val: string) => void;
  parentNickname: string;
  setParentNickname: (val: string) => void;
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
  },
  {
    name: "🍬 语文错字：甘甜 (甘写成干)",
    desc: "错字练习：将‘甘’错写成‘干’，附加多维组词强化",
    data: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200' style='background:%23FDFBF7;font-family:sans-serif;'><rect width='392' height='192' x='4' y='4' rx='16' fill='%23FFF' stroke='%23334155' stroke-width='4'/><text x='50' y='60' font-size='22' font-weight='bold' fill='%23334155'>二年级语文听写</text><text x='50' y='110' font-size='32' font-weight='black' fill='%23EF4444'>干甜 == gān tián</text><text x='320' y='110' font-size='20' fill='%2394A3B8'>(批改: ❌)</text></svg>"
  }
];

const ENGLISH_ORAL_POOL = [
  {
    type: "english_oral",
    target_topic: "交通与出行 (Transportation)",
    target_display: "大声朗读句子，和 AI 小助手练习口语磨耳朵吧！",
    correct_sequence: ["bicycle", "ride", "sunny"],
    grid_items: [],
    english_scene_sentence: "He rides a bright red bicycle in the park.",
    english_scene_translation: "他在公园里骑着一辆鲜红色的自行车。",
    english_scene_image: "bicycle",
    question_display: "He rides a bright red bicycle in the park.",
    correct_answer: "He rides a bright red bicycle in the park."
  },
  {
    type: "english_oral",
    target_topic: "可爱萌宠 (Lovely Pets)",
    target_display: "听听它的发音，然后跟着大声读读看吧！",
    correct_sequence: ["puppy", "dog", "cute"],
    grid_items: [],
    english_scene_sentence: "The cute puppy loves playing on the green grass.",
    english_scene_translation: "这局可爱的小狗喜欢在绿油油的草地上玩耍。",
    english_scene_image: "dog",
    question_display: "The cute puppy loves playing on the green grass.",
    correct_answer: "The cute puppy loves playing on the green grass."
  },
  {
    type: "english_oral",
    target_topic: "甜蜜冰淇淋 (Sweet Dessert)",
    target_display: "冰淇淋真好吃！跟读句子吧！",
    correct_sequence: ["ice cream", "sweet", "summer"],
    grid_items: [],
    english_scene_sentence: "I like eating sweet chocolate ice cream in hot summer.",
    english_scene_translation: "我喜欢在炎热的夏天吃甜甜的巧克力冰淇淋。",
    english_scene_image: "icecream",
    question_display: "I like eating sweet chocolate ice cream in hot summer.",
    correct_answer: "I like eating sweet chocolate ice cream in hot summer."
  },
  {
    type: "english_oral",
    target_topic: "快乐校园 (Happy School)",
    target_display: "我们去上学啦！口语跟读练习：",
    correct_sequence: ["school", "friends", "happy"],
    grid_items: [],
    english_scene_sentence: "We go to school and meet our happy classmates.",
    english_scene_translation: "我们去上学并遇见我们快乐的同班同学。",
    english_scene_image: "school",
    question_display: "We go to school and meet our happy classmates.",
    correct_answer: "We go to school and meet our happy classmates."
  },
  {
    type: "english_oral",
    target_topic: "金光闪闪的大太阳 (Warm Sun)",
    target_display: "太阳公公出来啦！太阳例句跟读：",
    correct_sequence: ["sun", "warm", "shines"],
    grid_items: [],
    english_scene_sentence: "The golden sun shines brightly in the blue sky.",
    english_scene_translation: "金灿灿的太阳在蔚蓝的天空中明朗地照耀着。",
    english_scene_image: "sun",
    question_display: "The golden sun shines brightly in the blue sky.",
    correct_answer: "The golden sun shines brightly in the blue sky."
  },
  {
    type: "english_oral",
    target_topic: "读书小屋 (Reading Corner)",
    target_display: "看书能让我们学到新知识！跟读练习：",
    correct_sequence: ["book", "read", "story"],
    grid_items: [],
    english_scene_sentence: "She reads an interesting story book every night.",
    english_scene_translation: "她每晚阅读一本有趣的童话故事书。",
    english_scene_image: "book",
    question_display: "She reads an interesting story book every night.",
    correct_answer: "She reads an interesting story book every night."
  },
  {
    type: "english_oral",
    target_topic: "温馨家庭 (My Warm Family)",
    target_display: "我爱我的家！跟读练习：",
    correct_sequence: ["family", "love", "home"],
    grid_items: [],
    english_scene_sentence: "I have a lovely family and we live in a warm house.",
    english_scene_translation: "我有一个可爱的家庭，我们住在一个温暖的房子里。",
    english_scene_image: "family",
    question_display: "I have a lovely family and we live in a warm house.",
    correct_answer: "I have a lovely family and we live in a warm house."
  }
];

export default function UploadStage({ onAnalyze, onSelectOral, isAnalyzing, practiceCount, isPaid, setIsPaid, enableGame, setEnableGame, parentPhone, setParentPhone, parentNickname, setParentNickname }: UploadStageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingText, setLoadingText] = useState("AI 老师正在分析纸张...");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Parent History State Managers (MySQL & Aliyun OSS)
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [historyQuestions, setHistoryQuestions] = useState<any[]>([]);
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [tempPhoneInput, setTempPhoneInput] = useState(parentPhone);
  const [tempNicknameInput, setTempNicknameInput] = useState(parentNickname);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Promotional Code & Distributor Management States
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats dashboard states
  const [showPromoterAdmin, setShowPromoterAdmin] = useState(false);
  const [promoterCodes, setPromoterCodes] = useState<any[]>([]);
  const [promoterLogs, setPromoterLogs] = useState<any[]>([]);
  const [isFetchingStats, setIsFetchingStats] = useState(false);

  // Promoter session and access credentials
  const [promoterLoginCode, setPromoterLoginCode] = useState("");
  const [promoterLoginPasscode, setPromoterLoginPasscode] = useState("");
  const [isPromoterLoggedIn, setIsPromoterLoggedIn] = useState(false);
  const [loggedInRole, setLoggedInRole] = useState<"admin" | "promoter" | "">("");
  const [loggedInPromoterName, setLoggedInPromoterName] = useState("");
  const [promoterLoginError, setPromoterLoginError] = useState("");

  // New activation code creation states
  const [newCodeStr, setNewCodeStr] = useState("");
  const [newPromoterName, setNewPromoterName] = useState("");
  const [newVipDays, setNewVipDays] = useState(30);
  const [newMaxUses, setNewMaxUses] = useState(100);
  const [newPasscode, setNewPasscode] = useState("");

  const handlePromoterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoterLoginCode.trim() || !promoterLoginPasscode.trim()) {
      setPromoterLoginError("请输入推广账号(激活码)及专属密匙！");
      return;
    }
    setPromoterLoginError("");
    setIsFetchingStats(true);
    try {
      const res = await fetch("/api/promoter/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoterLoginCode.trim().toUpperCase(),
          passcode: promoterLoginPasscode.trim()
        })
      }).then(r => r.json());

      if (res.success) {
        setIsPromoterLoggedIn(true);
        setLoggedInRole(res.role);
        setLoggedInPromoterName(res.promoter_name);
        setPromoterCodes(res.codes || []);
        setPromoterLogs(res.logs || []);
        setPromoterLoginError("");
      } else {
        setPromoterLoginError(res.error || "登录验证失败，请重新核对！");
      }
    } catch (err) {
      setPromoterLoginError("网络通畅度不佳，请重试登录！");
    } finally {
      setIsFetchingStats(false);
    }
  };

  const refreshPromoData = async () => {
    if (!isPromoterLoggedIn) return;
    setIsFetchingStats(true);
    try {
      if (loggedInRole === "admin") {
        const res = await fetch("/api/promoter-stats").then(r => r.json());
        if (res.success) {
          setPromoterCodes(res.codes || []);
          setPromoterLogs(res.logs || []);
        }
      } else {
        const res = await fetch("/api/promoter/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: promoterLoginCode.trim().toUpperCase(),
            passcode: promoterLoginPasscode.trim()
          })
        }).then(r => r.json());
        if (res.success) {
          setPromoterCodes(res.codes || []);
          setPromoterLogs(res.logs || []);
        }
      }
    } catch (err) {
      console.error("Failed to refresh statistics:", err);
    } finally {
      setIsFetchingStats(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!promoCodeInput.trim()) {
      alert("请输入有效的激活码！");
      return;
    }
    setIsRedeeming(true);
    setPromoMessage(null);
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parentPhone, code: promoCodeInput.trim() })
      }).then(r => r.json());

      if (res.success) {
        setPromoMessage({ type: "success", text: res.message });
        setIsPaid(true);
        localStorage.setItem("math_is_paid", "true");
        setPromoCodeInput("");
        alert(res.message);
        // Reload parent details & history to update VIP fields
        fetchParentHistory(parentPhone);
      } else {
        setPromoMessage({ type: "error", text: res.message || "激活失败" });
        alert(res.message);
      }
    } catch (err: any) {
      setPromoMessage({ type: "error", text: "激活异常，请稍后重试！" });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeStr.trim() || !newPromoterName.trim()) {
      alert("请填写完整的激活码与推广员姓名！");
      return;
    }
    try {
      const res = await fetch("/api/create-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCodeStr.trim().toUpperCase(),
          promoter_name: newPromoterName.trim(),
          vip_days: newVipDays,
          max_uses: newMaxUses,
          passcode: newPasscode.trim() || "123456"
        })
      }).then(r => r.json());

      if (res.success) {
        alert(`🎉 推广激活码 [${newCodeStr.trim().toUpperCase()}] 已成功绑定推广员 [${newPromoterName.trim()}]，登录密匙为 [${newPasscode.trim() || '123456'}]！`);
        setNewCodeStr("");
        setNewPromoterName("");
        setNewPasscode("");
        refreshPromoData();
      } else {
        alert("生成失败，请核实激活码是否已被占用！");
      }
    } catch (err) {
      alert("保存激活码出错，请检查接口连通性");
    }
  };

  const fetchParentHistory = async (phoneToQuery: string) => {
    setIsFetchingHistory(true);
    try {
      const qRes = await fetch(`/api/wrong-questions/${phoneToQuery}`).then(r => r.json());
      const rRes = await fetch(`/api/pdf-reports/${phoneToQuery}`).then(r => r.json());
      if (qRes.success && qRes.list) {
        setHistoryQuestions(qRes.list);
      }
      if (qRes.success && qRes.user) {
        if (qRes.user.nickname) {
          setParentNickname(qRes.user.nickname);
          setTempNicknameInput(qRes.user.nickname);
          localStorage.setItem("parent_nickname", qRes.user.nickname);
        }
        
        // Sync database VIP state with the frontend UI
        const isVip = qRes.user.is_vip === 1;
        setIsPaid(isVip);
        localStorage.setItem("math_is_paid", isVip ? "true" : "false");
      }
      if (rRes.success && rRes.reports) {
        setHistoryReports(rRes.reports);
      }
    } catch (err) {
      console.error("Failed to fetch historical database blocks:", err);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    setTempNicknameInput(parentNickname);
  }, [parentNickname]);

  useEffect(() => {
    if (parentPhone) {
      fetchParentHistory(parentPhone);
    }
  }, [parentPhone]);

  // Periodic greeting quotes for immersive feels
  const quotes = [
    "AI 老师正在用放大镜深度识题中...",
    "正在结合上下文寻找小朋友笔画和逻辑漏项...",
    "诊断成功！正在用魔法拼装定制打地鼠特训关卡...",
    "马上就好啦，通过游戏巩固能记得更深刻哦！",
  ];

  useEffect(() => {
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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
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
    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between" id="upload-stage">
      
      {/* WeChat Parent Phone & Nickname Binding Area */}
      <div className="bg-slate-50 border-4 border-slate-800 rounded-2xl p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-start md:items-center justify-between gap-2">
          <div className="flex items-start md:items-center gap-2 flex-1">
            <div className="bg-emerald-100 border-2 border-slate-800 rounded-xl p-1.5 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0">
              <span className="text-base">👤</span>
            </div>
            {!isEditingPhone ? (
              <div className="text-left flex-1 min-w-0">
                <span className="block text-[9px] text-slate-400 font-extrabold leading-none">企业微信家长工作台</span>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                  <span className="text-xs font-black text-slate-800 truncate" title={parentNickname}>
                    称呼: {parentNickname}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 font-mono">
                    ({parentPhone})
                  </span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isEditingPhone && (
              <button
                onClick={() => {
                  setTempPhoneInput(parentPhone);
                  setTempNicknameInput(parentNickname);
                  setIsEditingPhone(true);
                }}
                className="text-[9px] text-emerald-800 border-2 border-slate-800 bg-emerald-50 hover:bg-emerald-100 font-black px-2 py-1 rounded-lg active:translate-y-0.5"
                id="edit-profile-btn"
              >
                修改称呼
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab(activeTab === "upload" ? "history" : "upload");
              }}
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border-2 border-slate-800 transition-all ${
                activeTab === "history" ? "bg-amber-400 text-slate-950 shadow-[0_2px_0_#1e293b]" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
              id="toggle-archive-tab-btn"
            >
              {activeTab === "history" ? "↩️ 拍照识错" : "🗄️ 自适应归档库"}
            </button>
          </div>
        </div>

        {/* Edit Form Drawer */}
        {isEditingPhone && (
          <div className="flex flex-col gap-2 p-2.5 bg-white border-2 border-dashed border-slate-300 rounded-xl mt-1.5" id="profile-edit-panel">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 w-14 flex-shrink-0 text-right">家长手机:</span>
              <input
                type="text"
                maxLength={11}
                className="flex-1 text-xs border-2 border-slate-800 rounded-lg px-2 py-1 font-black font-mono focus:outline-none focus:border-emerald-500"
                value={tempPhoneInput}
                onChange={(e) => setTempPhoneInput(e.target.value.replace(/\D/g, ""))}
                placeholder="请输入家长11位大陆号码"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 w-14 flex-shrink-0 text-right">企微称呼:</span>
              <input
                type="text"
                maxLength={15}
                className="flex-1 text-xs border-2 border-slate-800 rounded-lg px-2 py-1 font-black focus:outline-none focus:border-emerald-500"
                value={tempNicknameInput}
                onChange={(e) => setTempNicknameInput(e.target.value)}
                placeholder="例如: 小雨爸爸、乐乐妈妈、i4ffyy"
              />
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => {
                  setIsEditingPhone(false);
                  setTempPhoneInput(parentPhone);
                  setTempNicknameInput(parentNickname);
                }}
                className="bg-slate-100 text-slate-600 border-2 border-slate-800 text-[10px] font-black rounded-lg px-2 py-1 hover:bg-slate-200 active:translate-y-0.5"
                id="cancel-profile-btn"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  const phoneVal = tempPhoneInput.trim();
                  const nickVal = tempNicknameInput.trim() || `小火伴家长_${phoneVal.slice(-4)}`;
                  if (phoneVal.length === 11) {
                    try {
                      const res = await fetch("/api/update-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: phoneVal, nickname: nickVal })
                      }).then(r => r.json());
                      
                      if (res.success && res.user) {
                        setParentPhone(phoneVal);
                        setParentNickname(res.user.nickname || nickVal);
                        localStorage.setItem("parent_phone", phoneVal);
                        localStorage.setItem("parent_nickname", res.user.nickname || nickVal);
                        setIsEditingPhone(false);
                        fetchParentHistory(phoneVal);
                      } else {
                        throw new Error(res.error || "接口异常");
                      }
                    } catch (err) {
                      console.warn("Update API issue, falling back to local simulation update:", err);
                      setParentPhone(phoneVal);
                      setParentNickname(nickVal);
                      localStorage.setItem("parent_phone", phoneVal);
                      localStorage.setItem("parent_nickname", nickVal);
                      setIsEditingPhone(false);
                      fetchParentHistory(phoneVal);
                    }
                  } else {
                    alert("请输入11位中国大陆家长手机号进行绑定！");
                  }
                }}
                className="bg-emerald-500 text-slate-900 border-2 border-slate-800 text-[10px] font-black rounded-lg px-3 py-1 shadow-sm active:translate-y-0.5 hover:bg-emerald-400"
                id="save-profile-btn"
              >
                保存资料
              </button>
            </div>
          </div>
        )}

        {/* VIP Status and Promo Code Activation Panel */}
        <div className="mt-2 border-t-2 border-dashed border-slate-300 pt-2 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-700">
            <div className="flex items-center gap-1">
              <span>会员状态:</span>
              {isPaid ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  👑 赞助人尊享特权 (激活码已生效)
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-905 border border-amber-350 px-1.5 py-0.5 rounded-md font-bold">
                  📖 免费体验中 (剩余 {Math.max(0, 3 - practiceCount)} 次上传识题机会)
                </span>
              )}
            </div>
            {isPaid ? null : (
              <span className="text-[10px] text-rose-500 font-bold">解锁全功能：可生成定制A4试卷PDF</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <input
              type="text"
              placeholder="请输入校外自营 / 推广激活码 (体验内置测试码如: VIP666, VIP888 等)"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              className="flex-1 text-xs px-2.5 py-2 border-2 border-slate-800 rounded-lg font-black focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
            <button
              onClick={handleRedeemCode}
              disabled={isRedeeming}
              className="bg-amber-400 text-slate-900 hover:bg-amber-300 font-extrabold text-[10px] border-2 border-slate-800 px-4 py-2 rounded-lg active:translate-y-0.5 transition-all flex-shrink-0"
            >
              {isRedeeming ? "激活中..." : "兑换激活码"}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-0.5">
            <span>💡 每一个激活码均关联了您的专属顾问或校外分享老师。</span>
            <button
              onClick={() => {
                setShowPromoterAdmin(true);
              }}
              className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded"
            >
              📊 推广后台与客户业绩结算
            </button>
          </div>
        </div>
      </div>

      {isAnalyzing ? (
        /* Cute loading container */
        <div className="p-8 text-center space-y-5 bg-white border-4 border-slate-800 rounded-3xl shadow-[0_8px_0_#059669] py-14 flex-1 flex flex-col items-center justify-center animate-fade-in">
          <div className="relative animate-bounce" style={{ animationDuration: "2s" }}>
            <div className="w-16 h-16 border-8 border-green-100 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-xl">🐼</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-slate-800 font-cartoon">AI 老师分析批改中...</h3>
            <p className="text-sm text-emerald-600 font-mono italic animate-pulse">
              {loadingText}
            </p>
          </div>
          <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden border-2 border-slate-800">
            <div className="bg-emerald-500 h-full rounded-full animate-[shimmer_2s_infinite]" style={{ width: "75%" }}></div>
          </div>
        </div>
      ) : activeTab === "history" ? (
        /* Parent dashboard history page (MySQL & OSS link checks) */
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1 py-1">
          {isFetchingHistory ? (
            <div className="p-12 text-center space-y-2 bg-white rounded-2xl border-4 border-slate-800">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-bold">正在拉取 MySQL 和 阿里云 OSS 提分存档...</p>
            </div>
          ) : (
            <>
              {/* Part A: Wrong Question lists */}
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-emerald-50/80 px-3 py-1.5 rounded-xl border-2 border-slate-800">
                  <span className="text-xs font-cartoon font-black text-slate-850">🧬 1/3 错题消灭库 (MySQL 极速连通)</span>
                  <span className="text-[10px] bg-white border border-slate-800 rounded px-1.5 py-0.5 text-slate-700 font-mono font-bold">
                    共 {historyQuestions.length} 道
                  </span>
                </div>

                <div className="space-y-2">
                  {historyQuestions.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                      <span className="text-2xl block mb-1">🦖</span>
                      <p className="text-[11px] text-slate-400 font-extrabold">当前手机暂无错题记录</p>
                      <button 
                        onClick={() => setActiveTab("upload")}
                        className="mt-2 text-[10px] font-black text-emerald-600 underline"
                      >
                        立刻去拍一张 📸
                      </button>
                    </div>
                  ) : (
                    historyQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="bg-white border-2 border-slate-800 rounded-xl p-2.5 space-y-2 shadow-sm animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 border border-slate-500 rounded px-1.5 py-0.5 text-[10px] font-black font-mono">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-extrabold text-emerald-700">【{q.subject || "通用"}】</span>
                            <span className="text-xs font-bold text-slate-705 truncate max-w-[120px]">{q.wrong_word || "未标注错点"}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {q.create_time ? new Date(q.create_time).toLocaleDateString() : "刚刚"}
                          </span>
                        </div>

                        {/* Image from Aliyun OSS */}
                        {q.raw_image_url && (
                          <div className="border border-slate-200 rounded-lg overflow-hidden h-24 bg-slate-50 relative group">
                            <img 
                              src={q.raw_image_url} 
                              alt="Raw Wrong Question preview" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            />
                            <div className="absolute top-1 left-1 bg-slate-905/70 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 rounded">
                              阿里云 HK-OSS 实机存储 URL
                            </div>
                          </div>
                        )}

                        {/* Expandable Markdown diagnostic summary */}
                        <div className="border border-slate-100 rounded-lg">
                          <button
                            onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                            className="w-full bg-slate-50 hover:bg-slate-150 px-2 py-1.5 text-[11px] font-black text-slate-700 flex items-center justify-between rounded-lg"
                          >
                            <span>🧑‍🏫 AI 老师思维偏差多模态诊断</span>
                            <span>{expandedQuestionId === q.id ? "收起 🔼" : "展开详情 🔽"}</span>
                          </button>
                          
                          {expandedQuestionId === q.id && (
                            <div className="p-2.5 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-600 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap font-sans">
                              {q.ai_analysis || "暂无学情诊断分析。"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Part B: Specialized PDF reports */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center bg-amber-50/80 px-3 py-1.5 rounded-xl border-2 border-slate-800">
                  <span className="text-xs font-cartoon font-black text-slate-850">📂 2/3 学情提分卷 (Alibaba OSS 镜像下载)</span>
                  <span className="text-[10px] bg-white border border-slate-800 rounded px-1.5 py-0.5 text-slate-705 font-mono font-bold">
                    共 {historyReports.length} 份
                  </span>
                </div>

                <div className="space-y-2">
                  {historyReports.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                      <span className="text-2xl block mb-1">📄</span>
                      <p className="text-[11px] text-slate-400 font-extrabold font-cartoon">当前手机暂无导出的提分 PDF</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">请先拍照识别错题，并在结算页点击“生成提分PDF试卷”</p>
                    </div>
                  ) : (
                    historyReports.map((report, idx) => (
                      <div key={report.id || idx} className="bg-amber-50/30 border-2 border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-xs animate-fade-in">
                        <div className="flex items-start justify-between">
                          <div className="text-left">
                            <span className="block text-xs font-extrabold text-slate-800">{report.report_name}</span>
                            <span className="block text-[9px] text-amber-900/60 mt-0.5 font-mono">创建时间: {report.create_time ? new Date(report.create_time).toLocaleString() : "刚刚"}</span>
                          </div>
                          <span className="bg-emerald-100 border border-emerald-700 text-emerald-950 font-black text-[9px] px-1.5 py-0.5 rounded">
                            云就绪 ✅
                          </span>
                        </div>

                        {/* Direct click OSS link with target blank */}
                        <a 
                          href={report.oss_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full text-center bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-800 rounded-xl py-2 text-xs font-black shadow-[0_2.5px_0_#1e293b] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform block"
                        >
                          📥 打印 A4 提分试卷 (下载 PDF)
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Action buttons container */
        <div className="space-y-4 flex-1 flex flex-col justify-center animate-fade-in">
          {/* Cartoon Graphic / Banner */}
          <div className="bg-green-50/90 rounded-2xl border-4 border-emerald-800/80 p-4 relative overflow-hidden">
            <div className="absolute right-2 top-2 bg-emerald-400 p-1.5 rounded-xl border-2 border-slate-800 animate-spin" style={{ animationDuration: "6s" }}>
              <Sparkles className="w-5 h-5 text-emerald-950" />
            </div>
            <p className="font-extrabold text-emerald-950 text-base leading-tight">
              💡 错题打地鼠，学习更高效！
            </p>
            <p className="text-xs text-emerald-800 mt-1.5 font-medium leading-relaxed">
              家长拍下孩子日常试卷、作业中的英/数/语错题，AI 精准诊断弱点后直接转换为互动玩乐包。让温故知新绝不枯燥！
            </p>
            
            {/* Photo Tips with microscopic guidance */}
            <div className="mt-3 bg-white/70 border-2 border-emerald-800/20 p-2.5 rounded-xl space-y-1 text-[11px] text-emerald-900 font-medium">
              <p className="font-extrabold text-xs text-emerald-950 flex items-center gap-1">🔬 家长拍照高精度识别宝典：</p>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                <li><strong>裁剪拍摄：</strong> 尽量不要拍一整纸大考卷。先用手机自带相册裁剪出该错题的小区域，再上传！</li>
                <li><strong>保留批改符号：</strong> 老师打的红笔 ❌、圈出的红线和拼读声调是 AI 识别的超级金钥匙，绝对不能遮挡哦！</li>
              </ul>
            </div>

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

          {/* Game Switch Selector */}
          <div className="bg-amber-50/95 rounded-2xl border-4 border-slate-800 p-3 flex items-center justify-between shadow-sm transition-all hover:bg-amber-100/50">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl select-none animate-bounce" style={{ animationDuration: "2.5s" }}>🐹</span>
              <div className="text-left">
                <span className="block font-black text-sm text-slate-850 font-cartoon">
                  趣味打地鼠游戏特训
                </span>
                <span className="text-[10px] text-amber-900 font-bold block leading-tight mt-0.5 max-w-[210px] sm:max-w-xs font-sans">
                  {enableGame 
                    ? "✨ 已开启：自主辨析弱点词并进行打地鼠闯关特训！" 
                    : "🌱 已关闭：静心精读，直接看举一反三A4提分卷与描红"}
                </span>
              </div>
            </div>
            
            <button
              id="toggle-game-mode-button"
              type="button"
              onClick={() => {
                const newVal = !enableGame;
                setEnableGame(newVal);
                localStorage.setItem("math_enable_game", String(newVal));
              }}
              className={`w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 border-2 border-slate-800 flex-shrink-0 ${
                enableGame ? "bg-amber-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full border border-slate-800 shadow transition-transform duration-200 ease-in-out ${
                  enableGame ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

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
              style={{ boxShadow: "0 6px 0 #064e3b" }}
              className="w-full flex flex-col items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:translate-y-1 active:shadow-[0_4px_0_#064e3b] border-4 border-slate-800 rounded-2xl py-4 px-4 transition-all text-white group cursor-pointer"
            >
              <div className="bg-white p-2 rounded-full border-4 border-slate-800 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-emerald-800" />
              </div>
              <div className="text-center">
                <span className="block font-black text-lg tracking-wide font-cartoon">📸 选图 / 拍照上传今日错题</span>
                <span className="text-[10px] text-emerald-100 mt-0.5 block">支持从手机相册选图或使用相机拍照</span>
              </div>
            </button>
            
            {selectedFileName && (
              <p className="text-xs text-center text-slate-500 font-mono">
                已选中: <span className="font-bold text-slate-700">{selectedFileName}</span>
              </p>
            )}

            {/* Special Oral Interactive card */}
            <button
              id="english-oral-trigger-button"
              onClick={() => {
                const randomOral = ENGLISH_ORAL_POOL[Math.floor(Math.random() * ENGLISH_ORAL_POOL.length)];
                onSelectOral(randomOral);
              }}
              style={{ boxShadow: "0 5px 0 #6d28d9" }}
              className="w-full flex items-center justify-between gap-3 bg-violet-600 hover:bg-violet-500 active:translate-y-0.5 active:shadow-[0_3px_0_#6d28d9] border-4 border-slate-800 rounded-2xl py-2.5 px-4 transition-all text-white group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl border-2 border-slate-800 group-hover:scale-110 transition-transform flex-shrink-0">
                  <span className="text-lg">🎙️</span>
                </div>
                <div className="text-left w-full">
                  <span className="block font-black text-sm tracking-wide font-cartoon text-yellow-350">🎙️ 趣味英语口语磨耳朵特训</span>
                  <span className="text-[9px] text-violet-100 block">零拍照 · 随机绘景互动跟读</span>
                </div>
              </div>
              <span className="bg-yellow-300 text-slate-900 border-2 border-slate-900 rounded-lg px-2 py-0.5 text-[8px] font-black shadow-sm flex-shrink-0 animate-bounce">
                免拍照 ⚡
              </span>
            </button>
          </div>

          {/* Quick Demo Segment */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-600">没有错题？用护眼示例图一秒测试效果👇</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_MATH_PICS.map((pic, idx) => (
                <button
                  id={`sample-trigger-button-${idx}`}
                  key={idx}
                  onClick={() => executeSample(pic.data)}
                  className="flex items-center justify-between text-left p-3 bg-white hover:bg-emerald-50 active:scale-[0.98] border-2 border-slate-800 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <div>
                    <span className="block font-black text-xs text-slate-800">{pic.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-sans leading-none">{pic.desc}</span>
                  </div>
                  <span className="bg-emerald-100 group-hover:bg-emerald-200 border border-slate-800 rounded-lg text-[9px] font-black px-2 py-1 text-emerald-800 font-mono">
                    测试 ⚡
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trust Seal */}
      <div className="pt-2 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
        🔒 守护数据安全 · 腾讯云/阿里云香港地域银行级加密存储
      </div>

      {/* Promoter statistics modal */}
      {showPromoterAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="promoter-admin-modal">
          <div className="bg-slate-50 border-4 border-slate-800 rounded-3xl shadow-[0_12px_0_#1e293b] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b-4 border-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div className="text-left">
                  <h2 className="font-extrabold text-base tracking-tight">
                    {isPromoterLoggedIn 
                      ? `${loggedInRole === "admin" ? "【督导总管理员后台】" : "【专属自营合伙人后台】"}` 
                      : "校外合伙人分销与业绩佣金结算后台"}
                  </h2>
                  <p className="text-[10px] text-slate-300 font-bold">
                    {isPromoterLoggedIn
                      ? `当前合伙人：${loggedInPromoterName} | 专属渠道码：${promoterLoginCode.toUpperCase()}`
                      : "分配分销激活码、追本溯源归属客户、安全拆提分销佣金"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPromoterAdmin(false);
                }}
                className="bg-rose-500 hover:bg-rose-400 text-white border-2 border-slate-900 px-3 py-1 rounded-xl text-xs font-black shadow-sm cursor-pointer"
              >
                关闭后台 ❌
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {!isPromoterLoggedIn ? (
                /* Login Gate Screen */
                <div className="max-w-md mx-auto my-4 bg-white border-4 border-slate-800 rounded-2xl p-6 shadow-md text-left">
                  <div className="text-center mb-6">
                    <span className="text-4xl text-center block">🔑</span>
                    <h3 className="font-black text-lg text-slate-850 mt-2">推广主管与顾问登录安全验证</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      本节为销售代理、渠道合伙人查收业绩报表专属通道。若您是家长，请输入激活码在主控面板进行兑换。
                    </p>
                  </div>

                  <form onSubmit={handlePromoterLogin} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-650 mb-1">📢 推广账号 (您的专属推广码)</label>
                      <input
                        type="text"
                        placeholder="例如: VIP666"
                        value={promoterLoginCode}
                        onChange={(e) => setPromoterLoginCode(e.target.value.toUpperCase())}
                        className="w-full text-xs border-2 border-slate-800 rounded-xl px-3 py-2 font-bold uppercase font-mono focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-650 mb-1">🔐 登录密匙 (安全验证密码)</label>
                      <input
                        type="password"
                        placeholder="请输入对应的登录密匙/密码"
                        value={promoterLoginPasscode}
                        onChange={(e) => setPromoterLoginPasscode(e.target.value)}
                        className="w-full text-xs border-2 border-slate-800 rounded-xl px-3 py-2 font-bold focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    {promoterLoginError && (
                      <div className="bg-rose-50 border border-rose-300 text-rose-600 rounded-xl px-3 py-2 text-[11px] font-bold">
                        ⚠️ Error: {promoterLoginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isFetchingStats}
                      className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold border-2 border-slate-800 py-2.5 rounded-xl text-xs active:translate-y-0.5 shadow-sm transition-all cursor-pointer"
                    >
                      {isFetchingStats ? "正在核实密匙..." : "验证密匙并登录合伙后台 🚀"}
                    </button>
                  </form>

                  <div className="mt-6 border-t border-dashed border-slate-200 pt-4 text-[10px] text-slate-400">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 font-bold text-slate-700 leading-relaxed space-y-1">
                      <p className="text-emerald-800 font-black">💡 演示说明与体验内建密匙:</p>
                      <ul className="list-decimal pl-4 space-y-1 text-[9.5px]">
                        <li>
                          林老师体验卡：账号 <code className="bg-white px-1 border">VIP666</code> / 密码 <code className="bg-white px-1 border font-sans text-rose-500">666666</code>
                        </li>
                        <li>
                          陈老板季度卡：账号 <code className="bg-white px-1 border">VIP888</code> / 密码 <code className="bg-white px-1 border font-sans text-rose-500">888888</code>
                        </li>
                        <li>
                          超级主督导：账号 <code className="bg-white px-1 border">ADMIN</code> / 密码 <code className="bg-white px-1 border font-sans text-rose-500">admin888</code>
                          <br />
                          <span className="text-slate-400 font-bold">(超级管理员可以分配发放全新的激活码，并定制个体的登录锁)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authenticated Dashboard Panel */
                <div className="space-y-6">
                  {/* Greeting Bar with Actions */}
                  <div className="bg-white border-2 border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                       <span className="text-2xl">🏆</span>
                       <p className="text-xs text-slate-700 text-left">
                         <strong>{loggedInPromoterName}</strong>，您好！
                         当前作为 <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{loggedInRole === "admin" ? "超级大区总代理" : "校外合伙人"}</span> 登录。
                         <span className="block text-[10px] text-slate-405 mt-0.5 font-bold">拥有独立的归宿关系机制，保护各个渠道的客户不冲突，保障资金公平结算。</span>
                       </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={refreshPromoData}
                        disabled={isFetchingStats}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer"
                      >
                        {isFetchingStats ? "同步中..." : "🔄 实时对账同步"}
                      </button>
                      <button
                        onClick={() => {
                          setIsPromoterLoggedIn(false);
                          setLoggedInRole("");
                          setLoggedInPromoterName("");
                          setPromoterCodes([]);
                          setPromoterLogs([]);
                          setPromoterLoginCode("");
                          setPromoterLoginPasscode("");
                        }}
                        className="bg-slate-200 hover:bg-slate-350 text-slate-900 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer"
                      >
                        🚪 安全退出系统
                      </button>
                    </div>
                  </div>

                  {/* High Contrast Bento Grid statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border-2 border-slate-850 rounded-2xl p-4 flex items-center gap-4">
                      <div className="bg-emerald-100 border-2 border-slate-800 rounded-xl p-2.5">
                        <span className="text-xl">🏷️</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold leading-none">
                          {loggedInRole === "admin" ? "累计分账激活码账户" : "我的专属特权兑换码"}
                        </span>
                        <span className="text-2xl font-black text-slate-800 mt-1 block">
                          {loggedInRole === "admin" ? `${promoterCodes.length} 个` : `${promoterCodes[0]?.code || "N/A"}`}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-slate-850 rounded-2xl p-4 flex items-center gap-4">
                      <div className="bg-blue-100 border-2 border-slate-800 rounded-xl p-2.5">
                        <span className="text-xl">👥</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold leading-none">名下绑定激活家长数</span>
                        <span className="text-2xl font-black text-slate-850 mt-1 block">{promoterLogs.length} 人</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border-2 border-slate-850 rounded-2xl p-4 flex items-center gap-4">
                      <div className="bg-amber-100 border-2 border-slate-800 rounded-xl p-2.5">
                        <span className="text-xl">💰</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold leading-none">
                          {loggedInRole === "admin" ? "全平台分红累计金额" : "我的推广专属分账分红"}
                        </span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block font-mono">
                          ￥{promoterLogs.length * 45} 元 
                          <span className="text-[10px] text-slate-400 font-bold font-sans ml-1">(按 ￥45/家长 自动抽提)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form to Register Promoter Code (ADMIN ONLY) */}
                  {loggedInRole === "admin" && (
                    <div className="bg-white border-2 border-slate-850 rounded-2xl p-4 shadow-sm">
                      <h3 className="font-extrabold text-sm text-slate-800 mb-3 flex items-center gap-1">
                        <span>➕ 分配注册新激活码 & 专属登录锁密码</span>
                        <span className="text-[10px] font-normal text-slate-400">(用于新增销售员、辅导中心合作商户)</span>
                      </h3>
                      <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">自定义激活码 (大写拼音)</label>
                          <input
                            type="text"
                            placeholder="如: LINLAOSHI"
                            value={newCodeStr}
                            onChange={(e) => setNewCodeStr(e.target.value.toUpperCase())}
                            className="w-full text-xs border-2 border-slate-800 rounded-xl px-2.5 py-1.5 font-bold uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">推广员姓名 (分红人)</label>
                          <input
                            type="text"
                            placeholder="如: 林老师"
                            value={newPromoterName}
                            onChange={(e) => setNewPromoterName(e.target.value)}
                            className="w-full text-xs border-2 border-slate-800 rounded-xl px-2.5 py-1.5 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">登录密匙/密码 (6位)</label>
                          <input
                            type="text"
                            placeholder="如: 666666"
                            value={newPasscode}
                            onChange={(e) => setNewPasscode(e.target.value)}
                            className="w-full text-xs border-2 border-slate-800 rounded-xl px-2.5 py-1.5 font-bold font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1">赠送VIP版本天数</label>
                          <select
                            value={newVipDays}
                            onChange={(e) => setNewVipDays(parseInt(e.target.value))}
                            className="w-full text-xs border-2 border-slate-800 rounded-xl px-2 py-1.5 font-bold bg-white"
                          >
                            <option value={30}>30 天体验卡</option>
                            <option value={60}>60 天双月卡</option>
                            <option value={90}>90 天季度特权</option>
                            <option value={180}>180 天半年卡</option>
                            <option value={365}>365 天整年尊享</option>
                            <option value={9999}>9999 天终身卡</option>
                          </select>
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold border-2 border-slate-800 px-4 py-2 rounded-xl text-xs active:translate-y-0.5 shadow-sm cursor-pointer"
                          >
                            注册并建立 🚀
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Dynamic split layouts with tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Exclusions of Admin Lists or own details */}
                    <div className="lg:col-span-12 xl:col-span-5 bg-white border-2 border-slate-850 rounded-2xl p-4">
                      <h4 className="font-extrabold text-xs text-slate-800 mb-2 flex items-center justify-between">
                        <span>🏷️ 现存专属激活码与登录锁一览</span>
                        <span className="text-[9px] text-slate-400">核对销售及商户安全</span>
                      </h4>
                      <div className="divide-y divide-slate-100 overflow-y-auto max-h-60 pr-1 space-y-1">
                        {promoterCodes.map((codeItem) => (
                          <div key={codeItem.id} className="py-2.5 flex items-center justify-between text-xs border-b border-dashed border-slate-100 last:border-0">
                            <div className="text-left">
                              <span className="font-mono font-black text-slate-850 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                {codeItem.code}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold ml-1">({codeItem.promoter_name})</span>
                              <p className="text-[9px] text-slate-400 mt-1 font-bold">
                                🔐 独立登录密匙 / 密码: <span className="font-mono text-rose-600">{codeItem.passcode || "123456"}</span>
                              </p>
                            </div>
                            <div className="text-right text-[10px] text-slate-500">
                              <span className="text-emerald-600 font-extrabold block">{codeItem.vip_days}天版本</span>
                              <span className="block mt-0.5">已用: <strong>{codeItem.current_uses}</strong>/{codeItem.max_uses}次</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer activation listing logs */}
                    <div className="lg:col-span-12 xl:col-span-7 bg-white border-2 border-slate-850 rounded-2xl p-4">
                      <h4 className="font-extrabold text-xs text-slate-800 mb-2 flex items-center justify-between">
                        <span>👥 {loggedInRole === "admin" ? "全部名下绑定客户归宿明细" : "由我激活的绑定客户名单"}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 rounded-full font-bold">
                          佣金核账依据
                        </span>
                      </h4>
                      
                      {promoterLogs.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          <span className="text-xl">📭</span>
                          <p className="text-[10px] mt-1">目前暂无名下绑定客户激活，请积极推广给家长用户！</p>
                        </div>
                      ) : (
                        <div className="overflow-y-auto max-h-60 pr-1 space-y-2 text-left">
                          {promoterLogs.map((log) => (
                            <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                              <div className="text-left space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-black font-mono">
                                    {log.user_phone}
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-400">
                                    {new Date(log.use_time).toLocaleString("zh-CN", { hour12: false })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-bold text-left">
                                  企微称呼: <span className="text-slate-800 font-black">{log.user_nickname || `企微家长_${log.user_phone.slice(-4)}`}</span>
                                </p>
                              </div>
                              
                              <div className="text-right flex flex-col items-end">
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9.5px] font-black px-1.5 py-0.5 leading-none shadow-sm">
                                  实时分红 (结算中)
                                </span>
                                <span className="text-[9px] text-slate-400 mt-1 font-bold">
                                  推广经理: <strong className="text-slate-700">{log.promoter_name}</strong> ({log.code})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-100 p-3 text-center text-[10px] text-slate-500 border-t border-slate-200 flex items-center justify-between px-6">
              <span>💡 分佣结算声明：本平台内独立激活码为唯一追踪标识，家长输入即视为自动绑定终身客户，请核对明细准确核发收益。</span>
              <span className="font-extrabold text-emerald-600">云分布式分红后台</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
