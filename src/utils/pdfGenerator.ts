import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import https from "https";
import os from "os";

// Lazy-loaded and cached TrueType Chinese Font path
let cachedFontPath = "";

/**
 * Ensures a TrueType Chinese font is available for PDFKit.
 * Downloads Google's Noto Sans SC dynamically to assets/ if not locally present.
 */
export async function getChineseFontPath(): Promise<string> {
  if (cachedFontPath && fs.existsSync(cachedFontPath)) {
    return cachedFontPath;
  }

  const fontDir = path.join(process.cwd(), "assets");
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true });
  }

  const fontPath = path.join(fontDir, "NotoSansSC-Regular.ttf");
  if (fs.existsSync(fontPath)) {
    cachedFontPath = fontPath;
    return fontPath;
  }

  // A slim, reliable and fast-downloading Chinese font hosted on raw github fonts OFL repo
  const fontUrl = "https://github.com/google/fonts/blob/main/ofl/notosanssc/static/NotoSansSC-Regular.ttf?raw=true";
  
  console.log("📥 [Font Downloader] Fetching Chinese font (Noto Sans SC) for PDF generation...");
  
  try {
    await new Promise<void>((resolve, reject) => {
      const file = fs.createWriteStream(fontPath);
      https.get(fontUrl, (response) => {
        // Handle redirect if any
        if (response.statusCode === 302 || response.statusCode === 301) {
          https.get(response.headers.location!, (redirectResponse) => {
            redirectResponse.pipe(file);
          });
        } else {
          response.pipe(file);
        }

        file.on("finish", () => {
          file.close();
          console.log("✅ [Font Downloader] NotoSansSC-Regular.ttf downloaded and cached successfully.");
          resolve();
        });
      }).on("error", (err) => {
        fs.unlink(fontPath, () => {});
        reject(err);
      });
    });

    cachedFontPath = fontPath;
    return fontPath;
  } catch (err: any) {
    console.warn(`⚠️ [Font Downloader] Failed to fetch Chinese font: ${err.message}. PDF will use default Helvetica.`);
    return "";
  }
}

export interface PDFExamData {
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
  studentName: string;
  schoolName: string;
  topic: string;
}

/**
 * Renders a highly-professional A4 PDF using PDFKit and returns the local temporary file path.
 */
export async function buildExamPDF(exam: PDFExamData): Promise<string> {
  const fontPath = await getChineseFontPath();
  const hasChineseFont = fontPath !== "" && fs.existsSync(fontPath);

  // Set up standard A4 page layout
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
    info: {
      Title: exam.examTitle,
      Author: "AI智能教研组",
      Subject: exam.topic
    }
  });

  const tempFilePath = path.join(os.tmpdir(), `exam-${Date.now()}-${Math.floor(Math.random() * 1000)}.pdf`);
  const writeStream = fs.createWriteStream(tempFilePath);
  doc.pipe(writeStream);

  // Helper font registration
  const primaryFont = hasChineseFont ? fontPath : "Helvetica";
  const boldFont = hasChineseFont ? fontPath : "Helvetica-Bold";

  const d = new Date();
  const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // ==========================================
  // PAGE 1: STUDENT EXAMINATION PAPER
  // ==========================================
  
  // Custom metadata line
  doc.font(primaryFont).fontSize(8).fillColor("#718096");
  doc.text(`试卷定制批号：AI-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-A4`, { align: "left" });
  doc.moveUp();
  doc.text(exam.schoolHeader, { align: "right" });
  doc.moveDown(1.5);

  // Double border line (Header rule)
  doc.strokeColor("#1a202c").lineWidth(2).moveTo(50, 60).lineTo(545, 60).stroke();
  doc.strokeColor("#718096").lineWidth(0.5).moveTo(50, 64).lineTo(545, 64).stroke();
  doc.moveDown(2);

  // Title
  doc.font(boldFont).fontSize(18).fillColor("#1a202c").text(exam.examTitle, { align: "center" });
  doc.moveDown(1.5);

  // Student details table/row
  const tableTop = doc.y;
  doc.font(boldFont).fontSize(9).fillColor("#4a5568");
  doc.text(`考点类别：🎯 ${exam.topic}`, 60, tableTop, { width: 160 });
  doc.text(`学生姓名：${exam.studentName}同学`, 240, tableTop, { width: 160 });
  doc.text(`学情得分：_____________`, 420, tableTop, { width: 130 });
  
  doc.strokeColor("#cbd5e0").lineWidth(1).moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).stroke();
  doc.moveDown(2.5);

  // Greeting box (Fills like a kid welcoming message)
  const currentY = doc.y;
  doc.rect(50, currentY, 495, 80).fill("#f8fafc").strokeColor("#e2e8f0").lineWidth(1).stroke();
  doc.fillColor("#10b981").font(boldFont).fontSize(9).text("📋 专属考点致词：", 65, currentY + 12);
  doc.fillColor("#4a5568").font(primaryFont).fontSize(9.5).text(exam.studentGreeting, 65, currentY + 28, { width: 465, lineGap: 3 });
  
  doc.y = currentY + 95;

  // Section 1: Misconception Analysis
  doc.fillColor("#1a202c").font(boldFont).fontSize(11).text("第一板块：思维漏洞深度反思与字理剖析");
  doc.moveDown(0.5);
  doc.fillColor("#4a5568").font(primaryFont).fontSize(10).text(exam.misconceptionAnalysis, { align: "justify", lineGap: 3 });
  doc.moveDown(2);

  // Section 2: Questions
  doc.fillColor("#1a202c").font(boldFont).fontSize(11).text("第二板块：举一反三 · 变式特训强化卷");
  doc.font(primaryFont).fontSize(8).fillColor("#718096").text("( 名师提醒：请在横排空格内认真书写你的思索与最终解答。第错后48小时黄金期重创提分。 )");
  doc.moveDown(1.5);

  exam.questions.forEach((q, idx) => {
    // Question header and text
    doc.fillColor("#1a202c").font(boldFont).fontSize(10).text(`[第${idx + 1}题] ${q.title}`, { lineGap: 3 });
    doc.moveDown(0.4);

    // Choices if available
    if (q.choices && q.choices.length > 0) {
      doc.font(primaryFont).fontSize(9).fillColor("#4a5568");
      // Render checkbox grids
      let colX = 70;
      q.choices.forEach((choice, cIdx) => {
        doc.text(`[  ] ${choice}`, colX, doc.y, { width: 140 });
        if (cIdx % 2 === 1) {
          doc.moveDown(1.1);
          colX = 70;
        } else {
          colX = 260;
          doc.moveUp();
        }
      });
      doc.moveDown(1.5);
    }

    // Hint label
    doc.fillColor("#059669").font(boldFont).fontSize(8.5).text(`💡 避漏解析：${q.hint}`);
    doc.moveDown(0.5);

    // Handwriting support lines
    const lineY1 = doc.y + 10;
    const lineY2 = lineY1 + 15;
    doc.strokeColor("#e2e8f0").lineWidth(1).dash(5, { space: 3 })
       .moveTo(70, lineY1).lineTo(520, lineY1).stroke()
       .moveTo(70, lineY2).lineTo(480, lineY2).stroke()
       .undash();

    doc.moveDown(3);
  });

  // Stamp Seal Decoration (Simulated circle stamp)
  doc.save();
  doc.strokeColor("#ef4444").lineWidth(2.5).circle(500, 100, 36).stroke();
  doc.strokeColor("#ef4444").lineWidth(0.5).circle(500, 100, 31).stroke();
  doc.font(boldFont).fontSize(6).fillColor("#ef4444")
     .text("AI教研组", 475, 82, { width: 50, align: "center" })
     .text("★ 特训合格 ★", 475, 96, { width: 50, align: "center" })
     .text(formattedDate, 475, 110, { width: 50, align: "center" });
  doc.restore();

  // Seat motto at the very end of first page
  doc.y = 750;
  doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, 740).lineTo(545, 740).stroke();
  doc.fillColor("#718096").font(primaryFont).fontSize(8.5).text(exam.motivationalQuote, { align: "center" });

  // ==========================================
  // PAGE 2: PARENT ADVICE BOOKLET
  // ==========================================
  doc.addPage();

  doc.font(primaryFont).fontSize(8).fillColor("#718096");
  doc.text(`专属考点密钥：KEY-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-VER1`, { align: "left" });
  doc.moveUp();
  doc.text(`${exam.schoolName} · 亲子伴读双向回执记录卡`, { align: "right" });
  doc.moveDown(1.5);

  // Scissor divider line
  const cutY = doc.y;
  doc.strokeColor("#cbd5e0").lineWidth(1).dash(5, { space: 5 }).moveTo(50, cutY + 10).lineTo(545, cutY + 10).stroke().undash();
  doc.font(boldFont).fontSize(8).fillColor("#718096").text("✂️ 家长陪伴教育共同体 · 防错提分核密卡（请由家长剪切或沿虚线折角剪折，单独保管以备核对） ✂️", 50, cutY + 22, { align: "center" });
  doc.moveDown(3);

  // Guidance card block
  const blockY = doc.y;
  doc.rect(50, blockY, 495, 90).fill("#fffaf0").strokeColor("#fbd38d").lineWidth(1).stroke();
  doc.fillColor("#dd6b20").font(boldFont).fontSize(10).text("💡 陪伴是最好的辅导：家长陪读心理学指引攻略", 65, blockY + 12);
  doc.fillColor("#7b341e").font(primaryFont).fontSize(9).text(exam.parentPrepingGuide, 65, blockY + 28, { width: 465, lineGap: 3 });

  doc.y = blockY + 115;

  // Answers heading
  doc.fillColor("#2d3748").font(boldFont).fontSize(11).text("📖 提分专项测试卷标准参考答案精析");
  doc.moveDown(1);

  exam.questions.forEach((q, idx) => {
    doc.fillColor("#2d3748").font(boldFont).fontSize(9.5).text(`第 ${idx + 1} 题标准答案参考：`, { lineGap: 2 });
    doc.fillColor("#4a5568").font(primaryFont).fontSize(9).text(q.parentCheckKey, { lineGap: 3 });
    doc.moveDown(1.2);
  });

  // Diagnostic summary card (Parent Receipt / feedback)
  doc.y = 610;
  const cardY = doc.y;
  doc.rect(50, cardY, 495, 90).fill("#f7fafc").strokeColor("#cbd5e0").lineWidth(0.5).stroke();
  doc.fillColor("#718096").font(boldFont).fontSize(8).text("📊 家校学情跟踪归档存折：", 65, cardY + 12);
  doc.fillColor("#4a5568").font(primaryFont).fontSize(8.5).text(
    `辅导记录档案：孩子在 ${formattedDate} 的错题测试中，已完成针对薄弱考点【${exam.topic}】的手写冲关打地鼠游戏训练及配套变式练习。本提分试卷在48小时学情金期内完成复旦记忆消灭。欢迎家长记录并扫码打标，让我们用智能教育科技保障每一份孩子的细心和热爱，共同陪伴见证孩子的点滴成长！`,
    65, cardY + 26, { width: 465, lineGap: 3.2 }
  );

  doc.font(primaryFont).fontSize(8).fillColor("#a0aec0").text(`- 亿言软件 AI-Studio 智慧提分中心定制研发 · 亲子共享 -`, 50, 750, { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      resolve(tempFilePath);
    });
    writeStream.on("error", (err) => {
      reject(err);
    });
  });
}
