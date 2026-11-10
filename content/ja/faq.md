---
title: "FAQ"
source: "docs/faq.md"
---

## なぜ Container Apps や App Service ではなく Functions なのですか。

[ADR-0001](./plan/decisions.md#adr-0001-compute-and-storage-targets)を参照してください。Flex Consumption の Functions は、ゼロまでスケールダウンでき、レスポンスをストリーミングできます。コンテナーなら、転送の手順なしで standalone サーバーを動かせるので、将来、2 つ目の対象にするかもしれません。

## タグに Cosmos DB ではなく Table Storage を使うのはなぜですか。

[ADR-0003](./plan/decisions.md#adr-0003-table-storage-for-the-tag-cache)を参照してください。キャッシュハンドラーは 1 つのファイルなので、別のストアを使うには、そのファイルを置き換えます。

## Front Door なしで使えますか。

はい。それが既定です。静的ファイルも関数が配信するので、アクセスの多いサイトでは、CDN を前に置いてください。

## ローカルで動かせますか。

はい。[ローカル開発](./contribute/local_run.md)を参照してください。

## 費用はどのくらいですか。

Flex Consumption は実行時間とメモリで、Storage は使用量で課金されます。Front Door Standard には、プロファイルごとに基本料金があります。常時稼働インスタンス(`--always-ready`)は、常に課金されます([ADR-0013](./plan/decisions.md#adr-0013-cold-start-always-ready-instances-first-no-timer-warmer-yet)を参照)。お使いのリージョンの最新の Azure の料金を確認してください。これまでの実際の実行は短く(小さなアプリで 17 分と 27 分)、Azure Cost Management の金額は、まだ確認していません。

## デプロイ直後の最初のリクエストが遅いのはなぜですか。

`--always-ready` を使わない場合、インスタンスは最初のリクエストで起動します(アイドル後の測定で 2.4 秒)。`deploy` は、そのリクエストを自分で送り、プリレンダリングされたページもプライミングするので、訪問者は待たされません。
