import type { Lang } from "./i18n";

export type NavItem = {
  title: string;
  /** Route without the language; a group's own page when it has one. */
  href?: string;
  children?: NavItem[];
};

/** The sidebar, in the order of the OpenNext documentation (https://opennext.js.org/aws). */
const navEn: NavItem[] = [
  { title: "Overview", href: "/" },
  { title: "Get started", href: "/get_started" },
  { title: "Compatibility", href: "/compatibility" },
  { title: "Configuration", href: "/configuration" },
  { title: "Comparison", href: "/comparison" },
  { title: "Cost", href: "/cost" },
  { title: "Support", href: "/support" },
  { title: "Your own infrastructure", href: "/infrastructure" },
  {
    title: "How does it work?",
    href: "/how_it_works",
    children: [
      { title: "Overview", href: "/how_it_works" },
      { title: "Azure notes", href: "/how_it_works/azure_notes" },
      { title: "Decision records", href: "/how_it_works/decisions" },
    ],
  },
  { title: "FAQ", href: "/faq" },
  { title: "Troubleshooting", href: "/troubleshooting" },
  {
    title: "Contributing",
    href: "/contribute",
    children: [
      { title: "Overview", href: "/contribute" },
      { title: "Run locally", href: "/contribute/local_run" },
      { title: "Testing", href: "/contribute/testing" },
      { title: "CI", href: "/contribute/ci" },
      { title: "Real Azure runs", href: "/contribute/azure_runs" },
      { title: "Azure E2E", href: "/contribute/azure_e2e" },
      { title: "Supply chain", href: "/contribute/supply_chain" },
    ],
  },
];

/** The sidebar titles in Japanese, by the English title. */
const titlesJa: Record<string, string> = {
  Overview: "概要",
  "Get started": "はじめに",
  Compatibility: "互換性",
  Configuration: "設定",
  Comparison: "比較",
  Cost: "費用",
  Support: "サポート",
  "Your own infrastructure": "自前のインフラ",
  "How does it work?": "仕組み",
  "Azure notes": "Azure のメモ",
  "Decision records": "設計判断の記録",
  FAQ: "FAQ",
  Troubleshooting: "トラブルシューティング",
  Contributing: "コントリビューション",
  "Run locally": "ローカルで動かす",
  Testing: "テスト",
  CI: "CI",
  "Real Azure runs": "Azure での実行",
  "Azure E2E": "Azure E2E",
  "Supply chain": "サプライチェーン",
};

/** The title of a page in the language of the site: the interface is translated even where the text is not. */
export const localizedTitle = (lang: Lang, title: string): string => (lang === "ja" ? (titlesJa[title] ?? title) : title);

const translate = (items: NavItem[], titles: Record<string, string>): NavItem[] =>
  items.map((item) => ({
    ...item,
    title: titles[item.title] ?? item.title,
    children: item.children ? translate(item.children, titles) : undefined,
  }));

export const navFor = (lang: Lang): NavItem[] => (lang === "ja" ? translate(navEn, titlesJa) : navEn);

/** The pages in reading order (groups flattened; a group's overview once). */
export function flatNav(items: NavItem[]): { title: string; href: string }[] {
  const out: { title: string; href: string }[] = [];
  const seen = new Set<string>();
  const walk = (list: NavItem[]) => {
    for (const item of list) {
      if (item.children) walk(item.children);
      else if (item.href && !seen.has(item.href)) {
        seen.add(item.href);
        out.push({ title: item.title, href: item.href });
      }
    }
  };
  walk(items);
  return out;
}

/** The trail of titles from the top to a route, for the breadcrumb. */
export function trail(href: string, items: NavItem[]): string[] {
  for (const item of items) {
    if (item.children) {
      const inner = trail(href, item.children);
      if (inner.length > 0) return [item.title, ...inner];
    }
    if (item.href === href && !item.children) return [item.title];
  }
  return [];
}
