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

アクセス数によります。小さなサイトは、Azure Functions の無料枠に収まります。アクセスの多いサイトは、実行回数、インスタンスの稼働時間、Application Insights、外向きのデータ転送の分を払います。[費用](./cost.md)に、ドキュメントサイトで Azure 上で実測した結果、アクセス数ごとの試算(月 10 万訪問で約 0.2 ドル、100 万訪問で約 22〜62 ドル)、費用を下げる方法を書いています。常時稼働インスタンス(`--always-ready`)は、常に課金されます([ADR-0013](./plan/decisions.md#adr-0013-cold-start-always-ready-instances-first-no-timer-warmer-yet)を参照)。

## デプロイ直後の最初のリクエストが遅いのはなぜですか。

`--always-ready` を使わない場合、インスタンスは最初のリクエストで起動します(アイドル後の測定で 2.4 秒。`--always-ready 1` なら 0.15 秒)。`deploy` は、そのリクエストを自分で送り、プリレンダリングされたページもプライミングするので、訪問者は待たされません。
