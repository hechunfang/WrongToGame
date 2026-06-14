import React, { useRef } from "react";
import { X, Printer, Download, Scissors, Sparkles, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { DiagnosticResult } from "../types";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedExam: {
    schoolHeader: string;
    examTitle: string;
    studentGreeting: string;
    misconceptionAnalysis: string;
    questions?: {
      id: string;
      title: string;
      choices?: string[];
      hint: string;
      parentCheckKey: string;
    }[];
    parentPrepingGuide: string;
    motivationalQuote: string;
  } | null;
  diagnostic: DiagnosticResult;
  schoolName: string;
  studentName: string;
  downloadOssUrl?: string;
  isCompilingPDF?: boolean;
  onDownloadHtml: () => void;
}

export default function PrintPreviewModal({
  isOpen,
  onClose,
  generatedExam,
  diagnostic,
  schoolName,
  studentName,
  downloadOssUrl,
  isCompilingPDF,
  onDownloadHtml,
}: PrintPreviewModalProps) {
  if (!isOpen || !generatedExam) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex flex-col justify-start p-0 overflow-y-auto animate-fade-in print:bg-white print:absolute print:inset-0 print:overflow-visible print:p-0">
      {/* 
        This style block forces proper page-breaks and cleans up standard headers/footers
        when the browser triggers print media.
      */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          /* Hide everything except our print content container */
          #preview-modal-action-bar,
          #preview-modal-tips-bar,
          .print\\:hidden {
            display: none !important;
          }
          .print-paper-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            border-radius: 0 !important;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* Parental Top Actions Control Bar (hidden in printing) */}
      <div 
        id="preview-modal-action-bar"
        className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 shrink-0 shadow-lg z-20 print:hidden"
      >
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-0.5 text-left">
              <h2 className="text-sm font-black text-white flex items-center gap-1.5 leading-snug">
                <span>✨ 专属 A4 纸质提分测试卷已就绪</span>
                <span className="bg-emerald-600/30 text-emerald-300 font-bold px-1.5 py-0.5 rounded text-[9px] hover:scale-105 transition-transform">
                  带校名定制 👑
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                专为孩子自适应设计：温故知新一关、错题原理解析、类题三阶演练、家长批改密钥。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Standard Native Browser Print Mechanism */}
            <button
              onClick={handlePrint}
              style={{ boxShadow: "0 3px 0 #065f46" }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 border-2 border-slate-950 transition-all hover:scale-105 active:translate-y-0.5 active:shadow-none shrink-0"
              id="print-preview-trigger-btn"
            >
              <Printer className="w-4 h-4" /> 网页直接打印 / 保存PDF
            </button>

            {downloadOssUrl ? (
              <a
                href={downloadOssUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ boxShadow: "0 3px 0 #92400e" }}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 border-2 border-slate-950 transition-all hover:scale-105 active:translate-y-0.5 active:shadow-none shrink-0"
                id="print-preview-download-oss-btn"
              >
                <Download className="w-4 h-4 animate-pulse" /> 保存 A4 纸质 PDF
              </a>
            ) : isCompilingPDF ? (
              <span className="bg-slate-800 text-slate-400 border border-slate-700 font-extrabold text-[11px] px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                <span className="w-3 h-3 border-2 border-dashed border-emerald-400 rounded-full animate-spin shrink-0"></span>
                A4 PDF 极速生成中...
              </span>
            ) : null}

            <button
              onClick={onDownloadHtml}
              style={{ boxShadow: "0 3px 0 #1e293b" }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-extrabold px-3 py-2.5 rounded-xl hover:scale-105 transition-all shrink-0 active:translate-y-0.5"
              id="print-preview-download-html-btn"
            >
              下载 HTML 原档
            </button>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 py-2.5 rounded-xl border border-slate-700 transition"
              aria-label="关闭预览"
              id="print-preview-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Hinting Banner (hidden in printing) */}
      <div 
        id="preview-modal-tips-bar"
        className="bg-amber-500/10 border-b border-amber-500/25 p-2.5 text-center px-4 print:hidden"
      >
        <p className="text-xs text-amber-200 font-bold flex items-center justify-center gap-1.5 leading-normal">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>温馨提示：点击<strong>「网页直接打印」</strong>可以唤起系统打印机。在打印目的地中选择<strong>【另存为 PDF】</strong>或连接物理打印机均可！试卷排版已完美适配 A4 比例。</span>
        </p>
      </div>

      {/* Scrollable container of paper mockups */}
      <div className="flex-1 w-full bg-slate-900 overflow-y-auto p-4 md:p-12 print:bg-white print:p-0 print:overflow-visible">
        {/* Paper Container Mockups */}
        <div className="print-paper-card max-w-4xl mx-auto bg-white text-slate-900 border-2 border-slate-400 rounded-2xl shadow-2xl p-8 md:p-14 mb-16 relative overflow-hidden select-text text-left print:mb-0 print:rounded-none">
          
          {/* Diagnostic Seal / Badge */}
          <div className="absolute top-4 right-4 md:top-10 md:right-10 w-20 h-20 border-4 border-dashed border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 text-[10px] font-black uppercase tracking-wider select-none rotate-12 bg-white/80 opacity-90 z-10">
            <span className="scale-90 font-black">★ AI 提分 ★</span>
            <span className="w-14 truncate text-center scale-95 font-extrabold">{schoolName.substring(0, 7)}</span>
            <span className="scale-[0.8]">{new Date().getMonth() + 1}/{new Date().getDate()} 已测</span>
          </div>

          <div className="space-y-8 font-sans antialiased text-slate-900">
            {/* Paper custom elegant title banner */}
            <div className="text-center border-b-2 border-slate-900 pb-5 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono tracking-wider">
                <span>考卷编码：AI-MEM-{new Date().getFullYear()}</span>
                <span>学校主脑评估：{generatedExam.schoolHeader}</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight tracking-wide text-center pt-1 px-4">
                {generatedExam.examTitle}
              </h1>

              <div className="grid grid-cols-3 gap-4 text-[11px] font-bold font-mono pt-2 text-slate-700 max-w-xl mx-auto border-t border-slate-100 mt-2">
                <div className="text-left font-sans flex items-center gap-1">
                  <span>考点：</span>
                  <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                    {diagnostic.target_topic}
                  </span>
                </div>
                <div className="text-center font-sans">
                  学生姓名：<span className="underline decoration-slate-300 text-slate-950 font-black px-1">{studentName}</span>
                </div>
                <div className="text-right font-mono text-rose-600">拼搏满分：100 分</div>
              </div>
            </div>

            {/* Letter from AI assistant */}
            <div className="bg-amber-500/[0.04] p-4 rounded-xl border border-amber-500/15 text-xs text-slate-800 leading-relaxed space-y-1 mt-4">
              <p className="font-extrabold text-amber-900 flex items-center gap-1">
                <span>💌 提分密信小贴士 (给亲爱的小伙伴)：</span>
              </p>
              <p className="whitespace-pre-line leading-relaxed text-amber-950 font-medium pl-1 text-[11px]">
                {generatedExam.studentGreeting}
              </p>
            </div>

            {/* Section 1: Analysis */}
            <div className="p-3 border-l-4 border-slate-950 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-950 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                  第一部分
                </span>
                <h4 className="text-sm font-black text-slate-950">错因短板剖析 (知彼知己)</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium pl-1 text-justify pr-2">
                {generatedExam.misconceptionAnalysis}
              </p>
            </div>

            {/* Section 2: Core practice list */}
            <div className="space-y-5">
              <div className="p-3 border-l-4 border-slate-950 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-950 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                    第二部分
                  </span>
                  <h4 className="text-sm font-black text-slate-950">
                    “举一反三”提分测试题组 (自适应三阶演变)
                  </h4>
                </div>
              </div>

              <div className="space-y-6 pl-4">
                {generatedExam.questions && generatedExam.questions.length > 0 ? (
                  generatedExam.questions.map((q, qIndex) => (
                    <div key={q.id} className="space-y-3">
                      <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed flex items-start gap-2 text-justify">
                        <span className="text-slate-400 font-mono text-xs mt-0.5">{qIndex + 1}.</span>
                        <span className="whitespace-pre-line font-extrabold text-slate-950 flex-1">{q.title}</span>
                      </p>

                      {/* Displaying Choices if available */}
                      {q.choices && q.choices.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-5 py-1">
                          {q.choices.map((choice, cIndex) => (
                            <div key={cIndex} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                              <span className="w-4 h-4 border border-slate-400 rounded-sm flex items-center justify-center text-[10px] font-bold select-none text-slate-300 shrink-0">
                                {String.fromCharCode(65 + cIndex)}
                              </span>
                              <span>{choice}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 italic pl-5">
                        提示引导：{q.hint}
                      </div>

                      {/* Handwriting blank slots */}
                      <div className="pt-2 pl-5 space-y-2">
                        <div className="h-6 border-b border-dashed border-slate-300 w-11/12"></div>
                        <div className="h-6 border-b border-dashed border-slate-300 w-11/12"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 pl-4 py-2">暂无类题内容，请核实识别考点是否支持。</p>
                )}
              </div>
            </div>

            {/* Optional Tracing/Drawing/Practice Blank Grid Section for children customized to error */}
            {getTargetCharacters(diagnostic).length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-black text-slate-900 flex items-center gap-1.5 pl-4">
                  <span>✍️ 【字词大复原 · 神经记忆格描红】请在下方进行专项练习临摹，加深大脑突触的正确记忆：</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                  {getTargetCharacters(diagnostic).map((char, index) => (
                    <div key={index} className="border border-slate-300 p-3 rounded-xl space-y-3 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        关于错点生字：<span className="text-red-600 bg-white border border-slate-200 px-1 rounded font-black text-sm">“{char}”</span>
                      </p>
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="text-[10px] text-slate-500">经典描红:</span>
                        <div className="w-10 h-10 border-2 border-red-500/30 relative bg-white flex items-center justify-center shrink-0">
                          <div className="absolute inset-y-0 left-1/2 border-l border-dotted border-red-500/25"></div>
                          <div className="absolute inset-x-0 top-1/2 border-t border-dotted border-red-500/25"></div>
                          <span className="text-lg font-black text-slate-300 select-none">
                            {char}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">➡临摹：</span>
                        <div className="w-10 h-10 border-2 border-red-500/50 relative bg-white shrink-0">
                          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                        </div>
                        <div className="w-10 h-10 border-2 border-red-500/50 relative bg-white shrink-0">
                          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                        </div>
                        <div className="w-10 h-10 border-2 border-red-500/50 relative bg-white shrink-0">
                          <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-red-500/35"></div>
                          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-red-500/35"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parent Guide Segment (Page break on printing avoids cutting guide card in half!) */}
            <div className="page-break pt-8 border-t-2 border-dashed border-slate-400 space-y-4 text-left mt-10">
              <div className="text-center pb-2">
                <p className="text-xs font-black tracking-widest text-slate-800 flex items-center justify-center gap-1.5">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <span>家长专属批改剪纸卡与伴读方案（请沿着虚线剪下）</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  （本部分在正式打印后，可以用剪刀剪下作为您的参考指南，避免孩子产生答案依赖）
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-300 space-y-4">
                <div className="text-xs leading-relaxed text-slate-700">
                  <strong className="text-amber-950 block text-xs font-black mb-1.5">👩‍🏫 伴读心理辅导精要：</strong>
                  <p className="pl-1 italic text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg leading-relaxed">{generatedExam.parentPrepingGuide}</p>
                </div>
                
                <div className="border-t border-slate-200 pt-3">
                  <strong className="text-slate-800 text-xs font-black block mb-2">🔑 错题专属试卷答案及阅卷要点：</strong>
                  <div className="space-y-2.5 pl-1.5 text-xs text-slate-600 leading-relaxed font-medium">
                    {generatedExam.questions?.map((q, index) => (
                      <div key={q.id} className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <strong className="text-slate-900 font-bold block text-xs">第 {index + 1} 题密钥解析：</strong>
                        <span className="text-emerald-700 font-extrabold pr-2 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] select-all">
                          参考：{q.parentCheckKey}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center py-3 italic font-black text-xs text-slate-500 bg-slate-100 rounded-xl">
                🌟 {generatedExam.motivationalQuote}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers inside the component context
function getTargetCharacters(diagnostic: DiagnosticResult): string[] {
  const charsSet = new Set<string>();
  
  if (diagnostic.correct_answer) {
    for (const char of diagnostic.correct_answer) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        charsSet.add(char);
      }
    }
  }
  
  if (charsSet.size === 0 && (diagnostic.correct_answer === "chéng" || (diagnostic.target_topic && diagnostic.target_topic.includes("橙")))) {
    charsSet.add("橙");
  }

  if (charsSet.size === 0 && Array.isArray(diagnostic.correct_sequence)) {
    diagnostic.correct_sequence.forEach((item) => {
      if (Array.isArray(item)) {
        item.forEach((subItem) => {
          for (const char of String(subItem)) {
            if (/[\u4e00-\u9fa5]/.test(char)) {
              charsSet.add(char);
            }
          }
        });
      } else {
        for (const char of String(item)) {
          if (/[\u4e00-\u9fa5]/.test(char)) {
            charsSet.add(char);
          }
        }
      }
    });
  }
  
  return Array.from(charsSet);
}
