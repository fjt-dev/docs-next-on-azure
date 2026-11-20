---
title: "How this site is hosted"
description: "This documentation site is built and hosted with next-on-azure on one Azure Function."
---

This site is a Next.js app that runs on the package it documents. It is an example of a small site on next-on-azure, and the way it was deployed is the one in [Get started](/get_started).

## What runs where

| Part | What the site uses |
| --- | --- |
| App | Next.js 16.4.5 (App Router). The pages are written in Markdown and prerendered at build time; the language of a visitor is chosen by a `proxy` |
| Package | `next-on-azure` `0.1.0`, installed from npm: `next-on-azure package` builds the zip and `next-on-azure deploy` creates the resources and deploys it |
| Compute | one Azure Function on [Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600), Node.js 22, Japan East. It answers every request, static files included |
| Storage | one storage account: the `cache` container and the `tagcache` table of the cache, and the deployment package |
| Monitoring | Application Insights and Log Analytics |
| Domain | a custom domain, with a free App Service managed certificate (set up in the Azure portal; the template does not include it) |

## How it was deployed

```bash
next-on-azure deploy --resource-group <rg> --name <short-name> --location japaneast \
  --request-telemetry errors --max-instances 10 --cache-retention-days 30
```

- `--request-telemetry errors` sends only failures to Application Insights, which keeps its data small ([Cost](/cost)).
- `--max-instances 10` bounds the instance count, so that a burst of requests cannot scale without limit.
- `--cache-retention-days 30` deletes cache entries of old builds.
- After each deployment, `deploy` requests every prerendered page once, so that the pages are in the cache before the first visitor arrives. This site has 24 of them.
- A monthly budget alert is set on the resource group.

The source of the site is in the [documentation repository](https://github.com/fjt-dev/docs-next-on-azure). The cost of this site is not published yet: the usage of the first days has not been reported by Azure.
