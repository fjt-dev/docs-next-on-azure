export const langs = ["en", "ja"] as const;
export type Lang = (typeof langs)[number];
export const defaultLang: Lang = "en";

export const langName: Record<Lang, string> = { en: "English", ja: "日本語" };

export const isLang = (value: string | undefined): value is Lang => langs.includes(value as Lang);

/** The language of a path such as `/ja/faq`; English when the path has none. */
export function langOf(pathname: string): Lang {
  const first = pathname.split("/")[1];
  return isLang(first) ? first : defaultLang;
}

/** `/ja/faq` -> `/faq`, `/ja` -> `/`. */
export function stripLang(pathname: string): string {
  const parts = pathname.split("/");
  if (!isLang(parts[1])) return pathname || "/";
  const rest = `/${parts.slice(2).join("/")}`.replace(/\/$/, "");
  return rest === "" ? "/" : rest;
}

/** `("ja", "/faq#x")` -> `/ja/faq#x`; the route of the overview is `/ja`. */
export function withLang(lang: Lang, route: string): string {
  const [path = "", hash] = route.split("#");
  const base = path === "/" || path === "" ? `/${lang}` : `/${lang}${path}`;
  return hash ? `${base}#${hash}` : base;
}

export type Strings = {
  description: string;
  searchPlaceholder: string;
  searchLabel: string;
  noResults: (query: string) => string;
  onThisPage: string;
  editPage: string;
  previous: string;
  next: string;
  pagination: string;
  breadcrumb: string;
  toggleNav: string;
  closeNav: string;
  docs: string;
  home: string;
  toggleGroup: (title: string) => string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  themeMenu: string;
  language: string;
  notFoundTitle: string;
  notFoundBody: string;
  overview: string;
  copy: string;
  copied: string;
  feedback: string;
  scrollTop: string;
  github: string;
  /** Shown above every page of the Japanese site. */
  translationNotice?: string;
  /** Shown above a page that has no translation yet (instead of the notice above). */
  untranslated?: string;
  /** The buttons under it: `request` (or `contribute`), in the order of the sentence `request（または contribute）`. */
  translationActions?: { request: string; contribute: string; open: string; close: string };
};

export const ui: Record<Lang, Strings> = {
  en: {
    description: "Run a Next.js app on one Azure Function (Flex Consumption) with Blob and Table Storage.",
    searchPlaceholder: "Search documentation…",
    searchLabel: "Search",
    noResults: (q) => `No results for “${q}”.`,
    onThisPage: "On This Page",
    editPage: "Edit this page",
    previous: "Previous",
    next: "Next",
    pagination: "Pagination",
    breadcrumb: "Breadcrumb",
    toggleNav: "Toggle navigation",
    closeNav: "Close navigation",
    docs: "Documentation",
    home: "next-on-azure, home",
    toggleGroup: (t) => `Toggle ${t}`,
    themeSystem: "Device default",
    themeLight: "Light mode",
    themeDark: "Dark mode",
    themeMenu: "Theme",
    language: "Language",
    notFoundTitle: "Page not found",
    notFoundBody: "There is no such page. Go to the overview.",
    overview: "Overview",
    copy: "Copy code",
    copied: "Copied",
    feedback: "Question? Give us feedback →",
    scrollTop: "Scroll to top",
    github: "GitHub repository",
  },
  ja: {
    description: "Next.js アプリを、Blob Storage と Table Storage を使う 1 つの Azure Function(Flex Consumption)で動かします。",
    searchPlaceholder: "ドキュメントを検索…",
    searchLabel: "検索",
    noResults: (q) => `「${q}」に一致する結果はありません。`,
    onThisPage: "このページの内容",
    editPage: "このページを編集",
    previous: "前へ",
    next: "次へ",
    pagination: "ページ送り",
    breadcrumb: "パンくずリスト",
    toggleNav: "ナビゲーションを開閉",
    closeNav: "ナビゲーションを閉じる",
    docs: "ドキュメント",
    home: "next-on-azure、トップ",
    toggleGroup: (t) => `${t}を開閉`,
    themeSystem: "デバイスのデフォルト",
    themeLight: "ライトモード",
    themeDark: "ダークモード",
    themeMenu: "テーマ",
    language: "言語",
    notFoundTitle: "ページが見つかりません",
    notFoundBody: "このページはありません。概要に戻ってください。",
    overview: "概要",
    copy: "コードをコピー",
    copied: "コピーしました",
    feedback: "質問・ご意見はこちら →",
    scrollTop: "ページの先頭へ",
    github: "GitHub リポジトリ",
    translationNotice: "このトピックの一部は機械翻訳または AI 翻訳されている場合があります。",
    untranslated: "このページはまだ日本語に翻訳されていません。英語版を表示しています。",
    translationActions: { request: "翻訳をリクエスト", contribute: "貢献する", open: "（または", close: "）" },
  },
};
