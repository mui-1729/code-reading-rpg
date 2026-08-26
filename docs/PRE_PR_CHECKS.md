# PR作成前npmチェック

PRを作成する前に、CIの結果ではなく、作業コピー上で実際にnpmコマンドを実行して確認する。

## 必須チェック

通常の変更では、PR作成前に必ず次を実行する。

```bash
npm run lint
npm test
npm run build
```

3つすべてが成功するまでPRを作成しない。

- 1つでも失敗したら同じBranchで修正する
- 修正後は3コマンドをすべてもう一度実行する
- GitHub Actions CI成功を、このPR前npmチェックの代替にしない
- 依存関係やlockfileを変更した場合は、可能な環境で`npm ci`も実行して再現性を確認する
- PR本文に「PR作成前npmチェック成功」を明記する

## CIとの役割分担

GitHub Actions CIはPR作成後・merge前の二重確認として使う。

```text
Issue
↓
Branchで実装
↓
PR前npmチェック
  npm run lint
  npm test
  npm run build
↓
すべて成功
↓
Pull Request作成
↓
自己レビュー
↓
GitHub Actions CI / Cloudflare Preview
↓
squash merge
↓
main CI / Cloudflare Production確認
```

「PRを出してからlint / test / build失敗に気づく」状態を避けることを目的とする。
