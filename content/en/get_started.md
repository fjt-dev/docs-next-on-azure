---
title: "Get started"
source: "docs/get_started.md"
---

> **Experimental.** `0.1.0` is on npm. What was tested is in [Compatibility](./compatibility.md).

## Prerequisites

- Node.js 22 or later
- A Next.js app on 15.5.29 or later, or 16.4.5 or later, using the App Router or the Pages Router
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli?wt.mc_id=studentamb_679600), signed in (`az login`), with the right to create resources in a resource group
- `zip` on the PATH (used by `package`)

## 1. Install and configure Next.js

```bash
npm install next-on-azure   # or: pnpm add next-on-azure, yarn add next-on-azure (Yarn 1)
```

```js title="next.config.mjs"
import { withAzure } from "next-on-azure/config";

export default withAzure({
  // your Next.js configuration
});
```

`withAzure()` sets `output: "standalone"`, the cache handlers and the settings Azure needs; see [Configuration](./configuration.md).

## 2. Build and package

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # keep it in your secret store
next build
next-on-azure package
```

This writes `.next-azure/app.zip`: the standalone build, the Linux `sharp` binaries and the Functions entry. Use the same Server Actions key for every build, otherwise pages that were open before a deployment fail when they call an action ([Troubleshooting](./troubleshooting.md#a-server-action-fails-after-a-deployment-failed-to-find-server-action)). `package --target local` keeps the binaries of your machine, for running locally.

## 3. Deploy

```bash
next-on-azure deploy --resource-group <rg> --name <short-name> --location <region>
```

`--name` is 3 to 12 lowercase letters or digits; it is combined with a hash into globally unique resource names. `deploy`:

1. creates the resource group if `--location` is given;
2. deploys `infra/main.bicep` (a storage account, one Function app, Application Insights);
3. deploys `.next-azure/app.zip`;
4. requests `/` until the app answers (up to 5 minutes) and prints how long it took;
5. requests every prerendered route once, so that the pages are in the cache before visitors arrive.

It prints the URL of the app. Options:

| Flag | Default | Effect |
| --- | --- | --- |
| `--always-ready <n>` | `0` | Keeps `n` instances running, so that a request does not wait for a cold start. Billed continuously. |
| `--memory <512\|2048\|4096>` | `2048` | Memory of each instance (MB). A smaller size did not lower the cost in our measurement. |
| `--max-instances <n>` | `20` | Upper limit on instances, so that a burst cannot scale (and bill) without limit. |
| `--request-telemetry all\|errors` | `all` | `errors` sends only failures to Application Insights, which cuts its data by about 85%. |
| `--cache-retention-days <n>` | `30` | Deletes cache entries that were not written for `n` days. `0` keeps everything. |
| `--wait-until hold\|detach` | `hold` | `hold` keeps a response open until deferred work such as `after()` is done. |
| `--full-telemetry` | off | Turns Application Insights sampling off. |
| `--no-warm-up`, `--no-prime` | off | Skip the wait for the first answer, or the cache priming. |
| `--output-file <path>` | none | Writes the URL and the resource names as JSON. |
| `--front-door` | off | Puts [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) in front (recurring base fee). Not tested; Azure refuses it on Free Trial and Student subscriptions. |

Every setting lives in the [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview?wt.mc_id=studentamb_679600) template, because a redeployment replaces the app settings: a setting added later with `az functionapp config appsettings set` is gone after the next `deploy`.

## What gets created

| Resource | Purpose |
| --- | --- |
| Storage account | the cache (`cache` container, `tagcache` table) and the deployment package |
| 1 Function app (Flex Consumption) | one function that serves every request, static files included |
| Application Insights and Log Analytics | logs and metrics |

The app reaches the storage account with its managed identity. Shared-key access is turned off and no container is public.
