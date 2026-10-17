import { normalizeWord, type NormalizeOptions } from "./normalize";

export interface DiffWord {
  text: string;
  ok: boolean;
}
export interface WordDiff {
  user: DiffWord[];
  expected: DiffWord[];
}

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** Word-level LCS: words not in the common subsequence are marked as differing. */
export function wordDiff(user: string, expected: string, opts: NormalizeOptions): WordDiff {
  const a = words(user);
  const b = words(expected);
  const na = a.map((w, i) => normalizeWord(w, opts, i === 0));
  const nb = b.map((w, i) => normalizeWord(w, opts, i === 0));
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = na[i] === nb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const okA = new Array(a.length).fill(false);
  const okB = new Array(b.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (na[i] === nb[j]) {
      okA[i++] = true;
      okB[j++] = true;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return {
    user: a.map((text, k) => ({ text, ok: okA[k] })),
    expected: b.map((text, k) => ({ text, ok: okB[k] })),
  };
}
