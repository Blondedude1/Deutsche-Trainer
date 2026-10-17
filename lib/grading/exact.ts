import { wordDiff, type WordDiff } from "../diff";
import { foldUmlauts, normalize, type NormalizeOptions } from "../normalize";
import type { Answer, Exercise } from "../types";

export interface GradeResult {
  correct: boolean;
  graded_by: "exact" | "self" | "ai";
  error_categories: string[];
  /** The correct answer as a sentence (for fill_blank: the filled sentence). */
  expected: string;
  diff?: WordDiff;
  /** fill_blank: which gaps were right. */
  gaps?: boolean[];
  /** label_parts: which tokens were labelled right. */
  parts?: boolean[];
  /** Short explanation (AI grading, Phase 3). */
  explanation?: string;
}

export const BLANK_RE = /_{3,}/g;

/** Replace each ___ gap with the given fills. */
export function fillText(text: string, fills: string[]): string {
  let i = 0;
  return text.replace(BLANK_RE, () => fills[i++] ?? "___");
}

function textOf(answer: Answer): string {
  return "text" in answer ? answer.text : "";
}

/** Categories for a wrong text answer: a pure capitalization / umlaut slip is named as such, else the exercise tags. */
function wrongCategories(user: string, targets: string[], tags: string[], opts: NormalizeOptions): string[] {
  const loose = (s: string) => normalize(s, { umlautEquivalence: true }).toLowerCase();
  if (targets.some((t) => loose(t) === loose(user))) {
    const caseOnly = targets.some((t) => normalize(t, opts).toLowerCase() === normalize(user, opts).toLowerCase());
    return caseOnly ? ["capitalization"] : ["umlaut_spelling"];
  }
  return tags.length ? tags : ["other"];
}

function gradeText(user: string, answer: string, variants: string[] | undefined, tags: string[], opts: NormalizeOptions): GradeResult {
  const targets = [answer, ...(variants ?? [])];
  const nu = normalize(user, opts);
  const hit = targets.find((t) => normalize(t, opts) === nu);
  if (hit !== undefined) return { correct: true, graded_by: "exact", error_categories: [], expected: hit };

  // Diff against the target that is closest to what was written.
  let best = wordDiff(user, answer, opts);
  let bestTarget = answer;
  for (const t of variants ?? []) {
    const d = wordDiff(user, t, opts);
    const bad = (x: WordDiff) => x.expected.filter((w) => !w.ok).length + x.user.filter((w) => !w.ok).length;
    if (bad(d) < bad(best)) {
      best = d;
      bestTarget = t;
    }
  }
  return {
    correct: false,
    graded_by: "exact",
    error_categories: wrongCategories(user, targets, tags, opts),
    expected: bestTarget,
    diff: best,
  };
}

export function gradeExact(ex: Exercise, answer: Answer, opts: NormalizeOptions): GradeResult {
  switch (ex.type) {
    case "translate_mn_de":
    case "error_hunt":
    case "transform":
    case "speed":
      return gradeText(textOf(answer), ex.payload.answer, ex.payload.accepted_variants, ex.tags, opts);

    case "translate_de_mn": {
      const correct = "self" in answer && answer.self === "got";
      return {
        correct,
        graded_by: "self",
        error_categories: correct ? [] : ex.tags,
        expected: ex.payload.answer,
      };
    }

    case "fill_blank": {
      const given = "blanks" in answer ? answer.blanks : [];
      const gaps = ex.payload.blanks.map((accepted, i) => {
        const g = normalize(given[i] ?? "", opts);
        return accepted.some((a) => normalize(a, opts) === g);
      });
      const correct = gaps.every(Boolean);
      const expected = fillText(ex.payload.text, ex.payload.blanks.map((b) => b[0]));
      let cats: string[] = [];
      if (!correct) {
        const lower = (s: string) => normalize(s, opts).toLowerCase();
        const loose = (s: string) => foldUmlauts(lower(s));
        const only = (f: (s: string) => string) =>
          ex.payload.blanks.every((acc, i) => gaps[i] || acc.some((a) => f(a) === f(given[i] ?? "")));
        cats = only(lower) ? ["capitalization"] : only(loose) ? ["umlaut_spelling"] : ex.tags;
      }
      return { correct, graded_by: "exact", error_categories: cats, expected, gaps };
    }

    case "name_case": {
      const correct = "case" in answer && answer.case === ex.payload.answer;
      return { correct, graded_by: "exact", error_categories: correct ? [] : ex.tags, expected: ex.payload.answer };
    }

    case "label_parts": {
      const given = "parts" in answer ? answer.parts : [];
      const parts = ex.payload.tokens.map((t, i) => given[i] === t.part);
      const correct = parts.every(Boolean);
      return {
        correct,
        graded_by: "exact",
        error_categories: correct ? [] : ex.tags,
        expected: ex.payload.tokens.map((t) => `${t.text} (${t.part})`).join(" · "),
        parts,
      };
    }
  }
}
