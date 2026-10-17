import type { Case, Gender, Part } from "@/lib/types";

export const GENDER_VAR: Record<Gender, string> = { m: "var(--der)", f: "var(--die)", n: "var(--das)", pl: "var(--pl)" };
export const ARTICLE_GENDER: Record<string, Gender> = { der: "m", die: "f", das: "n" };
export const CASE_VAR: Record<Case, string> = { N: "var(--case-n)", A: "var(--case-a)", D: "var(--case-d)", G: "var(--case-g)" };
export const PART_VAR: Record<Part, string> = {
  S: "var(--case-n)",
  V: "var(--part-v)",
  DO: "var(--case-a)",
  IO: "var(--case-d)",
  OWN: "var(--case-g)",
  WHERE: "var(--part-where)",
  WHEN: "var(--part-when)",
};
