"use client";

import Link from "next/link";
import { type Lang, langName, langs, withLang } from "@/lib/i18n";
import { useLang } from "@/lib/use-lang";
import { Dropdown } from "./Dropdown";

/** The language of the page; a choice goes to the same page in that language and is kept in a cookie. */
export function LanguageMenu() {
  const { lang, route, t } = useLang();
  const remember = (to: Lang) => {
    document.cookie = `lang=${to}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <Dropdown
      label={t.language}
      className="language-menu"
      trigger={
        <>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M2.5 10h15M10 2.5c2.2 2.2 3.3 4.7 3.3 7.5S12.2 15.3 10 17.5C7.8 15.3 6.7 12.8 6.7 10S7.8 4.7 10 2.5z" />
          </svg>
          <span className="dropdown-label">{langName[lang]}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </>
      }
    >
      {(close) =>
        langs.map((to) => (
          <Link
            key={to}
            href={withLang(to, route)}
            hrefLang={to}
            lang={to}
            role="menuitemradio"
            aria-checked={to === lang}
            className="dropdown-item"
            onClick={() => {
              remember(to);
              close();
            }}
          >
            <span>{langName[to]}</span>
            {to === lang && (
              <svg className="check" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8.5l3.2 3.2L13 4.8" />
              </svg>
            )}
          </Link>
        ))
      }
    </Dropdown>
  );
}
