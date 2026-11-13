---
title: "Comparison"
source: "docs/comparison.md"
---

## OpenNext(AWS、Cloudflare)

このプロジェクトの最初の設計は、OpenNext のアダプターでした。現在の設計は、`@opennextjs/aws` を使いません([ADR-0016](./plan/decisions.md))。

| | OpenNext(`@opennextjs/aws`) | next-on-azure |
| --- | --- | --- |
| Next.js の動かし方 | ビルド出力を再バンドルします。ルーティング、ミドルウェア、キャッシュ、画像最適化は OpenNext 自身のサーバーコードが行い、プラットフォームへは *overrides* を通して接続します | Next.js 自身の standalone サーバーを、そのまま Function の中で動かします。Azure 固有なのは、ストレージとエントリーだけです |
| 対応する Next.js のバージョン | OpenNext が宣言するもの | このパッケージの `next` の peer 範囲(引き継いだもので、独自に導いたものではありません) |
| ストレージのインターフェース | OpenNext の overrides(インクリメンタルキャッシュ、タグキャッシュ、キュー など) | Next.js の `cacheHandler` と `cacheHandlers` |
| ISR | キューのコンシューマーで再生成します | 同じプロセスの中で再生成します。キューはありません |
| 静的ファイル | マニフェストを持つアセットリゾルバーが、Blob から配信します | Next.js サーバーが、パッケージの中から配信します |
| 画像 | OpenNext の画像アダプター(元画像がないとき: 500 を 404 に変換) | Next.js の最適化機能(元画像がないとき: Next.js 15 では 400) |
| 関数の分割、外部ミドルウェア、Edge ランタイム | AWS と Cloudflare で対応 | 非対応 |
| パッケージのサイズ(同じサンプルアプリ) | zip 31.2 MB、バンドル 3 つ | zip 17.7 MB、バンドル 1 つ |
| 約 11 分アイドルしたあとの最初のリクエスト | 4.1〜4.5 秒(以前の測定、別のパッケージ) | 2.4 秒(サンプル 1 回) |

Next.js 自身のサーバーに由来する違いは、次のとおりです。`public/` のファイルの `Cache-Control`、JS の Content-Type が `application/javascript` であること、静的ファイルの弱い `ETag`、元画像がないときの 400 です。共通の HTTP テストスイートは、`E2E_TARGET=standalone` のとき、これらを許容します。
