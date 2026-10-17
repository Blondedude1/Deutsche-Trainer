import type { Attempt, Exercise } from "./types";

export type Mode = "set" | "mixed" | "mistakes" | "weakest";

export const MODE_LABELS: Record<Mode, string> = {
  set: "Practice set",
  mixed: "Mixed",
  mistakes: "Mistakes only",
  weakest: "Weakest first",
};

const MIXED_SIZE = 25;
const WEAKEST_SIZE = 20;
const MISTAKES_DAYS = 7;
const ACCURACY_WINDOW = 50;

export function shuffle<T>(a: T[]): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/** Per-tag accuracy over the given attempts (retries left out: they follow a shown answer). */
export function tagAccuracy(attempts: Attempt[], byId: Map<string, Exercise>) {
  const acc = new Map<string, { n: number; correct: number }>();
  for (const a of attempts) {
    if (a.is_retry) continue;
    const ex = byId.get(a.exercise_id);
    if (!ex) continue;
    for (const t of ex.tags) {
      const s = acc.get(t) ?? { n: 0, correct: 0 };
      s.n++;
      if (a.correct) s.correct++;
      acc.set(t, s);
    }
  }
  return acc;
}

/** Exercises with a wrong attempt in the last 7 days that were not answered correctly since. */
export function mistakesQueue(all: Exercise[], recent: Attempt[]): Exercise[] {
  const since = daysAgo(MISTAKES_DAYS);
  const lastWrong = new Map<string, string>();
  const lastRight = new Map<string, string>();
  for (const a of recent) {
    if (a.created_at < since) continue;
    const m = a.correct ? lastRight : lastWrong;
    if ((m.get(a.exercise_id) ?? "") < a.created_at) m.set(a.exercise_id, a.created_at);
  }
  const ids = [...lastWrong.entries()]
    .filter(([id, t]) => (lastRight.get(id) ?? "") < t)
    .sort((x, y) => y[1].localeCompare(x[1]))
    .map(([id]) => id);
  const byId = new Map(all.map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter((e): e is Exercise => !!e);
}

/** Exercises whose weakest tag has the lowest accuracy in the last 50 attempts. Untried tags rank just after weak ones. */
export function weakestQueue(all: Exercise[], last: Attempt[]): Exercise[] {
  const byId = new Map(all.map((e) => [e.id, e]));
  const acc = tagAccuracy(last.slice(0, ACCURACY_WINDOW), byId);
  const score = (e: Exercise) =>
    Math.min(...e.tags.map((t) => {
      const s = acc.get(t);
      return s ? s.correct / s.n : 0.6;
    }));
  return shuffle(all)
    .map((e) => ({ e, s: score(e) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, WEAKEST_SIZE)
    .map((x) => x.e);
}

export function mixedQueue(all: Exercise[]): Exercise[] {
  return shuffle(all).slice(0, MIXED_SIZE);
}
