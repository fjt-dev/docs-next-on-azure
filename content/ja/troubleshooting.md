---
title: "Troubleshooting"
source: "docs/troubleshooting.md"
---

開発中に観察した問題を、原因と対処とともに示します。

## デプロイのあとで Server Action が失敗する("Failed to find Server Action")

Server Actions は、クロージャーが捕捉した変数を暗号化します。既定では、Next.js はビルドのたびに新しいキーを作ります。そのため、アクションを呼び出せるのは、それを生成したビルドに対してだけです。デプロイの前から開いていたページは、アクションを呼ぶと失敗します。別々にビルドしたインスタンス同士も、キーが一致しません。これは、Next.js チームがセルフホスティングについて文書化している内容です。Azure での挙動は、再現していません。

すべてのビルドで同じキーを、ビルド時に設定してください(キーはビルド出力に埋め込まれます)。

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # keep it in your secret store, not in the repository
next build
next-on-azure package
```

キーは、16、24、または 32 バイトの base64 です。アプリに Server Actions があるのに環境変数が設定されていないとき、および値がビルドに埋め込まれたキーと違うとき、`package` は警告します。キーを `next build` のときだけ設定したなら、警告を消すために `package` にも設定してください。

## プロキシ/ミドルウェアを通るすべてのリクエストが 500 になる: "Unsupported external type Url for commonjs reference"

Next.js 16(Turbopack)は、キャッシュハンドラーをプロキシのバンドルに含めます。このバンドルは、CommonJS から `node:` の external を読み込めません。このパッケージのハンドラーは、これを避けています。自分でキャッシュハンドラーを書くときは、`require("node:fs")` ではなく `require("fs")` を使ってください。

## 画像がリサイズされずに配信される(エラーなし)

パッケージの中の `sharp` が、ない、または不完全です。`package` は、`sharp` パッケージ全体と Linux x64 のバイナリをコピーします。zip の `standalone/node_modules/@img` に、`@img/sharp-linux-x64` と `@img/sharp-libvips-linux-x64` があることを確認してください。`sharp` がないと、Next.js は元の画像を配信します。

## ミドルウェアの rewrite が 500 になる("Failed to proxy https://localhost:3000/...")

リクエストが、`x-forwarded-proto: https` を付けたまま Next.js サーバーに届きました。エントリは、このヘッダーを転送しません。エントリと Next.js の間に別のプロキシを置くときは、このヘッダーを付けないでください。

## リダイレクトが `http://localhost:3000/...` を指す

エントリは、`Location` ヘッダーを修正します。アプリのコードが `request.url` から作ってボディに書き込む URL は、修正されません。公開するオリジンには、環境変数を使ってください。

## ログに `EACCES: permission denied, mkdir '.../.next/cache'` が出る

アプリのディレクトリの下に、何かが書き込もうとしています。Azure では、そこは読み取り専用です。`withAzure()` は、画像のディスクキャッシュと `isrFlushToDisk` を無効にします。ほかの書き込みはやめるか、`/tmp` に書いてください。

## Function App に、Azure の "Your Azure Function App is up and running" ページが表示される

アプリが起動していません。まず、ホストのログを読んでください。`az monitor app-insights query --app <name> -g <rg> --analytics-query "traces | order by timestamp desc"` を実行すると、`Worker was unable to load entry point` と、見つからないモジュールが表示されます。Application Insights の反映は、1〜10 分遅れます。

## `az functionapp config appsettings set` で追加した設定が消えた

[Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview?wt.mc_id=studentamb_679600) で再デプロイすると、`appSettings` の配列全体が置き換わります。設定は、テンプレートに入れてください。

## `pnpm e2e:standalone` やローカルスタックが `func` を見つけられない

`azure-functions-core-tools` は、postinstall の手順でバイナリをダウンロードします。新しいチェックアウトや worktree では、もう一度 `pnpm install` を実行するか、別のチェックアウトから `bin` ディレクトリをコピーしてください。

## ローカルスタックで、Content-Length のない POST に応答が返らない

プレーンな http での [Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local?wt.mc_id=studentamb_679600) のホストは、チャンク転送のアップロードに一度も応答しませんでした(クライアントが諦めるまで、リクエストが止まります)。`Content-Length` を付けて送ってください。テストクライアントは付けています。https でも Azure でも、起きていません。
