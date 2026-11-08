// Runs the packaged site the way Azure does: Azurite with empty storage, then the Azure Functions
// host on http://localhost:7071. Needs `pnpm package:local` first. The tools (Azurite, Functions
// Core Tools) come from a checkout of the next-on-azure repository:
//   NEXT_ON_AZURE_REPO=/path/to/repo node scripts/run-local.mjs   (default: the sibling directory)
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
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
const repo = findRepo(process.env.NEXT_ON_AZURE_REPO);
const app = path.join(here, "../.next-azure/app");
const azurite = path.join(repo, "node_modules/.bin/azurite");
const func = path.join(repo, "node_modules/azure-functions-core-tools/bin/func");
for (const [what, file] of [["the packaged app", path.join(app, "main.mjs")], ["Azurite", azurite], ["Functions Core Tools", func]]) {
  if (!fs.existsSync(file)) {
    console.error(`${what} not found at ${file}. Run "pnpm package:local" (and install the repository) first.`);
    process.exit(1);
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docs-local-"));
// Azurite's published development account (not a secret).
const key = "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==";
const cs = [
  "DefaultEndpointsProtocol=http",
  "AccountName=devstoreaccount1",
  `AccountKey=${key}`,
  "BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1",
  "QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1",
  "TableEndpoint=http://127.0.0.1:10002/devstoreaccount1",
].join(";");

const children = [];
const stop = () => {
  for (const c of children) c.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
};
process.on("SIGINT", () => {
  stop();
  process.exit(0);
});
process.on("exit", stop);

children.push(
  spawn(azurite, ["--silent", "--skipApiVersionCheck", "--location", tmp, "--blobPort", "10000", "--queuePort", "10001", "--tablePort", "10002"], { stdio: "inherit" }),
);
await new Promise((r) => setTimeout(r, 3000));

const req = createRequire(path.join(app, "standalone/package.json"));
const { BlobServiceClient } = req("@azure/storage-blob");
const { TableServiceClient } = req("@azure/data-tables");
await BlobServiceClient.fromConnectionString(cs).getContainerClient("cache").createIfNotExists();
await TableServiceClient.fromConnectionString(cs, { allowInsecureConnection: true }).createTable("tagcache");

fs.writeFileSync(
  path.join(app, "local.settings.json"),
  JSON.stringify({ IsEncrypted: false, Values: { FUNCTIONS_WORKER_RUNTIME: "node", AzureWebJobsStorage: cs, AZURE_STORAGE_CONNECTION_STRING: cs } }),
);
children.push(spawn(func, ["start", "--port", "7071"], { cwd: app, stdio: "inherit" }));
console.log("[run-local] http://localhost:7071 (Ctrl+C to stop)");
