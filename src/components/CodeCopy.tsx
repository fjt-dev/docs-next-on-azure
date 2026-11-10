"use client";

import { useEffect } from "react";
import { useLang } from "@/lib/use-lang";

const icon =
  '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="7" width="9" height="9" rx="1.5"/><path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7"/></svg>';

/** Adds a "copy" button to every code block of the page (the pages are plain HTML from Markdown). */
export function CodeCopy() {
  const { route, lang, t } = useLang();
  useEffect(() => {
    const timers: number[] = [];
    for (const pre of document.querySelectorAll<HTMLElement>(".prose pre")) {
      if (pre.querySelector(":scope > .copy-button")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-button";
      button.setAttribute("aria-label", t.copy);
      button.title = t.copy;
      button.innerHTML = icon;
      button.addEventListener("click", async () => {
        const text = pre.querySelector("code")?.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          return; // clipboard blocked: nothing to confirm
        }
        button.dataset.copied = "true";
        button.title = t.copied;
        timers.push(
          window.setTimeout(() => {
            delete button.dataset.copied;
            button.title = t.copy;
          }, 1500),
        );
      });
      pre.append(button);
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [route, lang, t]);
  return null;
}
