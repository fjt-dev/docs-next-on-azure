---
title: "Your own infrastructure"
source: "docs/infrastructure.md"
---

`next-on-azure deploy` は、`infra/main.bicep` でリソースを 1 セット作成し、そこへアプリをデプロイします。これは参考実装であり、必須ではありません。インフラをまったく作らない OpenNext と同じように、このパッケージは、自分で作ったインフラ(Bicep、Terraform、ポータル、独自のポリシーを持つランディングゾーン)でも使えます。このページでは、アプリが必要とするものを挙げます。

**状況。** 以下のリソースは、テンプレートが作成するものです。このセットは、Azure にデプロイして HTTP スイートに合格しました(2026-11-09 と 2026-11-10)。同じセットを別のツールで作る方法は **Unverified** です。テンプレートが作っていないインフラでは、ここに書いたことを何も実行していません。

## アプリが必要とするもの

| リソース | アプリが前提にする設定 |
| --- | --- |
| **[Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)** の Function App(Linux) | Node.js 22(24 は未検証)。システム割り当てのマネージド ID。パッケージが提供する HTTP 関数 1 つ(`server`、ルート `{*path}`)。インスタンスのメモリは 512、2048、4096 MB(検証済みは 2048)。インスタンス数の上限 |
| ストレージアカウント | `cache` コンテナー(キャッシュエントリ)、`tagcache` テーブル(タグの状態)、Function App のデプロイ用コンテナー(テンプレートでは `deploy-app`) |
| Application Insights(任意) | アプリの `APPLICATIONINSIGHTS_CONNECTION_STRING` |
| [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600)(任意) | `/_next/static/*` のキャッシュ付きルート。このとき、アプリは `X-Azure-FDID`(`FRONT_DOOR_ID`)を確認します。**一度もデプロイしていません** |

テンプレートは、次の設定も行います。ストレージアカウントの TLS 1.2 以降と HTTPS のみ、共有キーのアクセスを無効、匿名の Blob アクセスを無効、大きなボディと Server Actions のための `FUNCTIONS_REQUEST_BODY_SIZE_LIMIT`。アプリが読む設定は、[Configuration](./configuration.md#環境変数) にあります。

## アクセス

アプリはマネージド ID を使うので、キーも接続文字列も要りません(接続文字列を受け付けるのは、[Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) のときだけです)。テンプレートは、ストレージアカウントで、アプリの ID に次のロールを付与します。

| ロール | 理由 |
| --- | --- |
| Storage Blob Data Owner | ストレージを ID で使うとき、Functions ホストとデプロイ用コンテナーが必要とします([Azure notes](./inner_workings/azure_notes.md)の項目 12)。キャッシュハンドラーも、`cache` コンテナーに同じロールを使います |
| Storage Table Data Contributor | タグの状態 |
| Storage Queue Data Contributor | 最初の設計から残したものです。HTTP だけのアプリに必要かどうかは、**テストしていません** |

デプロイする人には、リソースを作成する権限(Contributor)が必要です。テンプレートまたは別のツールがこれらのロールを割り当てる場合は、その権限(Role Based Access Control Administrator または User Access Administrator)も必要です([CI での Azure E2E](./contribute/azure_e2e.md))。`az functionapp deployment source config-zip` のパッケージのアップロードは、プラットフォームがアプリの ID で行います。ロールを作った直後に、一度 403 で失敗し、約 2 分後に成功しました(2026-11-10)。

## `deploy` を使わないビルドとデプロイ

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # the same key for every build
next build
next-on-azure package                       # writes .next-azure/app.zip
az functionapp deployment source config-zip -g <rg> -n <app> --src .next-azure/app.zip
next-on-azure prime https://<app>.azurewebsites.net   # requests every prerendered route once
```

`deploy` は、インフラを作ったあとで同じ手順を実行し、最初の応答を待ってから prime します。

## 何がどこに保存されるか

- Blob `cache`: Next.js がキャッシュする、レンダリング済みのページ、ルートハンドラーのレスポンス、`fetch` の結果と、`'use cache'` のエントリ。アプリが、1 人のユーザーに属するデータをキャッシュするなら、そのデータはこのコンテナーに入ります。キャッシュしないか、ストレージアカウントを共有しないでください。
- Table `tagcache`: タグと、それを再検証した時刻。
- Application Insights: Functions ホストのリクエストとトレース。既定ではサンプリングされます(`--full-telemetry` でサンプリングを止められます)。このパッケージは、リクエストボディを記録しません。
- デプロイ用コンテナー: アプリの zip(アプリのコードと `node_modules` が入っています。アプリがビルド時のシークレットを入れていなければ、シークレットは入りません)。

## 提供しないもの

プライベートネットワーク(VNet 統合、プライベートエンドポイント)、Web アプリケーションファイアウォール、お客様管理のキー、ゾーン冗長やジオ冗長の設定、診断設定、Azure Policy のタグは、テンプレートに入っていません。自分で作るインフラには、追加できます。ただし、このパッケージで試したものはないので、動くとは言いません。[ADR-0019](./plan/decisions.md#adr-0019-enterprise-use-at-the-level-of-opennext)を参照してください。
