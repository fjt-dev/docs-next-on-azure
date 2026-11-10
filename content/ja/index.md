---
title: "概要"
description: "Next.js アプリを、Blob Storage と Table Storage を使う 1 つの Azure Function(Flex Consumption)で動かします。"
---

> **実験的・リリース前・npm には未公開です。**

## next-on-azure

`next-on-azure` は、Next.js アプリを **1 つの Azure Function(Flex Consumption)** で動かします。Next.js の standalone サーバーを Functions のワーカーの中で動かし、Azure 固有にする必要がある部分だけをこのパッケージが置き換えます。具体的には、インクリメンタルキャッシュと `'use cache'`(Blob Storage)、タグの状態(Table Storage)、リクエストをサーバーに転送する Functions のエントリ、そしてパッケージ化とデプロイです。

そのために、Next.js が公式に用意しているオプション(`output: "standalone"`、`cacheHandler`、`cacheHandlers`)を使います。`@opennextjs/aws` には依存しません。

Azure での動作に関する記述には、すべて **Verified (Azure)**、**Verified (local)**、**Unverified** のいずれかを付けています([互換性](/compatibility)を参照)。実行していないものを「動く」とは書きません。

## 機能

「Azure」は、実際のデプロイに対して HTTP テストが通ったことを指します(47 件成功、2026-11-08)。「local」は、開発マシンと CI 上の Azurite と Functions ホストでの確認を指します。

- App Router と Pages Router、API ルート、動的ルート(Azure)
- レスポンスのストリーミングを伴うサーバーサイドレンダリング(Azure)
- 静的生成と、stale-while-revalidate による ISR(Azure)
- オンデマンドの再検証: `revalidateTag`、`revalidatePath`(Azure)
- タグ付きの `'use cache'`(Azure)
- ミドルウェア、Server Actions、`after()`(Azure)
- `sharp` による画像最適化(Azure)
- Next.js 15.5.29(Azure)と 16.4.5(Azure、local、CI)

未確認: Front Door、常時稼働インスタンス、このパッケージでの Partial Prerendering。未対応: Edge ランタイム。

## クイックスタート

```js title="next.config.mjs"
import { withAzure } from "next-on-azure/config";

export default withAzure({
  // your Next.js configuration
});
```

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(openssl rand -base64 32)"
next build
next-on-azure package
next-on-azure deploy --resource-group <rg> --name <short-name> --location <region>
```

パッケージは公開していないので、これはリポジトリのチェックアウトからのみ動かせます。詳しい手順は[はじめに](/get_started)にあります。

## 次に読むもの

- [はじめに](/get_started): インストール、設定、ビルド、パッケージ化、デプロイ
- [互換性](/compatibility): Next.js のバージョンと機能(確認状況つき)
- [設定](/configuration): `withAzure()`、環境変数、CLI
- [仕組み](/how_it_works): リクエストの経路、キャッシュ、`after()`、プライミング、パッケージ化
- [比較](/comparison): OpenNext(AWS、Cloudflare)
- [FAQ](/faq) と[トラブルシューティング](/troubleshooting)
- [コントリビューション](/contribute): ローカル実行、テスト、CI、Azure での実行
