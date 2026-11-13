---
title: "Azure notes"
source: "docs/inner_workings/azure_notes.md"
---

設計に影響する、Azure プラットフォームの事実です。

**出典と状態。** *(microsoft)* と付けた項目は、開発中に Microsoft Learn で見つけたものです。*(reported)* と付けた項目は、実際の Azure で動いていた以前の Azure アダプターの、外部レビューから得たものです。このプロジェクトが確認するまでは、仮説として扱ってください。*(verified 2026-11-06)* と付けた項目は、このプロジェクトが、実際の Azure サブスクリプション(japaneast。試用版または学生向けオファーのクォータを持つサブスクリプション)で観察したものです。作業ログのセッション 7 を参照してください。

## Flex Consumption

| # | 事実 | 出典 |
| --- | --- | --- |
| 1 | Linux のみ。1 プランにつきアプリ 1 つ。デプロイスロットなし。 | reported |
| 2 | ランタイム、スケール、パッケージの場所は、`functionAppConfig` にあります。 | microsoft |
| 3 | 従来の設定は、拒否されるか無視されます: `FUNCTIONS_WORKER_RUNTIME`、`FUNCTIONS_EXTENSION_VERSION`、`WEBSITE_RUN_FROM_PACKAGE`、`WEBSITE_CONTENT*`、`WEBSITE_NODE_DEFAULT_VERSION` など。Flex のアプリには書かないでください。 | reported(`WEBSITE_RUN_FROM_PACKAGE` は microsoft も) |
| 4 | 初期化には 30 秒の制限があります。 | reported |
| 5 | デプロイ用コンテナーは、プラットフォームが埋めます。書き込まないでください。 | reported |
| 6 | 対応する Node.js のバージョンは 22 と 24 です。このアプリは Node 22 で動きます。 | microsoft。Node 22 は *(verified 2026-11-06)* |
| 7 | Linux Consumption は 2028-09-30 に終了します。対象にしないでください。 | microsoft |
| 8 | `az functionapp show` は、Flex のアプリを、フィールドを `properties` の下に入れて返します。フラットな形を前提にしたクエリは、黙って何も返しません。実際の形でテストしてください。 | *(verified 2026-11-06)*: `--query "{state:state, host:defaultHostName}"` は、どちらも `null` を返しました |
| 9 | `az functionapp deployment source config-zip` は Flex で動きます(202、トリガーの同期、ヘルスチェック。32 MB のパッケージで約 3 分)。 | *(verified 2026-11-06)* |
| 10 | アイドルのあとの最初のリクエストは、約 5〜6 秒かかります。 | reported(測定) |
| 11 | 200 リクエストのバースト(40 並列)で、最大 10 のところ、7〜9 インスタンスにスケールしました。最大インスタンス数は、作成時に明示的に設定してください。あとからではなく(既定は大きい値です)。 | reported(測定) |
| 12 | マネージド ID によるアプリケーションデータへのアクセスには、Blob、Queue、Table のデータロールが必要です。ID ベースのとき、Functions ホストには、自身のストレージで *Storage Blob Data Owner* が必要です。 | microsoft / reported。1 つのストレージアカウントで、Blob Data Owner + Queue Data Contributor + Table Data Contributor を使い、`AzureWebJobsStorage__accountName` を設定して共有キーを無効にした状態で動きました *(verified 2026-11-06)* |
| 13 | **デプロイしたパッケージには、シンボリックリンクを残せません。** zip にリンクを残すと、アプリは起動時に失敗しました(`Cannot find package 'next'`)。リンクをたどって展開しても失敗しました(`Cannot find module 'styled-jsx/package.json'`)。Node は、実際のパスから隣のパッケージを解決するためです。pnpm の `node_modules` は、通常のツリーにする必要があります。 | *(verified 2026-11-06)* |
| 14 | サブスクリプションの Owner では、Blob のデータにアクセスできません。共有キーを無効にしているとき、ファイルをアップロードする人には、ストレージアカウントのデータロール(たとえば Storage Blob Data Contributor)が必要です。 | *(verified 2026-11-06)* |
| 15 | `az bicep build`、`az deployment group validate`、`what-if` は、間違った組み込みロール定義 ID を検出しません。実際のデプロイは、`RoleDefinitionDoesNotExist` で失敗します。 | *(verified 2026-11-06)* |
| 16 | 登録されていない `Microsoft.Insights` プロバイダーを、ARM が、最初のテンプレートデプロイの間に自分で登録しました。 | *(verified 2026-11-06)*。Microsoft の文書どおり |
| 17 | Flex Consumption のアプリは、3 つの関数(`server`、`image`、`revalidation`)を 1 つのアプリに登録し、1 つのプロセスが、HTTP ルートとキュートリガーの両方を処理しました。 | *(verified 2026-11-06)* |
| 18 | **レスポンスのあとで、インスタンスは凍結されません。** 遅延処理が設定したタイマーは、処理中のリクエストがなくても、時間どおりに動き続けました(20.004 秒と 90.009 秒)。しかし、**アイドルのインスタンスは、リクエストがないと、おおよそ 1.5〜3.5 分で消え**、それより長く続く遅延処理は、黙って失われます(240 秒のコールバックは、一度も実行されませんでした)。 | *(verified 2026-11-06)*。1 回の実行。境界はログのタイムスタンプから |
| 19 | HTTP 関数のコールドスタート(クライアント側、32 MB のパッケージ、2048 MB のインスタンス、Node 22): **4.1 秒**(設定の再起動のあとの最初のリクエスト)、**4.25 秒**(約 4 分アイドルしたあとの最初のリクエスト)、パッケージのデプロイ直後の最初のリクエストは、最大 **25.7 秒**。ウォームなリクエスト: 25〜60 ms。 | *(verified 2026-11-06)*。レビューは 5〜6 秒と報告していました |
| 20 | SSR ページへの 200 リクエストのバースト(40 並列): すべて 200 OK。p50 393 ms、p90 880 ms、p95 4.5 秒、p99 5.0 秒、最大 5.7 秒。**17 インスタンス**が処理しました(`maximumInstanceCount` は 20)。1 つのインスタンスが 181 リクエストを処理し、ほかの 16 は 1〜2 リクエストずつでした。遅い裾は、追加インスタンスの起動(それぞれ約 4〜5 秒)です。 | *(verified 2026-11-06)*。レビューは、似たバーストで、上限 10 のとき 7〜9 インスタンスと報告していました |
| 21 | アプリ設定を変更すると、アプリが再起動します。置き換えられるインスタンスは、新しいインスタンスが起動する間、処理中のリクエスト(とそれが保持する遅延処理)を、数分間処理し続けます。切り替えの間、リクエストは 2〜31 秒かかりました。 | *(verified 2026-11-06)* |
| 22 | **Bicep/ARM で再デプロイすると、`appSettings` の配列全体が置き換わります。** あとから `az functionapp config appsettings set` で追加した設定は、次の `deploy` のあとで消えます。設定は、テンプレートに入れる必要があります。 | *(verified 2026-11-06)* |
| 23 | 一部のインスタンスで、起動の直後に、ホストのヘルスチェック `azure.functions.webjobs.storage` が、"Unable to create client for AzureWebJobsStorage" で Unhealthy と報告されます(約 20 インスタンスのうち 2 つ)。トリガーへの影響は、分かっていません。 | *(verified 2026-11-06)*。観察として。原因は不明 |
| 24 | **キュートリガーの消費は、その関数を実行しているインスタンスがないと動きません。** 06:33:56 にキューに入れたメッセージは、新しいインスタンスが起動した 06:36:17 まで消費されませんでした(27 件が一度に)。すでに動いていたコンシューマーは、1〜3 秒でメッセージを拾いました。おそらく Flex は、HTTP 以外の関数グループを、HTTP とは別に、ゼロからスケールします。ADR-0010 を参照してください。 | 遅延は *(verified 2026-11-06)*。説明は仮説 |
| 25 | Application Insights は、イベントの約 1〜3 分後にレコードを表示します。診断には `az monitor app-insights query` が使えます。`cloud_RoleInstance` で、どのインスタンスがリクエストを処理したか分かります。 | *(verified 2026-11-06)* |
| 26 | `alwaysReady: [{ "name": "function:revalidation", "instanceCount": 1 }]` は、Flex に受け付けられます。これを設定しても、キューのメッセージが消費されたのは、37 秒後でした(コンシューマーのコールドスタート: 5 秒)。おそらくの原因(未テスト): アイドルのキューリスナーのポーリングが、`maxPollingInterval`(既定は 1 分)まで間隔を広げる。 | 受け付けられることと遅延は *(verified 2026-11-06)*。原因は仮説 |
| 27 | **`QueueMessageCount` のメトリックアラートには、評価ウィンドウとして PT1H、PT6H、PT12H、P1D のいずれかが必要です**(このメトリックは 1 時間ごと)。15 分のウィンドウは、`az deployment group validate` と `what-if` を通り、実際のデプロイは `BadRequest` で失敗しました。 | *(verified 2026-11-06)* |
| 28 | アイドルの関数のキューリスナーは、ポーリングの間隔を `maxPollingInterval`(既定は 1 分)まで広げます。エンキューから `revalidation` 関数の開始までの待ち時間は、60 秒のとき平均 **44.3 秒**(32.7、42.7、57.5)、5 秒のとき **2.2 秒**(1.6、3.8、1.1)でした。どちらも、常時稼働のインスタンスを 1 つ持っています。アプリ設定 `AzureFunctionsJobHost__extensions__queues__maxPollingInterval=00:00:05` は有効です。 | *(verified 2026-11-06)*(項目 26 は、仮説でした) |
| 29 | 200 リクエストのバースト(40 並列)の直後に、古いページのリクエストを送りました。ポーリング 5 秒で、メッセージは 3.9 秒後に消費されました(項目 24 の 2 分 21 秒の停止は、再現しませんでした。試行は 1 回)。 | *(verified 2026-11-06)*、n=1 |
| 30 | 2 回目の実行では、ホストの起動 26 回のうち 1 回で、ホストのヘルスチェック `azure.functions.webjobs.storage` が Unhealthy("Unable to create client for AzureWebJobsStorage")と報告しました(1 回目は約 20 回のうち 2 回)。設定の再起動の直後に、一度ありました。失敗したリクエストとは、関連していません。 | *(verified 2026-11-06)*。観察として |
| 31 | Flex のパッケージデプロイ(32 MB)は、アセットのアップロードを含めて、約 2.5 分かかります。変更のないインフラのデプロイも、その中に含まれます。 | *(verified 2026-11-06)* |

## 価格

| 項目 | 値 | 出典 |
| --- | --- | --- |
| Front Door Standard の基本料金 | プロファイルごとに月 35.00 USD、全ゾーン。リクエストとデータ転送(送信)は別 | Azure のリテール価格 API、公開の定価、2026-11-06 に照会 *(verified)* |
| Front Door Premium の基本料金 | プロファイルごとに月 330.00 USD | 同上 |

定価は変わり、契約や割引は含みません。頼る前に、再照会してください([Azure Retail Prices API](https://learn.microsoft.com/rest/api/cost-management/retail-prices/azure-retail-prices?wt.mc_id=studentamb_679600)、`https://prices.azure.com/api/retail/prices`)。

## 未解決の項目(Flex で、まだ誰も検証していません)

- ~~ID ベースのホストストレージ。~~ 検証済みです。項目 12 を参照してください。
- 仮想ネットワーク統合(サブネットの委任に、Container Apps のリソースプロバイダーが必要です)。
- 基本認証を無効にした状態での、アプリの読み取り。

検証するまでは、非対応として扱ってください。

## 現在の実装の状態

- Bicep テンプレートは、`AzureWebJobsStorage__accountName`、ID ベースのデプロイ用ストレージ、明示的な `maximumInstanceCount`、Blob/Queue/Table のロールを設定します。上に挙げた、拒否される従来の設定は、一つも設定しません。ただし、これはまだ、実際の Flex のアプリでは証明されていません。
- まだ一度もデプロイしていません。フェーズ 1c で、項目 1〜12 を確認または訂正します。
