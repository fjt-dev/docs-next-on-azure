import fs from "node:fs";
import path from "node:path";
import rehypeShiki from "@shikijs/rehype";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import type { Element, Root as HastRoot } from "hast";
import type { Link, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const root = path.join(process.cwd(), "content");

export type Heading = { depth: 2 | 3; text: string; id: string };
export type Page = {
  route: string;
  title: string;
  description?: string;
  /** Path of the page in the repository's docs/ directory, for "Edit this page". */
  source?: string;
  html: string;
  headings: Heading[];
  text: string;
};

/** content/a/b.md -> /a/b, content/a/index.md -> /a, content/index.md -> / */
function routeOf(file: string): string {
  const rel = path.relative(root, file).replace(/\\/g, "/").replace(/\.md$/, "");
  const route = `/${rel.replace(/(^|\/)index$/, "")}`;
  return route === "/" ? "/" : route.replace(/\/$/, "");
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : entry.name.endsWith(".md") ? [full] : [];
  });
}

const files = () => walk(root);
export const routes = (): string[] => files().map(routeOf);

/** Where a repository doc (docs/x.md) lives on the site, by the `source` of each page. */
function sourceMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of files()) {
    const { data } = matter(fs.readFileSync(file, "utf8"));
    if (typeof data.source === "string") map.set(data.source.replace(/^docs\//, ""), routeOf(file));
  }
  return map;
}

/**
 * Links between pages: `./compatibility.md#x` (relative to the doc in the repository) becomes the
 * site route; a link to something that is not on the site (plan, sources) becomes plain text.
 */
function rewriteLinks(source: string | undefined, known: Map<string, string>) {
  return () => (tree: Root) => {
    visit(tree, "link", (node: Link, index, parent) => {
      const url = node.url;
      if (/^(https?:|mailto:|#|\/)/.test(url)) return;
      const [target, hash] = url.split("#");
      const from = source ? path.posix.dirname(source.replace(/^docs\//, "")) : ".";
      const resolved = path.posix.normalize(path.posix.join(from, target ?? ""));
      const route = known.get(resolved);
      if (route) {
        node.url = hash ? `${route}#${hash}` : route;
      } else if (parent && index !== undefined) {
        parent.children.splice(index, 1, ...node.children);
        return index;
      }
    });
  };
}

/** Wraps tables so that a wide one scrolls inside the page. */
function wrapTables() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node],
      };
      return "skip";
    });
  };
}

/** The text of a page for the search index: text and code pieces, separated by spaces (table cells too). */
function plainText(tree: Root): string {
  const parts: string[] = [];
  visit(tree, (node) => {
    if (node.type === "text" || node.type === "inlineCode" || node.type === "code") {
      parts.push((node as { value: string }).value);
    }
  });
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export async function getPage(route: string): Promise<Page | undefined> {
  const file = files().find((f) => routeOf(f) === route);
  if (!file) return undefined;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const source = typeof data.source === "string" ? data.source : undefined;

  const headings: Heading[] = [];
  const slugger = new GithubSlugger();
  const tree = unified().use(remarkParse).use(remarkGfm).parse(content) as Root;
  visit(tree, "heading", (node) => {
    const text = toString(node);
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) headings.push({ depth: node.depth, text, id });
  });

  const html = String(
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(rewriteLinks(source, sourceMap()))
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeShiki, {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
        fallbackLanguage: "text",
        transformers: [
          {
            pre(node) {
              const meta = this.options.meta?.__raw ?? "";
              const title = /title="([^"]+)"/.exec(meta)?.[1];
              if (title) node.properties["data-title"] = title;
            },
          },
        ],
      })
      .use(wrapTables)
      .use(rehypeStringify)
      .process(content),
  );

  return {
    route,
    title: String(data.title ?? route),
    description: typeof data.description === "string" ? data.description : undefined,
    source,
    html,
    headings,
    text: plainText(tree),
  };
}

export type SearchEntry = { route: string; title: string; headings: Heading[]; text: string };

export async function searchIndex(): Promise<SearchEntry[]> {
  const pages = await Promise.all(routes().map((r) => getPage(r)));
  return pages
    .filter((p): p is Page => p !== undefined)
    .map((p) => ({ route: p.route, title: p.title, headings: p.headings, text: p.text.slice(0, 6000) }));
}
