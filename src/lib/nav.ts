export type NavItem = {
  title: string;
  /** Route; a group's own page when it has one. */
  href?: string;
  children?: NavItem[];
};

/** The sidebar, in the order of the OpenNext documentation (https://opennext.js.org/aws). */
export const nav: NavItem[] = [
  { title: "Overview", href: "/" },
  { title: "Get started", href: "/get_started" },
  { title: "Compatibility", href: "/compatibility" },
  { title: "Configuration", href: "/configuration" },
  { title: "Comparison", href: "/comparison" },
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

/** The pages in reading order (groups flattened; a group's overview once). */
export function flatNav(items: NavItem[] = nav): { title: string; href: string }[] {
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
export function trail(href: string, items: NavItem[] = nav): string[] {
  for (const item of items) {
    if (item.children) {
      const inner = trail(href, item.children);
      if (inner.length > 0) return [item.title, ...inner];
    }
    if (item.href === href && !item.children) return [item.title];
  }
  return [];
}
