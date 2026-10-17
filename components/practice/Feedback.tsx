"use client";
import { annotate, phraseRange, type Lexicon } from "@/lib/annotate";
import { words } from "@/lib/diff";
import { BLANK_RE, type GradeResult } from "@/lib/grading/exact";
import { CASE_NAMES, PART_LABELS, type Answer, type Attempt, type Case, type Exercise } from "@/lib/types";
import { AnnotatedSentence, CaseChip } from "../AnnotatedSentence";
import { PART_VAR } from "../colors";

export interface Graded {
  attempt: Attempt;
  result: GradeResult;
  answer: Answer;
  overTime?: boolean;
}

/** Word indices (in the filled sentence) that each gap lands on. */
function gapWordIndex(text: string, fills: string[]): number[] {
  let i = 0;
  const marked = text.replace(BLANK_RE, () => `\u0001${i}\u0001${fills[i++] ?? ""}`);
  const out: number[] = [];
  words(marked).forEach((w, wi) => {
    for (const m of w.matchAll(/\u0001(\d+)\u0001/g)) out[Number(m[1])] = wi;
  });
  return out;
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="text-[24px] font-medium">{children}</div>
    </div>
  );
}

function UserWords({ ws }: { ws: { text: string; ok: boolean }[] }) {
  return (
    <span className="inline-flex flex-wrap gap-x-[0.3em]">
      {ws.map((w, i) => (
        <span key={i} className={w.ok ? "" : "rounded bg-bad-bg px-0.5 text-bad line-through decoration-2"}>
          {w.text}
        </span>
      ))}
      {ws.length === 0 && <span className="text-muted">(empty)</span>}
    </span>
  );
}

export function Feedback({
  ex,
  graded,
  lex,
  flagged,
  onFlag,
  onRetry,
  onNext,
  isLast,
}: {
  ex: Exercise;
  graded: Graded;
  lex: Lexicon;
  flagged: boolean;
  onFlag: () => void;
  onRetry: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const { result, attempt, answer } = graded;
  const ok = result.correct;
  const pts = attempt.points;

  let body: React.ReactNode;
  const marked = "marked" in ex.payload ? ex.payload.marked : undefined;

  switch (ex.type) {
    case "translate_mn_de":
    case "error_hunt":
    case "transform":
    case "speed": {
      const marks = new Set<number>();
      result.diff?.expected.forEach((w, i) => !w.ok && marks.add(i));
      const groups = annotate(result.expected, lex, { marked: result.expected === ex.payload.answer ? marked : undefined });
      body = (
        <>
          {!ok && result.diff && (
            <Line label="Your answer">
              <UserWords ws={result.diff.user} />
            </Line>
          )}
          <Line label={ok ? "Correct" : "Correct answer"}>
            <AnnotatedSentence groups={groups} marks={ok ? undefined : marks} />
          </Line>
          {ex.type === "translate_mn_de" && <p lang="mn" className="text-[17px] text-muted">{ex.payload.mongolian}</p>}
        </>
      );
      break;
    }
    case "fill_blank": {
      const given = "blanks" in answer ? answer.blanks : [];
      const idx = gapWordIndex(ex.payload.text, ex.payload.blanks.map((b) => b[0]));
      const marks = new Set(idx.filter((_, i) => !result.gaps?.[i]));
      const pieces = ex.payload.text.split(BLANK_RE);
      body = (
        <>
          {!ok && (
            <Line label="Your answer">
              {pieces.map((p, i) => (
                <span key={i}>
                  {p}
                  {i < pieces.length - 1 && (
                    <span className={`rounded px-1 ${result.gaps?.[i] ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad line-through"}`}>
                      {given[i]?.trim() || "∅"}
                    </span>
                  )}
                </span>
              ))}
            </Line>
          )}
          <Line label={ok ? "Correct" : "Correct answer"}>
            <AnnotatedSentence groups={annotate(result.expected, lex, { marked })} marks={ok ? undefined : marks} />
          </Line>
          {ex.payload.mongolian && <p lang="mn" className="text-[17px] text-muted">{ex.payload.mongolian}</p>}
        </>
      );
      break;
    }
    case "name_case": {
      const range = phraseRange(ex.payload.sentence, ex.payload.highlight);
      const c = ex.payload.answer as Case;
      const groups = annotate(ex.payload.sentence, lex, { marked, overrides: range ? [{ range, case: c }] : [] });
      const picked = "case" in answer ? answer.case : null;
      body = (
        <>
          <Line label="Sentence">
            <AnnotatedSentence groups={groups} />
          </Line>
          <div className="flex flex-wrap items-center gap-2 text-[19px]">
            {!ok && picked && (
              <span className="text-bad line-through">
                {picked} {CASE_NAMES[picked].de}
              </span>
            )}
            <CaseChip c={c} />
            <b>{CASE_NAMES[c].de}</b>
            <span className="text-muted">({CASE_NAMES[c].mn})</span>
          </div>
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-[19px]">{ex.payload.reason}</p>
        </>
      );
      break;
    }
    case "label_parts": {
      const given = "parts" in answer ? answer.parts : [];
      body = (
        <>
          <div lang="mn" className="flex flex-wrap gap-3">
            {ex.payload.tokens.map((t, i) => {
              const right = result.parts?.[i];
              return (
                <div
                  key={i}
                  className="rounded-2xl border-[3px] px-4 py-2 text-[22px]"
                  style={{ borderColor: PART_VAR[t.part] }}
                >
                  <div className="text-[13px] font-extrabold" style={{ color: PART_VAR[t.part] }}>
                    {t.part} · {PART_LABELS[t.part]}
                    {!right && given[i] && <span className="ml-2 text-bad line-through">{given[i]}</span>}
                  </div>
                  {t.text} {right ? <span className="text-ok">✓</span> : <span className="text-bad">✗</span>}
                </div>
              );
            })}
          </div>
          {ex.payload.german && (
            <Line label="German">
              <AnnotatedSentence groups={annotate(ex.payload.german, lex, { marked })} />
            </Line>
          )}
        </>
      );
      break;
    }
    case "translate_de_mn": {
      body = (
        <>
          <Line label="German">
            <AnnotatedSentence groups={annotate(ex.payload.german, lex, { marked })} />
          </Line>
          <Line label="Model answer">
            <span lang="mn">{ex.payload.answer}</span>
          </Line>
          {"text" in answer && answer.text.trim() && (
            <Line label="You wrote">
              <span lang="mn" className="text-muted">{answer.text}</span>
            </Line>
          )}
        </>
      );
      break;
    }
  }

  const headline = ok
    ? graded.overTime
      ? "Correct — but too slow"
      : attempt.is_retry
        ? "Correct (retry)"
        : "Richtig!"
    : "Not quite";

  return (
    <div className="space-y-5">
      <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${ok ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad"}`}>
        <span className="text-[22px] font-bold">
          {ok ? "✓" : "✗"} {headline}
        </span>
        <span className="text-[22px] font-extrabold tabular-nums">+{pts}</span>
      </div>

      <div className="space-y-4">{body}</div>

      <div className="flex flex-wrap items-center gap-2">
        {(ok ? [] : result.error_categories).map((c) => (
          <span key={c} className="rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-sm">
            {c}
          </span>
        ))}
        {ok && <span className="text-sm text-muted">{ex.tags.join(" · ")}</span>}
        {attempt.tables_used && <span className="text-sm text-muted">· tables used ({attempt.tables_opened.join(", ") || "opened"})</span>}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button onClick={onFlag} aria-pressed={flagged} className={`btn ${flagged ? "border-accent text-accent" : ""}`}>
          {flagged ? "⚑ Flagged for review" : ok ? "⚐ Flag" : "⚐ I think I was right"}
        </button>
        <div className="ml-auto flex gap-3">
          {!ok && (
            <button onClick={onRetry} className="btn">
              ↻ Try again
            </button>
          )}
          <button onClick={onNext} className="btn btn-primary min-w-40" autoFocus>
            {isLast ? "Finish" : "Next"} <span className="text-sm opacity-60">↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
