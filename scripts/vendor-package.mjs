// Packs next-on-azure from the repository into vendor/, until the package is published.
//   node scripts/vendor-package.mjs [path to the repository]
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(process.argv[2] ?? path.join(here, "../../opennextjs-azure-fjtd"));
const r = spawnSync("npm", ["pack", "--pack-destination", path.join(here, "../vendor")], {
  cwd: path.join(repo, "packages/next-on-azure"),
  stdio: "inherit",
});
if (r.status !== 0) process.exit(r.status ?? 1);
// pnpm keeps the previous copy when the file name stays the same: reinstall the tarball.
const root = path.join(here, "..");
for (const args of [["remove", "next-on-azure"], ["add", "next-on-azure@file:vendor/next-on-azure-0.0.1.tgz"]]) {
  const step = spawnSync("pnpm", args, { cwd: root, stdio: "inherit" });
  if (step.status !== 0) process.exit(step.status ?? 1);
}
