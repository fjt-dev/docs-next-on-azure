"use client";

import Link from "next/link";
import { type Lang, langName, langs, withLang } from "@/lib/i18n";
import { useLang } from "@/lib/use-lang";

/** Links to the same page in the other language; the choice is kept in a cookie for the next visit. */
export function LanguageSwitch() {
  const { lang, route, t } = useLang();
  const remember = (to: Lang) => {
    document.cookie = `lang=${to}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <nav className="lang-switch" aria-label={t.language}>
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M2.5 10h15M10 2.5c2.2 2.2 3.3 4.7 3.3 7.5S12.200 15.300 10 17.500C7.800 15.300 6.700 12.800 6.700 10S7.800 4.700 10 2.500z" />
      </svg>
      {langs.map((to) => (
        <Link key={to} href={withLang(to, route)} hrefLang={to} lang={to} aria-current={to === lang ? "true" : undefined} className={to === lang ? "current" : undefined} onClick={() => remember(to)}>
          {langName[to]}
        </Link>
      ))}
    </nav>
  );
}
