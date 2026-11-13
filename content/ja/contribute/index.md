---
title: "Contributing"
source: "docs/contribute/README.md"
---

リポジトリが公開されたら、プルリクエストを歓迎します。それまでは、メンテナーが[ロードマップ](../plan/roadmap.md)に沿って作業します。

- [Run locally](./local_run.md): パッケージをビルドして、ローカルのスタック(Azurite と Azure Functions ホスト)を起動します
- [Testing](./testing.md): 単体テスト、統合テスト、E2E テストと、必須の動作ケース
- [CI](./ci.md): GitHub Actions のワークフローが実行する内容
- [Release](./release.md): バージョンを npm に公開する方法(タグ、承認、trusted publishing)
- [Azure E2E](./azure_e2e.md) と [Azure での実行](./azure_runs.md): 実際のリソースに対する、オプトインの実行と、その費用のルール
- [Supply chain](./supply_chain.md): 監査、ライセンスの確認、シークレットのスキャン

## 基本のルール

- 動作を変える変更には、`packages/tests-unit` のテストが必要です。HTTP から見える変更なら、E2E のケースも必要です。
- リソースグループ、時間枠、費用の上限に合意しないまま、Azure のリソースを作らないでください([Azure での実行](./azure_runs.md))。
- next-on-azure のランタイムの `.cjs` ファイルは、`require("node:...")` をしてはいけません(Turbopack のため。[Troubleshooting](../troubleshooting.md) を参照してください)。ADR-0007 と ADR-0008 は、以前のパッケージにだけ適用されます。
- ドキュメントは英語です。
