---
title: "Overview"
description: "Run a Next.js app on one Azure Function (Flex Consumption) with Blob and Table Storage."
---

> **Experimental.** `0.1.0` is on [npm](https://www.npmjs.com/package/next-on-azure).

## next-on-azure

`next-on-azure` runs a Next.js app on **one Azure Function** ([Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)). The Next.js server runs inside the function, and the caches are kept in Blob and Table Storage, so every instance shares the same state. The app scales to zero when nobody visits.

## Features

- App Router and Pages Router, API routes, dynamic routes
- Server-side rendering with response streaming
- Static generation and ISR, `revalidateTag` and `revalidatePath`
- `'use cache'`
- Middleware (including `proxy` on Next.js 16), Server Actions, `after()`
- Image optimization with `sharp`
- Next.js 15.5.29 and later 15.x, and 16.4.5 and later

What was tested, and what was not, is listed in [Compatibility](/compatibility). The Edge runtime is not supported.

## Quick start

```bash
npm install next-on-azure
```

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

The full guide is [Get started](/get_started).

## Where to go next

- [Get started](/get_started): install, configure, build, package and deploy
- [Compatibility](/compatibility): Next.js versions and features
- [Configuration](/configuration): `withAzure()`, environment variables, the CLI
- [Cost](/cost): what is billed, and what to expect
- [Your own infrastructure](/infrastructure): use the package without `deploy`
- [How does it work?](/how_it_works)
- [FAQ](/faq) and [Troubleshooting](/troubleshooting)
