import { type Lang, ui } from "@/lib/i18n";

/** The notice above every Japanese page; a page without a translation says so as well. */
export function TranslationNotice({ lang, fallback }: { lang: Lang; fallback: boolean }) {
  const t = ui[lang];
  if (!t.translationNotice) return null;
  return (
    <div className="translation-notice" role="note">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" />
        <path d="M10 5.5v5.5" />
        <circle cx="10" cy="14.2" r="0.6" fill="currentColor" stroke="none" />
      </svg>
      <div>
        <p>{t.translationNotice}</p>
        {fallback && t.untranslated && <p>{t.untranslated}</p>}
      </div>
    </div>
  );
}
