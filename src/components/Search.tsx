"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/content";

type Hit = { route: string; title: string; context: string; score: number; id?: string };

function search(index: SearchEntry[], query: string): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const hits: Hit[] = [];
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    const text = entry.text.toLowerCase();
    let score = 0;
    let context = "";
    let id: string | undefined;
    let matched = true;
    const phrase = words.length > 1 && text.includes(words.join(" "));
    if (phrase) score += 8;
    for (const word of words) {
      let found = false;
      if (title.includes(word)) {
        score += 10;
        found = true;
      }
      const heading = entry.headings.find((h) => h.text.toLowerCase().includes(word));
      if (heading) {
        score += 5;
        context = heading.text;
        id = heading.id;
        found = true;
      }
      const at = text.indexOf(word);
      if (at >= 0) {
        score += 1;
        if (!context) context = `…${entry.text.slice(Math.max(0, at - 30), at + 70).replace(/\s+/g, " ")}…`;
        found = true;
      }
      if (!found) matched = false;
    }
    if (matched) hits.push({ route: entry.route, title: entry.title, context, score, id });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | undefined>();
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((o) => !o);
      } else if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    if (!index) {
      fetch("/search-index.json")
        .then((r) => r.json())
        .then(setIndex)
        .catch(() => setIndex([]));
    }
  }, [open, index]);

  const hits = index ? search(index, query) : [];
  const go = (hit: Hit) => {
    close();
    router.push(hit.id ? `${hit.route}#${hit.id}` : hit.route);
  };

  return (
    <>
      <button type="button" className="search-button" onClick={() => setOpen(true)} aria-label="Search documentation">
        <span>Search documentation…</span>
        <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.5 13.5L17 17" />
        </svg>
        <kbd>⌘ K</kbd>
      </button>
      {open && (
        <div className="search-overlay" onMouseDown={close} role="presentation">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: the dialog is closed with Escape; the click only stops the overlay handler */}
          <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search" onMouseDown={(e) => e.stopPropagation()}>
            <input
              ref={input}
              value={query}
              placeholder="Search documentation…"
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelected((s) => Math.min(s + 1, hits.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelected((s) => Math.max(s - 1, 0));
                } else if (e.key === "Enter" && hits[selected]) {
                  go(hits[selected]);
                }
              }}
            />
            <ul>
              {hits.map((hit, i) => (
                <li key={`${hit.route}-${hit.id ?? ""}`}>
                  <button type="button" className={i === selected ? "selected" : undefined} onMouseEnter={() => setSelected(i)} onClick={() => go(hit)}>
                    <strong>{hit.title}</strong>
                    <span>{hit.context}</span>
                  </button>
                </li>
              ))}
              {query && index && hits.length === 0 && <li className="empty">No results for “{query}”.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
