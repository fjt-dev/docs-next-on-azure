# next-on-azure documentation site

The documentation of next-on-azure as a website. Structure and design follow the documentation of OpenNext (opennext.js.org): a sidebar, breadcrumbs, "On This Page", previous and next links, search (⌘K), light and dark themes.

The site is a Next.js (App Router) app that renders Markdown from `content/` at build time, and it is built and run with next-on-azure itself.

## Work on it

```bash
pnpm install
pnpm dev                    # http://localhost:3200 with: pnpm dev -p 3200
pnpm typecheck
```

## Content

`content/` holds the pages. All but `index.md` are copied from the `docs/` directory of the repository:

```bash
pnpm sync:content           # NEXT_ON_AZURE_REPO or the sibling directory
```

The sidebar is `src/lib/nav.ts`. Links between pages are rewritten from the repository's relative Markdown links; a link to something that is not on the site becomes plain text. Set `NEXT_PUBLIC_EDIT_BASE` at build time (for example `https://github.com/<owner>/<repo>/blob/main`) to get an "Edit this page" link.

## The package

next-on-azure is not published, so the site installs a tarball from `vendor/`. After the package changed:

```bash
pnpm vendor                 # npm pack in the repository, then reinstall
```

## Run it the way Azure does

```bash
pnpm package:local          # next build + next-on-azure package --target local
node scripts/run-local.mjs  # Azurite + the Azure Functions host on http://localhost:7071
```

`scripts/run-local.mjs` takes Azurite and the Functions Core Tools from a checkout of the next-on-azure repository (`NEXT_ON_AZURE_REPO`, default: the sibling directory).

## Deploy

```bash
pnpm package                # next build + next-on-azure package (Linux x64 sharp inside)
next-on-azure deploy -g <resource group> -n <short name> -l <region>
```

`deploy` creates billable Azure resources (Flex Consumption app, storage account, Application Insights). Decide the resource group, a time window and a cost ceiling first, and delete the resources by name afterwards. This has **not** been run for this site.
