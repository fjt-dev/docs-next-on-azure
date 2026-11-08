"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type NavItem, nav } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";

const contains = (item: NavItem, path: string): boolean =>
  item.href === path || (item.children?.some((c) => contains(c, path)) ?? false);

function Group({ item, path, depth }: { item: NavItem; path: string; depth: number }) {
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
          <Link href={item.href} className="nav-link" aria-current={item.href === path ? "page" : undefined}>
            {item.title}
          </Link>
        ) : (
          <span className="nav-link">{item.title}</span>
        )}
        <button type="button" className="nav-toggle" aria-expanded={open} aria-label={`Toggle ${item.title}`} onClick={() => setOpen(!open)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={open ? "open" : undefined}>
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </button>
      </div>
      {open && <List items={item.children ?? []} path={path} depth={depth + 1} />}
    </li>
  );
}

function List({ items, path, depth }: { items: NavItem[]; path: string; depth: number }) {
  return (
    <ul className={`nav-list depth-${depth}`}>
      {items.map((item) =>
        item.children ? (
          <Group key={item.title} item={item} path={path} depth={depth} />
        ) : (
          <li key={item.title}>
            <div className={`nav-row${item.href === path ? " active" : ""}`}>
              <Link href={item.href ?? "#"} className="nav-link" aria-current={item.href === path ? "page" : undefined}>
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
  const path = usePathname();
  // Close the drawer on small screens after a navigation.
  useEffect(() => {
    document.body.dataset.menu = "closed";
  }, [path]);
  return (
    <>
      <aside className="sidebar" aria-label="Documentation">
        <nav className="sidebar-scroll">
          <List items={nav} path={path} depth={0} />
        </nav>
        <div className="sidebar-foot">
          <ThemeToggle />
        </div>
      </aside>
      <button type="button" className="scrim" aria-label="Close navigation" onClick={() => (document.body.dataset.menu = "closed")} />
    </>
  );
}
