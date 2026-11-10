"use client";

import Link from "next/link";
import { useLang } from "@/lib/use-lang";
import { type Lang, withLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { type NavItem, navFor } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";

const contains = (item: NavItem, path: string): boolean =>
  item.href === path || (item.children?.some((c) => contains(c, path)) ?? false);

function Group({ item, path, depth, lang, toggleLabel }: { item: NavItem; path: string; depth: number; lang: Lang; toggleLabel: (title: string) => string }) {
  const active = contains(item, path);
  const [open, setOpen] = useState(active);
  // Opening the group of the page that is shown, also after navigating from elsewhere.
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);
  return (
    <li>
      <div className={`nav-row${item.href === path ? " active" : ""}`}>
        {item.href ? (
          <Link href={withLang(lang, item.href)} className="nav-link" aria-current={item.href === path ? "page" : undefined}>
            {item.title}
          </Link>
        ) : (
          <span className="nav-link">{item.title}</span>
        )}
        <button type="button" className="nav-toggle" aria-expanded={open} aria-label={toggleLabel(item.title)} onClick={() => setOpen(!open)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={open ? "open" : undefined}>
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </button>
      </div>
      {open && <List items={item.children ?? []} path={path} depth={depth + 1} lang={lang} toggleLabel={toggleLabel} />}
    </li>
  );
}

function List({ items, path, depth, lang, toggleLabel }: { items: NavItem[]; path: string; depth: number; lang: Lang; toggleLabel: (title: string) => string }) {
  return (
    <ul className={`nav-list depth-${depth}`}>
      {items.map((item) =>
        item.children ? (
          <Group key={item.title} item={item} path={path} depth={depth} lang={lang} toggleLabel={toggleLabel} />
        ) : (
          <li key={item.title}>
            <div className={`nav-row${item.href === path ? " active" : ""}`}>
              <Link href={withLang(lang, item.href ?? "/")} className="nav-link" aria-current={item.href === path ? "page" : undefined}>
                {item.title}
              </Link>
            </div>
          </li>
        ),
      )}
    </ul>
  );
}

export function Sidebar() {
  const { lang, route: path, t } = useLang();
  // Close the drawer on small screens after a navigation.
  useEffect(() => {
    document.body.dataset.menu = "closed";
  }, [path, lang]);
  return (
    <>
      <aside className="sidebar" aria-label={t.docs}>
        <nav className="sidebar-scroll">
          <List items={navFor(lang)} path={path} depth={0} lang={lang} toggleLabel={t.toggleGroup} />
        </nav>
        <div className="sidebar-foot">
          <ThemeToggle />
        </div>
      </aside>
      <button type="button" className="scrim" aria-label={t.closeNav} onClick={() => (document.body.dataset.menu = "closed")} />
    </>
  );
}
