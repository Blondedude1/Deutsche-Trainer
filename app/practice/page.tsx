import { notFound } from "next/navigation";
import { Practice } from "@/components/practice/Practice";
import { repo } from "@/lib/db";
import { MODE_LABELS, daysAgo, mistakesQueue, mixedQueue, weakestQueue, type Mode } from "@/lib/queue";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ mode?: string; set?: string }> }) {
  const sp = await searchParams;
  const mode: Mode = sp.set ? "set" : ((["mixed", "mistakes", "weakest"].includes(sp.mode ?? "") ? sp.mode : "mixed") as Mode);
  const db = repo();
  const [sets, vocab] = await Promise.all([db.listSets(), db.getVocab()]);
  const setTitles = Object.fromEntries(sets.map((s) => [s.id, s.title]));

  let exercises: Exercise[];
  let title: string = MODE_LABELS[mode];
  if (mode === "set") {
    const set = sets.find((s) => s.id === sp.set);
    if (!set) notFound();
    exercises = await db.getExercises({ setId: set.id });
    title = set.title;
  } else {
    const all = await db.getExercises();
    if (mode === "mixed") exercises = mixedQueue(all);
    else if (mode === "mistakes") exercises = mistakesQueue(all, await db.getAttempts({ since: daysAgo(7) }));
    else exercises = weakestQueue(all, await db.getAttempts({ limit: 50 }));
  }

  return <Practice key={`${mode}-${sp.set ?? ""}-${Date.now()}`} title={title} mode={mode} exercises={exercises} vocab={vocab} setTitles={setTitles} />;
}
