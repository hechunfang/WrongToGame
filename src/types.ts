export interface DiagnosticResult {
  target_topic: string;
  question_display: string;
  correct_answer: string;
  wrong_answers: string[];
}

export type AppState = "upload" | "diagnosing" | "paywall" | "game" | "settlement";

export interface Mole {
  id: number;
  active: boolean; // Is the mole visible?
  value: string;   // The answer or expression it exhibits
  isCorrect: boolean;
}
