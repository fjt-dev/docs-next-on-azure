# Contributing

This repository is the documentation site of [next-on-azure](https://github.com/fjt-dev/next-on-azure). The English pages are synced from the `docs/` directory of that repository (`pnpm sync:content`): to change an English page, change it there. The Japanese pages are written here, in `content/ja/`.

## Translations

- **Request a page**: a page that has no translation shows a "request a translation" link that opens an issue in this repository with the page filled in.
- **Contribute a translation**: add `content/ja/<same path as in content/en>.md` with the same `source` front matter as the English file, and keep its links, code and the names of commands and settings as they are. Every Japanese page shows a notice that the text may be machine or AI translated; say in the pull request if you translated it yourself.
- **Update a translation**: the English page changes first. When an English page changed, the Japanese page of the same name may be behind: compare them and open a pull request.
- Translating the interface (the texts of the menus, the search, the notices): `src/lib/i18n.ts` and `src/lib/nav.ts`.

## Run the site

```bash
pnpm install
pnpm dev            # http://localhost:3200 with: pnpm dev -p 3200
pnpm typecheck
pnpm build
```

More in the README. Everyone taking part is expected to follow the [Code of Conduct](https://github.com/fjt-dev/next-on-azure/blob/main/CODE_OF_CONDUCT.md) of the main repository; security problems are reported as described in its [security policy](https://github.com/fjt-dev/next-on-azure/blob/main/SECURITY.md).
