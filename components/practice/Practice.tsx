"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLexicon } from "@/lib/annotate";
import type { GradeResult } from "@/lib/grading/exact";
import type { Mode } from "@/lib/queue";
import { TYPE_LABELS, type Answer, type Attempt, type Exercise, type Vocab } from "@/lib/types";
import { FloatingPanel, useDrawerMode } from "../FloatingPanel";
import { TablesContent } from "../TablesContent";
import { TopBar } from "../TopBar";
import { useSettings } from "../useSettings";
import { VocabList } from "../VocabList";
import { ExerciseInput } from "./exercises";
import { Feedback, type Graded } from "./Feedback";
import { promptOf } from "@/lib/prompt";

interface Score {
  points: number;
  streak: number;
  best: number;
  answered: number;
  correct: number;
}
interface LogEntry {
  ex: Exercise;
  correct: boolean;
  points: number;
}

type Phase = "answer" | "feedback" | "done";

export function Practice({
  title,
  mode,
  exercises,
  vocab,
  setTitles,
}: {
  title: string;
  mode: Mode;
  exercises: Exercise[];
  vocab: Vocab[];
  setTitles: Record<string, string>;
}) {
  const [settings] = useSettings();
  const drawer = useDrawerMode();
  const lex = useMemo(() => buildLexicon(vocab), [vocab]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>(exercises.length ? "answer" : "done");
  const [round, setRound] = useState(0); // remounts the input on retry
  const [isRetry, setIsRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [score, setScore] = useState<Score>({ points: 0, streak: 0, best: 0, answered: 0, correct: 0 });
  const [log, setLog] = useState<LogEntry[]>([]);

  const [panels, setPanels] = useState({ vocab: false, tables: false });
  const [docks, setDocks] = useState<Record<string, { side: "left" | "right"; width: number } | null>>({});

  // per-exercise tracking
  const startedAt = useRef(Date.now());
  const tablesUsed = useRef(false);
  const tablesOpened = useRef(new Set<string>());
  const currentTab = useRef("verben");
  const [tablesFlag, setTablesFlag] = useState(false);

  const ex = exercises[idx];
  const answering = phase === "answer";

  const markTables = useCallback(() => {
    tablesUsed.current = true;
    tablesOpened.current.add(currentTab.current);
    setTablesFlag(true);
  }, []);

  // A new exercise (or retry) starts: reset the clock and the tables tracking.
  useEffect(() => {
    startedAt.current = Date.now();
    tablesUsed.current = false;
    tablesOpened.current = new Set();
    setTablesFlag(false);
    if (panels.tables) markTables();
  }, [idx, round]);

  useEffect(() => {
    if (panels.tables && answering) markTables();
  }, [panels.tables, answering, markTables]);

  const onTab = useCallback(
    (tab: string) => {
      currentTab.current = tab;
      if (answering && panels.tables) markTables();
    },
    [answering, panels.tables, markTables],
  );

  const onDockChange = useCallback((id: string, d: { side: "left" | "right"; width: number } | null) => {
    setDocks((prev) => (prev[id]?.side === d?.side && prev[id]?.width === d?.width ? prev : { ...prev, [id]: d }));
  }, []);
  const pad = { left: 0, right: 0 };
  for (const d of Object.values(docks)) if (d) pad[d.side] = Math.max(pad[d.side], d.width);

  const submit = async (answer: Answer, extra?: { over_time?: boolean }) => {
    if (!ex || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exercise_id: ex.id,
          answer,
          tables_used: tablesUsed.current,
          tables_opened: [...tablesOpened.current],
          seconds_taken: Math.round((Date.now() - startedAt.current) / 1000),
          over_time: extra?.over_time,
          is_retry: isRetry,
          umlautEquivalence: settings.umlautEquivalence,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
      const data = (await res.json()) as { attempt: Attempt; result: GradeResult };
      setGraded({ ...data, answer, overTime: ex.type === "speed" && !!extra?.over_time });
      setFlagged(false);
      setPhase("feedback");
      setScore((s) => {
        const points = s.points + data.attempt.points;
        if (isRetry) return { ...s, points };
        const streak = data.result.correct ? s.streak + 1 : 0;
        return {
          points,
          streak,
          best: Math.max(s.best, streak),
          answered: s.answered + 1,
          correct: s.correct + (data.result.correct ? 1 : 0),
        };
      });
      if (!isRetry) setLog((l) => [...l, { ex, correct: data.result.correct, points: data.attempt.points }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const next = useCallback(() => {
    setGraded(null);
    setIsRetry(false);
    if (idx + 1 >= exercises.length) setPhase("done");
    else {
      setIdx(idx + 1);
      setPhase("answer");
    }
  }, [idx, exercises.length]);

  const retry = () => {
    setGraded(null);
    setIsRetry(true);
    setRound((r) => r + 1);
    setPhase("answer");
  };

  const flag = async () => {
    if (!graded) return;
    const value = !flagged;
    setFlagged(value);
    await fetch(`/api/attempts/${graded.attempt.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flagged: value }),
    }).catch(() => setFlagged(!value));
  };

  // Enter = Next on the feedback screen (ignore the keypress that submitted)
  const feedbackAt = useRef(0);
  useEffect(() => {
    if (phase === "feedback") feedbackAt.current = Date.now();
  }, [phase]);
  useEffect(() => {
    if (phase !== "feedback") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat && Date.now() - feedbackAt.current > 250 && !(e.target as HTMLElement).closest("button")) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, next]);

  const setVocab = ex ? vocab.filter((v) => v.set_id === ex.set_id) : [];
  const total = exercises.length;

  return (
    <>
      <TopBar>
        <Link href="/" className="tb-btn text-xl" aria-label="Back to home">
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{title}</div>
          <div className="flex items-center gap-3 text-[15px] tabular-nums text-muted">
            <span title="Points / set total">
              ★ <b className="text-text">{score.points}</b> / {total}
            </span>
            <span title="Streak">🔥 <b className="text-text">{score.streak}</b></span>
            <span title="Progress">
              {Math.min(idx + 1, total)}/{total}
            </span>
          </div>
        </div>
        <button className="tb-btn border-border" aria-pressed={panels.vocab} onClick={() => setPanels((p) => ({ ...p, vocab: !p.vocab }))}>
          Wörter
        </button>
        <button className="tb-btn border-border" aria-pressed={panels.tables} onClick={() => setPanels((p) => ({ ...p, tables: !p.tables }))}>
          Tabellen
        </button>
      </TopBar>

      <div className="h-1 bg-surface-2">
        <div className="h-full bg-accent transition-all" style={{ width: `${total ? ((phase === "done" ? total : idx) / total) * 100 : 0}%` }} />
      </div>

      <main
        className="px-4 pb-24 pt-6 transition-[padding] sm:px-6"
        style={drawer ? undefined : { paddingLeft: pad.left ? pad.left + 24 : undefined, paddingRight: pad.right ? pad.right + 24 : undefined }}
      >
        <div className="mx-auto max-w-3xl">
          {phase === "done" ? (
            <Summary score={score} log={log} total={total} mode={mode} />
          ) : (
            ex && (
              <div className="card p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center gap-2 text-[14px]">
                  <span className="rounded-md bg-surface-2 px-2 py-1 font-semibold">{TYPE_LABELS[ex.type]}</span>
                  {mode !== "set" && <span className="text-muted">{setTitles[ex.set_id]}</span>}
                  {isRetry && <span className="rounded-md bg-bad-bg px-2 py-1 font-semibold text-bad">Retry · 0 points</span>}
                  {tablesFlag && answering && (
                    <span className="rounded-md bg-mark px-2 py-1 font-semibold">Tables opened · max 0.5</span>
                  )}
                </div>
                {answering && <ExerciseInput key={`${ex.id}-${round}`} ex={ex} onSubmit={submit} busy={busy} />}
                {phase === "feedback" && graded && (
                  <Feedback
                    ex={ex}
                    graded={graded}
                    lex={lex}
                    flagged={flagged}
                    onFlag={flag}
                    onRetry={retry}
                    onNext={next}
                    isLast={idx + 1 >= total}
                  />
                )}
                {error && <p className="mt-4 rounded-xl bg-bad-bg px-4 py-3 text-bad">Could not save: {error}</p>}
              </div>
            )
          )}
        </div>
      </main>

      <FloatingPanel
        id="vocab"
        title="Wörterliste"
        open={panels.vocab}
        onClose={() => setPanels((p) => ({ ...p, vocab: false }))}
        defaultDock="left"
        drawer={drawer}
        onDockChange={onDockChange}
      >
        <VocabList vocab={setVocab} setTitle={ex ? setTitles[ex.set_id] : undefined} />
      </FloatingPanel>
      <FloatingPanel
        id="tables"
        title={<>Tabellen {answering && <span className="ml-1 text-xs font-normal text-muted">(counts as help)</span>}</>}
        open={panels.tables}
        onClose={() => setPanels((p) => ({ ...p, tables: false }))}
        defaultDock="right"
        drawer={drawer}
        onDockChange={onDockChange}
      >
        <TablesContent onTab={onTab} />
      </FloatingPanel>
    </>
  );
}

function Summary({ score, log, total, mode }: { score: Score; log: LogEntry[]; total: number; mode: Mode }) {
  const wrong = log.filter((l) => !l.correct);
  const acc = score.answered ? Math.round((score.correct / score.answered) * 100) : 0;
  return (
    <div className="card space-y-6 p-6 sm:p-8">
      <h1 className="text-3xl font-bold">{total === 0 ? "Nothing to practice" : "Fertig!"}</h1>
      {total === 0 ? (
        <p className="text-lg text-muted">
          {mode === "mistakes" ? "No open mistakes from the last 7 days. 🎉" : "There are no exercises yet — import a set first."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Points" value={`${score.points} / ${total}`} />
          <Stat label="Accuracy" value={`${acc}%`} />
          <Stat label="Correct" value={`${score.correct} / ${score.answered}`} />
          <Stat label="Best streak" value={String(score.best)} />
        </div>
      )}
      {wrong.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">Mistakes</h2>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {wrong.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-[17px]">
                <span className="truncate">{promptOf(l.ex)}</span>
                <span className="shrink-0 font-mono text-xs text-muted">{l.ex.tags.join(" ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => location.reload()} className="btn btn-primary">
          Again
        </button>
        {wrong.length > 0 && (
          <a href="/practice?mode=mistakes" className="btn">
            Practice mistakes
          </a>
        )}
        <Link href="/" className="btn">
          Home
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
