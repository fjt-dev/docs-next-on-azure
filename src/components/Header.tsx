import Link from "next/link";
import { type Lang, ui, withLang } from "@/lib/i18n";
import { LanguageSwitch } from "./LanguageSwitch";
import { MenuButton } from "./MenuButton";
import { Search } from "./Search";

export function Header({ lang }: { lang: Lang }) {
  return (
    <header className="header">
      <div className="header-inner">
        <MenuButton />
        <Link href={withLang(lang, "/")} className="brand" aria-label={ui[lang].home}>
          <em>next</em>
          <strong>ON</strong>
          <em>azure</em>
        </Link>
        <div className="header-end">
          <Search />
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}
