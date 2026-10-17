import type { AnnGroup } from "@/lib/annotate";
import type { Case } from "@/lib/types";
import { CASE_VAR, GENDER_VAR } from "./colors";

/** Correct sentence with nouns in gender color and case blocks outlined. `marks` = word indices to highlight as differing. */
export function AnnotatedSentence({ groups, marks, className = "" }: { groups: AnnGroup[]; marks?: Set<number>; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-[0.3em] gap-y-1 leading-snug ${className}`}>
      {groups.map((g, gi) => {
        const ws = g.words.map((w) => (
          <span
            key={w.index}
            className={`${w.gender ? "font-semibold" : ""} ${marks?.has(w.index) ? "rounded bg-mark px-0.5 underline decoration-2 underline-offset-4" : ""}`}
            style={w.gender ? { color: GENDER_VAR[w.gender] } : undefined}
          >
            {w.text}
          </span>
        ));
        return g.case ? (
          <CaseBlock key={gi} c={g.case}>
            {ws}
          </CaseBlock>
        ) : (
          ws
        );
      })}
    </span>
  );
}

export function CaseBlock({ c, children, label }: { c: Case | "?"; children: React.ReactNode; label?: string }) {
  const color = c === "?" ? "var(--muted)" : CASE_VAR[c];
  return (
    <span className="case-block" style={{ ["--c" as string]: color, borderStyle: c === "?" ? "dashed" : "solid" }}>
      <span className="case-tag">{label ?? c}</span>
      {children}
    </span>
  );
}

export function CaseChip({ c }: { c: Case }) {
  return (
    <span
      className="inline-flex h-6 min-w-6 items-center justify-center rounded border-2 px-1 text-xs font-extrabold"
      style={{ borderColor: CASE_VAR[c], color: CASE_VAR[c] }}
    >
      {c}
    </span>
  );
}
