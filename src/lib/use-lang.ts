"use client";

import { usePathname } from "next/navigation";
import { type Lang, langOf, stripLang, type Strings, ui } from "./i18n";

/** The language of the page that is shown, its route without the language, and its strings. */
export function useLang(): { lang: Lang; route: string; t: Strings } {
  const pathname = usePathname();
  const lang = langOf(pathname);
  return { lang, route: stripLang(pathname), t: ui[lang] };
}
