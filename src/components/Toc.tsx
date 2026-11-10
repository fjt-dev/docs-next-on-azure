"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/content";
import { useLang } from "@/lib/use-lang";

export function Toc({ headings, editUrl }: { headings: Heading[]; editUrl?: string }) {
  const feedbackUrl = process.env.NEXT_PUBLIC_FEEDBACK_URL;
  const { t } = useLang();
  const [active, setActive] = useState<string | undefined>(headings[0]?.id);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => e !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [headings]);

  return (
    <aside className="toc" aria-label={t.onThisPage}>
      {headings.length > 0 && (
        <>
          <p className="toc-title">{t.onThisPage}</p>
          <ul>
            {headings.map((h) => (
              <li key={h.id} className={h.depth === 3 ? "sub" : undefined}>
                <a href={`#${h.id}`} className={active === h.id ? "active" : undefined}>
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="toc-links">
        {feedbackUrl && <a href={feedbackUrl}>{t.feedback}</a>}
        {editUrl && <a href={editUrl}>{t.editPage}</a>}
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {t.scrollTop}
        </button>
      </div>
    </aside>
  );
}
