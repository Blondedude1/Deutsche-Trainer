"use client";
import { useState } from "react";

/** Small single-series bar chart with tap/hover tooltips. One measure per chart (no second axis). */
export function BarChart({
  title,
  days,
  values,
  max,
  format,
  sub,
}: {
  title: string;
  days: string[];
  values: (number | null)[];
  max?: number;
  format: "count" | "percent";
  sub?: string;
}) {
  const fmt = (v: number) => (format === "percent" ? `${Math.round(v * 100)}%` : String(v));
  const [sel, setSel] = useState<number | null>(null);
  const top = max ?? Math.max(1, ...values.map((v) => v ?? 0));
  const W = 280;
  const H = 110;
  const gap = 2;
  const bw = (W - gap * (values.length - 1)) / values.length;
  const last = values.length - 1;
  const shown = sel ?? last;
  const label = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  return (
    <figure className="card p-4">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted tabular-nums">
          {label(days[shown])}: <b className="text-text">{values[shown] == null ? "—" : fmt(values[shown]!)}</b>
        </span>
      </figcaption>
      {sub && <p className="text-xs text-muted">{sub}</p>}
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-3 w-full touch-none select-none" onPointerLeave={() => setSel(null)} role="img" aria-label={title}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border)" strokeWidth={1} />
        {values.map((v, i) => {
          const h = v ? Math.max(2, (v / top) * (H - 4)) : 0;
          const x = i * (bw + gap);
          const r = Math.min(4, bw / 2, h);
          return (
            <g key={i} onPointerEnter={() => setSel(i)} onPointerDown={() => setSel(i)}>
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${H} V${H - h + r} Q${x},${H - h} ${x + r},${H - h} H${x + bw - r} Q${x + bw},${H - h} ${x + bw},${H - h + r} V${H} Z`}
                  fill="var(--accent)"
                  opacity={sel === null || sel === i ? 1 : 0.45}
                />
              )}
              {v === null && <circle cx={x + bw / 2} cy={H - 3} r={1.5} fill="var(--muted)" />}
            </g>
          );
        })}
        <text x={0} y={H + 14} fontSize={10} fill="var(--muted)">{label(days[0])}</text>
        <text x={W} y={H + 14} fontSize={10} fill="var(--muted)" textAnchor="end">today</text>
      </svg>
    </figure>
  );
}
