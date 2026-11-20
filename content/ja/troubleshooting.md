---
title: "Troubleshooting"
source: "docs/troubleshooting.md"
---

## デプロイのあとで Server Action が失敗する(Failed to find Server Action)

Server Actions は、クロージャが捕捉する変数を暗号化します。既定では、Next.js はビルドごとに新しいキーを作るので、デプロイの前に開いていたページは、アクションを呼ぶときに失敗し、別々にビルドしたインスタンスは、キーが一致しません。

すべてのビルドで同じキーを、ビルド時に設定してください。

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # シークレットの保管場所に保存します。リポジトリには入れません
next build
next-on-azure package
```

キーは、16、24、または 32 バイトの base64 です。アプリに Server Actions があって、この変数が設定されていないとき、またはビルドに埋め込まれたキーと値が違うとき、`package` が警告します。

## 画像が、リサイズされずに、エラーもなく返る

パッケージの中の `sharp` が、ないか、不完全です。`package` は、`sharp` のパッケージ全体と、Linux x64 のバイナリをコピーします。zip の `standalone/node_modules/@img` に、`@img/sharp-linux-x64` と `@img/sharp-libvips-linux-x64` があるか、確認してください。`sharp` がないと、Next.js は、元の画像を返します。

## リダイレクトが `http://localhost:3000/...` を指す

パッケージは、リダイレクトの `Location` ヘッダーを修正します。コードが `request.url` から作ってページに書き込む URL は、修正されません。公開するオリジンには、環境変数を使ってください。

## ログに `EACCES: permission denied, mkdir '.../.next/cache'` が出る

読み取り専用のアプリのディレクトリの下に、何かが書き込んでいます。`withAzure()` は、画像のディスクキャッシュと `isrFlushToDisk` をオフにします。ほかの書き込みを取り除くか、`/tmp` に書いてください。

## Function App に「Your Azure Function App is up and running」と表示される

アプリが起動していません。まずログを読んでください。`az monitor app-insights query --app <name> -g <rg> --analytics-query "traces | order by timestamp desc"` で、`Worker was unable to load entry point` と、足りないモジュールが見つかります。Application Insights は、1〜10 分遅れます。

## `az functionapp config appsettings set` で足した設定が、消えた

[Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview?wt.mc_id=studentamb_679600) で再デプロイすると、`appSettings` の配列全体が置き換えられます。設定は、テンプレートに入れてください。
