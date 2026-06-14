/**
 * High-fidelity HTML Exporter for Personalized Practice Sheets.
 * Generates an offline-interactive, perfectly proportioned A4 printable paper.
 * It contains school badges, double-grids for handwriting simulation, watermarks, 
 * and scissor cut lines for the parent Answer Key.
 */

export interface GeneratedExamData {
  examTitle: string;
  schoolHeader: string;
  studentGreeting: string;
  misconceptionAnalysis: string;
  questions: {
    id: number;
    title: string;
    choices?: string[];
    hint: string;
    parentCheckKey: string;
  }[];
  motivationalQuote: string;
  parentPrepingGuide: string;
}

export function generateExamHTML(exam: GeneratedExamData, studentName: string, schoolName: string, finalTopic: string): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const currentDate = String(new Date().getDate()).padStart(2, "0");

  const formattedQuestionsHTML = exam.questions.map((q, idx) => {
    const choicesListHTML = q.choices && q.choices.length > 0 
      ? `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 8px 0; padding-left: 20px;">
          ${q.choices.map(c => `<div style="font-size: 13px; color: #4a5568;"><input type="checkbox" style="margin-right: 6px;" /> ${c}</div>`).join("")}
         </div>`
      : "";

    return `
      <div style="margin-bottom: 24px; break-inside: avoid; border-left: 3px solid #cbd5e0; padding-left: 12px;">
        <p style="font-size: 14px; font-weight: bold; color: #2d3748; line-height: 1.6; margin: 0 0 6px 0;">
          <span style="color: #718096; font-family: monospace; font-size: 12px; margin-right: 4px;">[第${idx + 1}题]</span>
          ${q.title.replace(/\ng/g, "<br/>").replace(/\n/g, "<br/>")}
        </p>
        ${choicesListHTML}
        <p style="font-size: 11px; color: #059669; font-weight: 500; margin: 4px 0 10px 0; font-style: italic; background-color: #ecfdf5; padding: 4px 8px; border-radius: 4px; display: inline-block;">
          ${q.hint}
        </p>
        <!-- Dotted write lines for student response -->
        <div style="margin-top: 14px;">
          <div style="border-bottom: 1px dotted #a0aec0; width: 90%; height: 16px; margin-left: 14px;"></div>
          <div style="border-bottom: 1px dotted #a0aec0; width: 75%; height: 24px; margin-left: 14px; margin-bottom: 10px;"></div>
        </div>
      </div>
    `;
  }).join("");

  const formattedAnswersHTML = exam.questions.map((q, idx) => `
    <div style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">
      <p style="font-size: 12px; font-weight: bold; color: #2d3748; margin: 0 0 4px 0;">
        第 ${idx + 1} 题标准解答参考：
      </p>
      <p style="font-size: 11px; color: #4a5568; line-height: 1.5; margin: 0; background-color: #f7fafc; padding: 6px 10px; border-radius: 4px; border-left: 2px solid #ed8936;">
        ${q.parentCheckKey}
      </p>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${exam.examTitle}</title>
  <style>
    /* Premium A4 Worksheet Styling */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f7fafc;
      color: #2d3748;
      -webkit-font-smoothing: antialiased;
    }

    .printable-page {
      background: white;
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      padding: 24mm 18mm;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    /* Print watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 50px;
      color: rgba(16, 185, 129, 0.04);
      font-weight: 900;
      letter-spacing: 5px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      z-index: 1;
      text-transform: uppercase;
    }

    .header-rule {
      border: none;
      height: 3px;
      background-color: #1a202c;
      margin-top: 10px;
      margin-bottom: 20px;
    }

    .school-stamp {
      position: absolute;
      top: 60px;
      right: 60px;
      width: 85px;
      height: 85px;
      border: 3px double #ef4444;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      font-size: 9px;
      font-weight: bold;
      transform: rotate(-12deg);
      opacity: 0.85;
      background: rgba(255, 255, 255, 0.8);
      pointer-events: none;
      box-shadow: 0 0 1px rgba(239, 68, 68, 0.2);
    }
    
    .school-stamp-inner {
      border: 1px solid #ef4444;
      border-radius: 50%;
      width: 73px;
      height: 73px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .dashed-cutter {
      border-top: 2px dashed #a0aec0;
      position: relative;
      margin: 40px 0 25px 0;
      text-align: center;
      height: 1px;
    }

    .dashed-cutter-text {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      padding: 0 15px;
      font-size: 11px;
      color: #718096;
      font-weight: bold;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .action-bar {
      max-width: 210mm;
      margin: 20px auto 0 auto;
      background-color: #1a202c;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .btn-print {
      background-color: #10b981;
      color: #042f1a;
      border: none;
      font-weight: 900;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-print:hover {
      background-color: #34d399;
      transform: translateY(-1px);
    }

    @media print {
      body {
        background-color: white !important;
      }
      .action-bar {
        display: none !important;
      }
      .printable-page {
        box-shadow: none !important;
        margin: 0 !important;
        width: 100% !important;
        min-height: 100% !important;
        padding: 15mm 15mm !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Utility Bar in Browser -->
  <div class="action-bar">
    <div>
      <span style="font-weight: bold; font-size: 14px; color: #a7f3d0;">✨ A4 高清提分试卷已打包完毕</span>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">包含了 ${schoolName} 专属定制抬头及名家学情诊断说明。</p>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ 弹出打印机 (另存为 PDF)</button>
  </div>

  <!-- A4 Page Container -->
  <div class="printable-page">
    <div class="watermark">${schoolName} 专属定制</div>
    
    <!-- Red Seal Stamp -->
    <div class="school-stamp">
      <div class="school-stamp-inner">
        <span style="font-size: 7px; transform: scale(0.9); margin-bottom: 2px;">★ AI智能教研组 ★</span>
        <span style="letter-spacing: 0.5px; font-weight: 900; font-size: 8px; max-width: 60px; text-align: center; line-height: 1.1;">${schoolName.substring(0, 8)}</span>
        <span style="font-size: 6px; transform: scale(0.85); margin-top: 2px; color: #ef4444; line-height: 1;">${currentYear}-${currentMonth}-${currentDate}</span>
      </div>
    </div>

    <!-- Top Paper Header -->
    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #718096; font-family: monospace;">
      <span>试卷定制批号：AI-${currentYear}${currentMonth}${currentDate}-SVP</span>
      <span>${exam.schoolHeader}</span>
    </div>

    <h1 style="text-align: center; font-size: 20px; font-weight: 800; color: #1a202c; margin: 18px 0 10px 0; letter-spacing: 1px;">
      ${exam.examTitle}
    </h1>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); font-size: 12px; font-weight: bold; color: #4a5568; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
      <div style="text-align: left;">考点类别：<span style="color: #2d3748; background-color: #f7fafc; padding: 2px 6px; border-radius: 4px;">🎯 ${finalTopic}</span></div>
      <div style="text-align: center;">学生姓名：<span style="text-decoration: underline; color: #1a202c;">&nbsp;&nbsp;&nbsp;${studentName}&nbsp;&nbsp;&nbsp;</span></div>
      <div style="text-align: right;">起跑得分：<span style="text-decoration: underline; color: #1a202c;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
    </div>

    <!-- Student Greeting -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 25px;">
      <p style="font-size: 11px; font-weight: bold; color: #10b981; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.5px;">📋 专属考点致词：</p>
      <p style="font-size: 12px; color: #4a5568; line-height: 1.6; margin: 0; white-space: pre-line;">${exam.studentGreeting}</p>
    </div>

    <!-- Section 1 -->
    <div style="margin-bottom: 20px;">
      <div style="background-color: #1a202c; color: white; display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase;">第一板块</div>
      <span style="font-size: 13px; font-weight: bold; color: #1a202c; margin-left: 8px;">思维缺陷反向大剖析：我是怎么被“马虎小鬼”捉弄的？</span>
      <p style="font-size: 12px; color: #4a5568; line-height: 1.6; margin: 8px 0 0 0; text-align: justify;">
        ${exam.misconceptionAnalysis}
      </p>
    </div>

    <!-- Section 2 -->
    <div style="margin-top: 30px;">
      <div style="background-color: #1a202c; color: white; display: inline-block; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase;">第二板块</div>
      <span style="font-size: 13px; font-weight: bold; color: #1a202c; margin-left: 8px;">举一反三 · 变式思维特训阵地 (请在横排空格内认真书写解答)</span>
      <p style="font-size: 11px; color: #718096; margin: 6px 0 15px 0;">名师提醒：独立思考每一道题，不急不躁，用你刚才发现的“解毒秘匙”战胜失误！</p>
      
      <!-- Questions Container -->
      <div style="margin-top: 15px;">
        ${formattedQuestionsHTML}
      </div>
    </div>

    <!-- Seat Motto -->
    <div style="text-align: center; margin-top: 35px; padding-top: 15px; border-top: 1px solid #edf2f7;">
      <p style="font-size: 12px; font-style: italic; color: #4a5568; margin: 0; max-width: 80%; margin: 0 auto; line-height: 1.5;">
        ${exam.motivationalQuote}
      </p>
    </div>

  </div>

  <!-- A4 Page Container 2: Parent Answer Keys & Coaching Guidelines -->
  <div class="printable-page page-break">
    <div class="watermark">家长辅导指南</div>

    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #718096; font-family: monospace;">
      <span>参考密钥：KEY-${currentYear}${currentMonth}${currentDate}-VER1</span>
      <span>${schoolName} · 亲子陪读学情回执</span>
    </div>

    <div class="dashed-cutter">
      <span class="dashed-cutter-text">✂️ 亲子教育共同体 · 家长专属防错指南指南（请沿此虚线折剪） ✂️</span>
    </div>

    <div style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #dd6b20; margin: 0 0 10px 0; display: flex; align-items: center;">
        💡 陪伴是最好的提分药水：家长陪读心理学实操备忘录
      </h3>
      <p style="font-size: 12px; color: #7b341e; line-height: 1.6; margin: 0; text-align: justify;">
        ${exam.parentPrepingGuide}
      </p>
    </div>

    <h2 style="font-size: 15px; font-weight: 800; color: #2d3748; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #ed8936; padding-bottom: 6px;">
      📖 二板提分题标准参考密钥精析
    </h2>

    <div style="margin-bottom: 30px;">
      ${formattedAnswersHTML}
    </div>

    <!-- Diagnostic summary report -->
    <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 40px; position: relative;">
      <p style="font-size: 11px; font-weight: bold; color: #718096; text-transform: uppercase; margin: 0 0 4px 0;">📊 学情跟踪归档存折：</p>
      <p style="font-size: 11px; color: #4a5568; line-height: 1.6; margin: 0;">
        辅导记录回执表：小火伴孩子在时间为 ${currentYear}年${currentMonth}月${currentDate}日 的测验中，已成功完成了对 ${finalTopic} 的一键诊断。
        本份《提分卷》在错后48小时内重做效果达到黄金周期。欢迎您在今日陪读后，在公众号或微信交流群里留下您宝贵的家教经验反馈！让我们用AI科技赋能每一处亲子伴读，共同迎战学习痛点。
      </p>
    </div>

    <div style="text-align: center; margin-top: 50px; font-size: 10px; color: #a0aec0;">
      - 本测试卷由智能 AI 辅导系统专为 ${schoolName} 在读生定制研发。一站式解决小低段易错脑力盲点 -
    </div>

  </div>

</body>
</html>
`;
}
