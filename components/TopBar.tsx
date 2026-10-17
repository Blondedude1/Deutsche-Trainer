"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      setTheme((localStorage.getItem("dt-theme") as Theme) || "system");
    } catch {}
  }, []);
  const apply = (t: Theme) => {
    setTheme(t);
    try {
      localStorage.setItem("dt-theme", t);
    } catch {}
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };
  const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
  const icon = {
    system: <path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor" />,
    light: (
      <>
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="currentColor" />,
  }[theme];
  return (
    <button onClick={() => apply(next[theme])} className="tb-btn" title={`Theme: ${theme}`} aria-label={`Theme: ${theme}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" strokeWidth={theme === "system" ? 2 : 0} />
        {icon}
      </svg>
    </button>
  );
}

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/import", label: "Import" },
  { href: "/stats", label: "Stats" },
  { href: "/tables", label: "Tabellen" },
];

export function TopBar({ children }: { children?: React.ReactNode }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-16 items-center gap-2 px-3 sm:px-4">
        <Link href="/" className="mr-1 flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 flex-col justify-center gap-[3px] rounded-md bg-text p-1.5">
            <span className="h-[3px] rounded bg-der" />
            <span className="h-[3px] rounded bg-die" />
            <span className="h-[3px] rounded bg-das" />
          </span>
          <span className="hidden md:inline">Deutsch Trainer</span>
        </Link>
        {children ?? (
          <nav className="flex gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`tb-btn px-3 ${path === l.href ? "bg-surface-2 font-semibold" : ""}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
