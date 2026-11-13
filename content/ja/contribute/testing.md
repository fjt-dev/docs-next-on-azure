---
title: "Testing"
source: "docs/contribute/testing.md"
---

| レイヤー | コマンド | 実行対象 |
| --- | --- | --- |
| 単体 | `pnpm test` | `packages/tests-unit/src/unit/next-on-azure/`: 設定ヘルパー、パッケージ化のヘルパー、`prime`、デプロイのオプション、Bicep テンプレート、Front Door の確認、偽のストレージを使った両方のキャッシュハンドラー、`npm pack` の内容 |
| 統合 | `pnpm test:integration` | 実際の Azure SDK を使い、Azurite に対する両方のキャッシュハンドラー(ポート 10100〜10102) |
| ローカル E2E | `pnpm e2e:standalone` | 実際の Functions ホストと Azurite で動かした `examples/standalone` に対する、`packages/tests-e2e` の HTTP スイート |
| Azure E2E | ワークフロー `azure-e2e`(手動) | デプロイに対する同じスイート。[CI での Azure E2E](./azure_e2e.md) を参照してください |

`pnpm e2e:standalone` は、サンプルをローカルのマシン向けにパッケージ化し、Azurite と Functions ホストを起動し(`scripts/standalone-local.mjs`)、`E2E_BASE_URL=http://localhost:7071` でスイートを実行して、すべてを停止します。実行のたびに、空のストレージから始めてください(スクリプトはそうします)。時間ベースの ISR のケースは、テストより古いエントリがないことを前提にしています。

デプロイに対するスイートは、`E2E_TARGET=standalone E2E_BASE_URL=https://<app>.azurewebsites.net pnpm --filter tests-e2e run e2e:remote` です。

## スイートが確認すること

SSR、静的ページと ISR ページ(stale-while-revalidate)、`revalidateTag` と `revalidatePath`、`'use cache'`、Pages Router(`fallback`、`notFound`、`res.revalidate`)、ミドルウェア、Server Actions、`after()`(レスポンスが処理を待つこと)、チャンクのタイミングを含むストリーミング、画像最適化、Cookie、HEAD、404、静的ファイル。47 ケースです。

## ルール

- 動作を変える変更には、`packages/tests-unit` のテストが必要です。HTTP から見えるなら、`packages/tests-e2e` のケースも必要です。
- 機能を [Compatibility](../compatibility.md) で **Verified** にするのは、テストか、記録した実行がそれを網羅しているときだけです。
- 新しいテストは、それが網羅するコードを一度壊して、確認します(ハンドラーのテストでは、そうしました。4 件が失敗しました)。
