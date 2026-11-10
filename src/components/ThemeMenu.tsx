"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/use-lang";
import { Dropdown } from "./Dropdown";

type Preference = "light" | "dark" | "system";

function apply(preference: Preference) {
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

const svg = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function Icon({ name }: { name: Preference }) {
  if (name === "light") {
    return (
      <svg {...svg}>
        <circle cx="10" cy="10" r="3.5" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
      </svg>
    );
  }
  if (name === "dark") {
    return (
      <svg {...svg}>
        <path d="M16.5 11.5A7 7 0 0 1 8.5 3.5a7 7 0 1 0 8 8z" />
      </svg>
    );
  }
  return (
    <svg {...svg}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3v14" />
      <path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Light, dark or the device's setting; the choice is kept in localStorage (see the script in the layout). */
export function ThemeMenu() {
  const { t } = useLang();
  const [preference, setPreference] = useState<Preference>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") setPreference(saved);
    } catch {
      // storage can be blocked; the page then follows the device
    }
  }, []);

  // While the preference is "device default", follow the operating system.
  useEffect(() => {
    if (preference !== "system") return;
    const query = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const choose = (next: Preference) => {
    setPreference(next);
    apply(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  };

  const options: { value: Preference; label: string }[] = [
    { value: "light", label: t.themeLight },
    { value: "dark", label: t.themeDark },
    { value: "system", label: t.themeSystem },
  ];

  return (
    <Dropdown label={t.themeMenu} className="theme-menu" trigger={<Icon name={preference} />}>
      {(close) =>
        options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="menuitemradio"
            aria-checked={preference === option.value}
            className="dropdown-item"
            onClick={() => {
              choose(option.value);
              close();
            }}
          >
            <Icon name={option.value} />
            <span>{option.label}</span>
          </button>
        ))
      }
    </Dropdown>
  );
}
