---
title: "はじめに"
source: "docs/get_started.md"
---

> **実験的です。** `0.1.0` を npm で公開しています。テストした内容は[互換性](./compatibility.md)にあります。

## 前提条件

- Node.js 22 以降
- Next.js 15.5.29 以降、または 16.4.5 以降のアプリ(App Router または Pages Router)
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli?wt.mc_id=studentamb_679600)(`az login` でサインイン済みで、リソースグループにリソースを作成する権限があること)
- `zip` コマンドが PATH にあること(`package` が使います)

## 1. インストールと Next.js の設定

```bash
npm install next-on-azure   # または pnpm add next-on-azure、yarn add next-on-azure(Yarn 1)
```

```js title="next.config.mjs"
import { withAzure } from "next-on-azure/config";

export default withAzure({
  // your Next.js configuration
});
```

`withAzure()` は、`output: "standalone"`、キャッシュハンドラー、Azure に必要な設定を行います。詳しくは[設定](./configuration.md)を参照してください。

## 2. ビルドとパッケージ化

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"   # シークレットの保管場所に保存してください
next build
next-on-azure package
```

`.next-azure/app.zip` ができます。中身は、standalone のビルド、Linux 用の `sharp` のバイナリ、Functions のエントリです。Server Actions のキーは、すべてのビルドで同じものを使ってください。そうしないと、デプロイの前に開いていたページが、アクションを呼ぶときに失敗します([トラブルシューティング](./troubleshooting.md#デプロイのあとで-server-action-が失敗するfailed-to-find-server-action))。`package --target local` は、ローカルで動かすために、自分のマシンのバイナリのままにします。

## 3. デプロイ

```bash
next-on-azure deploy --resource-group <rg> --name <short-name> --location <region>
```

`--name` は、小文字の英数字で 3〜12 文字です。ハッシュと組み合わせて、世界で一意なリソース名になります。`deploy` は次のことを行います。

1. `--location` を指定すると、リソースグループを作成します。
2. `infra/main.bicep` をデプロイします(ストレージアカウント、Function App 1 つ、Application Insights)。
3. `.next-azure/app.zip` をデプロイします。
4. アプリが応答するまで `/` を要求し(最大 5 分)、かかった時間を表示します。
5. プリレンダリングされたすべてのルートを 1 回要求し、訪問者が来る前に、ページをキャッシュに入れます。

最後に、アプリの URL を表示します。オプションは次のとおりです。

| フラグ | 既定値 | 効果 |
| --- | --- | --- |
| `--always-ready <n>` | `0` | `n` 個のインスタンスを動かし続け、リクエストがコールドスタートを待たないようにします。継続的に課金されます。 |
| `--memory <512\|2048\|4096>` | `2048` | 各インスタンスのメモリ(MB)。測定では、小さくしても費用は下がりませんでした。 |
| `--max-instances <n>` | `20` | インスタンス数の上限。急なアクセスや悪用で、無制限にスケール(と課金)しないようにします。 |
| `--request-telemetry all\|errors` | `all` | `errors` は、失敗だけを Application Insights に送り、データ量を約 85% 減らします。 |
| `--cache-retention-days <n>` | `30` | `n` 日間書き込まれていないキャッシュエントリを削除します。`0` は、すべて残します。 |
| `--wait-until hold\|detach` | `hold` | `hold` は、`after()` などの遅延処理が終わるまで、レスポンスを開いたままにします。 |
| `--full-telemetry` | オフ | Application Insights のサンプリングをオフにします。 |
| `--no-warm-up`、`--no-prime` | オフ | 最初の応答の待機、またはキャッシュのプライミングを省きます。 |
| `--output-file <path>` | なし | URL とリソース名を JSON で書き出します。 |
| `--front-door` | オフ | [Azure Front Door](https://learn.microsoft.com/azure/frontdoor/front-door-overview?wt.mc_id=studentamb_679600) を前に置きます(固定の基本料金がかかります)。テストしていません。無料試用版と学生向けのサブスクリプションでは、Azure に拒否されます。 |

設定はすべて [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/overview?wt.mc_id=studentamb_679600) のテンプレートの中にあります。再デプロイすると、アプリ設定が置き換えられるためです。あとから `az functionapp config appsettings set` で足した設定は、次の `deploy` のあとでなくなります。

## 作成されるもの

| リソース | 目的 |
| --- | --- |
| ストレージアカウント | キャッシュ(`cache` コンテナーと `tagcache` テーブル)と、デプロイのパッケージ |
| Function App 1 つ(Flex Consumption) | すべてのリクエストを処理する 1 つの関数(静的ファイルも含みます) |
| Application Insights と Log Analytics | ログとメトリクス |

アプリは、マネージド ID でストレージアカウントに接続します。共有キーでのアクセスはオフで、公開されるコンテナーはありません。
