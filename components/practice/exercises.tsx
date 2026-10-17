"use client";
import { useEffect, useRef, useState } from "react";
import { BLANK_RE } from "@/lib/grading/exact";
import { CASE_NAMES, CASES, PART_LABELS, PARTS, type Answer, type Exercise, type Part } from "@/lib/types";
import { CaseBlock } from "../AnnotatedSentence";
import { BigInput, noFix } from "../BigInput";
import { CASE_VAR, PART_VAR } from "../colors";
import { trackFocus } from "../insert";
import { UmlautBar } from "../UmlautBar";

export interface ExProps<T extends Exercise["type"]> {
  ex: Extract<Exercise, { type: T }>;
  onSubmit: (a: Answer, extra?: { over_time?: boolean }) => void;
  busy: boolean;
}

const Prompt = ({ children, lang }: { children: React.ReactNode; lang?: string }) => (
  <p lang={lang} className="text-[26px] font-medium leading-snug sm:text-[28px]">
    {children}
  </p>
);
const Hint = ({ children }: { children: React.ReactNode }) => <p className="text-[17px] text-muted">{children}</p>;

function CheckButton({ onClick, disabled, label = "Check" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn btn-primary min-w-40">
      {label} <span className="text-sm opacity-60">↵</span>
    </button>
  );
}

function TextAnswer({ initial = "", onSubmit, busy, placeholder = "Deutsch …", lang = "de", umlauts = true }: {
  initial?: string;
  onSubmit: (text: string) => void;
  busy: boolean;
  placeholder?: string;
  lang?: string;
  umlauts?: boolean;
}) {
  const [v, setV] = useState(initial);
  const submit = () => v.trim() && !busy && onSubmit(v);
  return (
    <div className="space-y-4">
      <BigInput value={v} onChange={setV} onEnter={submit} placeholder={placeholder} autoFocus lang={lang} disabled={busy} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        {umlauts ? <UmlautBar /> : <span />}
        <CheckButton onClick={submit} disabled={!v.trim() || busy} />
      </div>
    </div>
  );
}

// ───────── 1. Mongolian → German
export function TranslateMnDeEx({ ex, onSubmit, busy }: ExProps<"translate_mn_de">) {
  const glosses = ex.payload.glosses?.split("·").map((g) => g.trim()).filter(Boolean) ?? [];
  return (
    <div className="space-y-5">
      <Prompt lang="mn">{ex.payload.mongolian}</Prompt>
      {glosses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {glosses.map((g, i) => (
            <span key={i} lang="de" className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[17px]">
              {g}
            </span>
          ))}
        </div>
      )}
      <TextAnswer onSubmit={(text) => onSubmit({ text })} busy={busy} />
    </div>
  );
}

// ───────── 2. German → Mongolian (self-graded)
export function TranslateDeMnEx({ ex, onSubmit, busy }: ExProps<"translate_de_mn">) {
  const [v, setV] = useState("");
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-5">
      <Prompt lang="de">{ex.payload.german}</Prompt>
      <BigInput value={v} onChange={setV} onEnter={() => setShown(true)} placeholder="Монголоор …" autoFocus lang="mn" disabled={shown} />
      {!shown ? (
        <div className="flex justify-end">
          <CheckButton onClick={() => setShown(true)} label="Show answer" />
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-surface-2 p-4">
          <Hint>Model answer</Hint>
          <p lang="mn" className="text-[24px] font-medium">{ex.payload.answer}</p>
          <div className="flex flex-wrap gap-3">
            <button disabled={busy} onClick={() => onSubmit({ text: v, self: "got" })} className="btn min-w-40 border-ok bg-ok-bg text-ok">
              ✓ Got it
            </button>
            <button disabled={busy} onClick={() => onSubmit({ text: v, self: "missed" })} className="btn min-w-40 border-bad bg-bad-bg text-bad">
              ✗ Missed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────── 3. Fill the gaps
export function FillBlankEx({ ex, onSubmit, busy }: ExProps<"fill_blank">) {
  const pieces = ex.payload.text.split(BLANK_RE);
  const n = pieces.length - 1;
  const [vals, setVals] = useState<string[]>(() => new Array(n).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    const el = refs.current[0];
    if (el) {
      el.focus({ preventScroll: true });
      trackFocus(el);
    }
  }, []);
  const submit = () => !busy && onSubmit({ blanks: vals });
  return (
    <div className="space-y-5">
      {ex.payload.mongolian && <Hint><span lang="mn">{ex.payload.mongolian}</span></Hint>}
      <div lang="de" className="flex flex-wrap items-center gap-y-3 text-[26px] font-medium leading-tight">
        {pieces.map((p, i) => (
          <span key={i} className="contents">
            {p && <span className="whitespace-pre-wrap">{p}</span>}
            {i < n && (
              <input
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={vals[i]}
                disabled={busy}
                onFocus={(e) => trackFocus(e.currentTarget)}
                onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (i < n - 1) refs.current[i + 1]?.focus();
                  else submit();
                }}
                {...noFix}
                aria-label={`Gap ${i + 1}`}
                style={{ width: `${Math.max(3, Math.max(...ex.payload.blanks[i].map((b) => b.length)) + 2)}ch` }}
                className="mx-1 h-16 rounded-xl border-2 border-dashed border-accent/60 bg-surface px-2 text-center text-[24px] outline-none focus:border-solid focus:border-accent"
              />
            )}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <UmlautBar />
        <CheckButton onClick={submit} disabled={busy} />
      </div>
    </div>
  );
}

// ───────── 4. Find the mistake
export function ErrorHuntEx({ ex, onSubmit, busy }: ExProps<"error_hunt">) {
  return (
    <div className="space-y-5">
      <Hint>One mistake. Write the corrected sentence.</Hint>
      <Prompt lang="de">{ex.payload.sentence}</Prompt>
      {ex.payload.mongolian && <Hint><span lang="mn">{ex.payload.mongolian}</span></Hint>}
      <TextAnswer initial={ex.payload.sentence} onSubmit={(text) => onSubmit({ text })} busy={busy} />
    </div>
  );
}

// ───────── 5. Transform
export function TransformEx({ ex, onSubmit, busy }: ExProps<"transform">) {
  return (
    <div className="space-y-5">
      <span className="inline-block rounded-lg bg-text px-3 py-1.5 text-[18px] font-semibold text-surface">{ex.payload.instruction}</span>
      <Prompt lang="de">{ex.payload.source}</Prompt>
      <TextAnswer onSubmit={(text) => onSubmit({ text })} busy={busy} />
    </div>
  );
}

// ───────── 6. Name the case
export function NameCaseEx({ ex, onSubmit, busy }: ExProps<"name_case">) {
  const { sentence, highlight } = ex.payload;
  const at = sentence.indexOf(highlight);
  return (
    <div className="space-y-6">
      <Prompt lang="de">
        {sentence.slice(0, at)}
        <CaseBlock c="?">{highlight}</CaseBlock>
        {sentence.slice(at + highlight.length)}
      </Prompt>
      <Hint>Which case is the marked block?</Hint>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CASES.map((c) => (
          <button
            key={c}
            disabled={busy}
            onClick={() => onSubmit({ case: c })}
            className="flex min-h-24 flex-col items-center justify-center rounded-2xl border-[3px] bg-surface active:scale-[0.97]"
            style={{ borderColor: CASE_VAR[c] }}
          >
            <span className="text-3xl font-extrabold" style={{ color: CASE_VAR[c] }}>{c}</span>
            <span className="text-[16px] font-semibold">{CASE_NAMES[c].de}</span>
            <span className="text-[14px] text-muted">{CASE_NAMES[c].mn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────── 7. Speed
export function SpeedEx({ ex, onSubmit, busy }: ExProps<"speed">) {
  const limit = (ex.payload.seconds ?? 8) * 1000;
  const start = useRef(performance.now());
  const [left, setLeft] = useState(limit);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const l = Math.max(0, limit - (performance.now() - start.current));
      setLeft(l);
      if (l > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [limit]);
  const over = left <= 0;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${(left / limit) * 100}%`, background: left < limit * 0.3 ? "var(--bad)" : "var(--accent)" }}
          />
        </div>
        <span className={`w-14 text-right text-xl font-bold tabular-nums ${over ? "text-bad" : ""}`}>{(left / 1000).toFixed(1)}</span>
      </div>
      <p lang="de" className="text-center text-[34px] font-bold">{ex.payload.prompt}</p>
      {over && <p className="text-center font-semibold text-bad">Time&apos;s up — finish it anyway, but no points.</p>}
      <TextAnswer onSubmit={(text) => onSubmit({ text }, { over_time: performance.now() - start.current > limit })} busy={busy} />
    </div>
  );
}

// ───────── 8. Sentence parts (Module 0)
export function LabelPartsEx({ ex, onSubmit, busy }: ExProps<"label_parts">) {
  const toks = ex.payload.tokens;
  const [parts, setParts] = useState<(Part | null)[]>(() => toks.map(() => null));
  const [active, setActive] = useState<Part>("S");
  const done = parts.every(Boolean);
  return (
    <div className="space-y-6">
      <Hint>Pick a part, then tap each word that has that role.</Hint>
      <div className="flex flex-wrap gap-2">
        {PARTS.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            aria-pressed={active === p}
            className="flex min-h-14 min-w-16 flex-col items-center justify-center rounded-xl border-[3px] px-3 font-extrabold"
            style={{
              borderColor: PART_VAR[p],
              background: active === p ? PART_VAR[p] : "var(--surface)",
              color: active === p ? "#fff" : PART_VAR[p],
            }}
          >
            <span className="text-lg leading-none">{p}</span>
            <span className="mt-0.5 text-[11px] font-semibold opacity-80">{PART_LABELS[p]}</span>
          </button>
        ))}
      </div>
      <div lang="mn" className="flex flex-wrap gap-3">
        {toks.map((t, i) => {
          const p = parts[i];
          return (
            <button
              key={i}
              disabled={busy}
              onClick={() => setParts((ps) => ps.map((x, j) => (j === i ? (x === active ? null : active) : x)))}
              className="relative min-h-16 rounded-2xl border-[3px] px-5 pb-2 pt-4 text-[26px] font-medium"
              style={{ borderColor: p ? PART_VAR[p] : "var(--border)", background: p ? `color-mix(in srgb, ${PART_VAR[p]} 14%, var(--surface))` : "var(--surface)" }}
            >
              {p && (
                <span className="absolute left-2 top-1 text-[12px] font-extrabold" style={{ color: PART_VAR[p] }}>
                  {p}
                </span>
              )}
              {t.text}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <CheckButton onClick={() => onSubmit({ parts: parts.map((p) => p ?? "") })} disabled={!done || busy} />
      </div>
    </div>
  );
}

export function ExerciseInput({ ex, onSubmit, busy }: { ex: Exercise; onSubmit: ExProps<Exercise["type"]>["onSubmit"]; busy: boolean }) {
  const p = { onSubmit, busy };
  switch (ex.type) {
    case "translate_mn_de": return <TranslateMnDeEx ex={ex} {...p} />;
    case "translate_de_mn": return <TranslateDeMnEx ex={ex} {...p} />;
    case "fill_blank": return <FillBlankEx ex={ex} {...p} />;
    case "error_hunt": return <ErrorHuntEx ex={ex} {...p} />;
    case "transform": return <TransformEx ex={ex} {...p} />;
    case "name_case": return <NameCaseEx ex={ex} {...p} />;
    case "speed": return <SpeedEx ex={ex} {...p} />;
    case "label_parts": return <LabelPartsEx ex={ex} {...p} />;
  }
}
