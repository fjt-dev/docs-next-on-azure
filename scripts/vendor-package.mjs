// Packs next-on-azure from the repository into vendor/, until the package is published.
//   node scripts/vendor-package.mjs [path to the repository]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// The repository of next-on-azure: the argument or NEXT_ON_AZURE_REPO, else a sibling directory.
function findRepo(argument) {
  if (argument) return path.resolve(argument);
  const parent = path.join(here, "../..");
  return path.resolve(
    ["next-on-azure", "opennextjs-azure-fjtd"].map((name) => path.join(parent, name)).find((dir) => fs.existsSync(dir)) ?? path.join(parent, "next-on-azure"),
  );
}
const repo = findRepo(process.argv[2]);
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
