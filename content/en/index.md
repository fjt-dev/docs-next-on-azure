---
title: "Overview"
description: "Run a Next.js app on one Azure Function (Flex Consumption) with Blob and Table Storage."
---

> **Experimental, pre-release, not published to npm.**

## next-on-azure

`next-on-azure` runs a Next.js app on **one Azure Function (Flex Consumption)**. The Next.js standalone server runs inside the Functions worker; the package replaces only what has to be Azure-specific: the incremental cache and `'use cache'` (Blob Storage), the tag state (Table Storage), the Functions entry that forwards requests to the server, and the packaging and deployment.

It uses the options Next.js documents for this (`output: "standalone"`, `cacheHandler`, `cacheHandlers`) and does not depend on `@opennextjs/aws`.

Every statement about behavior on Azure is marked **Verified (Azure)**, **Verified (local)** or **Unverified** in [Compatibility](/compatibility). Nothing is described as working unless it was run.

## Features

"Azure" means the HTTP suite passed on a real deployment (47 passed, 2026-11-08); "local" means Azurite and the Functions host on a developer machine and in CI.

- App Router and Pages Router, API routes, dynamic routes (Azure)
- Server-side rendering with response streaming (Azure)
- Static generation and ISR with stale-while-revalidate (Azure)
- On-demand revalidation: `revalidateTag`, `revalidatePath` (Azure)
- `'use cache'` with tags (Azure)
- Middleware, Server Actions, `after()` (Azure)
- Image optimization with `sharp` (Azure)
- Next.js 15.5.29 and 16.4.5 (Azure; also local and CI)

Not checked: Front Door, always-ready instances, Partial Prerendering with this design. Not supported: the Edge runtime.

## Quick start

```js title="next.config.mjs"
import { withAzure } from "next-on-azure/config";

export default withAzure({
  // your Next.js configuration
});
```

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"
next build
next-on-azure package
next-on-azure deploy --resource-group <rg> --name <short-name> --location <region>
```

The package is not published, so this works from a checkout of the repository only. The full guide is [Get started](/get_started).

## Where to go next

- [Get started](/get_started): install, configure, build, package and deploy
- [Compatibility](/compatibility): Next.js versions and features, with verification status
- [Configuration](/configuration): `withAzure()`, environment variables, the CLI
- [How does it work?](/how_it_works): the request path, the caches, `after()`, priming, packaging
- [Comparison](/comparison): OpenNext (AWS, Cloudflare)
- [FAQ](/faq) and [Troubleshooting](/troubleshooting)
- [Contributing](/contribute): run locally, tests, CI, real Azure runs
