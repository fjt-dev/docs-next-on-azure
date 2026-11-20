---
title: "How does it work?"
source: "docs/how_it_works.md"
---

## The request path

```
client ──▶ Functions front end ──▶ Function `server` ──loopback──▶ Next.js server (same worker)
                                                                        │
                                          cache handlers ──▶ Blob (entries) + Table (tags)
```

- The Function app has **one function**, `server`, that answers every route with streaming enabled. The first request starts the Next.js standalone server inside the same worker, on `127.0.0.1:3000`, and waits until the port is open.
- Every request is forwarded to that server, and the response is passed on as a stream. Routing, rendering, middleware, Server Actions, streaming and image optimization are done by Next.js itself.
- Request bodies are buffered before they are forwarded. `Set-Cookie` values are converted to the cookies of the Functions response, because the host keeps only one value per header name. The public host and scheme are put back into the `Location` header of redirects.

## Caches

Next.js asks two interfaces for storage; the package implements both on Storage, and `withAzure()` sets them:

| Interface | Used for | Storage |
| --- | --- | --- |
| `cacheHandler` | pages, route handlers, `fetch` results, `revalidateTag`, `revalidatePath` | one JSON blob per entry in the `cache` container, named by build id and a hash of the key |
| `cacheHandlers` | `'use cache'` | one JSON blob per entry, under `use-cache/<build id>/` |
| tags (both) | revalidation state | table `tagcache`: the time each tag was last revalidated |

An entry is dropped when any of its tags was revalidated after it was written. Nothing is deleted on revalidation, so it costs one small write per tag. The key includes the build id: a new deployment starts with an empty cache, and the entries of old builds are never read (a lifecycle rule deletes them after `--cache-retention-days`).

**Time-based ISR** is Next.js's own: a request that finds an entry older than `revalidate` gets the stale page at once (`x-nextjs-cache: STALE`) and the server regenerates the page in the background, in the same process. There is no queue. If the instance is removed in the meantime, the regeneration is lost and the next request starts it again.

**Prerendered pages.** `next build` prerenders pages into `.next/server`. On a miss in Blob, the cache handler reads them from there, so a built page is in the cache from the first request, and a route without a fallback (`dynamicParams = false`) works. `next-on-azure prime`, which `deploy` runs, requests every prerendered route once to warm the instance.

## `after()` and other deferred work

An idle instance is removed after about 1.5 to 3.5 minutes, and deferred work that outlives it is lost. So a response is held open until the work that was registered before it ended has finished (at most `WAIT_UNTIL_MAX_SECONDS`, 220 by default). `--wait-until detach` ends the response at once instead.

## Packaging

`next-on-azure package` makes a Function app from `.next/standalone`:

1. checks the Next.js version and the Server Actions key;
2. copies the standalone directory and turns the pnpm `node_modules` into a plain tree without symbolic links (Azure drops them);
3. copies `.next/static` and `public/` next to `server.js`, and the complete `sharp` package with the Linux x64 binaries;
4. adds the Functions entry and `host.json`, installs `@azure/functions`, and zips the result.
