import Link from "next/link";
import { ui, withLang, type Lang } from "@/lib/i18n";
import { navFor, trail } from "@/lib/nav";

export function Breadcrumb({ lang, route, title }: { lang: Lang; route: string; title: string }) {
  const parts = trail(route, navFor(lang));
  const items = parts.length > 1 ? parts : parts.length === 1 && route !== "/" ? parts : [];
  return (
    <nav className="breadcrumb" aria-label={ui[lang].breadcrumb}>
      <Link href={withLang(lang, "/")}>next-on-azure</Link>
      {items.map((part, i) => (
        <span key={`${part}-${i}`}>
          <span className="sep" aria-hidden="true">
            ›
          </span>
          <span className={i === items.length - 1 ? "current" : undefined}>{part}</span>
        </span>
      ))}
      {items.length === 0 && route !== "/" && (
        <span>
          <span className="sep" aria-hidden="true">
            ›
          </span>
          <span className="current">{title}</span>
        </span>
      )}
    </nav>
  );
}
