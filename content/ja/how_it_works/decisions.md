---
title: "Decision records"
source: "docs/plan/decisions.md"
---

各記録は、決定の内容、その理由、退けた案を示します。決定が変わるときは、履歴を書き換えずに、古い記録を置き換える新しい記録を追加します。見出しは、ページ内のリンクが切れないように、英語のままにしています。

---

## ADR-0001: Compute and storage targets

**状態:** 承認、2026-11-05。**Azure では Unverified**([ロードマップのフェーズ 1](./roadmap.md)を参照)。

**決定**

- コンピュート: **Flex Consumption** プランの Azure Functions。Node.js 22 または 24、HTTP ストリーミングを使うプログラミングモデル v4。
- ISR と fetch のキャッシュ: **Blob Storage**。
- 再検証のキュー: **Storage Queue**。
- 静的アセットと CDN: **Azure Front Door Standard** の背後にある Blob Storage(ADR-0009 で変更: 静的ファイルは、アプリが Blob から配信し、Front Door は任意)。
- タグキャッシュ(`revalidateTag` / `revalidatePath`): **Table Storage**(ADR-0003 を参照)。

**理由**

- Functions は、OpenNext が想定した Lambda のモデルに最も近いものです。リクエストごとのスケール、使った分だけの課金、文書化された HTTP ストリーミング機能があります。
- Flex Consumption は、Node 22/24 と、ID ベースのストレージアクセスに対応します。古い Linux Consumption プランは、終了予定(2028 年)で、新機能はありません。
- Blob、Queue、Table は、1 つのストレージアカウントにあります。そのため、1 セットのロールの割り当てで、データプレーン全体を賄えます。

**解決済み(2026-11-06、[ADR-0009](#adr-0009-single-function-app-and-optional-front-door-by-default)):** Front Door Standard は、リクエストやデータ転送の料金を除いて、**プロファイルごとに月 35 USD** かかります(Azure のリテール価格 API、2026-11-06 に照会。Premium は 330 USD)。これは、小さなサイトで想定されるコンピュートとストレージの請求額より大きいので、Front Door は**任意で、既定はオフ**にしました。上のアーキテクチャは、Front Door を使う場合のものです。

**代替案**

- Container Apps: `standalone` の出力を動かすのは簡単で、長く続くストリーミングにも向きますが、OpenNext の、コンポーネントごとに関数を持つモデルとは異なります。将来の 2 つ目の対象として、妥当です。
- App Service: 最も簡単ですが、スケールと費用のモデルが弱いです。

---

## ADR-0002: One Function app per OpenNext component

**状態:** **[ADR-0009](#adr-0009-single-function-app-and-optional-front-door-by-default) に置き換えられました**(2026-11-06)。履歴のために残しています。ロードマップのフェーズ 1b の作業が終わるまでは、コードはこの構成を実装しています。

**決定(当時):** `server`、`image`、`revalidation` を、3 つの別々の Function App としてデプロイします。AWS 用の OpenNext の 3 つの Lambda 関数に対応させます。

**理由:** OpenNext のランタイムは、状態を `globalThis` に保存します(キュー、キャッシュ、設定、ルートのプリローダー)。1 つの Node プロセスに 2 つのバンドルがあると、互いのグローバルを上書きします。アプリを分ければ、メモリ、スケール、`sharp` の依存関係も、独立させられます。

**コスト:** デプロイするリソースが増え、設定が増え、コールドスタートが 3 回になります。Flex Consumption は、実行ごとに課金されるので、アイドルのアプリは、ほとんどかかりません。

**反論(2026-11-06):** 外部のレビューは、3 つの関数を 1 つのアプリに登録する構成が、実際の Azure で検証済みで、より単純だと報告しています。これは、上の `globalThis` に関する推論と矛盾します。その推論は、OpenNext のソースを読んで導いたもので、ここでは一度もテストしていませんでした。フェーズ 1b でローカルにテストしました。レビューが正しく、`globalThis` の推論は、実際には間違っていました。ADR-0009 を参照してください。

---

## ADR-0003: Table Storage for the tag cache

**状態:** 承認、2026-11-05。

**決定:** `nextMode` のタグキャッシュを、Table Storage に実装します。`PartitionKey` は OpenNext のビルド ID、`RowKey` は base64url でエンコードしたタグで、`revalidatedAt`、`stale`、`expire` の列を持ちます。

**理由:** 最初の範囲は「Blob + Queue」で、タグの状態を置くのに適した場所がありませんでした。Table Storage は安価で、同じストレージアカウントにあり、キーによる点読み取りに対応し、DynamoDB の `nextMode` 実装に対応します。

**代替案:** Cosmos DB(機能が豊富ですが、はるかに高価で、リソースが増えます)。タグごとの Blob(遅く、バッチ読み取りができません)。Cosmos DB は、フェーズ 3 の代替の override の候補として残ります。

---

## ADR-0004: Monorepo layout and tooling

**状態:** 承認、2026-11-05。

**決定:** pnpm ワークスペース + Turborepo + Biome + Changesets を、次の構成で使います。

```
packages/open-next-azure   the published package (overrides, CLI, Bicep)
packages/tests-unit        (planned)
packages/tests-e2e         (planned)
examples/app-router        example Next.js apps used for manual and E2E testing
docs/                      documentation, plan and work log
```

**理由:** 上流の OpenNext リポジトリと一致するので、コントリビューターもツールも、慣れた形になります。サンプルアプリは、E2E テストがワークスペースのバージョンに対してビルドできるように、パッケージの隣に置く必要があります。1 つの `pnpm-workspace.yaml` のカタログが、共有するバージョン(Next.js、React、`@opennextjs/aws`)を固定します。

---

## ADR-0005: Package name is deferred

**状態:** 承認、2026-11-05。2026-11-10 に [ADR-0018](#adr-0018-the-package-name-is-next-on-azure) に置き換えられました(名前をハードコードしないというルールは、もう適用されません)。

**決定:** 最初の公開の直前まで、仮の名前 `opennextjs-azure` を使います。`@opennextjs/*` のスコープは、上流の組織のもので、使えません。最終的な名前は、OpenNext のメンテナーの同意がない限り、`opennextjs` で始めてはならず、パッケージは、公式の OpenNext パッケージではないと明記しなければなりません。

**理由:** 名前が重要になるのは、公開のときだけで、分離しておけば、名前の変更は安価です。安価に保つために:

- 名前が現れるのは、`packages/open-next-azure/package.json` と、`open-next.config.ts` ファイル、ドキュメント、サンプルの中の import 指定子です。
- ソースファイルに、パッケージ名をハードコードしてはいけません。

**名前変更のチェックリスト(フェーズ 4):** npm で使えるかを確認し、`package.json` の `name` を更新し、リポジトリ内で `opennextjs-azure` を検索し、changeset の設定とドキュメントを更新します。

---

## ADR-0006: `waitUntil` via response stream

**状態:** 承認、2026-11-05。**2026-11-06 に Azure で測定**(下を参照)。既定は `hold` のままで、`detach` も使えます。

**決定:** ラッパーは、遅延した promise が解決するまでレスポンスストリームを開いたままにして、それから閉じることで、`waitUntil` を実装します。

**理由:** Azure Functions には、Node v4 モデルの `waitUntil` のプリミティブがなく、ハンドラーが戻ったあとで、呼び出しが凍結されることがあります。ストリームを保持するのは、AWS のストリーミングのラッパーと同じ方法です。

**リスク:** クライアントには、必要以上にわずかに遅く終わるレスポンスが見えます。ボディを flush したあとも、Functions がインスタンスを生かしていることがフェーズ 1 で分かれば、本当に切り離す方法に切り替えて、この ADR を置き換えます。

**ローカルでの測定(2026-11-06、Functions Core Tools 4.16.0、Azure ではありません):** すぐに応答して、2 秒の遅延処理を持つ `after()` を呼ぶルートは、処理を完了します(ログに出ます)が、クライアントのリクエストは、合計 2.14 秒かかります(最初のバイトまで 0.12 秒)。つまり、ストリームを開いたままにすると、クライアントは、遅延処理の時間の全体だけ、**遅れます**。これは、すべての `after()`、キャッシュミスでのキューへの追加、キャッシュの write-through で、ユーザーに見えるコストになり、この決定を、既定として不適切にします。

**Azure での測定(2026-11-06、Flex Consumption、Node 22、japaneast):**

| モード | 2 秒の処理を持つ `after()` | 20 秒、90 秒、240 秒の遅延処理 |
| --- | --- | --- |
| `hold`(既定) | クライアントの合計 2039 ms(ヘッダーは 37 ms 後)。処理は完了する | 未測定(レスポンスが 240 秒開いたままになるため) |
| `detach`(`WAIT_UNTIL_MODE=detach`) | クライアントの合計 127〜149 ms。処理は完了する(2004 ms 後) | 20 秒と 90 秒のコールバックは、時間どおりに動いた(20.004 秒と 90.009 秒)。その間、**処理中のリクエストも新しいリクエストもなかった**。240 秒のコールバックは、**一度も動かなかった** |

240 秒のコールバックが失われたのは、それを保持していたインスタンスが消えたからです。06:26:10 以降は何もログに出ず、次のリクエスト(06:28:00)が、新しいホストを起動しました。つまり、Flex Consumption では、レスポンスのあとでインスタンスは**凍結されません**(タイマーは動き続けます)が、**アイドルのインスタンスは、リクエストがないと、おおよそ 1.5〜3.5 分で削除され**、それより長く続く遅延処理は、エラーなしに失われます。(1 つのインスタンス、1 回の実行です。境界は、ログのタイムスタンプによるもので、文書化されたタイムアウトではありません。)`hold` モードでは、設定の変更で置き換えられるインスタンスが、処理中のリクエストを、数分間完了させました。

`detach` での ISR のエンキュー: 古いページは、古いページのリクエストの 3 秒後に再生成されました。以前の `detach` の試行では、エンキューが失われたように見えましたが、それは、キューのコンシューマーがまだ動いていなかったためで、エンキューではありませんでした([ADR-0010](#adr-0010-isr-revalidation-depends-on-the-queue-trigger-scale-group)を参照)。

**測定後の決定:** `hold` を既定のままにします。遅延処理が、どんな長さでも正しいからです。遅延処理が短いアプリ(ISR のエンキューと、一般的な `after()` のコールバックは、そうです)向けには、Bicep のパラメーター `waitUntilMode` と `deploy --wait-until detach` で、`detach` を提供します。数分かかると見込まれる処理には、`after()` ではなく、永続的な仕組み(キュー)が必要です。データが増えたら、既定をもう一度見直します。

**以前は未解決だった問いで、今は一部に答えが出ています:** レスポンスのボディが終わったあとも、Flex Consumption が動き続けるか(CPU を保つか)。そうなら、ボディをすぐに終わらせ、遅延処理を、ウォームなインスタンスで終わらせます。そうでないなら、ボディを保持せずに、呼び出しを生かしておく仕組みが必要です。候補: 動作を設定可能にして(`hold` と `detach`)、Azure の測定が支持するほうを既定にします。ローカルの実行では、プロセスを凍結しないので、これには答えられません。

---

## ADR-0007: Azure SDKs are imported at runtime only

**状態:** 承認、2026-11-05。

**決定:** override のモジュールは、リテラルでない動的な `import()` で、`@azure/*` を読み込みます(`clients.ts` を参照)。`opennext-azure package` は、SDK を各 Function App にインストールします。

**理由:** OpenNext は、esbuild で `open-next.config.ts` をバンドルし、ビルド時に評価します。リテラルの import は、`@azure/identity` とその依存関係をそのバンドルに引き込み、失敗します(`__dirname` の再宣言)。計算した指定子なら、SDK を設定のバンドルの外に保てます。

**トレードオフ:** SDK のツリーシェイキングができず、zip が大きくなります。サイズやコールドスタートが問題になるなら、(上流が AWS でしているような)REST ベースの「lite」な override が、選択肢です。

---

## ADR-0008: Packaging never runs `npm install` inside an OpenNext bundle

**状態:** 承認、2026-11-05。

**決定:** `opennext-azure package` は、新しい `package.json` を書き、一時ディレクトリに Azure の依存関係をインストールして、上書きせずに、バンドルの `node_modules` にマージします。

**理由:** OpenNext は、各バンドルが必要とするもの(画像のための `sharp` を含む)を、すでにトレースしてインストールしています。バンドルの中で `npm install` を実行すると、`sharp` が削除され(生成された `package.json` になかったため)、サーバーでは、アプリ全体の依存関係がインストールされました。

---

## ADR-0009: Single Function app and optional Front Door by default

**状態:** **承認** 2026-11-06(ローカルでの証拠に基づく)。**同じ日に実装済み**(パッケージ、ローカルスタック、アセットリゾルバー、`X-Azure-FDID` の確認、Bicep)。Azure での動作は**未検証**です。静的アセットの費用は、まだ測定が必要です。

### 証拠

**Front Door の価格**(Azure のリテール価格 API、公開の定価、USD、2026-11-06 に照会): Standard の基本料金は、すべてのゾーンで、プロファイルごとに月 35.00。Premium は 330.00。リクエストとデータ転送(送信)は、別に課金されます(たとえば、Standard のリクエストは、ゾーン 1 で 10K あたり 0.009)。

**1 つのアプリで、ローカルでは動きます。** ビルドした `image`、`revalidation`、`server` のバンドルを、1 つの Functions アプリに読み込み(1 つの `main.mjs`、3 つの登録: `_next/image`、`{*path}`、キュートリガー)、Core Tools 4.16.0 で、Azurite に対して HTTPS で実行しました。SSR、ISR ページ、404、ストリーミング(最初のバイトは 0.04 秒、Suspense の部分は 3.0 秒)、`revalidateTag`、WebP への画像リサイズ、`after()`、キュー駆動の ISR 再生成(コンシューマーが 2 回実行され、どちらも成功し、タイムスタンプが進み、`STALE` のあとに `HIT`)は、すべて、3 つのアプリでの実行とまったく同じに動きました。ADR-0002 で想定した `globalThis` の衝突は、起きませんでした。3 つのバンドルは、同じ `open-next.config.mjs` を持つので、共有する `openNextConfig` は同一で、キューとキャッシュのグローバルを持つのは、サーバーだけです。

**実際の制約は、1 つだけ、作業ディレクトリです。** 3 つすべてを読み込むと、最初は `ENOENT: prerender-manifest.json` で失敗しました。revalidation のアダプターが、import 時に、`process.cwd()` からの相対で、そのファイルを読むためです(Lambda では、各関数の cwd が、その関数自身のルートです)。うまくいった修正: 各バンドルを import する前に、`process.chdir(<bundle dir>)` を呼び、`server` を**最後に**読み込んで、実行時には、自分のディレクトリが cwd になるようにします。

**同居のコスト(ローカル、新しいプロセス、各 3 回):** モジュールの読み込みは、`server` だけだと 59 ms、3 つ全部だと 72〜76 ms。常駐メモリは 87 MB 対 91 MB。未測定: Azure での実際のコールドスタートとスケールアウト(フェーズ 1c)。

### 決定

1. **1 つの Function App、3 つの関数**を、既定の構成にします。`server`(`{*path}`)、`image`(`_next/image`)、`revalidation`(キュートリガー)。1 つのプラン、1 セットの設定、1 つのパッケージで、アプリ間のずれがありません。
2. **Front Door は任意です**(Bicep のパラメーター、既定はオフ)。使わないときは、Function App が公開の入口です。
3. **直接アクセスの制限:** Front Door がなければ、迂回されるものはありません。Front Door を有効にするときは、アプリが、それを通らなかったトラフィックを拒否しなければなりません。ラッパーが、`X-Azure-FDID` を `FRONT_DOOR_ID` の設定に対して検証し(ローカルでテストできます)、Bicep が、`AzureFrontDoor.Backend` のサービスタグに対するアクセス制限を追加します(Flex Consumption での対応は未検証)。
4. **静的アセット:** OpenNext の `AssetResolver` の override を通して配信します。これは、アップロードしたファイルのマニフェストを使い、Blob から正確なパスを読みます(B10 にも対応します)。オリジンは 1 つで、公開コンテナーも CORS もありません。CDN(Front Door でも、ほかのものでも)は、あとで前に置けます。検証すべきコスト: すべてのアセットのリクエストが、関数の実行になります。大きなサイトでは、無視できない大きさになりえます。

### 結果

- 分割した構成(3 つのアプリ)は、テストしていない選択肢として残すのではなく、コードから**削除**しました。実際に必要になったら、この ADR から作り直せます。
- 共有のインスタンス: 画像処理と SSR が、同じメモリと CPU を取り合い、一緒にスケールします。メモリは、`sharp` を見込んで決めなければなりません。実際に問題になるなら、分割が逃げ道です。
- パッケージングは、`chdir` のロジックを持つ 1 つのエントリーポイントを作り、Azure SDK を、アプリのルートに 1 回だけインストールします(完了)。
- 生成するエントリーは、`ASSETS_MANIFEST_PATH` も設定します。実装中に分かったことですが、モノレポでは、OpenNext が、アプリをサーバーのバンドルの中に入れ子にするので(`server/examples/app-router/`)、実行時の cwd は、バンドルのルートでは**ありません**。cwd からの相対でマニフェストを探すと、黙って、アセットが何も配信されませんでした。
- OpenNext が、自身のツールのために `assets` にコピーする `BUILD_ID` は、配信されないように、マニフェストから除外します。
- 単一のアプリのコールドスタートやスケールアウトが、3 つのアプリより明らかに悪いと、フェーズ 1c で分かった場合は、見直します。

### 検討した代替案

- 3 つのアプリを維持する(ADR-0002): 既定としては退けました。その唯一の理由は、起きなかった障害のパターンでした。
- Front Door を既定にする: 小さなプロジェクトには、費用の面で退けました。
**Azure での結果(2026-11-06):** 単一のアプリを、Flex Consumption(Node 22、Front Door なし)にデプロイして、3 つの関数がすべて動きました。`server` が 321 回、`revalidation` が 34 回、`image` が 5 回の呼び出しで、失敗 0、例外 0。コールドスタートは約 4.1〜4.5 秒。40 並列の 200 リクエストを、17 インスタンスが処理しました(p50 393 ms、p95 4.5 秒)。**未測定: Azure での 3 つのアプリの構成**。そのため、分割した構成とのコールドスタートと費用の比較は、まだ未解決です。Front Door の構成は、デプロイしていません。

- 公開の `assets` コンテナーと `assetPrefix`: リクエストあたりは安くなりますが、`assetPrefix` は `public/` のファイルをカバーせず、コンテナーを公開します。アセットリゾルバーが高すぎると分かったときの、フォールバックとして残します。

---

## ADR-0010: ISR revalidation depends on the queue trigger scale group

**状態:** 観察を 2026-11-06 に Azure で記録しました。1 回の停止の原因は**未確認**です。**重複排除は、2026-11-06 に実装し、Azure で検証しました**(2 回目の Azure の実行)。ポーリング間隔を下げると、待ち時間がなくなることを検証しました。バックログのアラートは Azure Monitor が作成しましたが、一度も発火しませんでした。

### 観察したこと(Flex Consumption、1 つの Function App、Node 22、japaneast)

| 時刻 | 内容 | エンキューから revalidation 関数の実行までの時間 |
| --- | --- | --- |
| 06:08 | デプロイの直後 | 約 1 秒 |
| 06:49 | リクエストなしで 11 分たったあと | **約 5 秒**(別のインスタンスが起動して消費し、そのあとでページに `HEAD` リクエストを送りました) |
| 06:33:56 | 17 インスタンスを作った 200 リクエストのバーストの直後 | **2 分 21 秒**: 設定の変更のあとで、新しいインスタンスが起動した 06:36:17 まで、何もキューを消費せず、そのインスタンスが **27 件のメッセージを一度に**処理しました |

停止の間、2 つのインスタンスが、ホストのヘルスチェック `azure.functions.webjobs.storage` を、"Unable to create client for AzureWebJobsStorage" で Unhealthy と報告しました(06:34:03 と 06:36:51)。これは停止と同時ですが、その原因だとは**示されていません**。

### 原因が何であれ、データから導かれる結果

1. **メッセージは重複排除されません**(Storage Queue)。ページが古いと分かったリクエストごとに、メッセージが追加されます。再検証が遅れている間は、以後のリクエストごとに 1 件増えます。25 回のポーリングのリクエストが、25 件のメッセージと、同じページの 27 回の再生成になりました。遅れている間は、トラフィックとともにコストが増えます。**エンキューの前に claim を取ることで修正しました。下の「Deduplication」を参照してください。**
2. コンシューマーが止まると、**古いページが数分間、古いままになることがあります。** ページは配信され続けるので(stale-while-revalidate)、これは鮮度の問題で、障害ではありません。
3. 消費の失敗は、HTTP 側からは分かりません。キューが空になっていないことを知らせるものは、何もありません。

### Deduplication(実装済み)

メッセージをエンキューする前に、リクエストは、そのページの **claim** を取らなければなりません。claim は、タグキャッシュのテーブルの行(専用のパーティション `dedupe-<build id>`、行キーはホストと URL の SHA-1)で、楽観的同時実行制御で書き込みます。行がなければ、作成します(409 は、ほかの誰かが作ったという意味です)。同じバージョンの行が、ウィンドウ(`REVALIDATION_DEDUPE_SECONDS`、既定 60)より新しければ、すでに誰かが依頼しているので、何もエンキューしません。それ以外は、行の ETag を使って置き換えます(412 は、ほかの誰かが置き換えたという意味です)。そのため、何台のインスタンスの上で、いくつ同時にリクエストがあっても、エンキューするのは、ちょうど 1 つです。ウィンドウのあとは、claim を再び取れるので、失われたメッセージが、ページをいつまでもブロックすることはありません。claim の取得中のストレージエラーは、とにかくエンキューします(重複はレンダリング 1 回分のコストで、再検証の欠落は、ページを古いままにします)。

**ページのバージョンは、`lastModified` ではなく ETag です。** 最初のバージョンは、メッセージの `lastModified` を使い、エンドツーエンドのテストで失敗しました。30 件の同時リクエストで、再生成が 6 回起きました。ローカルで再現し、重複排除の行は `version = 0` でした。OpenNext のサーバーのパスは、async-storage の `lastModified` を*マーカー*に設定します(エントリが古いときは `1`、未設定のときは `0`。`adapters/cache.js`、`store.lastModified = _isStale ? 1 : _lastModified`)。そのため、同じページへの同時のリクエストが 0 か 1 を報告し、別々のバージョンと数えられて、claim を交代で取りました。キャッシュされた内容の ETag は、同じページを見るすべてのリクエストで同じで、新しい内容で再生成されると変わります。不明なバージョン(ETag がなく、`lastModified` が 0 か 1)は、ワイルドカードで、ウィンドウだけが決めます。結果: *同一*の内容に再生成されたページは、ウィンドウが終わるまで claim を保ちますが、内容が変わっていないので、害はありません。

制限: ページとビルドごとに 1 行が、テーブルに残ります(小さく、削除されません)。バージョンが不明だと、ウィンドウ(既定は 60 秒)より頻繁には、ページを再検証できません。より速く更新すべきページには、`REVALIDATION_DEDUPE_SECONDS` を低く設定してください。claim のコストは、古いリクエストごとに、Table の読み取り 1 回と、勝った側の書き込み 1 回です。単体テスト、Azurite のテスト(実際のサービスに対する 50 件の同時リクエストと、期限切れの claim をめぐる競争)、ローカルのエンドツーエンドのテストが、これを網羅します。**Azure で検証済み(2 回目の実行、2026-11-06):** 古いページへの 30 件の同時リクエストが、30 件の `STALE` レスポンスを返し、`revalidation` の呼び出しは、**ちょうど 1 回**でした(既定のポーリングで、22 秒後)。重複排除のない 1 回目の実行では、25 リクエストのポーリングのループから、27 回の呼び出しがありました。

### 待ち時間が 20〜57 秒だった理由: 測定

設定ごとに 3 回の時間計測。各回、古いリクエストを 1 回。試行の間に、少なくとも 2.5 分の無通信。どちらの場合も、revalidation 関数の常時稼働インスタンスを 1 つ持ちます(japaneast、Flex Consumption)。「待ち時間」は、古い HTTP リクエストの終了(エンキュー)から、`revalidation` の呼び出しの開始までで、どちらも Application Insights の値です。

| `maxPollingInterval` | 待ち時間(秒) | 平均 |
| --- | --- | --- |
| 60 秒(プラットフォームの既定) | 32.7、42.7、57.5 | **44.3 秒** |
| 5 秒(`revalidationPollingSeconds=5`) | 1.6、3.8、1.1 | **2.2 秒** |

先の 22 秒(stampede)と 37 秒(最初の実行)と合わせて、これが仮説を裏付けます。アイドルのキューリスナーは、ポーリングの間隔を `maxPollingInterval` まで広げるので、メッセージが最大 1 分待ちます。この修正のコストは、ストレージのトランザクションです。5 秒ごとに 1 回のポーリングは、リスナーのインスタンスごとに、月 518,400 回の `GetMessages` で、定価の 10,000 操作あたり 0.004 USD(Queues v2、Standard LRS、japaneast、Azure のリテール価格 API、2026-11-06)では、**月約 0.21 USD** です。60 秒なら、約 0.02 USD です。実際の回数のストレージメトリックは、リソースを削除したとき、まだ利用できなかったので、この数字は、測定ではなく見積もりです。

### 選択肢

- **revalidation 関数の常時稼働インスタンス**(Bicep の `revalidationAlwaysReady`、`deploy --revalidation-always-ready 1`、設定 `function:revalidation`)。1 つのインスタンスの費用が、継続的にかかります。**テスト済み:** Flex は受け付けました(`alwaysReady: [{name: "function:revalidation", instanceCount: 1}]` が、有効な設定に入っています)。**消費は速くなりませんでした:** 06:59:53 にエンキューしたメッセージが消費されたのは、07:00:30 で、**37 秒**後でした。コールドスタートでは 5 秒でした。考えられる理由(仮説で、未テスト): アイドルのキューリスナーは、ポーリングの間隔を `maxPollingInterval` まで広げます。これは既定で 1 分です(ホストの `QueuesOptions` に表示されます)。新しくスケールアウトしたインスタンスは、すぐにポーリングします。2 分 21 秒の停止は、一度だけ見られ、再現できなかったので、それへの影響は不明です。
- **`maxPollingInterval` を下げる:** Bicep の `revalidationPollingSeconds`(`deploy --revalidation-polling-seconds <1-60>`)が、アプリ設定 `AzureFunctionsJobHost__extensions__queues__maxPollingInterval` を設定し、`host.json` を上書きします。空のキューのポーリングは、ストレージのトランザクションなので、これは、動いているインスタンスごとの小さな一定のコストを、レイテンシーと引き換えにします。**測定: 44 秒が 2 秒になりました**(上の表)。既定は、既定値が選ばれるまで 60(プラットフォームの既定)のままです。テストした値は 5 秒です。
- **エンキューの前の重複排除**: 完了(上)。
- **キューのバックログのアラート:**(Azure では、ウィンドウ PT1H、評価 PT15M ごとで、作成して有効にしました。キューが空のままだったので、一度も発火しておらず、実際のアラートについては、何も分かっていません。)
  詳細: Bicep の `queueBacklogAlertThreshold`(`deploy --alert-queue-backlog <messages>`)が、ストレージアカウントのキューサービスの `QueueMessageCount` に対する、メトリックアラートを作成します(しきい値を超える 1 時間の平均。Azure Monitor は、`QueueMessageCount` に PT1H、PT6H、PT12H、P1D のウィンドウしか受け付けないためです(`validate` ではなく、アラートの最初のデプロイで分かりました)。revalidation のキューと poison のキューの合計。Storage は「最も古いメッセージの経過時間」を報告しないためです)。既定はオフ。アクショングループ(`alertActionGroupId`)がなければ、ポータルでしか見えません。検証と what-if は行いましたが、デプロイはしていません。まだないもの: ホストのヘルスチェックのアラート。
- 選ぶ前に、"Unable to create client for AzureWebJobsStorage" の原因を見つけること(ID トークンのタイミング、ロールの伝播、または ID ベースの `AzureWebJobsStorage` の設定)。

### 未決定

`revalidationAlwaysReady` の既定は 0 のままです。`revalidationPollingSeconds` は、当面、プラットフォームの既定の 60 のままです。測定は、古いページを数秒以内に更新すべきサイトに、低い値(5 秒)を勧めることを支持します。どの既定を出荷するかは、メンテナーが決めることで、ここでは決めません。ここにあるどれも、アーキテクチャを変える理由ではありません。重複排除と監視を追加する理由です。

---

## ADR-0011: Next.js support follows `@opennextjs/aws`

**日付:** 2026-11-07。**状態:** 承認。

**決定。** このパッケージは、インストールされた `@opennextjs/aws` が、`peerDependencies` として宣言する Next.js のバージョンに対応します。`@opennextjs/aws` 4.1.15 では、それは `>=15.5.29 <16 || >=16.4.5` で、このパッケージも、`next` に同じ範囲を宣言します。`@opennextjs/aws` が範囲を変えたら、これも一緒に変えます。`pnpm-workspace.yaml` のカタログは、最も低い 15.x のままです。CI は、最も低い 16.x でも、ローカルの E2E スイートを実行します(`check` ワークフローのマトリックス)。Dependabot は、`next` のメジャー更新を開きません。範囲を上げるのは、自動の更新ではなく、ここで行う決定です。

**理由。** 動作は、公式の OpenNext と一致するべきです。OpenNext も、内部でバージョンの確認(`compareSemver`)を使っています。独自の範囲は、OpenNext が対応する以上のことを約束するか、OpenNext と食い違うかの、どちらかになります。両方の系統を CI で動かすことで、主張を正直に保ちます。2026-11-07 に、`next` 16.4.5 は、試行で、ビルドとローカルの E2E スイート(既定 43、front-door 10、poison 1)に合格しました。Azure の E2E は、15.5.29 でしか実行していません。

**退けたもの。** サンプルを 16 だけにすること(15 のカバレッジを失います)。OpenNext より厳しい範囲(各バージョンに、独自の根拠が必要です)。マトリックスなし(テストのない Next.js 16 の主張になります)。

**結果。** Azure では 16 を動かしていません(Unverified)。`package` のときに、非対応のバージョンを拒否するガードは、まだ未解決です(ロードマップ)。

---

## ADR-0012: The Next.js Adapter API is not adopted yet; Next.js 15 stays supported

**日付:** 2026-11-07。**状態:** 承認。[ADR-0011](#adr-0011-nextjs-support-follows-opennextjsaws) の上に成り立っています。

**決定。** このアダプターは、`next build` の出力を読む `@opennextjs/aws` の上に構築を続け、Next.js の Adapter API(`adapterPath`、`modifyConfig`、`onBuildComplete`)は使いません。Next.js 15 は、対応範囲に残します。`@opennextjs/aws` が Adapter API を採用したとき、または Next.js チームが Next.js 15 をサポートしなくなったときに、見直します。

**理由。**

- Adapter API は、ルート、出力、プリレンダリング、静的ファイルを記述する、ビルド時のインターフェースです。リクエストの処理、ストリーミング、キャッシュは、Next.js サーバーとキャッシュのインターフェース(`cacheHandler`、`cacheHandlers`)の役割のままなので、このパッケージの override(キャッシュ、キュー、画像、アセット、ラッパー)は、これでは置き換えられません。出典: アダプターに関する Next.js の文書。2026-11-07 に、調査エージェントが読んだもので、メンテナーもアシスタントも読んでいません。
- 安定したのは、Next.js 16.2 から(2026-03-18 のブログ記事、同じ出典)です。範囲に Next.js 15 があるので、これだけを唯一の道にはできません。
- 公式の OpenNext は、独自の道を進んでいます。`opennextjs-aws` の README にも `opennextjs-cloudflare` の README にも、記載がありません。Next.js の "Across Platforms" の記事(2026-03)は、Netlify、Cloudflare、AWS(OpenNext)のアダプターを開発中としています(現在の状況は確認していません)。OpenNext に従うのは、ADR-0011 の方針です。
- Next.js 15 は、メンテナーによると、Next.js チームが 2027-01-31 までサポートします(2026-11-07。公式の出典は、ここでは確認していません)。それより早く外すと、サポートされているリリースのユーザーが、このアダプターを使えなくなります。

**見直しの日。** 2027-01-31。または、`@opennextjs/aws` が `next` の peer 範囲を変えるか、Adapter API を採用したら、それより早く。その時点で、OpenNext が外していれば、範囲と CI のマトリックスから 15 を外し、Adapter API について決めます。

**退けたもの。** 今、Adapter API に移ること(ランタイムの override には利点がなく、Next.js 15 を除外します)。サポートが終わる前に、Next.js 15 を外すこと。

**読んでいないもの。** PPR、ルーティング、静的アセットに関するアダプターのサブページ、機能の一覧表、RFC(`vercel/next.js` の discussion 77740)、最初のページより先の `opennextjs-aws` の issue。

---

## ADR-0013: Cold start: always-ready instances first, no timer warmer yet

**日付:** 2026-11-07。**状態:** 承認。

**背景。** `@opennextjs/aws` には、`warmer` の override があります。Lambda のインスタンスを温かく保つための、定期的な呼び出しです。Flex Consumption には、プラットフォーム自身の機能として、スケールグループごと(HTTP 関数では `http`)の常時稼働インスタンスがあります。これを使わずに Azure で測定した結果(Azure notes の項目 19 と 20): HTTP のコールドスタートは 4.1〜4.5 秒、パッケージのデプロイ直後の最初のリクエストは最大 25.7 秒、ウォームなリクエストは 25〜60 ms。

**決定。** `warmer` の override は作りません。コールドスタートは、プラットフォームが扱います。Bicep のパラメーター `alwaysReadyInstances`(グループ `http`)を、CLI から `deploy --always-ready <n>` で使えるようにしました。既定は 0 のままです。タイマートリガーによる自己 ping は作りません。

**理由。**

- Microsoft は、常時稼働インスタンスを、Flex Consumption でのコールドスタートの緩和策として文書化しています。ウォームアップのトリガーと事前にウォームアップしたインスタンスは、Premium の機能です(Microsoft Learn、2026-11-07 に確認)。
- 同じページによる課金: オンデマンドのインスタンスは、実行中だけ課金されます。サブスクリプションごとに、月 100,000 GB 秒と 250,000 回の実行の無料枠があります(有料のサブスクリプションのみ)。常時稼働のインスタンスは、メモリが常に課金され(ベースライン、GB 秒)、そこに実行時間と実行回数が加わります。無料枠はありません。2 GB のインスタンス 1 つは、30 日の月で約 520 万 GB 秒で、無料枠のおよそ 50 倍です。価格は、価格のページでは読めませんでした。Azure の料金計算ツールを使ってください。
- 常時稼働のインスタンスは、リージョンのコアのクォータを消費します(Azure for Students と無料試用版のサブスクリプションでは、15 コア)。
- タイマー関数からの ping は、インスタンスがアイドルのあとで削除されること(測定では約 1.5〜3.5 分)を防ぐだけです。バーストで新しいインスタンスが必要なときには、役に立ちません。動かすための専用のスケールグループが要りますし、Flex で動くことを示すものも、ここにはありません。理論上は安価です(1 秒の最小課金で、1 回の実行が約 2 GB 秒)が、未検証です。

**退けたもの。** AWS のものを真似た `warmer` の override(プラットフォームの仕組みが違います)。常時稼働を既定にすること(E2E の実行を含めて、すべてのサイトに継続的な費用がかかります)。

**未解決。** Azure で、`--always-ready 1` を使い、コールドスタートと、デプロイ後の最初のリクエストを測定します(有料の実行が必要です。項目 19 と 20 と比較します)。そのうえで、Get started で勧めるかを決めます。タイマーの ping は、常時稼働が小さなサイトには高すぎると分かった場合にだけ、テストします。ドキュメントの費用の節のための、価格の数字。

---

## ADR-0014: Optimized images are not cached by the server; `OPENNEXT_STATIC_ETAG` is on

**日付:** 2026-11-07。**状態:** 承認(選択肢 B)。メンテナーが、公式のアダプターに従うよう求めました。

**分かったこと。** ロードマップと B11 は、最適化した画像のサーバー側キャッシュがないと想定し、それを、公式のアダプターに対する最大の差だとしていました。インストールされている `@opennextjs/aws` 4.1.15 の画像アダプター(`dist/adapters/image-optimization-adapter.js`)を読むと、これは公式の設計でもあると分かりました。"We don't cache any images" です。`Cache-Control: public,max-age=<n>,immutable` と `Vary: Accept` を返し、キャッシュは、CDN(AWS では CloudFront)とブラウザーが担う想定です。環境変数 `OPENNEXT_STATIC_ETAG` を設定すると、`ETag`(URL、幅、品質、ビルド ID のハッシュ)も返し、一致する `If-None-Match` に対しては、画像の処理をする前に `304` を返します。Front Door のない Azure には、共有キャッシュがなく、ここでの Front Door は、`/_next/static/*` しかキャッシュしません。そのため、訪問者ごとの、各画像サイズへの最初のリクエストは、関数インスタンスで `sharp` を実行します。同じブラウザーの 2 回目以降は、ブラウザーのキャッシュから応答されます。

**選択肢。**

- **A. 何もしない。** 公式のアダプターと同じです。CDN のない Azure には、共有キャッシュがありません。
- **B. Bicep のアプリ設定で `OPENNEXT_STATIC_ETAG=true` にする。** 1 行です。条件付きリクエスト(再検証するブラウザー、CDN)は、`sharp` を実行せず、元画像も読まずに、`304` で終わります。注意点: レスポンスは `Accept` によって変わるのに、ETag には `Accept` の値が含まれません。また、デプロイなしで変わるリモートの元画像は、`max-age` が終わるまで、変わっていないものとして再検証されます。
- **C. 画像関数のラッパーに Blob キャッシュを置く。** リクエストで、URL、幅、品質、`Accept` の値の全体、ビルド ID をキーにした Blob を探します。ミスなら、ハンドラーを実行し、バイト列をストリームしながらコピーして、ステータスが 200 で、`Set-Cookie` がなく、`Cache-Control` に `private`/`no-store` がないときは、レスポンスのあとに(`waitUntil`)保存します。保存したレスポンスの `max-age` で期限切れにします。古いエントリを削除する、Blob のライフサイクルルールを追加します。既存の override のポイントの中で作れて、Azurite でテストできます。コスト: ストレージのコンテナー、Bicep のライフサイクルルール、ヒットごとの読み取り(関数の実行は、それでも起きます)、ミスごとの書き込み、保守するコード。
- **D. Front Door に `/_next/image` をキャッシュさせる。** 任意の Front Door のときしか役に立たず、クエリ文字列と `Accept` のキャッシュキーが必要です。

**決定。** B を実装しました。Bicep のアプリ設定とローカルスタックに `OPENNEXT_STATIC_ETAG=true` を入れ、E2E のケースが ETag と 304 を確認します。C と D は作りません。理由: 公式の仕組みで、費用がかからず、新しいコンポーネントも要りません。C は、Azure での測定(典型的な写真での画像関数の時間とメモリ、繰り返される最初のリクエストの費用)が問題を示すまで、作りません。数字が出たら見直します。D は、Front Door の構成のための、別の決定です。

**未測定。** 現実的な画像での、Azure 上の `sharp` の時間(ローカルでは、128 px の元画像で 30〜50 ms)。ブラウザーのキャッシュが空の訪問者が、同じ画像をどれくらいの頻度でリクエストするか。

---

## ADR-0015: The package is named `opennext-adapter-azure`; the positioning is open (superseded by ADR-0017 for the name)

**日付:** 2026-11-07、名前の決定は 2026-11-08。**状態:** 名前については承認。位置づけは未決定。[ADR-0005](#adr-0005-package-name-is-deferred) に続きます。

**分かったこと。** `opennextjs-azure` は、すでに npm にあります(バージョン 0.2.0、2026-08-30 に別のメンテナーが公開、MIT、リポジトリ `zpg6/opennextjs-azure`)。目的は似ていて、Azure Functions と Blob、Table、Queue Storage の上の OpenNext です。確認したのは、npm レジストリのメタデータと README だけです。`opennext-azure` は、2026-11-07 に 404 を返しましたが、「2025-10-29 に非公開」というものでした。非公開にされた名前は、再び公開できないことがあるため、これには頼りません。`opennext-adapter-azure` は、2026-11-08 の時点で、一度も使われていませんでした(404)。

**決定(名前)。** スコープなしの名前 `opennext-adapter-azure`。メンテナーが 2026-11-08 に、`nextjs-azure`(npm で使用済みで、Next.js の名前を使う)、`opennext-azure`(非公開にされた名前で、公開できるか不明)、スコープ付きの名前と比べて選びました。パッケージが何かを表し、`opennextjs` で始まらず(ADR-0005)、既存のパッケージとは綴りが違います。README は、公式の OpenNext パッケージではないと明記します。OpenNext のコードは MIT ライセンスで、OpenNext の README に命名や商標の方針はなく、ほかのコミュニティのパッケージも、名前に `opennext` を使っています。SST が商標を持っているかは確認していないので、P5(OpenNext のメンテナーに尋ねる)は、公開前に勧めたままです。公開の日に、使えるかをもう一度確認しなければなりません(P2)。

**未解決。** 別に公開するか、既存のプロジェクトに貢献するか、この成果を OpenNext の組織に提供するか。[Release plan](./release_plan.md) のタスク P1〜P5 を参照してください。パッケージは、リポジトリの中で名前を変更してあり、公開していません。

このプロジェクトの開発中は、ほかの Azure アダプターのコードを読みません(`AGENTS.md` のルール)。既存のパッケージへの貢献や統合には、より詳しく見る必要がありますが、当面は追求しません。


---

## ADR-0016: Run Next.js on Azure without `@opennextjs/aws`; start with a spike (accepted for the spike)

**日付:** 2026-11-08。**状態:** メンテナーが方向を決めました。既存のパッケージを変更する前に、設計をスパイクで検証します。同じ日の最初の提案は、目標が「opennextjs-aws の Azure 版」と述べられたとき、取り下げられました。そのあと、メンテナーが、実装で `@opennextjs/aws` を使ってはならないと、指示として言い直しました。最新の指示に従います。スパイクが承認されたら、[ADR-0011](#adr-0011-nextjs-support-follows-opennextjsaws) と [ADR-0012](#adr-0012-the-nextjs-adapter-api-is-not-adopted-yet-nextjs-15-stays-supported) を置き換えます。

**方向。** Next.js サーバー(ルーティング、レンダリング、ミドルウェア、ストリーミング、画像最適化を行います)を使い続け、Azure 固有の部分だけを、Next.js が文書化したインターフェースを通して提供します。`output: "standalone"`、`cacheHandler`(インクリメンタルキャッシュと `fetch` キャッシュ、`revalidateTag`)、`'use cache'` のための `cacheHandlers` です。ユーザーに見える動作の目標は、Azure 上の `opennextjs-aws` のままです。1 つの Function App、Blob、Table、Queue Storage、ストリーミング、ISR、タグ、画像。

**スパイク(この ADR の最初のステップ)。** 新しいサンプル(`examples/standalone`)で: `output: "standalone"` でビルドしたアプリ。ワーカーの中で Next.js サーバーを起動し、各リクエストをストリーミングで転送する、Functions v4 の HTTP 関数。Azurite に対する、Blob(エントリ)と Table(タグ)の `cacheHandler`。既存の HTTP の E2E ケースを、これに対して実行します。問い: 転送を通したストリーミング、Cookie、ISR と `revalidateTag`/`revalidatePath`、`'use cache'`、画像最適化、ミドルウェア、Server Actions。OpenNext のバンドルと比べた、コールドスタートとパッケージのサイズ。

**Next.js 15。** スパイクは 15.5.29(カタログのバージョン)を使います。これには Adapter API がありません。`standalone` と `cacheHandler` は、15 と 16 にあります。16.2 以降で Adapter API も使うかは、スパイクのあとで決めます。

**名前とドキュメント。** そうなると、パッケージは OpenNext のアダプターではなくなります。名前 `opennext-adapter-azure`(ADR-0015)と、OpenNext の形のドキュメントは、スパイクの前ではなく、あとで見直します。

**この ADR では行わないこと。** 現在のパッケージは動き続け、スパイクが承認されるまで変更しません。何も削除しません。

### スパイクの結果(2026-11-08、ローカルのみ)

構成: Next.js 15.5.29 の `examples/standalone`、`output: "standalone"`、ワークスペースのルートに設定した `outputFileTracingRoot`、Azurite に対する `cacheHandler`(`cache-handler.cjs`)と `experimental.cacheHandlers.default`(`cache-handlers.cjs`)、ワーカーの中で起動した Next.js サーバーへ `node:http` で転送する `main.mjs`、既存のヘルパーで平坦化した pnpm のレイアウト。既存の E2E スイート(`e2e:remote`、ループバックのプレーンな http)を、空のストレージから実行しました。**43 件が合格、4 件が失敗、5 件がスキップ**(52 件)。Azure は使っていません。

動いたもの: ページとルートハンドラー、Pages Router(ISR、`fallback: "blocking"` と `true`、`notFound`、`res.revalidate`)、**同じプロセスの中での** stale-while-revalidate による時間ベースの ISR(キューなし。STALE を返し、次のリクエストは、新しいページの HIT)、キャッシュハンドラーを通した `revalidateTag` と `revalidatePath`、`cacheHandlers` を通した `revalidateTag` を使う `'use cache'`、Server Actions(フォームの POST、`Next-Action` の呼び出し)、ミドルウェア(リダイレクト、rewrite、ヘッダー)、ストリーミング(遅い Suspense のページ)、Next.js 自身のオプティマイザーでの画像最適化(リサイズ、WebP、不正なサイズでの 400)、すべての Cookie(5 つの異なる `Set-Cookie`)、静的ファイルと条件付きリクエスト(304)。パッケージ: スパイクの zip は 17.4 MB で、同じアプリの OpenNext のパッケージは 31.2 MB(比較はできません。OpenNext のパッケージは、3 つのバンドルと Linux 用の `sharp` を含み、スパイクの `sharp` は、ビルドしたマシンのものです)。ホストの起動後の最初のリクエスト(ワーカーの中での Next.js サーバーの起動を含む)は 0.24 秒(ローカル、ディスクがウォーム、Node 26)。

4 件の失敗は、故障ではなく、違いです。(1) `after()`: レスポンスはすぐに終わり、遅延処理はプロセスの中で動き続けます。OpenNext のラッパーは、そのためにレスポンスを開いたままにしました(ADR-0006)。処理が残っている間に、アイドルのインスタンスが削除されることがあるので、保持の方法は、これから設計しなければなりません。(2) 元画像がないときは **400**(Next.js 自身の応答)。OpenNext のアダプターの変換は 404 でした。(3) `/_next/static` の JS は `application/javascript` で配信されますが、テストは `text/javascript` を期待しました。(4) `public/` のファイルは、`must-revalidate` なしの `public, max-age=0` になります。2〜4 は、OpenNext の動作を前提に書いた期待です。

途中で分かったこと: Next.js は、キャッシュハンドラーのパスを、dist ディレクトリからの相対で `server.js` に書き込むので、作業ディレクトリは、アプリのディレクトリでなければなりません。`next build` は、プリレンダリング中にハンドラーを呼びます(そのときは、ストレージアカウントがありません)。そのため、ビルドのフェーズでは何もしません。ページのエントリは、タグを、コンテキストではなく、`x-next-cache-tags` ヘッダーに持ちます。ビルド時にプリレンダリングされたページは、Blob にありません(最初のリクエストがレンダリングします。入れておくかどうか、どう入れるかは、未解決です)。チャンク転送の POST は、プレーンな http の Functions Core Tools のホストでは、一度も応答されませんでした(テストクライアントは、今は Content-Length を送ります)。ホストのリクエストストリームを転送すると止まったので、POST のボディはバッファーします。Node の `fetch` は、`http` なら 304 になる条件付きリクエストに 200 を返したので、転送は `node:http` を使います。

テストしていないもの: Azure(Flex Consumption、パッケージからの実行、シンボリックリンクがなくなること)、パッケージの中の Linux x64 用の `sharp`、Azure でのコールドスタートとメモリ、Next.js 16、Adapter API、並行性(1 つのワーカーが多くのリクエストを処理します。HTTP の並行性の設定)、キャッシュとタグを共有する複数のインスタンス、デプロイと `deploy` CLI、Front Door の ID の確認、`waitUntil`、Next.js サーバーが死んだとき、または起動しないときのエラー処理、リクエストボディの制限。

**ここまでの評価:** この方法は、E2E スイートが確認する動作については成立し、OpenNext の override よりずっと少ないコードで済みます(130 行のエントリと、2 つのキャッシュハンドラーのファイル)。まだ置き換えとはいえません。Azure では何も動かしていませんし、上のことが未解決です。

### Azure でのスパイクの結果(2026-11-08、1 つの Function App、Flex Consumption、japaneast、Node 22、常時稼働なし)

既存のパッケージの Bicep テンプレート(`name=sfjt1`)と、スパイクの zip(17.5 MB、`--linux` でビルド。Linux x64 の `sharp` のバイナリをコピーしたもの。シンボリックリンクなし)を使った `az functionapp deployment source config-zip` で、デプロイしました。デプロイに対する既存の E2E スイート: **43 件が合格、4 件が失敗、5 件がスキップ**。ローカルと同じ 4 つの違いです(`after()` がレスポンスを保持しない。元画像がないときは 404 ではなく 400。JS の Content-Type。`public/` のファイルの `Cache-Control`)。時間ベースの ISR、`fallback`、`revalidateTag`、`'use cache'`、Server Actions、Cookie、画像、ストリーミング、ミドルウェアのケースは、Azure で合格します。

測定(各 1 サンプル、日本にあるクライアント、常時稼働なし): デプロイ後の最初のリクエストは 0.54 秒(デプロイ自身のヘルスチェックが、すでにインスタンスを起動していました)。約 11 分アイドルしたあとの最初のリクエストは **2.5 秒**、その次は 0.13 秒(OpenNext のパッケージは、常時稼働なしで 4.1〜4.5 秒でした)。ウォームなレスポンスは 0.1〜0.2 秒。動的ページへの 30 並列の 300 リクエスト: すべて 200、p50 0.18 秒、p95 0.71 秒、最大 1.13 秒。ISR ページへの 30 並列の 300 リクエスト: すべて 200、p50 0.12 秒、p95 0.44 秒。`revalidateTag` のあと、60 件の並列リクエストが、約 60 ms の間に 4 つの異なる再生成された値を作り(同時のレンダリングはまとめられません)、次の 60 件は、すべて最後のものを見ました。Application Insights には、複数のデプロイをまたぐアプリの存続期間全体で、15 の異なるロールインスタンスが見えました。そのうち何台が負荷テストを処理したかは、読んでいません。

Azure でだけ分かったこと: (1) アプリのディレクトリは読み取り専用です。Next.js の画像オプティマイザーは `.next/cache` に書き込み、最初の画像リクエストのたびに `EACCES` で失敗し、未処理の rejection として記録されました。`images.maximumDiskCacheSize: 0` と `experimental.isrFlushToDisk: false` で修正しました。そのあと、トレースに残った唯一のエラーは、"unknown action id" のテストで想定されるものでした。(2) フロントエンドは、`x-forwarded-proto: https` を送ります。これがあると、Next.js は、自分のループバックのオリジンを同じオリジンとして扱わなくなり、ミドルウェアの rewrite が 500("Failed to proxy https://localhost:3000/...")を返しました。同じ失敗は、そのヘッダーを付ければ、ローカルでも再現します。`main.mjs` は、そのヘッダーを転送しなくなり、公開のオリジンを `Location` に入れます(ミドルウェアのリダイレクトは、それ以前から `http://localhost:3000` を指していました)。アプリのコードが `request.url` から作ってボディに書き込む絶対 URL は、修正されません。`experimental.trustHostHeader` を先に試しました。これは文書化されたオプションではなく(Next.js がホスティングプラットフォームを検出したときだけ設定されます)、効果がありませんでした。

まだテストしていないもの: 常時稼働、Next.js 16、Front Door の ID の確認、`after()` の保持、測定したインスタンス数でのキャッシュのスケールアウト時の一貫性、Blob に入れておいたプリレンダリング済みのページ、この構成の `deploy` CLI、古いビルドの上へのデプロイ(Server Actions のキー)、Next.js サーバーが死んだときのエラー処理、メモリ。

費用: アプリは約 27 分間(13:33 から 14:00 JST)存在しました。Azure Cost Management の数字は、まだありません。

### 同じ日の続き(ローカル): after()、prime、Next.js 16

- **`after()`:** Next.js は、`globalThis[Symbol.for("@next/request-context")]` を通して、プラットフォームに `waitUntil` を求めます。`main.mjs` がこれを提供し、処理を追跡して、レスポンスが終わる前に登録された処理が完了するまで、各レスポンスを開いたままにします(最大 220 秒。`WAIT_UNTIL_MODE=detach` で無効になります)。処理は、Next.js サーバーの内部で登録され、リクエストはそこへループバックで届いたので、1 つのリクエストに結び付けられません。そのため、レスポンスは、先に始まったほかのリクエストの処理も待つことがあります。`after()` の E2E のケースは合格します(2.01 秒の保持)。
- **Prime:** カスタムキャッシュハンドラーがあると、Next.js は、`next build` がプリレンダリングしたページを読みません。各ページは、デプロイ後の最初のリクエストでレンダリングされます(`x-nextjs-cache: MISS`)。`prime.mjs <url>` は、`prerender-manifest.json` のすべてのルートをリクエストし、そのあとは `HIT` になります。プリレンダリング済みのファイルをキャッシュのエントリに変換することは、試していません(バージョンごとの形式があるため)。
- **同時の再生成:** `revalidateTag` のあと、並列のリクエストが、それぞれ再生成することがあります。最後の書き込みに収束します。変更していません。
- **Next.js 16.4.5(ローカル、Node 26):** 同じ E2E スイートで、**45 件が合格、2 件が失敗、5 件がスキップ**。2 件の失敗は、`public/` のヘッダーの期待です。16 で必要だったこと: (1) キャッシュハンドラーのモジュールは、`require("node:...")` をしてはいけません。Turbopack がそれらをプロキシのバンドルに含め、プロキシされるすべてのリクエストが、"Unsupported external type Url for commonjs reference" で失敗するためです(`next start` でも再現しました)。(2) `sharp` パッケージ全体を、アプリにコピーしなければなりません。トレースされたコピーには `dist/index.cjs` がなく、そうするとイメージオプティマイザーが、黙って元の画像を返すためです。`experimental.cacheHandlers` と `experimental.useCache` は、16 でも、非推奨の警告付きで動きます(`cacheHandlers` と `cacheComponents` に移りました)。`middleware` のファイルの規約は、非推奨です。Azure では実行していません。
- **これらの変更のあとの Next.js 15.5.29(ローカル):** 44 件が合格、3 件が失敗(元画像がないときの 400 の応答、`public/` のヘッダーの期待 2 件)、5 件がスキップ。

---

## ADR-0017: Migrate to the standalone design in a new package, `next-on-azure`

**日付:** 2026-11-08。**状態:** 移行するというメンテナーの指示("go ahead with the migration")により承認。名前は、[ADR-0018](#adr-0018-the-package-name-is-next-on-azure) まで、仮のものでした。

**決定。** スパイク([ADR-0016](#adr-0016-run-nextjs-on-azure-without-opennextjsaws-start-with-a-spike-accepted-for-the-spike))で検証したランタイムを、独立したパッケージ `packages/next-on-azure` にして、名前を `next-on-azure` とします(未公開。`next-on-azure`、`next-azure-adapter`、`nextjs-on-azure`、`azure-next-adapter` は、2026-11-08 に npm で使われていませんでした)。`@opennextjs/aws` には依存しません。古いパッケージ `packages/open-next-azure` は、新しいものが同等になる(同じ E2E スイート、Azure での実行、ドキュメント)まで、テストと CI を含めて、そのまま残します。そのあと、古いパッケージを、別の変更で削除します。名前と位置づけは、公開の前に決めます(ADR-0015 は、趣旨としては置き換えられました。`opennext-adapter-azure` は、もうこのプロジェクトを表していません)。

**新しいパッケージの内容。** ランタイム: Blob と Table 上のキャッシュハンドラー(`cache-handler`、`cache-handlers`)、Next.js サーバーに転送する Functions のエントリ、Cookie の変換。ビルド側: `withAzure(nextConfig)`(`output: "standalone"`、ハンドラー、スパイクで必要と分かった設定を設定します)、`package`、`prime`、`deploy` を持つ CLI、OpenNext の部分を除いた Bicep テンプレート。まだ使えるコードは、古いパッケージからコピーして移します(pnpm のツリーの平坦化、バージョンと Server Actions のキーの確認、ウォームアップ)。

**段階。** (1) ランタイム、設定ヘルパー、CLI の `package`/`prime` を持つパッケージ、単体テストと統合テスト、それを使うサンプル、ローカルの E2E。(2) 簡略化した Bicep と `deploy`、Azure での実行。(3) CI のジョブ。(4) ドキュメントの書き直しと、名前の選択。(5) 古いパッケージの削除。

**名前(2026-11-08)。** メンテナーが、「当面」`next-on-azure` を選びました。その日は、npm で使われていませんでした。2026-11-10 に確認済みです(ADR-0018)。

**未決定。** Blob からの静的ファイル(現在は、Next.js がパッケージから配信します)、Front Door、常時稼働の既定、16.2 以降の Next.js Adapter API の道。

### パッケージのビルドでの Azure の実行(2026-11-08、`next-on-azure`、新しい Bicep テンプレートと `deploy`)

`next-on-azure deploy -g opennextjs-azure-fjtd -n nfjt1`(Flex Consumption、japaneast、Node 22、常時稼働なし、Front Door なし)でデプロイしました。新しい Bicep テンプレートは、最初の試行でデプロイでき、zip(17.7 MB、Linux 用の `sharp`)をデプロイして、デプロイ後の最初のリクエストは 0.6 秒で 200 を返し、プリレンダリング済みの 9 つのルートは、0.6 秒で prime されました。デプロイのコマンドは、全体で約 3 分かかりました。

URL に対して `E2E_TARGET=standalone` で実行した HTTP スイート: **47 件が合格、5 件がスキップ**(スキップした 5 件は、ローカルのホストログか、ローカルの HTTPS のフィクスチャサーバーが必要です)。最初の実行では、時間ベースの ISR のテストで 2 件が失敗しました。prime のあと、最初の応答がすでに STALE で、テストは、新しいページを想定していたためです。テストは、今は、古くないページを待ちます(`freshPage`)。動作自体は正しいものでした(1.5 秒ごとのプローブは、5 秒の周期で、STALE のあと、新しいページの HIT を示しました)。

測定(各 1 サンプル、日本にあるクライアント): 約 11 分アイドルしたあとの最初のリクエストは **2.4 秒**(そのあと、ISR ページで 0.16 秒と 0.55 秒)。30 並列の 300 リクエスト: 動的ページはすべて 200、p50 0.13 秒、p95 0.29 秒、最大 0.34 秒。ISR ページはすべて 200、p50 0.12 秒、p95 0.86 秒、最大 1.2 秒。Application Insights: "unknown action id" のテストで想定されるもの以外に、エラーはありませんでした。

`'use cache'` の一貫性: `revalidateTag` の前の 60 件の並列リクエストは、すべて 1 つの値を見ました。そのあとの 60 件の並列リクエストは、70 ms の間に 10 個の異なる再生成された値を見ました(同時の再生成は、インスタンスをまたいでも、インスタンスの中でも、まとめられません)。キャッシュは、最後の書き込みに収束します。変更も緩和もしていません。

CI(GitHub、コミット 04fcd42): Next.js 15 と 16.4.5 の `standalone-e2e` を含め、すべてのジョブが成功しました。

Azure でテストしていないもの: Front Door、常時稼働、Next.js 16、Queue Data Contributor のロールが不要であること(テンプレートは、今もそれを付与しています)、安定した Server Actions のキーがある場合とない場合の、古いビルドの上へのデプロイ、スケールアウトのインスタンス数。

費用: アプリは約 17 分間(15:18 から 15:35 JST)存在しました。Azure Cost Management の数字は、まだありません。

## ADR-0018: The package name is `next-on-azure`

**日付:** 2026-11-10。**状態:** メンテナーが承認("next-on-azure is fine")。[ADR-0005](#adr-0005-package-name-is-deferred) を置き換えます。

**決定。** パッケージ、リポジトリ、ドキュメントは、名前 `next-on-azure` を使います。これは、Next.js のほかのプラットフォーム用パッケージの `next-on-<platform>` のパターンに従い、パッケージが行うこと(Azure 上の Next.js)を表します。

**検討したもの。** `azure-<name>`: メンテナーが 2026-11-10 に、Microsoft の命名に従うかを尋ねました。`@azure/*` は Microsoft 自身のスコープで、`azure-` で始まる名前は、公式のパッケージのように読め、Microsoft の商標のガイドラインは、"Azure" で始まる製品名に、一般に厳しいため、退けました(ガイドライン自体は、このセッションでは読んでいません)。`opennextjs-azure` と `opennext-*` の名前: パッケージが `@opennextjs/aws` に依存しなくなったときに、やめました(ADR-0016)。

**結果。** 「仮」という注記は、README、ドキュメント、パッケージから削除しました。ソースファイルに名前をハードコードしないというルールは、なくなりました。最初の公開の前に、名前が npm で使えなければなりません(2026-11-08 に確認。公開の日に、もう一度確認します)。使えなければ、新しい ADR で別の名前を選びます。

## ADR-0019: Enterprise use at the level of OpenNext

**日付:** 2026-11-10。**状態:** メンテナーが承認("for organizations, at the level of opennextjs-aws")。

**決定。** 組織への対応とは、OpenNext が提供するものを指します。プラットフォーム上で動くビルド、アプリが必要とするものを示すドキュメント、バージョン付きのリリース、セキュリティポリシーです。テンプレート(`infra/main.bicep`)と `deploy` は、OpenNext の参考実装と同じように、参考実装です。独自のインフラのコードやランディングゾーンを持つ組織は、リソースを自分で作ります([Your own infrastructure](../infrastructure.md))。OpenNext は、インフラをまったく作りません([アーキテクチャのページ](https://opennext.js.org/aws/inner_workings/architecture)、2026-11-10 に確認)。

**テンプレートには入れず、誰かが必要とするまで予定もしないもの:** プライベートネットワーク、Web アプリケーションファイアウォール、お客様管理のキー、冗長性と診断の設定、Azure Policy のためのタグ、既存のワークスペースやプランの再利用。これらの最初のバージョン(ストレージの SKU、タグ、既存の Log Analytics ワークスペース、保持期間、診断設定のパラメーター)は書きましたが、このレベルを超えるとして、同じ日に破棄しました。

**このレベルで、まだやること:** `SECURITY.md`、`CONTRIBUTING.md`、そのほかのコミュニティのファイル(R1。メンテナーの連絡先のアドレス、P4 を待っています)、対応する Next.js と Node.js のバージョンの記述(peer の範囲と [Compatibility](../compatibility.md))、provenance 付きのリリースパイプライン(R3)。

## ADR-0020: Static files stay with the function; cost options first, measure later

**日付:** 2026-11-10。**状態:** メンテナーが承認("the current state may be fine"、"otherwise keep the current state"、トラフィックごとの見積もりのあとでの、選択肢 B の選択)。

**背景。** すべてのリクエストは、静的ファイルを含めて、関数を実行します。最初の設計では、アセットリゾルバーが関数の中で Blob を読み、今は、Next.js サーバーがパッケージの中から配信します。OpenNext(AWS)は、`assets` フォルダーを、サーバー関数を通さずに、ユーザーが作る CDN の背後にある S3 から配信します([アーキテクチャのページ](https://opennext.js.org/aws/inner_workings/architecture)、2026-11-10 に確認)。`/_next/static/*` は、`Cache-Control: public, max-age=31536000, immutable` で送られるので、ブラウザーは、各ファイルを一度だけ取得します。`public/` のファイルは、リクエストのたびに再検証されます。

**決定。** アルファ版では、設計をそのままにします。費用は、設計を変えず、既定でオフの選択肢で下げます。`deploy --memory`、`--max-instances`、`--cache-retention-days`、`--request-telemetry errors`。トラフィックごとの見積もりは、[Cost](../cost.md) ページにあり、見積もりとして明記しています(Japan East の実際の価格、仮定した数量)。`/_next/static/*` を、Blob(公開の読み取り用コンテナーと `assetPrefix`)から、または Front Door Standard(Front Door のマネージド ID を使う Blob オリジン。Azure の文書は、これを Standard 向けに挙げていますが、一部はプレビューと記されています)から配信することは、作って**いません**。ドキュメントサイトのデプロイの測定と、想定するトラフィックがそろったときに決めます。見積もりでは、月に数十万から 100 万ページビューのあたりです。

**結果。** 小さなサイトは、無料枠の中で、ほとんど何も支払いません。**2026-11-10 に測定**(Azure 上のドキュメントサイト。[Cost](../cost.md) ページを参照): リクエストあたり約 4.1 KB の Application Insights のデータ、2048 MB でリクエストあたり 0.106 GB 秒、1 訪問あたり 186 KB と 4.2 リクエスト。忙しいサイトでは、Application Insights の取り込みが、請求額の最大の部分です(100 万訪問で、62 USD のうち約 40 USD)。`--request-telemetry errors` は、これを 85% 減らします(Host.Results を Error に、Function.server を Warning に。ピリオドを含むアプリ設定の名前は、Flex Consumption で動きます)。`--memory 512` は、このワークロードでは、何も節約しません。リクエストが約 4 倍の時間かかるので、GB 秒は同じです。まだ行う測定: Cost Management の数字、より長い実行、512 MB での `sharp`。

## ADR-0021: The first release is `0.1.0`, without a pre-release suffix

**日付:** 2026-11-10。**状態:** メンテナーが承認("the tag carries no letters")。

**決定。** 最初の公開リリースは `0.1.0` で、npm の既定のタグで公開します。`-alpha`、`-beta`、`-rc` の接尾辞も、`alpha` の dist-tag も付けません。プロジェクトが実験的であることは、README、パッケージの説明、[Support](../support.md) ページで伝えます。Support ページは、実際に動かしたものだけを約束します。`0.x` というシリーズ自体が、マイナーバージョンで互換性が壊れることがあると、ユーザーに伝えます。最初の計画がベータと呼んだ段階は、`0.2.0` とそれ以降のマイナーになります。

**結果。** `npm install next-on-azure` は、タグを尋ねずに、実験的なリリースをインストールします。バージョンが警告を運ばないので、ドキュメントが警告を運ばなければなりません。プレリリースのチャンネル(リリースを既定にする前にテストするためのもの)は、予定していません。リリースは、公開の前に、リリースのコミットでテストします(R6)。

## ADR-0022: The cache handler reads the build output on a miss

**日付:** 2026-11-11。**状態:** 実装し、ローカルでテスト済み。**Azure では、まだ実行していません**。

**背景。** Next.js は、`next build` がプリレンダリングしたもの(`.next/server/app`、`.next/server/pages`)を、自身の `FileSystemCache` で読みます。カスタムの `cacheHandler` があると、ハンドラーに尋ねますが、ハンドラーには、これらのエントリがなく、すべてのページが、最初のリクエストでレンダリングされていました(そして `deploy` が prime していました)。フォールバックのないルート(App Router の `dynamicParams = false`)では、Next.js は、キャッシュにないページをレンダリングしません。`NoFallbackError` を投げて、ビルドされたパスでも、404 を返します。ドキュメントサイトが、最初のデプロイで、これに当たりました(Azure でもローカルでも、すべてのページが 404)。

**決定。** Blob にないとき、ハンドラーは、アプリの Next.js から作った、Next.js 自身の `FileSystemCache` で、ページを読みます(`serverDistDir` からの `createRequire` なので、クラスは、動いているバージョンのものです)。メモリキャッシュはゼロ、`flushToDisk: false` で、読み取りだけです。対象は、ビルドがプリレンダリングする種類(`APP_PAGE`、`APP_ROUTE`、`PAGES`)だけで、`fetch` のエントリは対象外です。タグの確認は、Blob のエントリと同じもので、`x-next-cache-tags` ヘッダーのタグを使い、Table Storage に対して行います。ビルドのファイルが書かれたあと(更新時刻)に、タグが再検証されたエントリは、ミスになります。読み取りが、Blob に何かを書くことはありません。クラスを読み込めないときは、これまでどおり、読み取りはミスになります。

**選ばなかったもの。** デプロイ時に Blob に入れておく(OpenNext の populate-cache): デプロイする人に、ストレージアカウントのデータロールが必要になり、値の形が、Next.js のバージョンによって違いますが、上のクラスは、それをすでに知っています。ファイルの形式を、ハンドラーの中で再現する: バージョン 15 と 16 をまたぐと、壊れやすくなります。

**結果。** ハンドラーは、Next.js の内部のパス(`next/dist/server/lib/incremental-cache/file-system-cache`)に依存します。E2E スイートは、CI で 15 と 16 の両方で動き、クラスがないときは、以前の動作に縮退します。`dynamicParams = false` が動きます(ローカルの E2E: ビルドされたパス、不明なパスは 404、古いページは配信して再生成。Functions ホスト上の、Next.js 16.4.5 のドキュメントサイト)。最初のリクエストが、ビルドされたページを、もう一度レンダリングすることはなくなりました。prime は残します。インスタンスを温め、古いページの再生成を始めます。Azure で検証すること: Next.js 15 と 16 で、デプロイに対して、同じ E2E のケース。

## ADR-0023: Releases are tags, published with trusted publishing, without Changesets

**日付:** 2026-11-11。**状態:** 書きましたが、**実行していません**。npm 側は、設定していません。

**決定。** リリースは、バージョンのタグです。`release` ワークフローが、検証(lint、型チェック、ビルド、単体テストと統合テスト、タグがパッケージのバージョンと等しいこと、パッケージが private でないこと)を行い、パッケージを 1 回パックし、2 つ目のジョブが、その tarball をダウンロードして、保護された environment `npm-publish` の承認のあとで、npm の trusted publishing(OIDC)を使い、`npm publish --provenance` で公開します。npm のトークンは存在しません。バージョンと `CHANGELOG.md` は、リリースのコミットで、手で編集します。使うのは、ファーストパーティの `actions/*` のアクションだけです。

**選ばなかったもの。** Changesets: 専用のアクション(`changesets/action`)が必要で、CI のルール(サードパーティのアクション)が許さず、ボットが作る「version」のプルリクエストも必要です。1 つのパッケージと 1 人のメンテナーなら、手書きの変更履歴とタグのほうが、仕組みもサプライチェーンも小さくて済みます。シークレットに入れたトークン: trusted publishing が避ける、長期の資格情報です。

**結果。** 最初のリリースは、パッケージが存在する前に、npm が trusted publisher を受け付けるかどうかに依存し、これは未検証です([Release](../contribute/release.md))。実際のデプロイでのエンドツーエンドの確認(R6)は、タグの前に手で行い、ワークフローでは行いません。ワークフローは、設計上、Azure へのアクセスを持ちません。
