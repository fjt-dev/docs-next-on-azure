import { type Lang, ui } from "@/lib/i18n";
import { translationRequestUrl } from "@/lib/site";

/**
 * Above every Japanese page, the same band: a translated page says that the text may be machine or AI
 * translated; a page without a translation says so, and has a link that opens a new GitHub issue.
 */
export function TranslationNotice({ lang, route, source, fallback }: { lang: Lang; route: string; source?: string; fallback: boolean }) {
  const t = ui[lang];
  if (!t.translationNotice) return null;
  const missing = fallback && t.untranslated;
  return (
    <div className="translation-notice" role="note">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" />
        <path d="M10 5.5v5.5" />
        <circle cx="10" cy="14.2" r="0.6" fill="currentColor" stroke="none" />
      </svg>
      <div>
        <p>{missing ? t.untranslated : t.translationNotice}</p>
        {missing && t.requestTranslation && (
          <p>
            <a href={translationRequestUrl(lang, route, source)} target="_blank" rel="noopener noreferrer">
              {t.requestTranslation}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
