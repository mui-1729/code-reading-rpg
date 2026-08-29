# CODE//READ RPG 開発フロー

この文書を、Issue作成からCloudflare Production確認までの**唯一の開発フローsource of truth**とする。

## 1. Standard flow

```text
Issue
↓
1 Issue = 1 Branch
↓
実装
↓
PR前quality checks
↓
Pull Request
↓
self-review
↓
GitHub Actions + Cloudflare Preview
↓
必要なら同Branchで修正して再確認
↓
squash merge to main
↓
main CI + Cloudflare Production
↓
Issue close / smoke test
```

`main`へmergeしただけでは完了としない。

## 2. Issue / Branch

### Issue

原則、実装前にIssueを作る。

タイトル:

```text
feat: ...
fix: ...
refactor: ...
docs: ...
test: ...
```

本文には最低限、

- 背景 / 問題
- 対応方針
- Acceptance Criteria
- 対象外

を書く。

### Branch

```text
<type>/<issue-number>-<short-description>
```

例:

```text
feat/173-typescript-story
refactor/174-battle-runtime
fix/175-world-sprite
```

`main`へ直接commitしない。

## 3. Commit

Conventional Commitsを使う。

```text
feat: add ...
fix(battle): preserve ...
refactor(world): split ...
test: cover ...
docs: update ...
```

`update` / `fix` / `wip`だけの曖昧なcommitを避ける。

Cloudflare buildを無駄に増やすためのno-op commitは作らない。

## 4. PR前quality checks

**PRを作る前に、作業branchの実コードで確認する。GitHub Actionsを最初のlint/test代わりにしない。**

基本:

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

少なくともcode / config / dependencyを変更するPRでは5項目をすべて通す。

純docsだけの変更でE2Eを省略する場合は、PR本文に理由を明記する。

### 失敗した場合

- 同じBranchで修正
- 修正後は関連checkだけで終わらず、原則一式を再実行
- failing testを削除 / skipして突破しない

### local executionが使えない作業環境

GitHub上の自動作業等でlocal command executionが不可能な場合は、PR前にfeature branch push用CIを**一時的にそのBranchだけ有効化**して同じcommandsを実行してよい。

条件:

- 検証用workflow差分はPR作成前に必ず戻す
- 最終PR差分に一時triggerを残さない
- 成功runをPR本文へ記録する
- PR作成後の通常CIも別に通す

## 5. Pull Request

PRは日本語を基本とし、Issueと同じtypeを使う。

本文例:

```md
Closes #123

## 概要

- ...

## 変更

- ...

## 削除 / compatibility

- ...

## Validation

- npm ci ✅
- npm run lint ✅
- npm test ✅
- npm run build ✅
- npm run test:e2e ✅

## Preview

- Cloudflare Preview: ...
```

PR作成後にdiff全体を自己レビューする。

## 6. Self-review

最低限確認する。

### General

- Issue範囲だけの変更か
- accidental / debug / dead codeがないか
- 型を不要に緩めていないか
- docsがcurrent codeと一致するか
- migration互換を壊していないか
- mobile / keyboard / focusを悪化させていないか

### CODE//READ RPG specific

- displayed codeとinternal ruleの意味が一致するか
- target preview OFFを壊していないか
- Skill名 /固定手順の暗記だけで攻略しやすくしていないか
- Equipment / Party / Levelが読解を代替していないか
- seed再現性 / solvabilityを壊していないか
- World UIへad-hoc座標分岐を戻していないか

自己レビュー結果はPRへCOMMENTで残してよい。

## 7. GitHub Actions

current CI:

### build

```bash
npm ci
npm run lint
npm test
npm run build
```

### e2e

```bash
npm ci
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

CI failure中はmergeしない。

workflowはtop-level `permissions: contents: read`をdefaultとする。追加権限が必要なjobだけjob-levelで最小権限を明示する。

third-party / official Actionもrelease tagだけで参照せず、review済みreleaseのfull commit SHAへpinし、末尾commentへ対応versionを書く。更新時はrelease notesとSHAを確認してDependabotまたは専用PRで更新する。shell commandから使うCLIはpackage lockへpinし、bare `npx`による未固定downloadをdeploy pathへ置かない。

## 8. Cloudflare Preview

PR / non-production branchのPreviewで確認する。

最低限:

- build success
- Preview URL発行
- 対象routeが開く
- UI変更ならDesktop / Mobile
- route変更ならdirect URL + reload
- seed変更なら同seed再現
- story / interaction変更なら主要flow

GitHub Actions successだけでPreview確認済みとは扱わない。

Vercelはcurrent deployment gateではない。

## 9. Merge / Production

### Merge

原則squash merge。

条件:

- Issue scope完了
- pre-PR checks success
- GitHub Actions success
- Cloudflare Preview success
- self-review blockerなし

### Production

Production:

```text
Cloudflare Worker: code-reading-rpg
Production branch: main
```

merge後:

1. main GitHub Actions success
2. Cloudflare Production build success
3. 必要ならProduction smoke test
4. Issue close確認

Production failure中は完了扱いにしない。

## 10. Refactor rule

- feature変更と大規模refactorをできるだけ混ぜない
- 新機能に不可欠な小refactorは同Issueでよい
- dead code削除では、save migration / regression fixtureとの区別を確認する
- 将来使うかもしれない抽象化を先に増やさない
- dependency追加前に標準API / current dependencyで代替できないか確認する

判断基準は変更file数ではなく、**目的が1つか**。

## Definition of Done

- [ ] Issue
- [ ] Issue branch
- [ ] Conventional Commits
- [ ] pre-PR quality checks
- [ ] PR
- [ ] self-review
- [ ] GitHub Actions success
- [ ] Cloudflare Preview success
- [ ] squash merge
- [ ] main CI success
- [ ] Cloudflare Production success
- [ ] Issue close /必要なsmoke test
