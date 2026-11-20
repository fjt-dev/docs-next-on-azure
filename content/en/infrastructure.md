---
title: "Your own infrastructure"
source: "docs/infrastructure.md"
---

`next-on-azure deploy` creates one set of resources with `infra/main.bicep` and deploys the app to it. You can also create the infrastructure yourself (Bicep, Terraform, the portal, a landing zone with its own policies) and use the package only to build the app. This page lists what the app needs.

The resources below are what the template creates; that set was deployed and tested on Azure. Building the same set with another tool is **not tested**.

## What the app needs

| Resource | Settings the app relies on |
| --- | --- |
| Function app on **[Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)**, Linux | Node.js 22; a system-assigned managed identity; instance memory 512, 2048 or 4096 MB (2048 is the one that was tested); an instance limit. The package provides the one HTTP function that serves every route |
| Storage account | a `cache` container (cache entries), a `tagcache` table (tag state), and the deployment container of the Function app (the template uses `deploy-app`) |
| Application Insights (optional) | `APPLICATIONINSIGHTS_CONNECTION_STRING` on the app |
| [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) (optional) | A route for `/_next/static/*` with caching; the app then checks `X-Azure-FDID` (`FRONT_DOOR_ID`). Not tested |

The template also sets: TLS 1.2 or later and HTTPS only on the storage account, shared-key access off, anonymous Blob access off, and `FUNCTIONS_REQUEST_BODY_SIZE_LIMIT` for large bodies and Server Actions. The settings the app reads are in [Configuration](./configuration.md#environment-variables).

## Access

The app uses its managed identity; no keys or connection strings are needed (a connection string is accepted for [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) only). On the storage account the template grants the app's identity:

| Role | Why |
| --- | --- |
| Storage Blob Data Owner | the Functions host and the deployment container need it when the storage is used by identity; the cache handlers use the same role for the `cache` container |
| Storage Table Data Contributor | tag state |
| Storage Queue Data Contributor | kept from an earlier design; whether an app with only an HTTP function needs it was not tested |

Whoever deploys needs to create the resources (Contributor), and to assign these roles (Role Based Access Control Administrator or User Access Administrator) if the template or another tool assigns them. The package upload of `az functionapp deployment source config-zip` is done by the platform with the app's identity: right after the roles were created, it failed once with 403 and worked after about two minutes.

## Build and deploy without `deploy`

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # the same key for every build
next build
next-on-azure package                       # writes .next-azure/app.zip
az functionapp deployment source config-zip -g <rg> -n <app> --src .next-azure/app.zip
next-on-azure prime https://<app>.azurewebsites.net   # requests every prerendered route once
```

`deploy` runs the same steps after creating the infrastructure, and waits for the first answer before it primes.

## What is stored where

- Blob `cache`: rendered pages, route handler responses, `fetch` results that Next.js caches, and `'use cache'` entries. If your app caches data that belongs to one user, that data is in this container: do not cache it, or do not share the storage account.
- Table `tagcache`: tags and the times they were revalidated.
- Application Insights: requests and traces of the Functions host, sampled by default (`--full-telemetry` turns sampling off). This package does not log request bodies.
- The deployment container: the zip of the app, which contains your code and `node_modules`, and no build-time secrets unless your app put them there.

## Not provided

Private networking (VNet integration, private endpoints), a web application firewall, customer-managed keys, zone or geo redundancy settings, diagnostic settings and Azure Policy tags are not in the template. You can add them to infrastructure you create yourself; none of them was tried with this package.
