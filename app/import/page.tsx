"use client";
import Link from "next/link";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import demo from "@/data/demo-set.json";

interface Res {
  ok: boolean;
  errors?: string[];
  warnings?: string[];
  id?: string;
  summary?: { vocab: number; exercises: number };
}

export default function ImportPage() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (dry: boolean) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/import${dry ? "?dry=1" : ""}`, { method: "POST", body: text });
      setRes((await r.json()) as Res);
    } catch (e) {
      setRes({ ok: false, errors: [(e as Error).message] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-4xl space-y-4 p-4 pb-16 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold">Import a set</h1>
          <button onClick={() => { setText(JSON.stringify(demo, null, 2)); setRes(null); }} className="btn min-h-12 text-base">
            Load demo JSON
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setRes(null); }}
          placeholder='{ "title": "Übung 11 – Wechselpräpositionen", "vocab": [...], "exercises": [...] }'
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="h-[55dvh] w-full rounded-2xl border-2 border-border bg-surface p-4 font-mono text-[14px] leading-relaxed outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-3">
          <button disabled={!text.trim() || busy} onClick={() => send(true)} className="btn">
            Check
          </button>
          <button disabled={!text.trim() || busy} onClick={() => send(false)} className="btn btn-primary">
            Save as new set
          </button>
        </div>

        {res && (
          <div className={`space-y-2 rounded-2xl border p-4 ${res.ok ? "border-ok bg-ok-bg" : "border-bad bg-bad-bg"}`}>
            {res.ok && res.id && (
              <p className="text-lg font-semibold text-ok">
                Saved. <Link href={`/practice?set=${res.id}`} className="underline">Practice it now →</Link>
              </p>
            )}
            {res.ok && !res.id && res.summary && (
              <p className="text-lg font-semibold text-ok">
                Looks good: {res.summary.exercises} exercises, {res.summary.vocab} words.
              </p>
            )}
            {!!res.errors?.length && (
              <>
                <p className="font-semibold text-bad">{res.errors.length} error{res.errors.length > 1 ? "s" : ""} — nothing was saved:</p>
                <ul className="list-disc space-y-1 pl-6 font-mono text-[14px] text-bad">
                  {res.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </>
            )}
            {!!res.warnings?.length && (
              <ul className="list-disc space-y-1 pl-6 font-mono text-[14px] text-muted">
                {res.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
              </ul>
            )}
          </div>
        )}

        <details className="card p-4 text-[15px]">
          <summary className="cursor-pointer font-semibold">Format reference</summary>
          <div className="mt-3 space-y-2 text-muted">
            <p>Types: translate_mn_de, translate_de_mn, fill_blank, error_hunt, transform, name_case, speed, label_parts.</p>
            <p>Every exercise needs <code>tags</code> from the fixed category list. fill_blank needs one entry in <code>blanks</code> per ___ gap.</p>
            <p>
              Optional on any exercise: <code>&quot;marked&quot;: &quot;Ich gebe [D:dem Kind] [A:den Ball].&quot;</code> — exact case blocks for the feedback view
              (otherwise they are guessed from articles and prepositions). speed may set <code>seconds</code> (default 8).
            </p>
          </div>
        </details>
      </main>
    </>
  );
}
