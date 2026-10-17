import Link from "next/link";
import { DeleteSetButton, LogoutButton, SettingsCard } from "@/components/HomeClient";
import { TopBar } from "@/components/TopBar";
import { backend, repo } from "@/lib/db";
import { daysAgo, mistakesQueue } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = repo();
  const [sets, all, recent] = await Promise.all([db.listSets(), db.getExercises(), db.getAttempts({ since: daysAgo(7) })]);
  const openMistakes = mistakesQueue(all, recent).length;
  const today = recent.filter((a) => a.created_at >= daysAgo(1));

  const modes = [
    { href: "/practice?mode=mixed", title: "Mixed", text: "Shuffle across all sets", n: `${Math.min(all.length, 25)} exercises` },
    { href: "/practice?mode=mistakes", title: "Mistakes only", text: "Wrong in the last 7 days", n: `${openMistakes} open` },
    { href: "/practice?mode=weakest", title: "Weakest first", text: "Lowest-accuracy tags in your last 50", n: "20 exercises" },
  ];

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-4xl space-y-8 p-4 pb-16 sm:p-6">
        {backend() === "local" && (
          <p className="rounded-xl bg-mark px-4 py-3 text-[15px]">
            Local data mode: everything is stored in <code>.data/db.json</code>. Set SUPABASE_URL to use Supabase.
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          {modes.map((m) => (
            <Link key={m.href} href={m.href} className="card block p-5 transition active:scale-[0.98]">
              <div className="text-xl font-bold">{m.title}</div>
              <div className="mt-1 text-[15px] text-muted">{m.text}</div>
              <div className="mt-3 text-sm font-semibold text-accent">{m.n} →</div>
            </Link>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Sets</h2>
            <Link href="/import" className="btn min-h-12 text-base">
              + Import
            </Link>
          </div>
          {sets.length === 0 ? (
            <div className="card p-6 text-lg text-muted">
              No sets yet. <Link href="/import" className="font-semibold text-accent underline">Import one</Link> — or load the demo set there.
            </div>
          ) : (
            <ul className="card divide-y divide-border overflow-hidden">
              {sets.map((s) => (
                <li key={s.id} className="flex items-center gap-2 pr-2">
                  <Link href={`/practice?set=${s.id}`} className="flex min-h-[72px] flex-1 flex-col justify-center px-5 py-3 active:bg-surface-2">
                    <span className="text-lg font-semibold">{s.title}</span>
                    <span className="text-sm text-muted">
                      {s.exercise_count} exercises{s.source_note ? ` · ${s.source_note}` : ""}
                    </span>
                  </Link>
                  <DeleteSetButton id={s.id} title={s.title} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Settings</h2>
          <SettingsCard />
          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Last 24 h: {today.length} attempts · {today.reduce((s, a) => s + a.points, 0)} points
            </span>
            <LogoutButton />
          </div>
        </section>
      </main>
    </>
  );
}
