import { type Lang, ui } from "@/lib/i18n";
import { translationIssueUrl } from "@/lib/site";

/**
 * Above every Japanese page. A translated page says that the text may be machine or AI translated; a
 * page without a translation says so instead, and offers to request or contribute one (a new GitHub issue).
 */
export function TranslationNotice({ lang, route, source, fallback }: { lang: Lang; route: string; source?: string; fallback: boolean }) {
  const t = ui[lang];
  if (!t.translationNotice) return null;
  const actions = t.translationActions;
  return (
    <div className="translation-notice" role="note">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" />
        <path d="M10 5.5v5.5" />
        <circle cx="10" cy="14.2" r="0.6" fill="currentColor" stroke="none" />
      </svg>
      <div>
        {fallback && t.untranslated ? (
          <>
            <p>{t.untranslated}</p>
            {actions && (
              <p>
                <a className="notice-button" href={translationIssueUrl("request", lang, route, source)} target="_blank" rel="noopener noreferrer">
                  {actions.request}
                </a>
                {actions.open}
                <a className="notice-button" href={translationIssueUrl("contribute", lang, route, source)} target="_blank" rel="noopener noreferrer">
                  {actions.contribute}
                </a>
                {actions.close}
              </p>
            )}
          </>
        ) : (
          <p>{t.translationNotice}</p>
        )}
      </div>
    </div>
  );
}
