import Link from "next/link";
import { type Lang, ui, withLang } from "@/lib/i18n";

/** A line under every page: the site runs on the package it documents. */
export function SiteFooter({ lang }: { lang: Lang }) {
  const t = ui[lang];
  return (
    <footer className="site-footer">
      {t.builtWith} <Link href={withLang(lang, "/hosting")}>{t.builtWithLink}</Link>
    </footer>
  );
}
