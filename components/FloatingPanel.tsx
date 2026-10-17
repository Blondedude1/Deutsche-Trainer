"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Dock = "float" | "left" | "right";
interface Layout {
  dock: Dock;
  x: number;
  y: number;
  w: number;
  h: number;
}

const TOP = 64; // top bar height
const MIN_W = 280;
const MIN_H = 220;

/** Portrait or narrow screens get slide-over drawers instead of floating panels. */
export function useDrawerMode() {
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(orientation: portrait), (max-width: 900px)");
    const on = () => setDrawer(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return drawer;
}

function loadLayout(id: string, fallback: Layout): Layout {
  try {
    const s = localStorage.getItem(`dt-panel-${id}`);
    return s ? { ...fallback, ...JSON.parse(s) } : fallback;
  } catch {
    return fallback;
  }
}

export function FloatingPanel({
  id,
  title,
  open,
  onClose,
  defaultDock,
  drawer,
  onDockChange,
  children,
}: {
  id: string;
  title: React.ReactNode;
  open: boolean;
  onClose: () => void;
  defaultDock: "left" | "right";
  drawer: boolean;
  /** Reports the docked side and width so the page can make room. */
  onDockChange?: (id: string, dock: { side: "left" | "right"; width: number } | null) => void;
  children: React.ReactNode;
}) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const drag = useRef<{ kind: "move" | "resize" | "edge"; sx: number; sy: number; start: Layout } | null>(null);

  useEffect(() => {
    const w = Math.min(380, Math.round(window.innerWidth * 0.32));
    // open docked by default so the panel never covers the exercise
    const fallback: Layout = {
      dock: defaultDock,
      w,
      h: Math.min(620, window.innerHeight - TOP - 40),
      x: defaultDock === "left" ? 16 : window.innerWidth - w - 16,
      y: TOP + 16,
    };
    setLayout(loadLayout(id, fallback));
  }, [id, defaultDock]);

  useEffect(() => {
    if (!layout) return;
    try {
      localStorage.setItem(`dt-panel-${id}`, JSON.stringify(layout));
    } catch {}
  }, [id, layout]);

  useEffect(() => {
    if (!onDockChange) return;
    if (open && !drawer && layout && layout.dock !== "float") onDockChange(id, { side: layout.dock, width: layout.w });
    else onDockChange(id, null);
  }, [id, open, drawer, layout, onDockChange]);

  const clamp = useCallback((l: Layout): Layout => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.max(MIN_W, Math.min(l.w, vw - 40));
    const h = Math.max(MIN_H, Math.min(l.h, vh - TOP - 8));
    return { ...l, w, h, x: Math.max(0, Math.min(l.x, vw - w)), y: Math.max(TOP, Math.min(l.y, vh - 60)) };
  }, []);

  const onPointerDown = (kind: "move" | "resize" | "edge") => (e: React.PointerEvent) => {
    if (!layout || drawer) return;
    if ((e.target as HTMLElement).closest("button") && kind === "move") return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, sx: e.clientX, sy: e.clientY, start: layout };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (d.kind === "move") {
      // dragging a docked panel pulls it out into a floating one
      const base = d.start.dock === "float" ? d.start : { ...d.start, dock: "float" as Dock, y: TOP + 16, h: Math.min(d.start.h, 560) };
      setLayout(clamp({ ...base, x: base.x + dx, y: base.y + dy }));
    } else if (d.kind === "resize") {
      setLayout(clamp({ ...d.start, w: d.start.w + dx, h: d.start.h + dy }));
    } else {
      const w = d.start.dock === "left" ? d.start.w + dx : d.start.w - dx;
      setLayout((l) => (l ? { ...l, w: Math.max(MIN_W, Math.min(w, window.innerWidth * 0.6)) } : l));
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.kind !== "move" || !layout) return;
    // snap to an edge when released against it
    if (layout.x <= 4) setLayout({ ...layout, dock: "left", x: 0 });
    else if (layout.x + layout.w >= window.innerWidth - 4) setLayout({ ...layout, dock: "right" });
  };

  const setDock = (dock: Dock) =>
    setLayout((l) => (l ? clamp({ ...l, dock, x: dock === "right" ? window.innerWidth - l.w - 16 : dock === "left" ? 16 : l.x }) : l));

  if (!layout) return null;

  // ── portrait / narrow: slide-over drawer
  if (drawer) {
    const side = defaultDock;
    return (
      <>
        <div
          className={`fixed inset-0 z-50 bg-black/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={onClose}
        />
        <aside
          className={`fixed bottom-0 top-0 z-50 flex w-[min(92vw,460px)] flex-col border-border bg-surface shadow-2xl transition-transform duration-200 ${
            side === "left" ? "left-0 border-r" : "right-0 border-l"
          } ${open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"}`}
          aria-hidden={!open}
        >
          <PanelHeader title={title} onClose={onClose} />
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">{open && children}</div>
        </aside>
      </>
    );
  }

  if (!open) return null;

  const docked = layout.dock !== "float";
  const style: React.CSSProperties = docked
    ? { top: TOP, bottom: 0, width: layout.w, [layout.dock]: 0 }
    : { left: layout.x, top: layout.y, width: layout.w, height: layout.h };

  return (
    <aside
      className={`fixed z-30 flex flex-col overflow-hidden border border-border bg-surface shadow-xl ${docked ? "" : "rounded-2xl"}`}
      style={style}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <PanelHeader
        title={title}
        onClose={onClose}
        onPointerDown={onPointerDown("move")}
        dock={layout.dock}
        setDock={setDock}
      />
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">{children}</div>
      {docked ? (
        <div
          onPointerDown={onPointerDown("edge")}
          className={`absolute bottom-0 top-0 w-4 cursor-ew-resize touch-none ${layout.dock === "left" ? "-right-1" : "-left-1"}`}
          aria-label="Resize panel"
        >
          <div className="mx-auto mt-[45vh] h-12 w-1.5 rounded-full bg-border" />
        </div>
      ) : (
        <div
          onPointerDown={onPointerDown("resize")}
          className="absolute bottom-0 right-0 h-8 w-8 cursor-nwse-resize touch-none"
          aria-label="Resize panel"
        >
          <svg viewBox="0 0 20 20" className="absolute bottom-1 right-1 h-5 w-5 text-muted">
            <path d="M18 8 8 18M18 13l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </aside>
  );
}

function PanelHeader({
  title,
  onClose,
  onPointerDown,
  dock,
  setDock,
}: {
  title: React.ReactNode;
  onClose: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  dock?: Dock;
  setDock?: (d: Dock) => void;
}) {
  const DockBtn = ({ d, label, icon }: { d: Dock; label: string; icon: string }) => (
    <button
      onClick={() => setDock?.(d)}
      aria-pressed={dock === d}
      title={label}
      aria-label={label}
      className="tb-btn h-11 w-11 text-lg text-muted"
    >
      {icon}
    </button>
  );
  return (
    <div
      onPointerDown={onPointerDown}
      className={`flex min-h-14 select-none items-center gap-1 border-b border-border bg-surface-2 pl-4 pr-1 ${onPointerDown ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
    >
      <div className="min-w-0 flex-1 truncate text-base font-semibold">{title}</div>
      {setDock && (
        <>
          <DockBtn d="left" label="Dock left" icon="⇤" />
          <DockBtn d="float" label="Float" icon="❐" />
          <DockBtn d="right" label="Dock right" icon="⇥" />
        </>
      )}
      <button onClick={onClose} className="tb-btn h-11 w-11 text-xl" aria-label="Close panel">
        ✕
      </button>
    </div>
  );
}
