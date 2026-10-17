import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { Attempt, Exercise, ExerciseSet, Vocab } from "../types";
import type { Repo } from "./repo";

/**
 * Development/testing backend: everything in .data/db.json.
 * Not for Vercel (read-only filesystem) — use Supabase there.
 */
interface Store {
  sets: ExerciseSet[];
  exercises: Exercise[];
  vocab: Vocab[];
  attempts: Attempt[];
}

const FILE = path.join(process.cwd(), ".data", "db.json");

function load(): Store {
  if (!existsSync(FILE)) return { sets: [], exercises: [], vocab: [], attempts: [] };
  return JSON.parse(readFileSync(FILE, "utf8")) as Store;
}
function save(s: Store) {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(s, null, 1));
}

export const localRepo: Repo = {
  async listSets() {
    const s = load();
    return [...s.sets]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((set) => ({ ...set, exercise_count: s.exercises.filter((e) => e.set_id === set.id).length }));
  },
  async getSet(id) {
    return load().sets.find((x) => x.id === id) ?? null;
  },
  async getExercises(filter) {
    let ex = load().exercises;
    if (filter?.setId) ex = ex.filter((e) => e.set_id === filter.setId);
    if (filter?.ids) ex = ex.filter((e) => filter.ids!.includes(e.id));
    return ex.sort((a, b) => a.set_id.localeCompare(b.set_id) || a.position - b.position);
  },
  async getVocab(setIds) {
    const v = load().vocab;
    return (setIds ? v.filter((x) => setIds.includes(x.set_id)) : v).sort((a, b) => a.german.localeCompare(b.german));
  },
  async createSet(input) {
    const s = load();
    const id = randomUUID();
    s.sets.push({ id, title: input.title, source_note: input.source_note ?? null, created_at: new Date().toISOString() });
    for (const v of input.vocab)
      s.vocab.push({
        id: randomUUID(),
        set_id: id,
        german: v.german,
        article: v.article ?? null,
        plural: v.plural ?? null,
        mongolian: v.mongolian,
        kind: v.kind,
        irregular: v.irregular ?? false,
      });
    input.exercises.forEach((e, position) => {
      const { type, tags, ...payload } = e;
      s.exercises.push({ id: randomUUID(), set_id: id, position, type, tags, payload } as unknown as Exercise);
    });
    save(s);
    return id;
  },
  async deleteSet(id) {
    const s = load();
    const exIds = new Set(s.exercises.filter((e) => e.set_id === id).map((e) => e.id));
    save({
      sets: s.sets.filter((x) => x.id !== id),
      exercises: s.exercises.filter((e) => e.set_id !== id),
      vocab: s.vocab.filter((v) => v.set_id !== id),
      attempts: s.attempts.filter((a) => !exIds.has(a.exercise_id)),
    });
  },
  async updateExercisePayload(id, payload) {
    const s = load();
    const ex = s.exercises.find((e) => e.id === id);
    if (ex) ex.payload = payload as never;
    save(s);
  },
  async insertAttempt(a) {
    const s = load();
    const row: Attempt = { ...a, id: randomUUID(), created_at: new Date().toISOString() };
    s.attempts.push(row);
    save(s);
    return row;
  },
  async updateAttempt(id, patch) {
    const s = load();
    const row = s.attempts.find((a) => a.id === id);
    if (!row) throw new Error("Attempt not found");
    Object.assign(row, patch);
    save(s);
    return row;
  },
  async getAttempt(id) {
    return load().attempts.find((a) => a.id === id) ?? null;
  },
  async getAttempts(q = {}) {
    let a = [...load().attempts].sort((x, y) => y.created_at.localeCompare(x.created_at));
    if (q.since) a = a.filter((x) => x.created_at >= q.since!);
    if (q.flagged !== undefined) a = a.filter((x) => x.flagged === q.flagged);
    return q.limit ? a.slice(0, q.limit) : a;
  },
};
