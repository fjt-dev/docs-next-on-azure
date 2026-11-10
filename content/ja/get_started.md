---
title: "はじめに"
source: "docs/get_started.md"
---

> **実験的・リリース前です。** パッケージはまだ npm に公開しておらず、仮の名前 `next-on-azure` を使っています。そのため、インストールの手順は、このリポジトリのチェックアウトからのみ動かせます(`examples/standalone` が動作するアプリです)。確認済みの内容は[互換性](./compatibility.md)にあります。

## 前提条件

- Node.js 22 以降
- Next.js 15.5.29 以降、または 16.4.5 以降のアプリ(App Router または Pages Router)
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)(`az login` でサインイン済みで、リソースグループにリソースを作成する権限があること)
- `zip` コマンドが PATH にあること(`package` が使います)

## 1. Next.js を設定する

```js
// next.config.mjs
import { withAzure } from "next-on-azure/config";

export default withAzure({
  // your Next.js configuration
});
```

`withAzure()` は、`output: "standalone"`、キャッシュハンドラー、Azure に必要な設定を行います。詳しくは[設定](./configuration.md)を参照してください。

## 2. ビルドとパッケージ化

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # keep it in your secret store
next build
next-on-azure package
```

これで `.next-azure/app.zip` が作られます。中身は、standalone ビルド、シンボリックリンクをなくして普通のツリーにした `node_modules`(Azure はシンボリックリンクを落とすため)、Linux x64 用の `sharp` のバイナリ、そして Functions のエントリです。Server Actions のキーは、ビルドのたびに同じものを使ってください。違うキーを使うと、デプロイ前に開かれていたページが、アクションを呼ぶときに失敗します([トラブルシューティング](./troubleshooting.md#a-server-action-fails-after-a-deployment-failed-to-find-server-action))。`package --target local` は、ローカル実行向けに、手元のマシンのバイナリを残します。

## 3. デプロイ

```bash
next-on-azure deploy --resource-group <rg> --name <short-name> --location <region>
```

`--name` は、小文字の英字と数字で 3〜12 文字です。ハッシュと組み合わせて、全世界で一意なリソース名になります。`deploy` は次の順に行います。

1. `--location` を指定した場合は、リソースグループを作成します。
2. `infra/main.bicep` をデプロイします(`cache` コンテナーと `tagcache` テーブルを持つストレージアカウント、Function App 1 つ、Application Insights、`--front-door` を付けたときだけ Front Door)。
3. `.next-azure/app.zip` をデプロイします。
4. アプリが応答するまで `/` を要求し(最大 5 分)、かかった時間を表示します。
5. プリレンダリングされた全ルートを 1 回ずつ要求します(`prime`)。訪問者が来る前に、ページがキャッシュに入ります。

| フラグ | 既定値 | 効果 |
| --- | --- | --- |
| `--front-door` | オフ | Azure Front Door を前に置きます(固定の基本料金がかかります)。アプリは、Front Door を通っていないリクエストを拒否します(`X-Azure-FDID`)。**これまでデプロイしたことはありません。** |
| `--wait-until hold\|detach` | `hold` | レスポンスが完了したあと、`after()` のような後回しの処理をどうするかです。`hold` は、処理が終わるまでレスポンスを開いたままにします。`detach` はすぐに応答しますが、短い処理にしか安全ではありません(アイドルのインスタンスは、約 1.5〜3.5 分で削除されます)。 |
| `--always-ready <n>` | `0` | HTTP 関数のインスタンスを `n` 個動かし続けて、リクエストがコールドスタートを待たないようにします。常に課金されます。**このパッケージでは測定していません。** |
| `--full-telemetry` | オフ | Application Insights のサンプリングをオフにします。トラフィックが多いと費用が増えます。 |
| `--no-warm-up`、`--no-prime` | オフ | 最初の応答を待つ処理、またはプライミングを省きます。 |
| `--output-file <path>` | なし | URL とリソース名を JSON で書き出します。 |

設定はすべて Bicep テンプレートに入れます。再デプロイでアプリ設定が置き換わるため、あとから `az functionapp config appsettings set` で追加した設定は、次の `deploy` で消えます。

## 作られるもの

| リソース | 用途 |
| --- | --- |
| ストレージアカウント | `cache` コンテナー(ページ、`fetch` の結果、`'use cache'` のエントリ)、`tagcache` テーブル(タグの再検証の状態)、`deploy-app` コンテナー(プラットフォームが使います) |
| Function App 1 つ(Flex Consumption) | `{*path}` に対する `server` 関数 1 つ。静的ファイルを含む、すべてのリクエストを受けます |
| Application Insights + Log Analytics | ログとメトリクス |
| Front Door Standard(`--front-door` のときだけ) | `/_next/static/*` のエッジキャッシュ |

データへのアクセスはすべて、Function App のマネージド ID で行います。ストレージアカウントでは共有キーでのアクセスを無効にしており、公開されているコンテナーはありません。

## ローカルで動かす

```bash
pnpm install && pnpm build
pnpm --filter example-standalone run standalone    # next build + package --target local
node scripts/standalone-local.mjs                  # Azurite + the Functions host on http://localhost:7071
```

詳しくは[ローカル開発](./contribute/local_run.md)を参照してください。
