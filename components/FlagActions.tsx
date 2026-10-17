"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Review a flagged attempt: accept (mark correct + learn my answer as a variant) or dismiss the flag. */
export function FlagActions({ id, accepted }: { id: string; accepted: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (body: object) => {
    setBusy(true);
    await fetch(`/api/attempts/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
    setBusy(false);
  };
  return (
    <div className="flex shrink-0 gap-2">
      {!accepted && (
        <button disabled={busy} onClick={() => act({ accept: true })} className="btn min-h-11 px-3 text-sm text-ok">
          Accept
        </button>
      )}
      <button disabled={busy} onClick={() => act({ flagged: false })} className="btn min-h-11 px-3 text-sm">
        {accepted ? "Done" : "Dismiss"}
      </button>
    </div>
  );
}
