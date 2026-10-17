"use client";
import { useEffect, useRef } from "react";
import { trackFocus } from "./insert";

/** Large answer field for Apple Pencil Scribble: no autocorrect, no auto-capitalize, no spellcheck. Enter submits. */
export const noFix = {
  autoCorrect: "off",
  autoCapitalize: "off",
  autoComplete: "off",
  spellCheck: false,
  "data-gramm": "false",
  enterKeyHint: "done",
} as const;

export function BigInput({
  value,
  onChange,
  onEnter,
  placeholder,
  autoFocus,
  disabled,
  lang = "de",
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  lang?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 64)}px`;
  }, [value]);
  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus({ preventScroll: true });
      trackFocus(ref.current);
    }
  }, [autoFocus]);
  return (
    <textarea
      ref={ref}
      rows={1}
      lang={lang}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onFocus={(e) => trackFocus(e.currentTarget)}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          onEnter?.();
        }
      }}
      {...noFix}
      className="big-field block w-full resize-none overflow-hidden rounded-2xl border-2 border-border bg-surface px-4 py-3.5 outline-none placeholder:text-muted/60 focus:border-accent disabled:opacity-70"
    />
  );
}
