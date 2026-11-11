---
title: "設定"
source: "docs/configuration.md"
---

## `withAzure()`

```js
import { withAzure } from "next-on-azure/config";
export default withAzure({ /* your Next.js configuration */ });
```

次の変更を加えた設定を返します。アプリ自身の `images`、`experimental`、`cacheHandlers` の値は残したうえで拡張します。アプリが自分で設定したインクリメンタルの `cacheHandler` も、そのまま残ります。

| 設定 | 値 | 理由 |
| --- | --- | --- |
| `output` | `"standalone"` | パッケージの元になるビルド出力 |
| `cacheHandler` | `next-on-azure/cache-handler` | Blob Storage と Table Storage 上の、インクリメンタルキャッシュ、`fetch` キャッシュ、`revalidateTag` |
| `cacheHandlers.default`(Next.js 16 より前は `experimental.cacheHandlers`) | `next-on-azure/cache-handlers` | Blob Storage と Table Storage 上の `'use cache'`。設定する場所は、インストールされている Next.js のバージョンから決まります |
| `cacheMaxMemorySize` | `0` | インスタンスごとのメモリキャッシュを使いません。どのインスタンスも同じ状態を見ます |
| `compress` | `false` | Functions のフロントエンドが圧縮します。圧縮済みの本文だと、転送が壊れます |
| `images.maximumDiskCacheSize`、`experimental.isrFlushToDisk` | `0`、`false` | Azure ではアプリのディレクトリが読み取り専用です。そこへ書き込むと `EACCES` で失敗します |

## 環境変数

Bicep テンプレートが、Function App に次の変数を設定します。

| 変数 | 既定値 | 使うもの |
| --- | --- | --- |
| `AZURE_STORAGE_ACCOUNT_NAME` | なし(接続文字列を設定しない場合は必須) | キャッシュハンドラー |
| `AZURE_STORAGE_CONNECTION_STRING` | なし | キャッシュハンドラー。Azurite を使うローカル開発専用 |
| `CACHE_CONTAINER_NAME` | `cache` | インクリメンタルキャッシュと `'use cache'` のエントリ |
| `CACHE_TABLE_NAME` | `tagcache` | タグの状態 |
| `NEXT_BUILD_ID` | `.next/BUILD_ID` のビルド ID | すべてのキーの接頭辞。古いビルドのエントリは、新しいビルドから読まれません |
| `WAIT_UNTIL_MODE` | `hold` | エントリ: `hold` は、後回しの処理が終わるまでレスポンスを開いたままにします。`detach` はすぐに終わらせます |
| `WAIT_UNTIL_MAX_SECONDS` | `220` | エントリ: レスポンスを開いたままにする最長の時間 |
| `FRONT_DOOR_ID` | なし(確認しない) | エントリ: `X-Azure-FDID` が違うと 403 を返します |
| `NEXT_INTERNAL_PORT` | `3000` | エントリ: Next.js サーバーのループバックのポート |
| `FUNCTIONS_REQUEST_BODY_SIZE_LIMIT` | `104857600` | Functions ホスト(リクエスト本文、Server Actions) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | なし | アプリではなく、**ビルド**時に設定します。[はじめに](./get_started.md)を参照してください |

## 認証

`AZURE_STORAGE_CONNECTION_STRING` が設定されていれば(Azurite)、キャッシュハンドラーはそれを使います。設定されていなければ、`AZURE_STORAGE_ACCOUNT_NAME` のアカウントに、HTTPS と `DefaultAzureCredential` でアクセスします。Azure 上では、これがマネージド ID に解決されます。

## CLI

| コマンド | 効果 |
| --- | --- |
| `next-on-azure package [--target azure\|local] [--allow-unsupported-next]` | `.next/standalone` を `.next-azure/app.zip` にします。対応範囲外の Next.js のバージョンは拒否し、Server Actions のキーがない場合や違う場合は警告します。 |
| `next-on-azure deploy -g <rg> -n <name> [-l <location>] [options]` | Bicep でプロビジョニングし、zip をデプロイして、アプリを待ち、キャッシュをプライミングします。フラグは[はじめに](./get_started.md#3-デプロイ)を参照してください。 |
| `next-on-azure prime <url>` | プリレンダリングされた全ルートを 1 回ずつ要求します。 |
