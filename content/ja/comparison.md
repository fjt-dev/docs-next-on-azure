---
title: "Comparison"
source: "docs/comparison.md"
---

Azure で Next.js アプリを動かす方法を、並べて比べます。next-on-azure は、アプリをパッケージ化して 1 つの Azure Function にデプロイします。ほかの選択肢は、Azure と Next.js が文書化している内容です。サービスは変わるので、決める前に出典を確認してください。

| | next-on-azure | Azure Static Web Apps(ハイブリッド) | Node.js サーバーまたは Docker コンテナー | 静的エクスポート |
| --- | --- | --- | --- | --- |
| 何が得られるか | アプリをパッケージ化して、1 つの Azure Function(Flex Consumption)にデプロイします | 静的ホストと、Next.js 用のマネージドバックエンド ¹ | `next start` や standalone のイメージを、選んだサービス(App Service、Container Apps、AKS)で動かします | HTML、CSS、JavaScript のファイルを、任意の静的ホストに置きます |
| Next.js の機能 | App Router と Pages Router、SSR、ストリーミング、ISR、`revalidateTag` と `revalidatePath`、`'use cache'`、ミドルウェア、Server Actions、`after()`、`next/image`。Edge ランタイムは非対応。詳しくは[互換性](./compatibility.md) | App Router、Pages Router、React Server Components、ルートハンドラー、画像最適化、i18n、ミドルウェア ¹ | すべて ² | 限定的 ² |
| 状態 | 実験的(`0.1.0`) | プレビュー ¹ | Next.js が対応 ² | Next.js が対応 ² |
| ゼロまでスケールイン | はい | ドキュメントには記載がありません ¹ | サービスによります。Container Apps はできます ³ | 静的ホストにはサーバーがありません |
| すべてのインスタンスでキャッシュを共有 | はい(Blob Storage と Table Storage) | ドキュメントには記載がありません ¹ | キャッシュハンドラーを足さない限り、インスタンスごとに別のキャッシュです ⁴ | 不要 |
| インフラ | `deploy` が Bicep で作ります。自前のインフラも使えます([自前のインフラ](./infrastructure.md)) | Static Web Apps が作り、GitHub Actions や Azure DevOps からデプロイします | 自分で作ります | 自分で作ります |
| 既知の制約 | Edge ランタイムは非対応。静的ファイルは関数が配信するので、アクセスの多いサイトは前に CDN が必要です。Front Door は未テスト | アプリのサイズは最大 250 MB。ISR では、画像のキャッシュに対応していません。リンクした API と SWA CLI には対応していません ¹ | イメージ、スケーリング、共有キャッシュを、自分で作り、動かします | サーバーが必要なものは動きません |

## ほかのプラットフォーム

- **OpenNext** は、Next.js のビルド出力を、AWS Lambda、Cloudflare、Node.js サーバー用のパッケージに変えます。アプリのデプロイそのものは行いません([OpenNext のドキュメント](https://opennext.js.org/aws))。Azure 向けの対象はありません。
- **Vercel** には、検証済みのアダプターがあります。Next.js のテストスイートを実行し、Next.js のチームが、メジャーリリースの前に調整します ²。AWS Amplify、Cloudflare、Netlify などは、独自の統合を持ち、Next.js は検証していません ²。

## 出典

1. Microsoft Learn: [Deploy Next.js websites on Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/nextjs) と [hybrid Next.js (preview)](https://learn.microsoft.com/azure/static-web-apps/deploy-nextjs-hybrid)(2026-11-20 に確認)。
2. Next.js のドキュメント: [Deploying](https://nextjs.org/docs/app/getting-started/deploying)(2026-11-20 に確認)。
3. Microsoft Learn: [Set scaling rules in Azure Container Apps](https://learn.microsoft.com/azure/container-apps/scale-app)。レプリカの最小数は、既定で 0 です。
4. Next.js のドキュメント: [Self-hosting のキャッシュと ISR](https://nextjs.org/docs/app/guides/self-hosting)。既定では、キャッシュは、各 Next.js サーバーインスタンスのローカルのファイルシステムに保存されます。
