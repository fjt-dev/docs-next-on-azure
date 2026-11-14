---
title: "Support"
source: "docs/support.md"
---

`next-on-azure` は実験的なプロジェクトです。このページでは、最初のリリースで何を約束し、何を約束しないかを示します。ここに書いたことはすべて、[Compatibility](./compatibility.md) と照らし合わせています。そこでは、各項目に **Verified (Azure)**、**Verified (local)**、**Unverified** のいずれかを付けています。

## バージョン

- 最初のリリースは `0.1.0` で、既定の npm タグで公開します。バージョンに接尾辞は付けません。実験的であることは、このページ、README、パッケージの説明で伝えます。
- `0.x` では、マイナーバージョン(`0.2.0`)で動作が変わることがあり、パッチバージョン(`0.1.1`)は修正だけです。互換性を壊す変更は、リリースノートに書きます。
- サポートするのは、最新のリリースだけです。セキュリティの問題は[セキュリティポリシー](../SECURITY.md)に従って扱い、そのほかの問題は、メンテナー 1 人がベストエフォートで対応します。応答時間やサービスレベルの約束はありません。

## 実際に動かしたもの

| 領域 | `0.1.0` で約束すること |
| --- | --- |
| Next.js | 15.5.29 以降の 15.x と、16.4.5 以降。Azure で動かしたのは 15.5.29 と 16.4.5 です。範囲のそれ以外は、動くと見込んでいますが、動かしていません |
| ルーターと機能 | [Compatibility](./compatibility.md) で **Verified (Azure)** とした行です。App Router と Pages Router、SSR、ストリーミング、ISR、`revalidateTag` と `revalidatePath`、`'use cache'`、ミドルウェアと `proxy`、Server Actions、`after()`、`next/image`、Cookie、`dynamicParams = false` の App Router のルート(2026-11-11 からビルド出力から読みます。2026-11-14 に **Verified (Azure)**) |
| プラットフォーム | Azure Functions Flex Consumption、Node.js 22、japaneast |
| ビルドするマシン | macOS と Linux。npm、pnpm、Yarn 1 に対応します(`node_modules` ディレクトリが必要です。Yarn Plug'n'Play は、メッセージを出して拒否します) |
| デプロイ | このリポジトリのテンプレートを使った `next-on-azure deploy`、または[自前のインフラ](./infrastructure.md)で行う方法 |

## 約束しないこと

- Edge ランタイムと外部ミドルウェア(非対応)。
- Azure Front Door、Node.js 24、ほかのリージョン、Windows のビルドマシン、Yarn 2 以降、Bun: **Unverified** です。
- `--wait-until detach` を使う `after()`、`cacheLife` の期限切れ、`'use cache'` の `remote` と `private` の種類: **Unverified** です。
- プライベートネットワーク、Web アプリケーションファイアウォール、お客様管理のキー、そのほかランディングゾーンの設定: テンプレートには入っていません([ADR-0019](./plan/decisions.md#adr-0019-enterprise-use-at-the-level-of-opennext))。
- [Cost](./cost.md) ページの数字は、1 つのサイトの測定から出した見積もりです。コールドスタートと負荷の数字は、サンプル 1 回のものです。保証ではありません。
