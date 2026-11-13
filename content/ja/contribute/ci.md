---
title: "CI"
source: "docs/contribute/ci.md"
---

ワークフロー `check`: すべてのプルリクエストと、`main` へのすべての push で動きます。同じ ref の、古くなった実行はキャンセルされます。コミット 04fcd42 では、GitHub 上ですべてのジョブが合格しました。

| ジョブ | 内容 |
| --- | --- |
| `check`(Node 22 と 24) | `pnpm install --frozen-lockfile`、lint、ビルド、型チェック、単体テスト、Azurite の統合テスト、テンプレートの `az bicep build` |
| `supply-chain` | 本番依存の監査、シークレットのスキャン、ライセンスの許可リスト([Supply chain](./supply_chain.md))、Markdown ファイル間のリンク(`node scripts/check-links.mjs`: ファイルがあること、`#anchor` が見出しであること) |
| `e2e`(Next.js 15 と 16.4.5、Node 22) | `pnpm e2e:standalone`。失敗したときは、ホストのログ(`LOCAL_STACK_LOG_DIR`)を 7 日間アップロードします |
| `install`(npm と Yarn 1、Node 22 と 24) | `node scripts/install-test.mjs`: パッケージをパックし、tarball をサンプルのまっさらなコピーにインストールして、ビルドし、パッケージ化し、Functions ホストで HTTP スイートを実行します。失敗したときは、ホストのログをアップロードします。`pnpm` のワークスペースのリンクは、レイアウトの問題を隠しますが、このジョブは隠しません |

## ワークフローのセキュリティルール

- ワークフロー全体で `permissions: contents: read` です。これ以上を必要とするジョブはありません。このワークフローに、`id-token` や書き込み権限を追加しないでください。`id-token: write` があるのは 2 か所で、どちらも単体テストで固定しています。Azure E2E のワークフロー([CI での Azure E2E](./azure_e2e.md))と、リリースのワークフローの publish ジョブ([Release](./release.md))です。
- ここでは、`pull_request_target` と `workflow_run` を決して使いません。これらは、フォークのコードに対して、特権のあるトークンで動きます。
- `actions/checkout` は、`persist-credentials: false` で動かします。
- **すべてのアクションを、完全なコミット SHA に固定**し、リリースタグを末尾のコメントに書きます。現在は、`actions/checkout` v7.0.1、`actions/setup-node` v7.1.0、`actions/upload-artifact` v7.0.2 です。
- 使うのは、ファーストパーティの `actions/*` のアクションだけです。pnpm は、サードパーティのアクションではなく、`package.json` の `packageManager` のバージョンで、npm からインストールします。
- ワークフローのすべての `pnpm install` は、`scripts/ci/pnpm-install.sh` を通します。これは最大 3 回試します。postinstall での Functions Core Tools のバイナリのダウンロードが、GitHub のランナーで、ときどき失敗したためです(ネットワークエラー)。
- `.github/dependabot.yml` は、アクションと npm の依存関係について、毎週、更新の PR を開きます。

### 固定したアクションを更新する

1. タグを、コミットに解決します: `git ls-remote --tags --refs https://github.com/actions/<name> | grep <tag>`。
2. そのコミットが、できたばかりでないこと(公開から数週間たったリリースを選びます)と、使う入力が `action.yml` にまだあることを確認します。
3. SHA とバージョンのコメントを、一緒に置き換えます。Dependabot の PR も、同じように確認してください。SHA は、コメントに書かれたタグのものでなければなりません。
