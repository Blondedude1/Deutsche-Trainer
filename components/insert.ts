/** Remembers the last focused answer field so the ä/ö/ü buttons know where to type. */
let active: HTMLInputElement | HTMLTextAreaElement | null = null;

export function trackFocus(el: HTMLInputElement | HTMLTextAreaElement | null) {
  if (el) active = el;
}

/** Insert text at the caret of the last focused field, in a way React's onChange sees. */
export function insertAtCaret(text: string) {
  const el = active;
  if (!el || !el.isConnected) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, next);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.focus();
  el.setSelectionRange(start + text.length, start + text.length);
}
