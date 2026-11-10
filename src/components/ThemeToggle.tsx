"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/use-lang";

type Preference = "system" | "light" | "dark";
const order: Preference[] = ["system", "light", "dark"];

function apply(preference: Preference) {
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const { t } = useLang();
  const [preference, setPreference] = useState<Preference>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") setPreference(saved);
    } catch {
      // storage can be blocked; the page then follows the system
    }
  }, []);

  // While the preference is "system", follow the operating system.
  useEffect(() => {
    if (preference !== "system") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const choose = () => {
    const next = order[(order.indexOf(preference) + 1) % order.length] ?? "system";
    setPreference(next);
    apply(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  };

  return (
    <button type="button" className="theme-toggle" onClick={choose} aria-label={t.themeLabel(preference === "system" ? t.themeSystem : preference === "light" ? t.themeLight : t.themeDark)}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {preference === "light" ? (
          <>
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
          </>
        ) : preference === "dark" ? (
          <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
        ) : (
          <>
            <rect x="2" y="3" width="12" height="8.5" rx="1.5" />
            <path d="M5.5 14h5" />
          </>
        )}
      </svg>
      <span>{preference === "system" ? t.themeSystem : preference === "light" ? t.themeLight : t.themeDark}</span>
    </button>
  );
}
