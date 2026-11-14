---
title: "Compatibility"
source: "docs/compatibility.md"
---

各行を、どこまで検証したかを示します。

- **Verified (Azure)**: このパッケージの実際のデプロイに対して実行しました([Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600)、japaneast、Node 22)。記録は、`E2E_TARGET=standalone` で実行した `packages/tests-e2e` の HTTP スイート(2026-11-08 に 47 件が合格。そのとき、今はなくなったホストログの 5 件はスキップしました)と、ADR-0016 の測定です。同じ設計の以前のスパイクでも、同じ結果でした。
- **Verified (local)**: 開発者のマシンと CI で、[Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?wt.mc_id=studentamb_679600) と Azure Functions ホストを使って実行しました(`pnpm e2e:standalone`)。
- **Unverified**: 実装した、または動くと見込んでいますが、一度も実行していません。

## Next.js

| バージョン | 状態 |
| --- | --- |
| 15.5.29 | Verified (Azure)、CI でも実行 |
| 16.4.5 | Verified (Azure、2026-11-09: `middleware.js` を使うサンプルのデプロイに対して、HTTP スイート 48 件)、CI でも実行 |
| 15.5.30 以降の 15.x | 動くと見込んでいます(対応範囲の内側)。実行したのは 15.5.29 だけです |
| 16.0.0〜16.4.4 | 非対応(`package` が拒否します。`--allow-unsupported-next` で上書きできます) |
| 15.5.29 より古いもの | 非対応 |

範囲は、このパッケージの `next` の peer 範囲です。最初の設計から引き継いだもので、独自に導いたものではありません。

## 機能

| 機能 | 状態 |
| --- | --- |
| App Router: 動的レンダリング(SSR)、ルートハンドラー、動的ルート | Verified (Azure) |
| Pages Router: `getServerSideProps`、`getStaticProps`、API ルート、`fallback: "blocking"` と `true`、`notFound`、`res.revalidate` | Verified (Azure) |
| 静的ページと、時間ベースの ISR(`revalidate`) | Verified (Azure): 古いページをすぐに返し、次のリクエストで新しいページを返します。再生成は、古いページを返したリクエストと同じプロセスで動きます(キューはありません)。 |
| `revalidateTag`、`revalidatePath` | Verified (Azure) |
| `cacheTag` と `revalidateTag` を使う `'use cache'` | Next.js 15 で `experimental.useCache` を使う場合は Verified (Azure)。Partial Prerendering を使う `cacheComponents`(16.4.5)は、小さなアプリで **Verified (Azure)**(2026-11-10。ページは部分的にプリレンダリングされる。`'use cache'` の部分はリクエストをまたいで値を保ち、`connection()` の後ろの部分はリクエストごとにレンダリングされ、`revalidateTag` はキャッシュされた部分を更新する)と Verified (local、2026-11-08)。CI には入っていません。`cacheLife` の期限切れと、`remote`、`private` の種類は、未テストです。 |
| レスポンスのストリーミング(Suspense) | Verified (Azure) |
| ミドルウェア(リダイレクト、rewrite、ヘッダー)。Next.js 16 の `proxy` の規約を含む | `middleware` は Verified (Azure)。`proxy` は、16.4.5 で **Verified (Azure)**(サンプルの `middleware.js` を `proxy.js` に名前変更したもの: スイート全体の 48 件が、2 つのデプロイに対して合格。2026-11-10)と Verified (local)。CI には入っていません(サンプルは `middleware.js` のままです)。Edge ランタイムのミドルウェアは非対応です。 |
| Server Actions | Verified (Azure): フォームの POST と `Next-Action` の呼び出し。安定した `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` が設定されていないと、`package` が警告します。古いビルドの上へのデプロイは **Unverified** です。 |
| `after()` | Verified (Azure): 処理が終わるまで、レスポンスを開いたままにします(`--wait-until hold`、既定)。`detach` は、この設計では **Unverified** です。 |
| 画像最適化(`next/image`) | Verified (Azure): リサイズ、WebP、不正なサイズや許可されていないリモート URL の拒否。Linux 用の `sharp` を使います。元画像がないときは **400** を返します(Next.js 15 自身の応答)。最適化した画像の Next.js のディスクキャッシュは、無効です(アプリのディレクトリが読み取り専用のため)。そのため、最適化した画像は、インスタンスの再起動のあとで作り直されます。 |
| Cookie(複数の `Set-Cookie`) | Verified (Azure) |
| 静的ファイル(`/_next/static`、`public/`) | Verified (Azure): Next.js サーバーが、パッケージの中から、自身の `ETag` と `Cache-Control` で配信します。Blob や CDN には**入っていない**ので、リクエストごとに関数が 1 回実行されます。 |
| `next build` でプリレンダリングされたページ | Next.js は、カスタムキャッシュハンドラー経由では読みません。そのため、Blob にないとき、ハンドラーが自分でビルド出力から読みます。Next.js 自身のファイルシステムキャッシュのクラスを使います(読み取り専用。タグの再検証は、ほかのエントリと同じように Table Storage に対して確認します。[ADR-0022](./plan/decisions.md#adr-0022-the-cache-handler-reads-the-build-output-on-a-miss))。2026-11-11 から **Verified (local)**、2026-11-14 から **Verified (Azure)** です(コミット 3006689、Next.js 15.5.29 と 16.4.5。`deploy` の直後に、プリレンダリング済みのすべてのルートが、prime のリクエストで `HIT` を返し、HTTP スイートは、どちらも 50 件中 50 件が合格しました)。変更の前は、各ページを最初のリクエストでレンダリングし、`deploy` が prime していました。`deploy` は今も、すべてのルートを 1 回 prime します。 |
| `dynamicParams = false`(App Router)、`fallback: false`(Pages Router) | App Router: 2026-11-11 まで、すべてのパスが 404 を返しました(Azure でもローカルでも。フォールバックがないとき、Next.js はキャッシュにないページをレンダリングしません)。現在は、ビルドされたページをビルド出力から見つけます。パスは 200、不明なパスは 404、古いページは配信して再生成します。**Verified (Azure)**(2026-11-14。Next.js 15.5.29 と 16.4.5、`routes without a fallback` の E2E のケース。手で確認: ビルドされたパスは 200、不明なパスは 404。どちらも)と Verified (local) です。Pages Router の `fallback: false`: Verified (local)。影響は受けませんでした。 |
| Edge ランタイム | 非対応 |
| [Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) | テンプレートはコンパイルできます。**一度もデプロイしていません**。エントリの `X-Azure-FDID` の確認は、単体テストだけで Verified (local) です。 |

## プラットフォーム

| 項目 | 状態 |
| --- | --- |
| Azure Functions Flex Consumption、Node 22 | Verified (Azure)。Node 24: Unverified。 |
| パッケージからの実行: アプリのディレクトリが読み取り専用 | Verified (Azure): 画像オプティマイザーのディスクキャッシュを無効にするまで、`EACCES` で失敗していました。 |
| シンボリックリンクのないパッケージ | Verified (Azure): `package` は、pnpm のレイアウトを通常のツリーに平坦化し、リンクが残るパッケージの生成を拒否します。npm と Yarn classic(1.x)のレイアウト: 2026-11-10 に **Verified (local、CI でも)**(パックした tarball をまっさらなプロジェクトにインストールし、ビルド、パッケージ化して、Azurite と Functions ホストで実行しました。macOS の Node 26 で、npm は Next.js 15.5.29 と 16.4.5、Yarn 1.22 は 15.5.29 で、48 件が合格。CI では、Linux の Node 22 と 24 で、npm と Yarn 1 を Next.js 15.5.29 で実行。Azure では未実行)。Yarn Plug'n'Play は非対応です。`package` は、直し方(`nodeLinker: node-modules`)を示すメッセージを出して止まります。`node_modules` を使う Yarn 2 以降と Bun は Unverified です。 |
| コールドスタート | サンプル 1 回、日本にあるクライアント: 約 11 分アイドルしたあとの最初のリクエストが **2.4 秒**(以前のスパイクでは 2.5 秒)、ウォーム時は 0.1〜0.2 秒。`--always-ready 1` を付けると、同じ種類のアイドル(約 17 分)のあとの最初のリクエストが **0.15 秒**、付けないと **2.4 秒**(2026-11-10、各 1 サンプル、同じビルドを 2 つのアプリに)。 2026-11-14 には、約 10〜12 分アイドルしたあとの最初のリクエストが、常時稼働なしで、**2.68 秒**(Next.js 15.5.29)と **2.45 秒**(16.4.5)でした(各 1 サンプル)。 |
| 負荷 | 30 並列で 300 リクエスト: すべて 200。動的ページの p95 は 0.29 秒、ISR ページの p95 は 0.86 秒(サンプル 1 回)。 |
| スケールアウト | キャッシュとタグは、Storage を通して共有されます。`revalidateTag` のあと、並列のリクエストがそれぞれ再生成することがあります(あるテストでは、70 ms の間に 10 個の異なる値)。キャッシュは、最後の書き込みに収束します。 |

## 既知の制約

- 最初のバイトのあとで失敗するレスポンス(Next.js サーバーが接続を閉じる場合)は、その時点で終わります。クライアントには、短くなったボディが正常終了として見え、失敗はログに記録されます。ストリームをエラーにすると、クライアントがプラットフォームのタイムアウトまで待ちました(ローカルで測定)。このケースは、Azure のデプロイに対して合格しています(2026-11-09)。
- 再検証のあとの同時の再生成は、まとめられません。
- `after()` の処理を、1 つのリクエストに結び付けることはできません。レスポンスが、ほかのリクエストが先に始めた処理を待つこともあります(最大 220 秒)。
- ミドルウェアで、アプリのコードが `request.url` から作ってレスポンスのボディに書き込む絶対 URL は、ループバックのオリジン(`http://localhost:3000`)になります。リダイレクトの `Location` ヘッダーは修正されます。
- Front Door は未テストで、always-ready の費用もそうです(読んだ Azure Cost Management の金額は、短い実行のものだけです: [Cost](./cost.md#実際の請求額))。
- `proxy`(Next.js 16.4.5)による rewrite は、レスポンスヘッダー `x-middleware-rewrite` に、ループバックのオリジン(`http://localhost:3000/...`)を残します。2026-11-10 に Azure で確認しました。Next.js 15 や素の `next start` でも同じかどうかは、確認していません。
- Next.js 自身のサーバーに由来する OpenNext との動作の違いは、[Comparison](./comparison.md) に一覧があります。
