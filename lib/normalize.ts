export interface NormalizeOptions {
  /** Treat ae/oe/ue/ss as equal to ä/ö/ü/ß. Default on. */
  umlautEquivalence: boolean;
}
export const DEFAULT_NORMALIZE: NormalizeOptions = { umlautEquivalence: true };

const QUOTES: [RegExp, string][] = [
  [/[„“”«»″]/g, '"'],
  [/[‚‘’`´′]/g, "'"],
];

/** Spell out ä/ö/ü/ß as ae/oe/ue/ss so both spellings compare equal. */
export function foldUmlauts(s: string): string {
  return s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/ẞ/g, "SS");
}

export function unifyQuotes(s: string): string {
  return QUOTES.reduce((acc, [re, to]) => acc.replace(re, to), s);
}

/**
 * Trim, collapse spaces, strip final punctuation, unify quotes,
 * ignore the case of the first character only, optionally fold umlauts.
 */
export function normalize(input: string, opts: NormalizeOptions = DEFAULT_NORMALIZE): string {
  let s = unifyQuotes(input.normalize("NFC"))
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s.!?…,;:]+$/u, "")
    .replace(/\s+([,.!?;:])/g, "$1");
  if (s.length > 0) s = s[0].toLowerCase() + s.slice(1);
  if (opts.umlautEquivalence) s = foldUmlauts(s);
  return s;
}

/** Normalize a single word for word-level comparison (punctuation around it is ignored). */
export function normalizeWord(w: string, opts: NormalizeOptions, first: boolean): string {
  let s = unifyQuotes(w.normalize("NFC")).replace(/^["'(]+|[.,!?;:…")]+$/g, "");
  if (first && s.length) s = s[0].toLowerCase() + s.slice(1);
  if (opts.umlautEquivalence) s = foldUmlauts(s);
  return s;
}
