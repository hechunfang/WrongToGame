export interface DiagnosticResult {
  type: "math" | "chinese_pinyin" | "chinese_words" | "english_spelling" | "english_oral";
  target_topic: string;
  target_display: string;
  correct_sequence: string[] | string[][];
  grid_items: string[];
  
  // English Scenarios & Oral fields
  english_scene_sentence?: string;
  english_scene_translation?: string;
  english_scene_image?: string;
  
  // Backwards compatibility fallbacks
  question_display?: string;
  correct_answer?: string;
  wrong_answers?: string[];
}

export type AppState = "upload" | "diagnosing" | "paywall" | "game" | "settlement";

export interface Mole {
  id: number;
  active: boolean; // Is the mole visible?
  value: string;   // The answer or expression it exhibits
  isCorrect: boolean;
  color?: string;  // Creative colorful moles
}
