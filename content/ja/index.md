---
title: "概要"
description: "Next.js アプリを、Blob Storage と Table Storage を使う 1 つの Azure Function(Flex Consumption)で動かします。"
---

> **実験的です。** `0.1.0` を [npm](https://www.npmjs.com/package/next-on-azure) で公開しています。

## next-on-azure

`next-on-azure` は、Next.js アプリを **1 つの Azure Function**([Flex Consumption](https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan?wt.mc_id=studentamb_679600))で動かします。Next.js のサーバーを関数の中で動かし、キャッシュは Blob Storage と Table Storage に置くので、すべてのインスタンスが同じ状態を共有します。誰も訪れないときは、ゼロまでスケールインします。

## 機能

- App Router と Pages Router、API ルート、動的ルート
- ストリーミングを伴うサーバーサイドレンダリング
- 静的生成と ISR、`revalidateTag` と `revalidatePath`
- `'use cache'`
- ミドルウェア(Next.js 16 の `proxy` を含む)、Server Actions、`after()`
- `sharp` による画像最適化
- Next.js 15.5.29 以降の 15.x、および 16.4.5 以降

テストした内容としていない内容は、[互換性](/compatibility)にあります。Edge ランタイムには対応していません。

## クイックスタート

```bash
npm install next-on-azure
```

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

詳しい手順は[はじめに](/get_started)にあります。

## 次に読むもの

- [はじめに](/get_started): インストール、設定、ビルド、パッケージ化、デプロイ
- [互換性](/compatibility): Next.js のバージョンと機能
- [設定](/configuration): `withAzure()`、環境変数、CLI
- [費用](/cost): 何に課金されるか、どのくらいかかるか
- [自前のインフラ](/infrastructure): `deploy` を使わずに使う
- [仕組み](/how_it_works)
- [FAQ](/faq) と[トラブルシューティング](/troubleshooting)
