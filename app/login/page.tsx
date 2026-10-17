"use client";
import { useState } from "react";

export default function Login() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: code }),
    });
    setBusy(false);
    if (res.ok) {
      const next = new URLSearchParams(location.search).get("next");
      location.href = next && next.startsWith("/") ? next : "/";
    } else setErr((await res.json().catch(() => ({}))).error ?? "Login failed");
  };
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-col justify-center gap-1 rounded-lg bg-text p-2">
            <span className="h-1 rounded bg-der" />
            <span className="h-1 rounded bg-die" />
            <span className="h-1 rounded bg-das" />
          </span>
          <h1 className="text-2xl font-bold">Deutsch Trainer</h1>
        </div>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Passcode"
          autoFocus
          autoComplete="current-password"
          className="big-field w-full rounded-2xl border-2 border-border bg-surface px-4 outline-none focus:border-accent"
        />
        {err && <p className="text-bad">{err}</p>}
        <button disabled={busy || !code} className="btn btn-primary w-full">
          {busy ? "…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
