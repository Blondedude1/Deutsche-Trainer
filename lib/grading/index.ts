import type { NormalizeOptions } from "../normalize";
import type { Answer, Exercise, ExerciseType } from "../types";
import { aiGrade } from "./ai";
import { gradeExact, type GradeResult } from "./exact";

export type { GradeResult } from "./exact";

/** Free-text types where an AI second opinion makes sense. */
const AI_TYPES: ExerciseType[] = ["translate_mn_de", "error_hunt", "transform"];

export const aiGradingEnabled = () => process.env.AI_GRADING === "on";

/**
 * The single grading entry point. Phase 1: exact matching only.
 * With AI_GRADING=on, a non-matching free-text answer gets a second opinion from aiGrade().
 */
export async function grade(ex: Exercise, answer: Answer, opts: NormalizeOptions): Promise<GradeResult> {
  const exact = gradeExact(ex, answer, opts);
  if (exact.correct || !aiGradingEnabled() || !AI_TYPES.includes(ex.type)) return exact;
  try {
    return (await aiGrade(ex, answer, exact, opts)) ?? exact;
  } catch (err) {
    console.error("AI grading failed, using exact result", err);
    return exact;
  }
}

/** 1 point if correct without tables, 0.5 with tables, 0 if wrong, a retry, or a speed answer over time. */
export function computePoints(a: {
  correct: boolean;
  tables_used: boolean;
  is_retry: boolean;
  overTime?: boolean;
}): number {
  if (!a.correct || a.is_retry || a.overTime) return 0;
  return a.tables_used ? 0.5 : 1;
}
