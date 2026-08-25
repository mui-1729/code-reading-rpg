# CODE//READ RPG 開発フロー

## 1. 目的

この文書は、Issue作成からCloudflare Production反映確認までの標準フローを定義する。

```text
Issue
↓
1 Issue = 1 Branch
↓
実装
↓
Conventional Commit
↓
Pull Request
↓
自己レビュー
↓
GitHub Actions CI / Cloudflare Preview
↓
必要なら同Branchで修正
↓
squash merge to main
↓
Issue close確認
↓
Cloudflare Production確認
↓
完了
```

`main`へmergeしただけでは完了としない。Production反映確認までを1つの作業とする。

---

## 2. 基本原則

### 2.1 1 Issue = 1 Branch = 1 PR

1つの目的に対して、原則として1本のBranchと1本のPRを作る。

目的:

- 変更理由を追いやすくする
- レビュー範囲を限定する
- revertしやすくする
- Issue / commit / PR / Preview / Productionの対応を明確にする

独立した複数機能を1 Issueへまとめない。ただし、そのIssueを成立させるために不可分な小修正は同じIssue内で扱ってよい。

### 2.2 `main`へ直接commitしない

通常の機能追加、修正、docs更新はIssue / Branch / PR経由とする。

緊急時でも可能な限りhotfix Issue / Branch / PRを作る。

### 2.3 deploy回数を浪費しない

Cloudflareにもbuild資源の上限があるため、意味のない小pushを連続させない。

- 関連する変更はローカルまたはGit object上でまとめてからpushする
- CIを再実行したいだけのno-op commitを作らない
- PR内で論理的に必要な複数commitは問題ない
- `main`へは原則squash merge

---

## 3. Issue規約

### 3.1 実装前にIssueを作る

目的・範囲・完了条件を決めてからBranchを作る。

### 3.2 Issueは日本語

タイトルはConventional系typeを付ける。

```text
feat: JavaScriptのStage Selectを追加する
fix: seed再現時に敵順が変わる問題を修正する
docs: Cloudflare運用を更新する
```

### 3.3 推奨本文

```md
## 概要
何をするか

## 背景 / 問題
なぜ必要か

## 対応方針
どう実装するか

## Acceptance Criteria
- [ ] ユーザーから見た完了条件
- [ ] GitHub Actions CI成功
- [ ] Cloudflare Preview成功
- [ ] 自己レビュー完了
- [ ] mainへsquash merge
- [ ] Cloudflare Production成功

## 対象外
今回やらないこと
```

Acceptance Criteriaは「コンポーネントを作る」ではなく、検証可能な結果を書く。

---

## 4. Branch規約

形式:

```text
<type>/<issue番号>-<short-description>
```

例:

```text
feat/43-player-progression
feat/44-javascript-stage-select
docs/60-cloudflare-rpg-direction
fix/18-preserve-unlocked-skills
```

ルール:

- 英語
- 小文字
- kebab-case
- Issue番号を含める
- 長すぎる説明を入れない

---

## 5. Commit規約

Conventional Commitsを使う。

```text
<type>(optional-scope): <summary>
```

例:

```text
feat: プレイヤー進行モデルを追加
fix(battle): seed再現時の対象ずれを修正
test: solvabilityの回帰テストを追加
docs: Cloudflare運用を更新
```

避ける例:

```text
update
fix
wip
again
```

1 commitは1つの論理的変更を目安にする。ただしCloudflare Previewを無駄に増やさないよう、repoへpushする前に関連変更をまとめることを優先する。

---

## 6. Pull Request規約

### 6.1 PRは日本語

タイトルはIssueと同じConventional系typeを使う。

### 6.2 推奨本文

```md
## 概要
- 変更1
- 変更2

## 変更内容
実装上の要点

## 確認項目
- [ ] Acceptance Criteriaを満たす
- [ ] 既存挙動を壊していない
- [ ] GitHub Actions CI成功
- [ ] Cloudflare Preview成功
- [ ] 自己レビュー完了

## 影響範囲
画面 / ロジック / データ

Closes #123
```

### 6.3 Issueを自動closeする

原則PR本文へ次を含める。

```text
Closes #<issue番号>
```

merge後にIssueが実際にcloseされたことも確認する。

---

## 7. 自己レビュー

PRを作ったら、merge前に実差分を読む。

必須チェック:

- 想定したファイルだけが変わっているか
- Issueの範囲を超えていないか
- dead code / debug code / console出力がないか
- 型を不必要に緩めていないか
- セキュリティ上不要な外部入力実行がないか
- UI変更でモバイル / keyboard / focusを悪化させていないか
- 必要なテストを追加したか
- README / docs更新が必要な仕様変更ではないか

ゲーム固有チェック:

- 表示コードと内部`TargetRule`が同じ意味か
- 対象プレビューOFFを壊していないか
- コードを読まず暗記だけで攻略しやすくしていないか
- JavaScript上の意味と戦略上の最適解を混同していないか
- seed再現性を壊していないか
- 生成盤面の学習条件を壊していないか
- Player成長を追加しても、敵をcurrent Levelに合わせて自動弱体化していないか
- Level / 装備の数値だけで読解をスキップできる設計になっていないか

問題なしでもレビューコメントを残す。

```text
自己レビュー完了。変更範囲、既存ロジックへの影響、CI、Cloudflare Previewを確認し、ブロッカーはありません。
```

自分自身のPRでは`APPROVE`ではなく`COMMENT`で自己レビューを残してよい。

---

## 8. GitHub Actions CI

現在のCIはNode.js 24で次を実行する。

```bash
npm ci
npm run lint
npm test
npm run build
```

CI失敗時はmergeしない。

- ログを読む
- 原因を修正
- 同じBranchへcommit / push
- CI再実行
- 差分を再レビュー

CIを一時的に無効化して突破しない。

---

## 9. Cloudflare Preview

PR / non-production branch pushではCloudflare Workers BuildsのPreviewを使う。

merge前に確認するもの:

- `Workers Builds: code-reading-rpg` がsuccess
- Preview URLが発行される
- 対象画面が開く
- UI変更ならDesktop / Mobileを確認
- route追加なら直URLと再読み込みを確認
- seed関連変更なら同じseedで再現できることを確認

GitHub Actionsだけ成功し、Cloudflare checkがまだ無い場合はPreview完了とは扱わない。

Vercel Previewは現在のmerge条件ではない。

---

## 10. Merge規約

### 10.1 原則squash merge

PR内に複数commitがあっても、`main`にはIssue単位の1commitとして取り込む。

### 10.2 merge前条件

- Issue範囲の実装完了
- 自己レビュー完了
- blockerなし
- GitHub Actions CI success
- Cloudflare Preview success
- review後にhead SHAが意図せず変わっていない

---

## 11. Production規約

正式deploy先:

```text
Cloudflare Account: Profuse Comb
Worker: code-reading-rpg
Production branch: main
Production URL: https://code-reading-rpg.profuse-comb.workers.dev
```

`main` merge後にCloudflare Workers Production Buildが走る。

確認項目:

1. merge commitのGitHub Actionsがsuccess
2. `Workers Builds: code-reading-rpg`がsuccess
3. Cloudflare Version IDが発行される
4. 必要に応じてProduction URLでsmoke test

Production失敗時はIssueを完了扱いにしない。必要ならfix Issueを作る。

---

## 12. Vercel

Vercel Git連携は解除済みで、自動Git deployは`vercel.json`でも無効化している。

したがって次は完了条件から外す。

- Vercel Preview
- Vercel Production
- Vercel status check

旧Vercel Projectを残していても、通常開発フローからは参照しない。

---

## 13. Definition of Done

通常のIssueは以下を満たして完了。

- [ ] Issueがある
- [ ] Issue専用Branchで作業した
- [ ] Conventional Commitsになっている
- [ ] PRが日本語で作成されている
- [ ] PRがIssueを参照している
- [ ] 実差分を自己レビューした
- [ ] 必要なテストを追加・実行した
- [ ] GitHub Actions CI success
- [ ] Cloudflare Preview success
- [ ] squash merge済み
- [ ] Issue close確認
- [ ] Cloudflare Production success
- [ ] 必要なProduction smoke test完了

---

## 14. Issueを分ける判断

別Issueにする例:

- 新機能と無関係な既存バグ
- UI改善と独立したゲームロジック変更
- 現Issueに不要な大規模refactor
- 「ついでに」追加したい別機能

同じIssueでよい例:

- その修正なしではAcceptance Criteriaを満たせない
- 同じ原因の変更が複数ファイルへまたがる
- route追加に伴う最小navigation変更

判断基準はファイル数ではなく**目的が1つか**。

---

## 15. Refactor / Dependency

- 動作変更と大規模refactorをできるだけ混ぜない
- 新機能に不可欠な最小refactorは同Issueでよい
- 将来使うかもしれない抽象化を先に作りすぎない
- 新しいnpm packageは標準API / 既存依存で代替できないか確認する
- bundle size / maintenance / license / securityを確認する

特にGame Domainでは、実際に責務が増えてから分割し、抽象化そのものを目的にしない。
