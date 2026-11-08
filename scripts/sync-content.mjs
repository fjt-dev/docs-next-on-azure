// Copies the documentation pages from the next-on-azure repository into content/ and adds the front
// matter (title, order) that the site needs. Run after the docs of the repository changed:
//   node scripts/sync-content.mjs [path to the repository]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(process.argv[2] ?? path.join(here, "../../opennextjs-azure-fjtd"));
const docs = path.join(repo, "docs");
const out = path.join(here, "../content");

// source (relative to docs/) -> target (relative to content/) and title
const pages = [
  ["get_started.md", "get_started.md", "Get started"],
  ["compatibility.md", "compatibility.md", "Compatibility"],
  ["configuration.md", "configuration.md", "Configuration"],
  ["comparison.md", "comparison.md", "Comparison"],
  ["how_it_works.md", "how_it_works/index.md", "How does it work?"],
  ["inner_workings/azure_notes.md", "how_it_works/azure_notes.md", "Azure notes"],
  ["plan/decisions.md", "how_it_works/decisions.md", "Decision records"],
  ["faq.md", "faq.md", "FAQ"],
  ["troubleshooting.md", "troubleshooting.md", "Troubleshooting"],
  ["contribute/README.md", "contribute/index.md", "Contributing"],
  ["contribute/local_run.md", "contribute/local_run.md", "Run locally"],
  ["contribute/testing.md", "contribute/testing.md", "Testing"],
  ["contribute/ci.md", "contribute/ci.md", "CI"],
  ["contribute/azure_runs.md", "contribute/azure_runs.md", "Real Azure runs"],
  ["contribute/azure_e2e.md", "contribute/azure_e2e.md", "Azure E2E"],
  ["contribute/supply_chain.md", "contribute/supply_chain.md", "Supply chain"],
];

for (const [source, target, title] of pages) {
  const text = fs.readFileSync(path.join(docs, source), "utf8").replace(/^# .*\n+/, "");
  const file = path.join(out, target);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\ntitle: ${JSON.stringify(title)}\nsource: ${JSON.stringify(`docs/${source}`)}\n---\n\n${text}`);
}
console.log(`synced ${pages.length} pages from ${docs}`);
