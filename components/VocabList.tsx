"use client";
import { useState } from "react";
import type { Vocab } from "@/lib/types";
import { ARTICLE_GENDER, GENDER_VAR } from "./colors";

export function VocabList({ vocab, setTitle }: { vocab: Vocab[]; setTitle?: string }) {
  const [q, setQ] = useState("");
  const f = q.trim().toLowerCase();
  const match = (v: Vocab) => !f || v.german.toLowerCase().includes(f) || v.mongolian.toLowerCase().includes(f) || (v.plural ?? "").toLowerCase().includes(f);
  const nouns = vocab.filter((v) => v.kind === "noun" && match(v));
  const verbs = vocab.filter((v) => v.kind === "verb" && match(v));
  const other = vocab.filter((v) => v.kind === "other" && match(v));

  if (vocab.length === 0) return <p className="p-4 text-muted">This set has no word list.</p>;

  return (
    <div className="p-3 text-[17px]">
      {setTitle && <p className="mb-2 px-1 text-sm text-muted">{setTitle}</p>}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search…"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mb-3 h-12 w-full rounded-xl border border-border bg-surface-2 px-3 outline-none focus:border-accent"
      />
      {nouns.length > 0 && (
        <Section title="Nomen">
          {nouns.map((v) => {
            const color = GENDER_VAR[ARTICLE_GENDER[v.article ?? "der"]];
            return (
              <Row key={v.id} mn={v.mongolian}>
                <span className="font-semibold" style={{ color }}>
                  {v.article} {v.german}
                </span>
                {v.plural && (
                  <span className="ml-2 text-[15px]" style={{ color: "var(--pl)" }}>
                    {v.plural === "-" ? "(no plural)" : `die ${v.plural}`}
                  </span>
                )}
              </Row>
            );
          })}
        </Section>
      )}
      {verbs.length > 0 && (
        <Section title="Verben">
          {verbs.map((v) => (
            <Row key={v.id} mn={v.mongolian}>
              <span className="font-semibold">{v.german}</span>
              {v.irregular && <span className="ml-1.5 text-sm font-semibold text-die">(u.r.)</span>}
            </Row>
          ))}
        </Section>
      )}
      {other.length > 0 && (
        <Section title="Andere">
          {other.map((v) => (
            <Row key={v.id} mn={v.mongolian}>
              <span className="font-semibold">{v.german}</span>
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-1 px-1 text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">{children}</ul>
    </section>
  );
}

function Row({ children, mn }: { children: React.ReactNode; mn: string }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 bg-surface px-3 py-2.5">
      <span>{children}</span>
      <span className="text-[15px] text-muted">{mn}</span>
    </li>
  );
}
