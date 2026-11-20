---
title: "FAQ"
source: "docs/faq.md"
---

## なぜ Container Apps や App Service ではなく、Functions なのですか?

Flex Consumption の Functions は、ゼロまでスケールインし、レスポンスをストリーミングできます。動いた分だけ支払い、小さなサイトなら無料枠に収まります。

## Front Door なしで使えますか?

はい、それが既定です。静的ファイルも関数が配信するので、アクセスの多いサイトでは、前に CDN を置いてください。

## 費用はいくらですか?

トラフィックによります。小さなサイトは Azure Functions の無料枠に収まります。アクセスの多いサイトは、実行、インスタンスの時間、Application Insights、アウトバウンドのデータに支払います。[費用](./cost.md)に、トラフィック別の見積もりと、費用を下げる方法があります。

## デプロイのあとの最初のリクエストが遅いのはなぜですか?

`--always-ready` がないと、インスタンスは最初のリクエストで起動します(アイドルのあとで約 2.5 秒)。`deploy` が、そのリクエストを自分で行い、プリレンダリングされたページを prime するので、訪問者には起きません。

## ローカルで動かせますか?

はい。`next-on-azure package --target local` で、自分のマシン用のパッケージを作り、Azure Functions Core Tools と [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) で動かします。リポジトリに、動作するサンプルアプリと、そのためのスクリプトがあります。

## 問題はどこに報告すればよいですか?

[GitHub](https://github.com/fjt-dev/next-on-azure/issues) です。
