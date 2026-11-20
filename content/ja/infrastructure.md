---
title: "Your own infrastructure"
source: "docs/infrastructure.md"
---

`next-on-azure deploy` は、`infra/main.bicep` で 1 組のリソースを作り、アプリをデプロイします。インフラを自分で作り(Bicep、Terraform、ポータル、独自のポリシーを持つランディングゾーン)、パッケージはアプリのビルドだけに使うこともできます。このページは、アプリが必要とするものの一覧です。

次のリソースは、テンプレートが作るもので、その組は、Azure にデプロイしてテストしました。同じ組を別のツールで作ることは、**未テスト**です。

## アプリが必要とするもの

| リソース | アプリが前提とする設定 |
| --- | --- |
| **[Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)** の Function App(Linux) | Node.js 22、システム割り当てのマネージド ID、インスタンスのメモリ 512、2048、4096 MB(テストしたのは 2048)、インスタンス数の上限。すべてのルートを処理する 1 つの HTTP 関数は、パッケージが提供します |
| ストレージアカウント | `cache` コンテナー(キャッシュエントリ)、`tagcache` テーブル(タグの状態)、Function App のデプロイ用コンテナー(テンプレートは `deploy-app` を使います) |
| Application Insights(省略可) | アプリの `APPLICATIONINSIGHTS_CONNECTION_STRING` |
| [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600)(省略可) | キャッシュ付きの `/_next/static/*` のルート。アプリは `X-Azure-FDID`(`FRONT_DOOR_ID`)を確認します。未テストです |

テンプレートは、ほかに次の設定もします。ストレージアカウントの TLS 1.2 以上と HTTPS のみ、共有キーでのアクセスをオフ、匿名の Blob アクセスをオフ、大きなボディと Server Actions のための `FUNCTIONS_REQUEST_BODY_SIZE_LIMIT`。アプリが読む設定は、[設定](./configuration.md#環境変数)にあります。

## アクセス

アプリはマネージド ID を使います。キーや接続文字列は要りません(接続文字列は、[Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) のときだけ受け付けます)。テンプレートは、ストレージアカウントで、アプリの ID に次のロールを付与します。

| ロール | 理由 |
| --- | --- |
| Storage Blob Data Owner | ID でストレージを使うとき、Functions ホストとデプロイ用コンテナーが必要とします。キャッシュハンドラーも、`cache` コンテナーに同じロールを使います |
| Storage Table Data Contributor | タグの状態 |
| Storage Queue Data Contributor | 以前の設計から残したものです。HTTP 関数だけのアプリに必要かは、テストしていません |

デプロイする人は、リソースを作る権限(Contributor)と、テンプレートやほかのツールがロールを割り当てるなら、ロールを割り当てる権限(Role Based Access Control Administrator または User Access Administrator)が必要です。`az functionapp deployment source config-zip` のパッケージのアップロードは、プラットフォームが、アプリの ID で行います。ロールを作った直後には、一度 403 で失敗し、約 2 分後に成功しました。

## `deploy` を使わずにビルドしてデプロイする

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # すべてのビルドで同じキー
next build
next-on-azure package                       # .next-azure/app.zip を書き出します
az functionapp deployment source config-zip -g <rg> -n <app> --src .next-azure/app.zip
next-on-azure prime https://<app>.azurewebsites.net   # プリレンダリングされたすべてのルートを 1 回要求します
```

`deploy` は、インフラを作ったあとで、同じ手順を行い、最初の応答を待ってから prime します。

## 何がどこに保存されるか

- Blob の `cache`: レンダリングしたページ、ルートハンドラーのレスポンス、Next.js がキャッシュする `fetch` の結果、`'use cache'` のエントリ。アプリが、ユーザー 1 人に属するデータをキャッシュすると、そのデータはこのコンテナーに入ります。キャッシュしないか、ストレージアカウントを共有しないでください。
- テーブル `tagcache`: タグと、再検証した時刻。
- Application Insights: Functions ホストのリクエストとトレース。既定ではサンプリングされます(`--full-telemetry` でオフ)。このパッケージは、リクエストのボディを記録しません。
- デプロイ用コンテナー: アプリの zip。コードと `node_modules` が入り、アプリが入れない限り、ビルド時のシークレットは入りません。

## 提供しないもの

プライベートネットワーク(VNet 統合、プライベートエンドポイント)、Web アプリケーションファイアウォール、お客様管理のキー、ゾーンやジオの冗長化の設定、診断設定、Azure Policy のタグは、テンプレートに入っていません。自分で作るインフラには足せますが、どれも、このパッケージでは試していません。
