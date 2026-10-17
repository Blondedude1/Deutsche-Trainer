export const EXERCISE_TYPES = [
  "translate_mn_de",
  "translate_de_mn",
  "fill_blank",
  "error_hunt",
  "transform",
  "name_case",
  "speed",
  "label_parts",
] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const TYPE_LABELS: Record<ExerciseType, string> = {
  translate_mn_de: "Mongolian → German",
  translate_de_mn: "German → Mongolian",
  fill_blank: "Fill the gaps",
  error_hunt: "Find the mistake",
  transform: "Transform",
  name_case: "Name the case",
  speed: "Speed",
  label_parts: "Sentence parts",
};

export const CATEGORIES = [
  "verb_ending",
  "vowel_change",
  "irregular_verb",
  "extra_e",
  "eln_ich",
  "plural_subject_verb",
  "nom_article",
  "akk_article",
  "dativ_article",
  "plural_dativ",
  "genitiv_article",
  "genitiv_s",
  "dativ_verb",
  "prep_akk",
  "prep_dativ",
  "contraction",
  "wechsel_case",
  "verb_pair",
  "adjective_ending",
  "ein_kein",
  "kein_nicht",
  "w_question",
  "word_order",
  "ohne_no_article",
  "capitalization",
  "umlaut_spelling",
  "vocab",
  "sentence_parts",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CASES = ["N", "A", "D", "G"] as const;
export type Case = (typeof CASES)[number];

export const CASE_NAMES: Record<Case, { de: string; mn: string }> = {
  N: { de: "Nominativ", mn: "нэрлэхийн" },
  A: { de: "Akkusativ", mn: "заахын" },
  D: { de: "Dativ", mn: "өгөх-оршихын" },
  G: { de: "Genitiv", mn: "харьяалахын" },
};

export const PARTS = ["S", "V", "DO", "IO", "OWN", "WHERE", "WHEN"] as const;
export type Part = (typeof PARTS)[number];

export const PART_LABELS: Record<Part, string> = {
  S: "Subject",
  V: "Verb",
  DO: "Direct object",
  IO: "Indirect object",
  OWN: "Owner",
  WHERE: "Where",
  WHEN: "When",
};

export type Gender = "m" | "f" | "n" | "pl";
export type Article = "der" | "die" | "das";

// ───────── payloads (what is stored in exercises.payload) ─────────
export interface CommonPayload {
  /** Optional hand-marked version of the correct sentence, e.g. "Ich sehe [A:den Hund]." */
  marked?: string;
  note?: string;
}
export interface TranslateMnDe extends CommonPayload {
  mongolian: string;
  glosses?: string;
  answer: string;
  accepted_variants?: string[];
}
export interface TranslateDeMn extends CommonPayload {
  german: string;
  answer: string;
}
export interface FillBlank extends CommonPayload {
  text: string;
  blanks: string[][];
  mongolian?: string;
}
export interface ErrorHunt extends CommonPayload {
  sentence: string;
  answer: string;
  accepted_variants?: string[];
  mongolian?: string;
}
export interface Transform extends CommonPayload {
  instruction: string;
  source: string;
  answer: string;
  accepted_variants?: string[];
}
export interface NameCase extends CommonPayload {
  sentence: string;
  highlight: string;
  answer: Case;
  reason: string;
}
export interface Speed extends CommonPayload {
  prompt: string;
  answer: string;
  accepted_variants?: string[];
  seconds?: number;
}
export interface LabelParts extends CommonPayload {
  mongolian: string;
  tokens: { text: string; part: Part }[];
  german?: string;
}

export type PayloadByType = {
  translate_mn_de: TranslateMnDe;
  translate_de_mn: TranslateDeMn;
  fill_blank: FillBlank;
  error_hunt: ErrorHunt;
  transform: Transform;
  name_case: NameCase;
  speed: Speed;
  label_parts: LabelParts;
};

export type Exercise = {
  [K in ExerciseType]: {
    id: string;
    set_id: string;
    position: number;
    type: K;
    payload: PayloadByType[K];
    tags: string[];
  };
}[ExerciseType];

export interface ExerciseSet {
  id: string;
  title: string;
  source_note: string | null;
  created_at: string;
}

export interface Vocab {
  id: string;
  set_id: string;
  german: string;
  article: Article | null;
  plural: string | null;
  mongolian: string;
  kind: "noun" | "verb" | "other";
  irregular: boolean;
}

export type GradedBy = "exact" | "self" | "manual" | "ai";

export interface Attempt {
  id: string;
  exercise_id: string;
  answer: Answer;
  correct: boolean;
  points: number;
  tables_used: boolean;
  tables_opened: string[];
  error_categories: string[];
  seconds_taken: number | null;
  graded_by: GradedBy;
  flagged: boolean;
  is_retry: boolean;
  created_at: string;
}
export type NewAttempt = Omit<Attempt, "id" | "created_at">;

// ───────── answers (what is stored in attempts.answer) ─────────
export type Answer =
  | { text: string }
  | { text: string; self: "got" | "missed" }
  | { blanks: string[] }
  | { case: Case }
  | { parts: string[] };

// ───────── import format ─────────
export interface ImportVocab {
  german: string;
  article?: Article;
  plural?: string;
  mongolian: string;
  kind: "noun" | "verb" | "other";
  irregular?: boolean;
}
export type ImportExercise = { type: ExerciseType; tags: string[] } & Record<string, unknown>;
export interface ImportInput {
  title: string;
  source_note?: string;
  vocab: ImportVocab[];
  exercises: ImportExercise[];
}
