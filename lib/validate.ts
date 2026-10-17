import {
  CASES,
  CATEGORIES,
  EXERCISE_TYPES,
  PARTS,
  type ExerciseType,
  type ImportInput,
} from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  value?: ImportInput;
}

const BLANK = /_{3,}/g;

/** Fields each exercise type requires (besides type and tags) and the optional ones it may carry. */
const FIELDS: Record<ExerciseType, { required: string[]; optional: string[] }> = {
  translate_mn_de: { required: ["mongolian", "answer"], optional: ["glosses", "accepted_variants"] },
  translate_de_mn: { required: ["german", "answer"], optional: [] },
  fill_blank: { required: ["text", "blanks"], optional: ["mongolian"] },
  error_hunt: { required: ["sentence", "answer"], optional: ["accepted_variants", "mongolian"] },
  transform: { required: ["instruction", "source", "answer"], optional: ["accepted_variants"] },
  name_case: { required: ["sentence", "highlight", "answer", "reason"], optional: [] },
  speed: { required: ["prompt", "answer"], optional: ["accepted_variants", "seconds"] },
  label_parts: { required: ["mongolian", "tokens"], optional: ["german"] },
};
const COMMON_OPTIONAL = ["marked", "note"];

const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** Turn a JSON.parse error into "line X, column Y" when the engine gives a position. */
export function parseJson(text: string): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    const msg = (e as Error).message;
    const m = msg.match(/position (\d+)/);
    if (m) {
      const pos = Number(m[1]);
      const before = text.slice(0, pos);
      const line = before.split("\n").length;
      const col = pos - before.lastIndexOf("\n");
      return { error: `JSON syntax error at line ${line}, column ${col}: ${msg}` };
    }
    return { error: `JSON syntax error: ${msg}` };
  }
}

export function validateImport(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["Top level must be an object { title, vocab, exercises }."], warnings };
  }
  const o = raw as Record<string, unknown>;

  if (!isStr(o.title)) errors.push("title: required (non-empty text).");
  if (o.source_note !== undefined && typeof o.source_note !== "string")
    errors.push("source_note: must be text.");
  for (const k of Object.keys(o))
    if (!["title", "source_note", "vocab", "exercises"].includes(k)) warnings.push(`Unknown top-level field "${k}" is ignored.`);

  // ── vocab
  const vocab = o.vocab ?? [];
  if (!Array.isArray(vocab)) errors.push("vocab: must be an array (can be empty).");
  else
    vocab.forEach((v, i) => {
      const p = `vocab[${i}]`;
      if (!v || typeof v !== "object") return errors.push(`${p}: must be an object.`);
      const w = v as Record<string, unknown>;
      const name = isStr(w.german) ? ` (${w.german})` : "";
      if (!isStr(w.german)) errors.push(`${p}.german: required.`);
      if (!isStr(w.mongolian)) errors.push(`${p}${name}.mongolian: required.`);
      if (!["noun", "verb", "other"].includes(w.kind as string))
        errors.push(`${p}${name}.kind: must be "noun", "verb" or "other".`);
      if (w.kind === "noun") {
        if (!["der", "die", "das"].includes(w.article as string))
          errors.push(`${p}${name}.article: nouns need "der", "die" or "das".`);
        if (w.plural !== undefined && typeof w.plural !== "string")
          errors.push(`${p}${name}.plural: must be text (use "-" if there is no plural).`);
        if (isStr(w.german) && w.german[0] !== w.german[0].toUpperCase())
          warnings.push(`${p}${name}: nouns are written with a capital letter.`);
      } else if (w.article !== undefined) {
        warnings.push(`${p}${name}.article: only nouns have an article; ignored.`);
      }
      if (w.irregular !== undefined && typeof w.irregular !== "boolean")
        errors.push(`${p}${name}.irregular: must be true or false.`);
    });

  // ── exercises
  if (!Array.isArray(o.exercises) || o.exercises.length === 0) {
    errors.push("exercises: required, at least one exercise.");
  } else {
    o.exercises.forEach((ex, i) => {
      const p = `exercises[${i}]`;
      if (!ex || typeof ex !== "object") return errors.push(`${p}: must be an object.`);
      const e = ex as Record<string, unknown>;
      const type = e.type as ExerciseType;
      if (!EXERCISE_TYPES.includes(type)) {
        errors.push(`${p}.type: "${String(e.type)}" is not one of ${EXERCISE_TYPES.join(", ")}.`);
        return;
      }
      const pt = `${p} (${type})`;

      if (!Array.isArray(e.tags) || e.tags.length === 0) errors.push(`${pt}.tags: at least one category is required.`);
      else
        e.tags.forEach((t) => {
          if (!CATEGORIES.includes(t as never))
            errors.push(`${pt}.tags: "${String(t)}" is not in the category list.`);
        });

      const spec = FIELDS[type];
      for (const f of spec.required) if (e[f] === undefined) errors.push(`${pt}.${f}: required.`);
      for (const k of Object.keys(e))
        if (!["type", "tags", ...spec.required, ...spec.optional, ...COMMON_OPTIONAL].includes(k))
          warnings.push(`${pt}: unknown field "${k}" is kept but not used.`);

      for (const f of ["mongolian", "glosses", "answer", "german", "sentence", "instruction", "source", "prompt", "reason", "text", "marked", "note", "highlight"])
        if (e[f] !== undefined && (spec.required.includes(f) ? !isStr(e[f]) : typeof e[f] !== "string"))
          errors.push(`${pt}.${f}: must be ${spec.required.includes(f) ? "non-empty " : ""}text.`);

      if (e.accepted_variants !== undefined && (!Array.isArray(e.accepted_variants) || !e.accepted_variants.every(isStr)))
        errors.push(`${pt}.accepted_variants: must be an array of text.`);

      if (type === "fill_blank" && typeof e.text === "string") {
        const gaps = (e.text.match(BLANK) ?? []).length;
        if (gaps === 0) errors.push(`${pt}.text: needs at least one ___ gap.`);
        if (!Array.isArray(e.blanks) || !e.blanks.every((b) => Array.isArray(b) && b.length > 0 && b.every((x) => typeof x === "string")))
          errors.push(`${pt}.blanks: must be an array of arrays of accepted answers, e.g. [["den"],["n"]].`);
        else if (e.blanks.length !== gaps)
          errors.push(`${pt}.blanks: text has ${gaps} gap(s) but blanks has ${e.blanks.length} entr${e.blanks.length === 1 ? "y" : "ies"}.`);
      }

      if (type === "name_case") {
        if (!CASES.includes(e.answer as never)) errors.push(`${pt}.answer: must be "N", "A", "D" or "G".`);
        if (isStr(e.sentence) && isStr(e.highlight) && !e.sentence.includes(e.highlight))
          errors.push(`${pt}.highlight: "${e.highlight}" does not appear in the sentence.`);
      }

      if (type === "speed" && e.seconds !== undefined && (typeof e.seconds !== "number" || e.seconds < 2 || e.seconds > 60))
        errors.push(`${pt}.seconds: must be a number between 2 and 60.`);

      if (type === "label_parts") {
        if (!Array.isArray(e.tokens) || e.tokens.length === 0) errors.push(`${pt}.tokens: must be a non-empty array.`);
        else
          e.tokens.forEach((t, j) => {
            const tk = t as Record<string, unknown>;
            if (!tk || !isStr(tk.text)) errors.push(`${pt}.tokens[${j}].text: required.`);
            if (!tk || !PARTS.includes(tk.part as never))
              errors.push(`${pt}.tokens[${j}].part: must be one of ${PARTS.join(" / ")}.`);
          });
      }

      if (typeof e.marked === "string") {
        const plain = e.marked.replace(/\[([NADG]):([^\]]+)\]/g, "$2");
        if (/[[\]]/.test(plain)) errors.push(`${pt}.marked: use blocks like [A:den Hund] (case letter N, A, D or G).`);
      }
    });
  }

  const ok = errors.length === 0;
  if (!ok) return { ok, errors, warnings };

  const value: ImportInput = {
    title: (o.title as string).trim(),
    source_note: typeof o.source_note === "string" ? o.source_note.trim() : undefined,
    vocab: ((vocab as Record<string, unknown>[]) ?? []).map((w) => ({
      german: (w.german as string).trim(),
      article: w.kind === "noun" ? (w.article as "der" | "die" | "das") : undefined,
      plural: typeof w.plural === "string" && w.plural.trim() ? w.plural.trim() : undefined,
      mongolian: (w.mongolian as string).trim(),
      kind: w.kind as "noun" | "verb" | "other",
      irregular: w.irregular === true,
    })),
    exercises: (o.exercises as Record<string, unknown>[]).map((e) => ({ ...e }) as ImportInput["exercises"][number]),
  };
  return { ok, errors, warnings, value };
}
