// Checks the internal links of the built site (`pnpm build` first): every href that starts with a slash must
// be a page of the site (or a file in public/ or the search index), and a `#anchor` must be an id on that page.
// The site turns a link to something that is not on the site into plain text while it renders, so a dead link
// does not show up in the build: this is what finds it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, ".next/server/app");
if (!fs.existsSync(appDir)) {
  console.error("No build found: run `pnpm build` first.");
  process.exit(2);
}

function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith(".html") && !entry.name.startsWith("_not-found")) out.push(full);
  }
  return out;
}

const pages = new Map(); // route -> Set of ids
for (const file of htmlFiles(appDir)) {
  const route = `/${path.relative(appDir, file).replace(/\.html$/, "")}`;
  const html = fs.readFileSync(file, "utf8");
  pages.set(route, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

const files = new Set(
  fs.existsSync(path.join(root, "public")) ? fs.readdirSync(path.join(root, "public")).map((f) => `/${f}`) : [],
);
const problems = [];
let checked = 0;
for (const file of htmlFiles(appDir)) {
  const from = `/${path.relative(appDir, file).replace(/\.html$/, "")}`;
  const html = fs.readFileSync(file, "utf8");
  for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(href) || href.startsWith("/_next/")) continue;
    const [target = "", rawHash] = href.split("#");
    const hash = rawHash === undefined ? undefined : decodeURIComponent(rawHash);
    const route = target === "" ? from : target.replace(/\/$/, "") || "/";
    checked++;
    const ids = pages.get(route === "/" ? "/index" : route);
    if (!ids && !files.has(route) && !route.endsWith("search-index.json")) {
      problems.push(`${from}: ${href} (no such page)`);
    } else if (hash && ids && !ids.has(hash)) {
      problems.push(`${from}: ${href} (no such id)`);
    }
  }
}
console.log(`${pages.size} pages, ${checked} internal links checked.`);
if (problems.length > 0) {
  const unique = [...new Set(problems)];
  console.error(`${unique.length} broken link(s):\n${unique.slice(0, 40).map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
