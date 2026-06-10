/**
 * Converts standard mathematical questions into highly conceptual, animated and child-friendly formats.
 */
export interface ConceptualQuestion {
  originalQuestion: string;
  creativeQuestion: string;
}

export function decorateMathQuestion(topic: string, question: string, correct: string): ConceptualQuestion {
  let creative = question;

  // 1. Matches multiplication syntax such as "7 × 8" or "7*8" or "7x8"
  const multiRegex = /(\d+)\s*[×*xX]\s*(\d+)/;
  const matchMulti = question.match(multiRegex);
  if (matchMulti) {
    const num1 = matchMulti[1];
    const num2 = matchMulti[2];
    
    const creativeTemplates = [
      `🤔 ${num1} 个 ${num2} 相加是多少呀？`,
      `🍎 ${num1} 的 ${num2} 倍是多少呢？`,
      `🐰 操场上有 ${num1} 组小兔子，每组有 ${num2} 只，一共是多少只？`,
      `🎈 家长给宝宝买了 ${num1} 袋气球，每袋装 ${num2} 个，总数是多少？`
    ];
    // Consistently pick one or alternate based on topic length so it's stable per session
    const idx = (parseInt(num1) + parseInt(num2)) % creativeTemplates.length;
    creative = creativeTemplates[idx];
    return { originalQuestion: question, creativeQuestion: creative };
  }

  // 2. Matches addition syntax like "38 + 45"
  const addRegex = /(\d+)\s*\+\s*(\d+)/;
  const matchAdd = question.match(addRegex);
  if (matchAdd) {
    const num1 = matchAdd[1];
    const num2 = matchAdd[2];
    
    const creativeTemplates = [
      `🎒 哥哥有 ${num1} 张奥特曼卡片，妹妹又送来 ${num2} 张，一共有多少张？`,
      `📈 把 ${num1} 和 ${num2} 凑成一个大数字，是多少呢？`,
      `⭐ 已经攒了 ${num1} 颗小红星，今天又得了 ${num2} 颗，合起来是多少？`
    ];
    const idx = (parseInt(num1) + parseInt(num2)) % creativeTemplates.length;
    creative = creativeTemplates[idx];
    return { originalQuestion: question, creativeQuestion: creative };
  }

  // 3. Matches division syntax like "72 ÷ 8" or "72 / 8"
  const divRegex = /(\d+)\s*[÷/]\s*(\d+)/;
  const matchDiv = question.match(divRegex);
  if (matchDiv) {
    const num1 = matchDiv[1];
    const num2 = matchDiv[2];
    
    const creativeTemplates = [
      `🍰 把 ${num1} 个小蛋糕平均分给 ${num2} 个小朋友，每人分几个？`,
      `🔢 算算 ${num1} 里面包含有几个 ${num2} 呢？`,
      `🍒 ${num2} 个小篮子要装满 ${num1} 颗小樱桃，平均每个盛多少？`
    ];
    const idx = (parseInt(num1) + parseInt(num2)) % creativeTemplates.length;
    creative = creativeTemplates[idx];
    return { originalQuestion: question, creativeQuestion: creative };
  }

  // Default return if no classic format matches
  return { originalQuestion: question, creativeQuestion: `⭐ 跟着 AI 老师冲关：${question}` };
}

/**
 * Generates an appropriate math expression left-hand side or equivalent structure.
 */
export function getFormulaEquiv(question: string, value: string): string {
  // 1. Matches multiplication syntax such as "7 × 8" or "7*8" or "7x8"
  const multiRegex = /(\d+)\s*[×*xX]\s*(\d+)/;
  const matchMulti = question.match(multiRegex);
  if (matchMulti) {
    const num1 = parseInt(matchMulti[1], 10);
    const num2 = parseInt(matchMulti[2], 10);
    
    // Representation: "7个8相加" which is num2 repeated num1 times
    if (num1 > 1 && num1 <= 10) {
      const repeated = Array(num1).fill(num2).join("+");
      return `${repeated} = ${value}`;
    }
    return `${num1} × ${num2} = ${value}`;
  }

  // 2. Matches addition syntax like "38 + 45"
  const addRegex = /(\d+)\s*\+\s*(\d+)/;
  const matchAdd = question.match(addRegex);
  if (matchAdd) {
    const num1 = matchAdd[1];
    const num2 = matchAdd[2];
    return `${num1} + ${num2} = ${value}`;
  }

  // 3. Matches division syntax like "72 ÷ 8"
  const divRegex = /(\d+)\s*[÷/]\s*(\d+)/;
  const matchDiv = question.match(divRegex);
  if (matchDiv) {
    const num1 = matchDiv[1];
    const num2 = matchDiv[2];
    return `${num1} ÷ ${num2} = ${value}`;
  }

  // 4. Matches subtraction
  const subRegex = /(\d+)\s*[-−]\s*(\d+)/;
  const matchSub = question.match(subRegex);
  if (matchSub) {
    const num1 = matchSub[1];
    const num2 = matchSub[2];
    return `${num1} - ${num2} = ${value}`;
  }

  return value;
}

