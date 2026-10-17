"use client";
import { insertAtCaret } from "./insert";

const CHARS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"];

export function UmlautBar() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Insert special letters">
      {CHARS.map((c) => (
        <button
          key={c}
          type="button"
          // pointerdown + preventDefault keeps focus (and the caret) in the answer field
          onPointerDown={(e) => {
            e.preventDefault();
            insertAtCaret(c);
          }}
          onClick={(e) => e.preventDefault()}
          className="h-14 w-14 rounded-xl border border-border bg-surface text-2xl font-medium shadow-sm active:scale-95 active:bg-surface-2"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
