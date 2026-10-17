import { CATEGORIES, type Attempt, type Exercise } from "./types";

export interface DayStat {
  day: string; // YYYY-MM-DD
  attempts: number;
  correct: number;
  points: number;
  /** correct answers that needed tables */
  correctWithTables: number;
}

export interface CategoryStat {
  category: string;
  attempts: number;
  mistakes: number;
  accuracy: number;
}

/** Local calendar day for a timestamp, in the given IANA zone. */
export const dayKey = (iso: string | Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export function perDay(attempts: Attempt[], days: number, tz: string): DayStat[] {
  const out: DayStat[] = [];
  const index = new Map<string, DayStat>();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(new Date(Date.now() - i * 86_400_000), tz);
    if (index.has(day)) continue;
    const d = { day, attempts: 0, correct: 0, points: 0, correctWithTables: 0 };
    out.push(d);
    index.set(day, d);
  }
  for (const a of attempts) {
    const d = index.get(dayKey(a.created_at, tz));
    if (!d) continue;
    d.attempts++;
    d.points += a.points;
    if (a.correct) {
      d.correct++;
      if (a.tables_used) d.correctWithTables++;
    }
  }
  return out;
}

/** Mistakes and accuracy per category over the given (recent) attempts, worst first. */
export function perCategory(attempts: Attempt[], byId: Map<string, Exercise>): CategoryStat[] {
  const m = new Map<string, { attempts: number; mistakes: number }>();
  const bump = (c: string) => {
    const s = m.get(c) ?? { attempts: 0, mistakes: 0 };
    m.set(c, s);
    return s;
  };
  for (const a of attempts) {
    if (a.is_retry) continue;
    const tags = new Set([...(byId.get(a.exercise_id)?.tags ?? []), ...a.error_categories]);
    for (const t of tags) bump(t).attempts++;
    if (!a.correct) for (const c of new Set(a.error_categories)) bump(c).mistakes++;
  }
  return [...m.entries()]
    .map(([category, s]) => ({ category, ...s, accuracy: s.attempts ? (s.attempts - s.mistakes) / s.attempts : 1 }))
    .sort((a, b) => a.accuracy - b.accuracy || b.mistakes - a.mistakes || CATEGORIES.indexOf(a.category as never) - CATEGORIES.indexOf(b.category as never));
}

export function tablesShare(attempts: Attempt[]): { correct: number; withTables: number } {
  const c = attempts.filter((a) => a.correct);
  return { correct: c.length, withTables: c.filter((a) => a.tables_used).length };
}
