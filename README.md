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

`content/en/` holds the English pages and `content/ja/` the Japanese ones. They are written for people who use the package; the maintainers' documents (decision records, tests, CI, release, cost measurements) stay in the `docs/` directory of the next-on-azure repository and are not copied here.

The sidebar is `src/lib/nav.ts`. Relative Markdown links between pages (`./compatibility.md`) are rewritten to site routes by the `source` front matter of each page; a link to something that is not on the site becomes plain text. Set `NEXT_PUBLIC_EDIT_BASE` at build time (for example `https://github.com/<owner>/<repo>/blob/main`) to get an "Edit this page" link. `NEXT_PUBLIC_FEEDBACK_URL` adds the "Question? Give us feedback" link under "On This Page", and `NEXT_PUBLIC_REPO_URL` the GitHub icon in the header; all three are left out while the repository is private.

## Languages

The site is in English (`/en/...`) and Japanese (`/ja/...`). A path without a language (`/`, `/faq`) opens the English page, unless the visitor chose another language in the language menu (the `lang` cookie it sets; `src/proxy.ts`). The browser's language is not used.

- `content/ja/` holds the Japanese pages, with the same file names and the same `source` front matter as the English ones. A page that is not there is shown in English, with a notice.
- A translated Japanese page has the notice that the text may be machine or AI translated; a page without a translation says so instead, in the same band, with a "request a translation" link that opens a new GitHub issue with the page filled in (`TranslationNotice`, `src/lib/site.ts`; the repository is `NEXT_PUBLIC_ISSUES_URL`, default `fjt-dev/docs-next-on-azure`).
- The texts of the interface and the sidebar titles are in `src/lib/i18n.ts` and `src/lib/nav.ts`. To add a language, add it to `langs`, `ui` and the nav titles, and a `content/<lang>/` directory.
- Every page has a Japanese translation. Change the English page first; the translation follows by hand.

## The package

The site installs `next-on-azure` from npm at a fixed version (`package.json`). To try an unreleased change, pack the package in its repository (`npm pack` in `packages/next-on-azure`) and install the tarball temporarily; do not commit that.

## Deployment

A push to `main` that changes the site starts `.github/workflows/deploy.yml`: it builds and packages the site, then deploys the zip to the Function app of the site and requests every prerendered page once. Sign-in to Azure is OIDC with the identity `noa-docs-deploy`, which is Contributor on the resource group of the site only; the workflow reads the repository variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP` and `AZURE_APP_NAME`. It does not change the infrastructure; run `next-on-azure deploy` by hand for that.

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
