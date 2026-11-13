---
title: "How does it work?"
source: "docs/how_it_works.md"
---

## リクエストの経路

```
client ──▶ Functions front end ──▶ Function `server` ({*path}) ──loopback──▶ Next.js server (same worker)
                                                                                  │
                                                         cache handlers ──▶ Blob (entries) + Table (tags)
```

- Function App には、`{*path}` に対する **関数が 1 つ**、`server` があります。ストリーミングは有効です(`main.mjs`。元は `src/runtime/entry.mjs`)。最初のリクエストが、同じワーカーの中で、Next.js の standalone サーバー(`server.js`)を `127.0.0.1:3000` で起動し、ポートが開くまで待ちます。
- すべてのリクエストは、`node:http` でこのサーバーに転送されます。レスポンスは、ストリームとして渡します。`Set-Cookie` の値は、Functions のレスポンスの構造化された `cookies` に変換します。ホストが、ヘッダー名ごとに 1 つの値しか保持しないためです。
- `x-forwarded-proto` は転送しません。`https` を付けると、Next.js が自分のループバックアドレスを同じオリジンとして扱わなくなり、ミドルウェアの rewrite が 500 で失敗します。公開するスキームは、リダイレクトの `Location` ヘッダーに戻します。
- リクエストボディは、転送する前にバッファーします(ホストのリクエストストリームをそのまま転送すると、POST で止まりました)。
- ルーティング、レンダリング、ミドルウェア、Server Actions、ストリーミング、画像最適化は、Next.js 自身が行います。このパッケージは、どれも再実装しません。

## キャッシュ

Next.js は、ストレージのために 2 つのインターフェースを呼び出します。どちらも Storage の上に実装していて、`next.config` からパスで読み込まれます(`withAzure()` が設定します)。

| インターフェース | 用途 | ストレージ |
| --- | --- | --- |
| `cacheHandler`(`cache-handler.cjs`) | ページ、ルートハンドラー、`fetch` の結果、`revalidateTag`、`revalidatePath` | エントリは、`cache` コンテナーの JSON の Blob(`<build id>/<キーの sha256>.json`)。Buffer と Map はシリアライズします。タグはテーブルに入ります |
| `cacheHandlers`(`cache-handlers.cjs`) | `'use cache'` | ストリームのエントリを、1 つの JSON ドキュメント(値は base64)として、`use-cache/<build id>/...` の下に保存します |
| タグ(両方) | 再検証の状態 | テーブル `tagcache`: パーティション = ビルド ID、行キー = タグの base64url、`revalidatedAt` はエポックのミリ秒 |

エントリは、いずれかのタグ(とリクエストのソフトタグ)が、エントリの書き込み後に再検証されていれば、破棄されます。ページのタグは `x-next-cache-tags` ヘッダーから、`fetch` のエントリのタグはそのコンテキストから得ます。再検証では何も削除しないので、タグごとに小さな書き込みが 1 回で済みます。

キーのプレフィックスはビルド ID です。新しいデプロイは空のキャッシュで始まり、古いエントリは読まれません。古いエントリは、削除されません。

**時間ベースの ISR** は、Next.js 自身のものです。`revalidate` より古いエントリを見つけたリクエストには、古いページをすぐに返し(`x-nextjs-cache: STALE`)、サーバーが同じプロセスの中で、バックグラウンドでページを再生成します。キューはありません。その間にインスタンスが削除されると、再生成は失われ、次のリクエストが再び開始します。

**ビルド出力と prime。** `next build` は、ページを `.next/server` にプリレンダリングします。Next.js は、これを自身のファイルシステムキャッシュで読みます。カスタムキャッシュハンドラーがあるときは、代わりにハンドラーに尋ねます。そのため、Blob にないとき、ハンドラーが自分でそれを読みます。Next.js 自身の `FileSystemCache` クラスを使います(読み取り専用、メモリキャッシュなし)。ページのタグは、ほかのエントリと同じように、Table Storage に対して確認します。フォールバックのないルート(`dynamicParams = false`)には、これが必要です。そのようなルートでは、Next.js は、キャッシュにないページをレンダリングしません。ページが一度再生成されると、そのエントリは Blob に入り、以後はそこから読まれます。`next-on-azure prime`(`deploy` が実行します)は、`.next/prerender-manifest.json` のすべてのルートを 1 回リクエストします。インスタンスを温め、すでに revalidate の時間を過ぎたページの再生成を始めます。

## `after()` とその他の遅延処理

Next.js は、`globalThis[Symbol.for("@next/request-context")]` を通して、プラットフォームに `waitUntil` を求めます。エントリがこれを提供し、処理を追跡します。レスポンスは、レスポンスが終わる前に登録された処理が完了するまで(最大 `WAIT_UNTIL_MAX_SECONDS`)、開いたままです。理由は、アイドルのインスタンスが、おおよそ 1.5〜3.5 分で消え、それより長く続く遅延処理は失われるからです([Azure notes](./inner_workings/azure_notes.md)、項目 18)。処理は、Next.js サーバーの内部で登録されます。リクエストは、そこへループバックで届いたので、処理を 1 つのリクエストに結び付けることはできません。

## パッケージング

`next-on-azure package` は、`.next/standalone` から Function App を作ります。

1. Next.js のバージョンと、Server Actions のキーを確認します。
2. standalone ディレクトリをコピーし、pnpm の `node_modules` を、シンボリックリンクのない通常のツリーにします([Azure notes](./inner_workings/azure_notes.md)、項目 13)。
3. `.next/static` と `public/` を `server.js` の隣にコピーします。また、`sharp` パッケージ全体(Next.js 16 では、ファイルトレースが `dist/index.cjs` を落とし、オプティマイザーが黙って元の画像を返します)と、Azure 用の Linux x64 のバイナリもコピーします。
4. `main.mjs`、`cookies.mjs`、`front-door.mjs`、`host.json`(`/` の HTTP ルート、extension bundle なし)、そして `@azure/functions` を入れた `package.json` を書き出し、インストールして、結果を zip にします。

キャッシュハンドラーのファイルは、意図的に、`node:` プレフィックスなしで require しています。Next.js 16 は、これらを Turbopack でプロキシのバンドルに含めます。Turbopack は、CommonJS から `node:` の external を読み込めません。
