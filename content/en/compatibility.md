---
title: "Compatibility"
source: "docs/compatibility.md"
---

How far each row has been tested:

- **Tested on Azure**: run against a real deployment of this package ([Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600), Japan East, Node.js 22).
- **Tested locally**: run with [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) and the Azure Functions host only.
- **Not tested**: implemented or expected to work, but never run.

## Next.js

| Version | Status |
| --- | --- |
| 15.5.29 | Tested on Azure |
| 15.5.30 and later 15.x | Expected to work; only 15.5.29 was run |
| 16.4.5 | Tested on Azure |
| 16.4.6 and later | Expected to work; only 16.4.5 was run |
| 16.0.0 to 16.4.4 | Not supported (`package` refuses; `--allow-unsupported-next` overrides) |
| Older than 15.5.29 | Not supported |

## Features

| Feature | Status |
| --- | --- |
| App Router: server rendering, route handlers, dynamic routes | Tested on Azure |
| Pages Router: `getServerSideProps`, `getStaticProps`, API routes, `fallback`, `notFound`, `res.revalidate` | Tested on Azure |
| Static pages and time-based ISR (`revalidate`) | Tested on Azure. A stale page is served at once, and the next request gets the new one |
| `revalidateTag`, `revalidatePath` | Tested on Azure |
| `'use cache'` with `cacheTag` and `revalidateTag` | Tested on Azure: Next.js 15 with `experimental.useCache`, and Next.js 16 with `cacheComponents` (Partial Prerendering). `cacheLife` expiry and the `remote` and `private` variants are not tested |
| Response streaming (Suspense) | Tested on Azure |
| Middleware (redirect, rewrite, headers) and the Next.js 16 `proxy` convention | Tested on Azure. The Edge runtime is not supported |
| Server Actions | Tested on Azure. Set a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` ([Troubleshooting](./troubleshooting.md#a-server-action-fails-after-a-deployment-failed-to-find-server-action)). Deploying over an older build is not tested |
| `after()` | Tested on Azure with the default `--wait-until hold`. `detach` is not tested |
| Image optimization (`next/image`) | Tested on Azure: resizing, WebP, and rejection of bad sizes and remote URLs that are not allowed. Optimized images are made again after an instance restarts |
| Cookies (several `Set-Cookie`) | Tested on Azure |
| Prerendered pages, `dynamicParams = false`, `fallback: false` | Tested on Azure (App Router). Pages Router `fallback: false` is tested locally. Prerendered pages are in the cache right after `deploy` |
| Static files (`/_next/static`, `public/`) | Tested on Azure. The function serves them, so every request is a function execution |
| Custom domain with a free App Service managed certificate | Tested on Azure. Set up in the portal (the template does not include it). Renewal of the certificate is not tested |
| Edge runtime | Not supported |
| [Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) | Not tested. Azure refuses it on Free Trial and Student subscriptions |

## Platform

| Item | Status |
| --- | --- |
| Azure Functions Flex Consumption, Node.js 22, Japan East | Tested on Azure |
| Node.js 24, other regions | Not tested |
| Build machine: macOS and Linux with npm, pnpm or Yarn 1 | Tested (pnpm on Azure; npm and Yarn 1 locally and in CI) |
| Windows, Yarn 2 and later with `node_modules`, Bun | Not tested |
| Yarn Plug'n'Play | Not supported (`package` stops and names the fix, `nodeLinker: node-modules`) |
| Cold start | 2.4 to 2.7 seconds for the first request after about 10 minutes idle (four single samples); 0.1 to 0.2 seconds warm. With `--always-ready 1` it was 0.15 seconds |
| Load | 300 requests at 30 in parallel: all succeeded; the 95th percentile was 0.29 seconds for a dynamic page and 0.86 seconds for an ISR page |

## Known limits

- A response that fails after its first byte ends at that point: the client sees a shortened body, and the failure is logged.
- Concurrent regeneration after a revalidation is not coalesced: parallel requests can each regenerate a page.
- `after()` work cannot be tied to one request: a response may also wait for work that other requests started earlier (at most 220 seconds).
- Absolute URLs that your code builds from `request.url` in middleware and writes into a response body show the loopback address (`http://localhost:3000`). The `Location` header of a redirect is corrected.
- A rewrite by `proxy` (Next.js 16) leaves the response header `x-middleware-rewrite` with the loopback address.
