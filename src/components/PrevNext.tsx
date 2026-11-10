import Link from "next/link";
import { ui, withLang, type Lang } from "@/lib/i18n";
import { flatNav, navFor } from "@/lib/nav";

export function PrevNext({ lang, route }: { lang: Lang; route: string }) {
  const t = ui[lang];
  const pages = flatNav(navFor(lang));
  const i = pages.findIndex((p) => p.href === route);
  if (i < 0) return null;
  const prev = pages[i - 1];
  const next = pages[i + 1];
  if (!prev && !next) return null;
  return (
    <nav className="prevnext" aria-label={t.pagination}>
      {prev ? (
        <Link href={withLang(lang, prev.href)} className="prev">
          <span>{t.previous}</span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={withLang(lang, next.href)} className="next">
          <span>{t.next}</span>
          {next.title}
        </Link>
      )}
    </nav>
  );
}
