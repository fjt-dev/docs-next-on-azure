---
title: "How this site is hosted"
description: "このドキュメントサイトは、next-on-azure で、1 つの Azure Function にデプロイしています。"
---

このサイトは、ドキュメントを書いているパッケージ自身で動く Next.js アプリです。next-on-azure で小さなサイトを動かす例であり、デプロイの手順は、[はじめに](/get_started)にあるものです。

## 何がどこで動くか

| 部分 | このサイトが使うもの |
| --- | --- |
| アプリ | Next.js 16.4.5(App Router)。ページは Markdown で書き、ビルド時にプリレンダリングします。訪問者の言語は、`proxy` で選びます |
| パッケージ | npm の `next-on-azure` `0.1.0`。`next-on-azure package` で zip を作り、`next-on-azure deploy` でリソースを作ってデプロイします |
| コンピューティング | [Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600) の Azure Function 1 つ(Node.js 22、Japan East)。静的ファイルも含めて、すべてのリクエストに応答します |
| ストレージ | ストレージアカウント 1 つ。キャッシュの `cache` コンテナーと `tagcache` テーブル、およびデプロイのパッケージ |
| 監視 | Application Insights と Log Analytics |
| ドメイン | 独自ドメイン。無料の App Service マネージド証明書を使っています(Azure ポータルで設定しました。テンプレートには含まれません) |

## どうデプロイしたか

```bash
next-on-azure deploy --resource-group <rg> --name <short-name> --location japaneast \
  --request-telemetry errors --max-instances 10 --cache-retention-days 30
```

- `--request-telemetry errors` は、失敗だけを Application Insights に送り、データ量を小さく保ちます([費用](/cost))。
- `--max-instances 10` は、インスタンス数を抑え、急なアクセスで無制限にスケールしないようにします。
- `--cache-retention-days 30` は、古いビルドのキャッシュエントリを削除します。
- デプロイのたびに、`deploy` がプリレンダリングされたすべてのページを 1 回要求し、最初の訪問者が来る前に、ページをキャッシュに入れます。
- リソースグループには、月ごとの予算アラートを設定しています。

サイトのソースは、[ドキュメントのリポジトリ](https://github.com/fjt-dev/docs-next-on-azure)にあります。このサイトの費用は、まだ公開していません。Azure が、最初の数日分の使用量を、まだ報告していないためです。
