---
title: "Troubleshooting"
source: "docs/troubleshooting.md"
---

## A Server Action fails after a deployment ("Failed to find Server Action")

Server Actions encrypt the variables a closure captures. By default Next.js makes a new key for every build, so a page that was open before a deployment fails when it calls an action, and instances built apart do not agree.

Set the same key for every build, at build time:

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # keep it in your secret store, not in the repository
next build
next-on-azure package
```

The key is base64 of 16, 24 or 32 bytes. `package` warns when the app has Server Actions and the variable is not set, or when it differs from the key in the build.

## Images are served unresized, with no error

`sharp` is missing or incomplete in the package. `package` copies the whole `sharp` package and the Linux x64 binaries; check that `@img/sharp-linux-x64` and `@img/sharp-libvips-linux-x64` are in `standalone/node_modules/@img` of the zip. Without `sharp`, Next.js serves the original image.

## A redirect points to `http://localhost:3000/...`

The package corrects the `Location` header of redirects. A URL that your code builds from `request.url` and writes into a page is not corrected: use an environment variable for the public origin.

## `EACCES: permission denied, mkdir '.../.next/cache'` in the logs

Something writes below the app directory, which is read-only on Azure. `withAzure()` turns off the image disk cache and `isrFlushToDisk`; remove any other write there, or write to `/tmp`.

## The Function app shows "Your Azure Function App is up and running"

The app did not start. Read the log first: `az monitor app-insights query --app <name> -g <rg> --analytics-query "traces | order by timestamp desc"` shows `Worker was unable to load entry point` with the missing module. Application Insights lags by one to ten minutes.

## A setting I added with `az functionapp config appsettings set` disappeared

A [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview?wt.mc_id=studentamb_679600) redeployment replaces the whole `appSettings` array. Put settings in the template.
