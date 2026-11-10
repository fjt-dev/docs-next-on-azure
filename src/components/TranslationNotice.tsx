import { type Lang, ui } from "@/lib/i18n";
import { translationRequestUrl } from "@/lib/site";

const circle = (
  <svg width="22" height="22" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9" fill="currentColor" />
    <path d="M10 9v5" stroke="var(--notice-icon-fg)" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="10" cy="6.1" r="1.1" fill="var(--notice-icon-fg)" />
  </svg>
);

/**
 * Above every Japanese page. A translated page says that the text may be machine or AI translated. A page
 * without a translation says so instead, in a box of its own, with a link that opens a new GitHub issue.
 */
export function TranslationNotice({ lang, route, source, fallback }: { lang: Lang; route: string; source?: string; fallback: boolean }) {
  const t = ui[lang];
  if (!t.translationNotice) return null;
  if (fallback && t.untranslated) {
    return (
      <div className="translation-missing" role="note">
        {circle}
        <div>
          <p className="translation-missing-text">{t.untranslated}</p>
          {t.requestTranslation && (
            <a href={translationRequestUrl(lang, route, source)} target="_blank" rel="noopener noreferrer">
              {t.requestTranslation}
            </a>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="translation-notice" role="note">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" />
        <path d="M10 5.5v5.5" />
        <circle cx="10" cy="14.2" r="0.6" fill="currentColor" stroke="none" />
      </svg>
      <div>
        <p>{t.translationNotice}</p>
      </div>
    </div>
  );
}
