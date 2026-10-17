import type { NormalizeOptions } from "../normalize";
import type { Answer, Exercise } from "../types";
import type { GradeResult } from "./exact";

/**
 * Phase 3: ask Claude to judge an answer that had no exact match.
 * Must return strict JSON { correct, corrected, error_categories, explanation }
 * using only the fixed category list. Not implemented yet — returning null
 * makes the caller keep the exact-match result.
 */
export async function aiGrade(
  _ex: Exercise,
  _answer: Answer,
  _exact: GradeResult,
  _opts: NormalizeOptions,
): Promise<GradeResult | null> {
  return null;
}
