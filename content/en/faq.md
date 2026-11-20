---
title: "FAQ"
source: "docs/faq.md"
---

## Why Functions and not Container Apps or App Service?

Functions on Flex Consumption scales to zero and streams responses. You pay for what runs, and a small site stays inside the free grants.

## Can I use it without Front Door?

Yes, and that is the default. Static files are served by the function too, so a busy site should put a CDN in front.

## What does it cost?

It depends on the traffic. A small site stays inside the free grants of Azure Functions; a busy one pays for executions, instance time, Application Insights and outbound data. [Cost](./cost.md) has an estimate by traffic and what lowers the bill.

## Why are the first requests after a deployment slow?

Without `--always-ready` the instance starts on the first request (about 2.5 seconds after being idle). `deploy` makes that request itself and primes the prerendered pages, so a visitor does not.

## Can I run it locally?

Yes. `next-on-azure package --target local` builds a package for your machine, and the Azure Functions Core Tools and [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) run it. The repository has a working example app and a script for it.

## Where do I report a problem?

On [GitHub](https://github.com/fjt-dev/next-on-azure/issues).
