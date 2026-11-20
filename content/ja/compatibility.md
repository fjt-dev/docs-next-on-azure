---
title: "Compatibility"
source: "docs/compatibility.md"
---

各行を、どこまでテストしたかを示します。

- **Azure でテスト済み**: このパッケージの実際のデプロイに対して実行しました([Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)、Japan East、Node.js 22)。
- **ローカルでテスト済み**: [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) と Azure Functions ホストだけで実行しました。
- **未テスト**: 実装した、または動くと見込んでいますが、一度も実行していません。

## Next.js

| バージョン | 状態 |
| --- | --- |
| 15.5.29 | Azure でテスト済み |
| 15.5.30 以降の 15.x | 動くと見込んでいます。実行したのは 15.5.29 だけです |
| 16.4.5 | Azure でテスト済み |
| 16.4.6 以降 | 動くと見込んでいます。実行したのは 16.4.5 だけです |
| 16.0.0〜16.4.4 | 非対応(`package` が拒否します。`--allow-unsupported-next` で上書きできます) |
| 15.5.29 より古いもの | 非対応 |

## 機能

| 機能 | 状態 |
| --- | --- |
| App Router: サーバーレンダリング、ルートハンドラー、動的ルート | Azure でテスト済み |
| Pages Router: `getServerSideProps`、`getStaticProps`、API ルート、`fallback`、`notFound`、`res.revalidate` | Azure でテスト済み |
| 静的ページと、時間ベースの ISR(`revalidate`) | Azure でテスト済み。古いページをすぐに返し、次のリクエストで新しいページを返します |
| `revalidateTag`、`revalidatePath` | Azure でテスト済み |
| `cacheTag` と `revalidateTag` を使う `'use cache'` | Azure でテスト済み: `experimental.useCache` を使う Next.js 15 と、`cacheComponents`(Partial Prerendering)を使う Next.js 16。`cacheLife` の期限切れと、`remote`、`private` の種類は、未テストです |
| レスポンスのストリーミング(Suspense) | Azure でテスト済み |
| ミドルウェア(リダイレクト、rewrite、ヘッダー)と、Next.js 16 の `proxy` の規約 | Azure でテスト済み。Edge ランタイムは非対応です |
| Server Actions | Azure でテスト済み。安定した `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` を設定してください([トラブルシューティング](./troubleshooting.md#デプロイのあとで-server-action-が失敗するfailed-to-find-server-action))。古いビルドの上へのデプロイは、未テストです |
| `after()` | 既定の `--wait-until hold` で、Azure でテスト済み。`detach` は未テストです |
| 画像最適化(`next/image`) | Azure でテスト済み: リサイズ、WebP、不正なサイズや許可されていないリモート URL の拒否。最適化した画像は、インスタンスの再起動のあとで作り直されます |
| Cookie(複数の `Set-Cookie`) | Azure でテスト済み |
| プリレンダリングされたページ、`dynamicParams = false`、`fallback: false` | Azure でテスト済み(App Router)。Pages Router の `fallback: false` は、ローカルでテスト済みです。プリレンダリングされたページは、`deploy` の直後からキャッシュに入っています |
| 静的ファイル(`/_next/static`、`public/`) | Azure でテスト済み。関数が配信するので、リクエストごとに関数が 1 回実行されます |
| 無料の App Service マネージド証明書を使う独自ドメイン | Azure でテスト済み。ポータルで設定します(テンプレートには含まれません)。証明書の更新は、未テストです |
| Edge ランタイム | 非対応 |
| [Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) | 未テスト。無料試用版と学生向けのサブスクリプションでは、Azure に拒否されます |

## プラットフォーム

| 項目 | 状態 |
| --- | --- |
| Azure Functions Flex Consumption、Node.js 22、Japan East | Azure でテスト済み |
| Node.js 24、ほかのリージョン | 未テスト |
| ビルドするマシン: macOS と Linux で npm、pnpm、Yarn 1 | テスト済み(pnpm は Azure で。npm と Yarn 1 は、ローカルと CI で) |
| Windows、`node_modules` を使う Yarn 2 以降、Bun | 未テスト |
| Yarn Plug'n'Play | 非対応(`package` が止まり、直し方 `nodeLinker: node-modules` を示します) |
| コールドスタート | 約 10 分アイドルしたあとの最初のリクエストで 2.4〜2.7 秒(単発のサンプル 4 回)。ウォーム時は 0.1〜0.2 秒。`--always-ready 1` を付けると 0.15 秒でした |
| 負荷 | 30 並列で 300 リクエスト: すべて成功。95 パーセンタイルは、動的ページで 0.29 秒、ISR ページで 0.86 秒 |

## 既知の制約

- 最初のバイトのあとで失敗するレスポンスは、その時点で終わります。クライアントには、短くなったボディが見え、失敗はログに記録されます。
- 再検証のあとの同時の再生成は、まとめられません。並列のリクエストが、それぞれページを再生成することがあります。
- `after()` の処理を、1 つのリクエストに結び付けることはできません。レスポンスが、ほかのリクエストが先に始めた処理を待つこともあります(最大 220 秒)。
- ミドルウェアで、コードが `request.url` から作ってレスポンスのボディに書き込む絶対 URL は、ループバックのアドレス(`http://localhost:3000`)になります。リダイレクトの `Location` ヘッダーは修正されます。
- `proxy`(Next.js 16)による rewrite は、レスポンスヘッダー `x-middleware-rewrite` に、ループバックのアドレスを残します。
