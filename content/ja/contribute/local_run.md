---
title: "Run locally"
source: "docs/contribute/local_run.md"
---

## next-on-azure(現在のもの)

```bash
pnpm install
pnpm build                                          # builds packages/next-on-azure
pnpm --filter example-standalone run standalone     # next build + next-on-azure package --target local
node scripts/standalone-local.mjs                   # Azurite + the Functions host on http://localhost:7071
```

`standalone-local.mjs` は、実行のたびに、空のストレージで Azurite を起動し、`examples/standalone/.next-azure/app` を実行します。これに対して HTTP スイートを実行するには、`pnpm e2e:standalone` を使います(パッケージ化し、スタックを起動し、スイートを実行して、すべてを停止します)。スタックを起動したままにするなら、`E2E_BASE_URL=http://localhost:7071 E2E_TARGET=standalone pnpm --filter tests-e2e exec vitest run --project remote` です。実行のたびに、空のストレージから始めてください。時間ベースの ISR のケースは、テストより古いエントリがないことを前提にしています。

別の Next.js のバージョンを試すには、`pnpm-workspace.yaml` のカタログの `next` を変更して、`pnpm install --no-frozen-lockfile` を実行します(CI は、Next.js 16 のレッグでこうしています)。git の worktree では、Functions Core Tools のバイナリがないことがあります。別のチェックアウトの `node_modules/azure-functions-core-tools` から、`bin` ディレクトリをコピーしてください。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm build` | すべてのパッケージをビルドします |
| `pnpm typecheck` | すべてのパッケージの型チェックをします |
| `pnpm lint` | Biome のチェック |
| `pnpm test` / `pnpm test:integration` / `pnpm e2e:standalone` | 単体テスト、Azurite の統合テスト、ローカルスタックの E2E テスト。[Testing](./testing.md) を参照してください |
| `node scripts/standalone-local.mjs` | Azurite + Functions ホスト(http://localhost:7071) |
| `pnpm --filter next-on-azure bicep:build` | Bicep テンプレートをコンパイルします(Azure CLI が必要です) |

## 規約

- TypeScript と ESM を使います。相対 import には、`.js` 拡張子を付けます。
- override のモジュールで、`@azure/*` を静的に import しないでください([ADR-0007](../plan/decisions.md#adr-0007-azure-sdks-are-imported-at-runtime-only))。
- 変更のたびに、[作業ログ](../plan/worklog.md)と[ロードマップ](../plan/roadmap.md)を更新してください。
