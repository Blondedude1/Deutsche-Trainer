import { words } from "./diff";
import type { Case, Gender, Vocab } from "./types";

/**
 * Turns a correct German sentence into words with gender colors and case blocks.
 * A hand-marked version ("Ich sehe [A:den Hund].") wins; otherwise a heuristic
 * reads articles, prepositions and the vocabulary list. Word indices match
 * `words()` so diff highlights line up.
 */

export interface AnnWord {
  text: string;
  index: number;
  gender?: Gender;
}
export interface AnnGroup {
  case?: Case;
  words: AnnWord[];
}
interface Block {
  start: number;
  end: number; // inclusive
  case: Case;
}

// ───────── lexicon ─────────
export interface LexEntry {
  gender: Gender;
  /** singular and plural spelled the same (der Lehrer / die Lehrer) */
  pluralSame?: boolean;
}
export type Lexicon = Map<string, LexEntry>;

const clean = (w: string) => w.replace(/^["'„“(«]+|[.,!?;:…"“”)»]+$/g, "");
const isCap = (w: string) => /^[A-ZÄÖÜ]/.test(clean(w));

export function buildLexicon(vocab: Pick<Vocab, "german" | "article" | "plural" | "kind">[]): Lexicon {
  const lex: Lexicon = new Map();
  const G: Record<string, Gender> = { der: "m", die: "f", das: "n" };
  const put = (form: string, e: LexEntry, override = false) => {
    const k = form.toLowerCase();
    if (override || !lex.has(k)) lex.set(k, e);
  };
  const nouns = vocab.filter((v) => v.kind === "noun" && v.article);
  for (const v of nouns) {
    const g = G[v.article!];
    const pl = v.plural && v.plural !== "-" ? v.plural : null;
    put(v.german, { gender: g, pluralSame: pl === v.german }, true);
    if (pl && pl !== v.german && !lex.has(pl.toLowerCase())) put(pl, { gender: "pl" }, true);
  }
  // inflected forms never override base forms
  for (const v of nouns) {
    const g = G[v.article!];
    const pl = v.plural && v.plural !== "-" ? v.plural : null;
    if (pl && !/[ns]$/.test(pl)) put(pl + "n", { gender: "pl" });
    if (g !== "f") for (const suf of ["s", "es", "n", "en"]) put(v.german + suf, { gender: g });
  }
  return lex;
}

// ───────── articles ─────────
type Pair = [Gender, Case];
const DEF: Record<string, Pair[]> = {
  der: [["m", "N"], ["f", "D"], ["f", "G"], ["pl", "G"]],
  die: [["f", "N"], ["f", "A"], ["pl", "N"], ["pl", "A"]],
  das: [["n", "N"], ["n", "A"]],
  den: [["m", "A"], ["pl", "D"]],
  dem: [["m", "D"], ["n", "D"]],
  des: [["m", "G"], ["n", "G"]],
};
const EIN_END: Record<string, Pair[]> = {
  "": [["m", "N"], ["n", "N"], ["n", "A"]],
  e: [["f", "N"], ["f", "A"], ["pl", "N"], ["pl", "A"]],
  en: [["m", "A"], ["pl", "D"]],
  em: [["m", "D"], ["n", "D"]],
  er: [["f", "D"], ["f", "G"], ["pl", "G"]],
  es: [["m", "G"], ["n", "G"]],
};
const DER_END: Record<string, Pair[]> = {
  er: DEF.der,
  e: DEF.die,
  es: [...DEF.das, ...DEF.des],
  en: DEF.den,
  em: DEF.dem,
};
const EIN_STEMS = ["kein", "mein", "dein", "sein", "ihr", "unser", "euer", "eur", "ein"];
const DER_STEMS = ["dies", "jed", "welch"];
const CONTRACTIONS: Record<string, Pair[]> = {
  zum: [["m", "D"], ["n", "D"]],
  zur: [["f", "D"]],
  vom: [["m", "D"], ["n", "D"]],
  beim: [["m", "D"], ["n", "D"]],
  im: [["m", "D"], ["n", "D"]],
  am: [["m", "D"], ["n", "D"]],
  ins: [["n", "A"]],
  ans: [["n", "A"]],
};

function articlePairs(word: string): Pair[] | null {
  const w = clean(word).toLowerCase();
  if (DEF[w]) return DEF[w];
  if (CONTRACTIONS[w]) return CONTRACTIONS[w];
  for (const stem of EIN_STEMS) {
    if (!w.startsWith(stem)) continue;
    const end = w.slice(stem.length);
    if (!(end in EIN_END)) continue;
    const pairs = EIN_END[end];
    // "ein" has no plural; "euer" drops its e before an ending (eure, euren)
    if (stem === "ein") return pairs.filter(([g]) => g !== "pl");
    if (stem === "euer" && end !== "") continue;
    return pairs;
  }
  for (const stem of DER_STEMS) {
    const end = w.slice(stem.length);
    if (w.startsWith(stem) && DER_END[end]) return DER_END[end];
  }
  return null;
}

const AKK_PREPS = new Set(["für", "um", "gegen", "durch", "ohne", "bis"]);
const DAT_PREPS = new Set(["ab", "aus", "bei", "mit", "nach", "seit", "von", "zu"]);
const WECHSEL = new Set(["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"]);
const PRONOUNS: Record<string, Case> = {
  ich: "N", du: "N", er: "N", wir: "N", wer: "N",
  mich: "A", dich: "A", ihn: "A", wen: "A",
  mir: "D", dir: "D", ihm: "D", wem: "D",
  wessen: "G",
};
const SUBJECT_ONLY = new Set(["sie", "es", "ihr", "man"]);
const CLAUSE_BREAK = new Set(["und", "aber", "oder", "denn", "sondern"]);

function heuristicBlocks(ws: string[], lex: Lexicon): Block[] {
  const blocks: Block[] = [];
  let subjectFound = false;
  for (let i = 0; i < ws.length; i++) {
    const w = clean(ws[i]).toLowerCase();
    const prev = i > 0 ? clean(ws[i - 1]).toLowerCase() : "";
    if (CLAUSE_BREAK.has(w) || (i > 0 && /,$/.test(ws[i - 1]))) subjectFound = false;

    if (PRONOUNS[w] && !AKK_PREPS.has(prev) && !DAT_PREPS.has(prev)) {
      blocks.push({ start: i, end: i, case: PRONOUNS[w] });
      if (PRONOUNS[w] === "N") subjectFound = true;
      continue;
    }
    if (SUBJECT_ONLY.has(w) && !subjectFound) {
      // "ihr Bruder" is a possessive (handled as an article below); otherwise sie/es/ihr/man is the subject
      const possessive = w === "ihr" && i + 1 < ws.length && isCap(ws[i + 1]);
      if (!possessive) {
        subjectFound = true;
        continue;
      }
    }

    // Genitiv with names: "Peters Auto", "Hans' Auto"
    const raw = clean(ws[i]);
    if (/^[A-ZÄÖÜ].*'$/.test(ws[i].replace(/[.,!?]+$/, "")) && i + 1 < ws.length && isCap(ws[i + 1])) {
      blocks.push({ start: i, end: i, case: "G" });
      continue;
    }
    if (/^[A-ZÄÖÜ][a-zäöüß]+s$/.test(raw) && !lex.has(raw.toLowerCase()) && !articlePairs(ws[i - 1] ?? "") &&
        i + 1 < ws.length && lex.has(clean(ws[i + 1]).toLowerCase())) {
      blocks.push({ start: i, end: i, case: "G" });
      continue;
    }

    const pairs = articlePairs(ws[i]);
    if (!pairs) continue;
    // find the noun: up to 3 lowercase words (adjectives) then a capitalized word
    let n = -1;
    for (let j = i + 1; j < Math.min(ws.length, i + 5); j++) {
      if (isCap(ws[j])) {
        n = j;
        break;
      }
      // only declined adjectives (or "sehr") can stand between article and noun
      const a = clean(ws[j]).toLowerCase();
      if (/[,.!?;:]$/.test(ws[j]) || articlePairs(ws[j]) || !(a === "sehr" || /(e|en|er|es|em)$/.test(a))) break;
    }
    if (n < 0) continue;

    const entry = lex.get(clean(ws[n]).toLowerCase());
    let cand = pairs;
    if (entry) {
      const okG = (g: Gender) => g === entry.gender || (entry.pluralSame && g === "pl");
      const f = pairs.filter(([g]) => okG(g));
      if (f.length) cand = f;
    }
    const isContraction = !!CONTRACTIONS[w];
    if (!isContraction) {
      const allowed: Case[] | null = AKK_PREPS.has(prev) ? ["A"] : DAT_PREPS.has(prev) ? ["D"] : WECHSEL.has(prev) ? ["A", "D"] : null;
      if (allowed) {
        const f = cand.filter(([, c]) => allowed.includes(c));
        if (f.length) cand = f;
      }
    }
    const cases = new Set(cand.map(([, c]) => c));
    let c: Case;
    if (cases.size === 1) c = [...cases][0];
    else if (cases.has("N") && !subjectFound) c = "N";
    else if (cases.has("G") && i > 0 && isCap(ws[i - 1]) && !articlePairs(ws[i - 1])) c = "G";
    else c = (["A", "D", "G", "N"] as Case[]).find((x) => cases.has(x))!;
    if (c === "N") subjectFound = true;

    // the preposition belongs inside the block: "für den Opa", "mit dem Bus"
    const withPrep = !isContraction && (AKK_PREPS.has(prev) || DAT_PREPS.has(prev) || WECHSEL.has(prev));
    blocks.push({ start: withPrep ? i - 1 : i, end: n, case: c });
    i = n;
  }
  return blocks;
}

function parseMarked(marked: string): { plain: string; blocks: Block[] } {
  const blocks: Block[] = [];
  let plain = "";
  let last = 0;
  const re = /\[([NADG]):([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(marked))) {
    plain += marked.slice(last, m.index);
    const start = words(plain).length - (plain.length && !/\s$/.test(plain) ? 1 : 0);
    plain += m[2];
    const end = words(plain).length - 1;
    blocks.push({ start, end, case: m[1] as Case });
    last = m.index + m[0].length;
  }
  plain += marked.slice(last);
  return { plain, blocks };
}

export const stripMarked = (marked: string) => parseMarked(marked).plain;

/** Word range (inclusive) where `phrase` occurs inside `sentence`. */
export function phraseRange(sentence: string, phrase: string): [number, number] | null {
  const at = sentence.indexOf(phrase);
  if (at < 0) return null;
  const before = sentence.slice(0, at);
  const start = words(before).length - (before.length && !/\s$/.test(before) ? 1 : 0);
  return [start, start + words(phrase).length - 1];
}

function genderFromArticle(ws: string[], b: Block, lex: Lexicon, out: (Gender | undefined)[]) {
  for (let k = b.start; k <= b.end; k++) {
    if (!isCap(ws[k]) || k === b.start) continue;
    const pairs = articlePairs(ws[k - 1] ?? "") ?? articlePairs(ws[b.start]) ?? [];
    const entry = lex.get(clean(ws[k]).toLowerCase());
    const fit = pairs.filter(([, c]) => c === b.case);
    if (entry?.pluralSame && fit.length && fit.every(([g]) => g === "pl")) out[k] = "pl";
    else if (!entry) {
      const gs = new Set(fit.map(([g]) => g));
      if (gs.size === 1) out[k] = [...gs][0];
    }
  }
}

export function annotate(
  sentence: string,
  lex: Lexicon,
  opts: { marked?: string; overrides?: { range: [number, number]; case: Case }[] } = {},
): AnnGroup[] {
  let blocks: Block[];
  const ws0 = words(sentence);
  if (opts.marked && words(stripMarked(opts.marked)).join(" ") === ws0.join(" ")) {
    blocks = parseMarked(opts.marked).blocks;
  } else {
    blocks = heuristicBlocks(ws0, lex);
  }
  for (const o of opts.overrides ?? []) {
    const [s, e] = o.range;
    blocks = blocks.filter((b) => b.end < s || b.start > e);
    blocks.push({ start: s, end: e, case: o.case });
  }
  blocks.sort((a, b) => a.start - b.start);
  const ws = ws0;

  const genders: (Gender | undefined)[] = ws.map((w) => (isCap(w) ? lex.get(clean(w).toLowerCase())?.gender : undefined));
  // a sentence-initial capital is not necessarily a noun: only color it if the lexicon knows it
  for (const b of blocks) genderFromArticle(ws, b, lex, genders);

  const groups: AnnGroup[] = [];
  let i = 0;
  for (const b of blocks) {
    if (b.start < i) continue;
    if (b.start > i) groups.push({ words: ws.slice(i, b.start).map((t, k) => ({ text: t, index: i + k, gender: genders[i + k] })) });
    groups.push({ case: b.case, words: ws.slice(b.start, b.end + 1).map((t, k) => ({ text: t, index: b.start + k, gender: genders[b.start + k] })) });
    i = b.end + 1;
  }
  if (i < ws.length) groups.push({ words: ws.slice(i).map((t, k) => ({ text: t, index: i + k, gender: genders[i + k] })) });
  return groups;
}
