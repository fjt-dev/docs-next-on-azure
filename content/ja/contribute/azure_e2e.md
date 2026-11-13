---
title: "Azure E2E"
source: "docs/contribute/azure_e2e.md"
---

ワークフロー `.github/workflows/azure-e2e.yml` は、`examples/standalone` を実際のサブスクリプションにデプロイし、デプロイした URL に対してエンドツーエンドのテストを実行して、すべてを削除します。[Azure での実行](./azure_runs.md)のルールに従います。

## 仕組み

1. トリガー: 手動(`workflow_dispatch`、入力は `location`)と、リポジトリ変数 `AZURE_E2E_SCHEDULED` が `true` のときだけの週次です。プルリクエストや push では動きません。そのため、フォークのコードが Azure の ID に届くことはありません。
2. GitHub の environment は使いません(無料プランの非公開リポジトリでは、必須のレビュアーが使えないためです)。代わりに、Azure の資格情報は、このリポジトリの `refs/heads/main` からのトークンしか受け付けません。ジョブも、ほかの ref を拒否します。ワークフローを開始できるのは、書き込み権限を持つ人だけです。あとで environment のあるプランに移るなら、資格情報のサブジェクトを `environment:<name>` に切り替えて、レビュアーを追加してください。
3. サインインは OIDC フェデレーションです(`scripts/ci/azure-login.sh`)。GitHub が短命のトークンを発行し、Azure がそれを交換します。シークレットは保存しません。使うのは `curl`、`jq`、`az` だけで、サードパーティのアクションは使いません。`id-token: write` があるのは、このワークフローだけです(単体テストで固定しています)。
4. 新しいリソースグループ `rg-oe2e-<run id>-<attempt>` を、タグ `purpose=next-on-azure-e2e` と `createdAt` を付けて作ります。
5. `next-on-azure deploy` が、アプリをプロビジョニングし(Flex Consumption、Front Door なし)、zip をデプロイして、最初の応答を待ち、プリレンダリングされたページを prime します。
6. `pnpm --filter tests-e2e run e2e:remote` が、`E2E_TARGET=standalone` で、その URL に対してスイートを実行します。
7. ジョブの最後に、グループを削除します(`if: always()`)。2 つ目のジョブ `cleanup` は、1 つ目がタイムアウトまたはキャンセルされても実行されます。この実行のグループと、タグが付いていて 3 時間より古いグループを削除し、残っているものを一覧にします。

厳しい制限: ジョブのタイムアウトは 60 分、cleanup は 15 分、一度に 1 回だけの実行(`concurrency`)です。想定される費用は小さいです(Flex Consumption は使った分だけ課金され、そこにストレージと Application Insights が加わります)。以前の手動の実行には、費用の数字がまだありません。そのため、引用できる**測定した数字はありません**。最初の何回かの実行のあとで、サブスクリプションの費用分析を確認し、その数字をここに書いてください。

## 最初の 1 回だけの設定(あなたが行います。ここにあるものは、まだ何も実行していません)

ワークフローには、**専用のテスト用サブスクリプション**(少なくとも、間違いの被害が小さいサブスクリプション)にある ID が必要です。コマンドは、テナントとサブスクリプションに権限を持つ人が、一度だけ実行します。

```bash
az ad app create --display-name opennextjs-azure-e2e --query appId -o tsv
```

```bash
az ad sp create --id <appId> --query id -o tsv
```

```bash
az ad app federated-credential create --id <appId> --parameters '{
  "name": "github-main-branch",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<owner>@<owner id>/<repo>@<repo id>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

`subject` は、トークンの `sub` クレームと完全に一致しなければなりません。このリポジトリは、プレーンな `repo:<owner>/<repo>:...` ではなく、数値の ID を使う不変の形式(`repo:<owner>@<owner id>/<repo>@<repo id>:ref:...`)で送ります。最初の実行は、資格情報がエラーメッセージに示された形式になるまで、`AADSTS700213` で失敗しました。別のリポジトリでは、そのエラー、またはリポジトリの OIDC 設定から、サブジェクトをコピーしてください。

サービスプリンシパルに、次を付与します(アプリ ID ではなく、`az ad sp create` が出力したオブジェクト ID を使います)。

```bash
az role assignment create --assignee-object-id <spObjectId> --assignee-principal-type ServicePrincipal --role Contributor --scope /subscriptions/<subscriptionId>
```

```bash
az role assignment create --assignee-object-id <spObjectId> --assignee-principal-type ServicePrincipal --role "Role Based Access Control Administrator" --scope /subscriptions/<subscriptionId>
```

両方が必要な理由: テンプレートは、リソースグループのリソースを作り(Contributor)、アプリのマネージド ID とデプロイする人にデータロールを割り当てます(ロールの割り当てには、RBAC Administrator または User Access Administrator が必要です)。どちらもサブスクリプション全体に及ぶので、大事なものがほかに入っていないサブスクリプションを使ってください。

GitHub で(Settings、Secrets and variables、Actions、Variables)、次の**リポジトリ変数**(シークレットではありません)を追加します。`AZURE_CLIENT_ID`(アプリ ID)、`AZURE_TENANT_ID`、`AZURE_SUBSCRIPTION_ID`、`AZURE_PRINCIPAL_ID`(サービスプリンシパルのオブジェクト ID)。週次の実行をしたい場合は、`AZURE_E2E_SCHEDULED=true` も追加します。

最初の実行は手動で、見守りながら行い、その日と翌日に、サブスクリプションの読み取り専用のインベントリを取ってください([Azure での実行](./azure_runs.md))。

## どのデプロイに対しても、ローカルから

```bash
E2E_BASE_URL=https://<app>.azurewebsites.net pnpm --filter tests-e2e run e2e:remote
```
