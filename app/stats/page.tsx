import { cookies } from "next/headers";
import { BarChart } from "@/components/BarChart";
import { FlagActions } from "@/components/FlagActions";
import { TopBar } from "@/components/TopBar";
import { repo } from "@/lib/db";
import { promptOf } from "@/lib/prompt";
import { daysAgo } from "@/lib/queue";
import { dayKey, perCategory, perDay, tablesShare } from "@/lib/stats";

export const dynamic = "force-dynamic";

const pct = (v: number) => `${Math.round(v * 100)}%`;

export default async function StatsPage() {
  const tz = decodeURIComponent((await cookies()).get("dt_tz")?.value ?? "") || process.env.APP_TIMEZONE || "UTC";
  const db = repo();
  const [recent14, last50, flagged, exercises] = await Promise.all([
    db.getAttempts({ since: daysAgo(15) }),
    db.getAttempts({ limit: 50 }),
    db.getAttempts({ flagged: true }),
    db.getExercises(),
  ]);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const days = perDay(recent14, 14, tz);
  const cats = perCategory(last50, byId);
  const t14 = tablesShare(recent14);
  const t50 = tablesShare(last50);
  const ds = days.map((d) => d.day);

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-5xl space-y-8 p-4 pb-16 sm:p-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Attempts (14 d)" value={String(days.reduce((s, d) => s + d.attempts, 0))} />
          <Tile label="Accuracy (last 50)" value={last50.length ? pct(last50.filter((a) => a.correct).length / last50.length) : "—"} />
          <Tile label="Points (14 d)" value={String(days.reduce((s, d) => s + d.points, 0))} />
          <Tile
            label="Correct that needed tables (last 50)"
            value={t50.correct ? pct(t50.withTables / t50.correct) : "—"}
            hint="goal: 0%"
          />
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Last 14 days</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <BarChart title="Attempts per day" days={ds} values={days.map((d) => d.attempts)} format="count" />
            <BarChart title="Accuracy per day" days={ds} values={days.map((d) => (d.attempts ? d.correct / d.attempts : null))} max={1} format="percent" />
            <BarChart title="Points per day" days={ds} values={days.map((d) => d.points)} format="count" />
            <BarChart
              title="Correct answers that needed tables"
              sub={`goal: 0% · 14-day total ${t14.correct ? pct(t14.withTables / t14.correct) : "—"}`}
              days={ds}
              values={days.map((d) => (d.correct ? d.correctWithTables / d.correct : null))}
              max={1}
              format="percent"
            />
          </div>
          <details className="mt-3 text-[15px]">
            <summary className="cursor-pointer text-muted">Show as table</summary>
            <table className="tbl mt-2 w-full">
              <thead>
                <tr><th>Day</th><th>Attempts</th><th>Correct</th><th>Accuracy</th><th>Points</th><th>Needed tables</th></tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.day}>
                    <th>{d.day}</th>
                    <td>{d.attempts}</td>
                    <td>{d.correct}</td>
                    <td>{d.attempts ? pct(d.correct / d.attempts) : "—"}</td>
                    <td>{d.points}</td>
                    <td>{d.correct ? `${d.correctWithTables} (${pct(d.correctWithTables / d.correct)})` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section>
          <h2 className="mb-1 text-xl font-bold">Categories — last 50 attempts</h2>
          <p className="mb-3 text-sm text-muted">Worst first. Retries are left out.</p>
          {cats.length === 0 ? (
            <p className="card p-5 text-muted">No attempts yet.</p>
          ) : (
            <ul className="card divide-y divide-border overflow-hidden">
              {cats.map((c) => (
                <li key={c.category} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 px-4 py-3">
                  <span className="truncate font-mono text-[15px]">{c.category}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <span className="block h-full rounded-full bg-accent" style={{ width: pct(c.accuracy) }} />
                  </span>
                  <span className="w-36 text-right text-[15px] tabular-nums">
                    <b>{pct(c.accuracy)}</b> <span className="text-muted">· {c.mistakes} mistake{c.mistakes === 1 ? "" : "s"} / {c.attempts}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-xl font-bold">Flagged attempts</h2>
          <p className="mb-3 text-sm text-muted">Accept = mark as correct and accept this answer next time.</p>
          {flagged.length === 0 ? (
            <p className="card p-5 text-muted">Nothing flagged.</p>
          ) : (
            <ul className="card divide-y divide-border overflow-hidden">
              {flagged.map((a) => {
                const ex = byId.get(a.exercise_id);
                const ans = a.answer as Record<string, unknown>;
                const shown = "text" in ans ? String(ans.text) : "blanks" in ans ? (ans.blanks as string[]).join(" | ") : "case" in ans ? String(ans.case) : (ans.parts as string[]).join(" ");
                const expected = ex ? ("answer" in ex.payload ? String(ex.payload.answer) : "blanks" in ex.payload ? ex.payload.blanks.map((b) => b[0]).join(" | ") : "") : "";
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="truncate text-[15px] text-muted">{ex ? promptOf(ex) : "(deleted exercise)"}</div>
                      <div className="text-[17px]">
                        <span className={a.correct ? "text-ok" : "text-bad"}>{shown || "(empty)"}</span>
                        {expected && !a.correct && <span className="text-muted"> → {expected}</span>}
                      </div>
                      <div className="text-xs text-muted">
                        {dayKey(a.created_at, tz)} · {a.graded_by}
                        {a.graded_by === "manual" && " · accepted ✓"}
                      </div>
                    </div>
                    <FlagActions id={a.id} accepted={a.graded_by === "manual"} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
