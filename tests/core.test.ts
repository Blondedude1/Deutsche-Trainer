import assert from "node:assert/strict";
import { test } from "node:test";
import demo from "../data/demo-set.json";
import { annotate, buildLexicon } from "../lib/annotate";
import { gradeExact } from "../lib/grading/exact";
import { computePoints } from "../lib/grading";
import { normalize } from "../lib/normalize";
import type { Exercise, Vocab } from "../lib/types";
import { validateImport } from "../lib/validate";

const on = { umlautEquivalence: true };
const off = { umlautEquivalence: false };

const ex = (type: Exercise["type"], payload: object, tags = ["other"]) =>
  ({ id: "x", set_id: "s", position: 0, type, payload, tags }) as Exercise;

test("normalize", () => {
  assert.equal(normalize("  die   Mutter legt.  "), normalize("Die Mutter legt"));
  assert.equal(normalize("Ich heiße „Bat“!"), normalize('ich heisse "Bat"'));
  assert.notEqual(normalize("ich heisse", off), normalize("ich heiße", off));
  assert.notEqual(normalize("Die mutter"), normalize("Die Mutter")); // only the first character is case-insensitive
});

test("text grading, variants, categories", () => {
  const e = ex("translate_mn_de", { mongolian: "", answer: "Die Mutter legt den Teppich auf den Fußboden.", accepted_variants: ["Mutter legt den Teppich auf den Boden."] }, ["wechsel_case"]);
  assert.equal(gradeExact(e, { text: "die mutter legt den Teppich auf den Fussboden" }, on).correct, false);
  const r1 = gradeExact(e, { text: "die Mutter legt den Teppich auf den Fussboden" }, on);
  assert.equal(r1.correct, true);
  const r2 = gradeExact(e, { text: "Die Mutter legt den Teppich auf dem Fußboden." }, on);
  assert.equal(r2.correct, false);
  assert.deepEqual(r2.error_categories, ["wechsel_case"]);
  assert.deepEqual(r2.diff!.user.filter((w) => !w.ok).map((w) => w.text), ["dem"]);
  assert.deepEqual(r2.diff!.expected.filter((w) => !w.ok).map((w) => w.text), ["den"]);
  assert.deepEqual(gradeExact(e, { text: "Die Mutter legt den teppich auf den Fußboden" }, on).error_categories, ["capitalization"]);
  assert.deepEqual(gradeExact(e, { text: "Die Mutter legt den Teppich auf den Fussboden" }, off).error_categories, ["umlaut_spelling"]);
});

test("fill_blank", () => {
  const e = ex("fill_blank", { text: "Ich helfe ___ Kinder___.", blanks: [["den"], ["n"]] }, ["plural_dativ"]);
  const r = gradeExact(e, { blanks: ["den", ""] }, on);
  assert.deepEqual(r.gaps, [true, false]);
  assert.equal(r.expected, "Ich helfe den Kindern.");
  assert.equal(gradeExact(e, { blanks: [" den ", "n"] }, on).correct, true);
});

test("points", () => {
  assert.equal(computePoints({ correct: true, tables_used: false, is_retry: false }), 1);
  assert.equal(computePoints({ correct: true, tables_used: true, is_retry: false }), 0.5);
  assert.equal(computePoints({ correct: true, tables_used: false, is_retry: true }), 0);
  assert.equal(computePoints({ correct: true, tables_used: false, is_retry: false, overTime: true }), 0);
  assert.equal(computePoints({ correct: false, tables_used: false, is_retry: false }), 0);
});

test("validation", () => {
  assert.equal(validateImport(demo).ok, true, validateImport(demo).errors.join("\n"));
  const bad = validateImport({ title: "x", exercises: [{ type: "fill_blank", text: "a ___ b ___", blanks: [["x"]], tags: ["nope"] }] });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => e.includes("2 gap(s)")));
  assert.ok(bad.errors.some((e) => e.includes('"nope"')));
});

const lex = buildLexicon(demo.vocab.map((v) => ({ ...v, article: (v as { article?: string }).article ?? null, plural: (v as { plural?: string }).plural ?? null })) as Vocab[]);
const blocks = (s: string) =>
  annotate(s, lex)
    .filter((g) => g.case)
    .map((g) => `${g.case}:${g.words.map((w) => w.text).join(" ")}`);

test("annotate case blocks", () => {
  assert.deepEqual(blocks("Die Mutter legt den Teppich auf den Fußboden."), ["N:Die Mutter", "A:den Teppich", "A:auf den Fußboden."]);
  assert.deepEqual(blocks("Die Katze liegt unter dem Tisch."), ["N:Die Katze", "D:unter dem Tisch."]);
  assert.deepEqual(blocks("Ich helfe den Kindern."), ["N:Ich", "D:den Kindern."]);
  assert.deepEqual(blocks("Der Bruder bringt der Oma eine Zeitung."), ["N:Der Bruder", "D:der Oma", "A:eine Zeitung."]);
  assert.deepEqual(blocks("Das ist gut."), []);
  assert.deepEqual(blocks("Ich gehe zum Opa."), ["N:Ich", "D:zum Opa."]);
});

test("annotate genders", () => {
  const g = annotate("Die Kinder helfen der Mutter.", lex).flatMap((x) => x.words).filter((w) => w.gender).map((w) => `${w.text}=${w.gender}`);
  assert.deepEqual(g, ["Kinder=pl", "Mutter.=f"]);
});
