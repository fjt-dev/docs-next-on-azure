import Link from "next/link";
import { type Lang, ui, withLang } from "@/lib/i18n";
import { LanguageMenu } from "./LanguageMenu";
import { MenuButton } from "./MenuButton";
import { Search } from "./Search";
import { ThemeMenu } from "./ThemeMenu";

export function Header({ lang }: { lang: Lang }) {
  const repo = process.env.NEXT_PUBLIC_REPO_URL; // the repository, once it is public
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
          <ThemeMenu />
          <LanguageMenu />
          {repo && (
            <a href={repo} className="icon-link" aria-label={ui[lang].github}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
