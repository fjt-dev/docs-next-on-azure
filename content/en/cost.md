---
title: "Cost"
source: "docs/cost.md"
---

What a deployment costs depends on the traffic. This page says what is billed, what was measured, and what the bill looks like at different traffic. The estimates come from measurements of one site (this documentation site) and are not bills.

## What is billed

| Resource | Billed by |
| --- | --- |
| Function app ([Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)) | executions, and memory times execution time (GB-seconds), above a monthly free grant; always-ready instances are billed continuously |
| Application Insights and Log Analytics | ingested data (GB), above a monthly free grant |
| Storage account | transactions and capacity |
| Outbound data | GB sent to the internet, above a free first part |
| [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) Standard (optional) | a base fee per profile, plus requests and data |

Every request runs the function, static files included. `/_next/static/*` is sent with `Cache-Control: public, max-age=31536000, immutable`, so a browser fetches each file once; `public/` files are revalidated on every request.

## Measured

The documentation site was deployed on Flex Consumption in Japan East, and a script made 300 visits to each deployment: 30% were first visits that fetch the page and its 10 static files, the others fetched the page only.

| | Measured |
| --- | --- |
| Requests per visit, data per visit | 4.2 requests, 186 KB |
| Execution time per request at 2048 MB | about 0.05 to 0.1 GB-seconds (26 to 106 ms) |
| Application Insights data per request, default | about 4 KB |
| Application Insights data per request with `--request-telemetry errors` | about 0.6 KB |
| Storage transactions | a few thousand over the whole test, including the deployment: negligible |

At 512 MB the same request took about four times as long, so the GB-seconds were the same and the instance count went up: a smaller size does not save money for this workload. The first requests after a deployment include the warm-up of a new instance, so the figures are an upper bound for a site that stays up. Most of the telemetry is the "Executing" and "Executed" messages of the function; `--request-telemetry errors` removes them.

## Estimate by traffic

For a documentation-like site: 4.2 requests and 186 KB per visit at 2048 MB. Prices are the Azure retail prices for Japan East of 2026-11-10 in USD: 0.40 per million executions, 0.000026 per GB-second, Log Analytics 3.34 per GB, outbound data 0.11 per GB after a free first part. The free grants are 250,000 executions, 100,000 GB-seconds and 5 GB of Log Analytics a month.

| Visits a month | Function | Application Insights, default | Application Insights, `errors` | Outbound data | Total, default | Total, `errors` |
| --- | --- | --- | --- | --- | --- | --- |
| 10,000 | 0 | 0 | 0 | 0 | about 0 | about 0 |
| 100,000 | 0.1 | 0 | 0 | 0 | about 0.2 | about 0.2 |
| 1,000,000 | 10.5 | 41 | 0 | 9.5 | about 62 | about 22 |
| 10,000,000 | 130 | 558 | 70 | 194 | about 900 | about 410 |

Storage adds about 1.5 USD at one million visits. One always-ready instance adds about 21 USD a month at 2048 MB. A site with more requests or more data per visit costs more: scale the table by the requests and the kilobytes of your own pages. Up to about 100,000 visits a month the bill is inside the free grants or a few dollars. Above that, Application Insights is the largest part of the bill unless you reduce it, then the function, then outbound data.

## How to lower the bill

| Lever | Effect |
| --- | --- |
| `deploy --request-telemetry errors` | 85% less Application Insights data; successful requests then do not appear there |
| `deploy --max-instances <n>` | Bounds the worst case of a burst or abuse (default 20) |
| `deploy --cache-retention-days <n>` | Deletes cache entries, and those of old builds, after `n` days (default 30) |
| Serving `/_next/static/*` from a CDN | Takes the static files off the function; worth it from a few hundred thousand visits a month, by the estimate. Front Door Standard has a base fee of about 35 USD a month at list price |
| `--always-ready` at 0 (the default) | An always-ready instance costs about 21 USD a month but removes the cold start (2.4 s to 0.15 s) |

## What was not measured

- A bill at real traffic: the traffic was scripted, and the runs lasted minutes to hours.
- Dynamic pages, images and Server Actions were not part of the load.
- Outbound data prices above the free first part, and Table Storage prices.
