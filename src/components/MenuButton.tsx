"use client";

import { useLang } from "@/lib/use-lang";

export function MenuButton() {
  const { t } = useLang();
  return (
    <button
      type="button"
      className="icon-button menu-button"
      aria-label={t.toggleNav}
      onClick={() => {
        const body = document.body;
        body.dataset.menu = body.dataset.menu === "open" ? "closed" : "open";
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M3 5h14M3 10h14M3 15h14" />
      </svg>
    </button>
  );
}
