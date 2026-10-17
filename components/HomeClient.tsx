"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSettings } from "./useSettings";

export function SettingsCard() {
  const [s, update] = useSettings();
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-4 py-3">
      <span>
        <span className="block font-semibold">ae / oe / ue / ss = ä / ö / ü / ß</span>
        <span className="block text-sm text-muted">Accept spelled-out umlauts as correct.</span>
      </span>
      <input
        type="checkbox"
        checked={s.umlautEquivalence}
        onChange={(e) => update({ umlautEquivalence: e.target.checked })}
        className="h-7 w-7 accent-[var(--accent)]"
      />
    </label>
  );
}

export function DeleteSetButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm(`Delete "${title}" with all its exercises and attempts?`)) return;
        setBusy(true);
        await fetch(`/api/sets/${id}`, { method: "DELETE" });
        router.refresh();
      }}
      className="tb-btn text-muted"
      aria-label={`Delete ${title}`}
      title="Delete set"
    >
      🗑
    </button>
  );
}

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        location.href = "/login";
      }}
      className="text-sm text-muted underline"
    >
      Log out
    </button>
  );
}
