# CODE//READ RPG 開発フロー

## 1. 目的

この文書は、`CODE//READ RPG` のIssue作成からProduction反映確認までの標準手順を定義する。

原則として、すべての変更は次の流れで行う。

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
CI / Vercel Preview
↓
必要なら修正・再レビュー
↓
squash merge to main
↓
Issue close確認
↓
Vercel Production Deploy確認
↓
完了
```

`main` へmergeしただけでは完了としない。Production反映確認までを1つの作業とする。

---

## 2. 基本原則

### 2.1 1 Issue = 1 Branch = 1 PR

1つのIssueに対して、原則として1本のBranchと1本のPRを作る。

目的:

- 変更理由を追いやすくする
- レビュー範囲を限定する
- revertしやすくする
- Issue / commit / PR / deployの対応関係を明確にする

独立した複数機能を1 Issueへまとめない。

例:

悪い例:

```text
feat: ステージ選択とログインとBGMを追加する
```

良い例:

```text
feat: JavaScriptのステージ選択画面を追加する
feat: LocalStorageで進捗を保存する
feat: BattleにSEを追加する
```

ただし、現在のIssueを成立させるために不可分な小修正は同じIssue内で扱ってよい。

---

## 3. Issue規約

### 3.1 Issueは実装前に作る

先にIssueを作り、目的・範囲・完了条件を決めてからBranchを作成する。

### 3.2 Issueは日本語で書く

Issueのタイトル・本文は原則日本語。

Conventional Commitsと対応しやすいよう、タイトル先頭にtypeを付けてもよい。

例:

```text
feat: JavaScriptのステージ選択画面を追加する
fix: Battle 3で技が減る問題を修正する
docs: ロードマップを更新する
test: ターゲット判定のテストを追加する
```

### 3.3 Issue本文の推奨構成

```md
## 概要
何をするか。

## 背景 / 問題
なぜ必要か。

## 対応方針
どう直す / 作るか。

## Acceptance Criteria
- [ ] 条件1
- [ ] 条件2
- [ ] CI成功
- [ ] Vercel Production確認

## 対象外
今回やらないことがあれば書く。
```

仕様が明確な小Issueでは簡略化してよい。

### 3.4 Acceptance Criteriaを必ず持つ

「実装した」ではなく、ユーザーから見た結果や検証可能な条件を書く。

悪い例:

```text
- [ ] コンポーネントを作る
```

良い例:

```text
- [ ] クリア済みBattleをステージ選択画面から再プレイできる
```

---

## 4. Branch規約

### 4.1 BranchはIssueから作る

原則、Issue作成後に`main`の最新状態からBranchを作る。

### 4.2 命名形式

```text
<type>/<issue番号>-<short-description>
```

例:

```text
feat/12-stage-select
fix/18-preserve-unlocked-skills
test/21-targeting-tests
docs/10-roadmap-and-workflow
refactor/30-split-game-domain
```

### 4.3 Branch名は英語・kebab-case

Issue / PRは日本語だが、Branch名はCLIやURLで扱いやすい英語を使う。

- 小文字
- 単語区切りは`-`
- Issue番号を含める
- 長すぎる説明を入れない

### 4.4 typeの目安

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `test`: テスト
- `refactor`: 動作を変えない構造改善
- `chore`: 開発環境・依存・運用
- `style`: 見た目中心でロジック変更なし
- `perf`: パフォーマンス改善

---

## 5. Commit規約

### 5.1 Conventional Commitsを使用する

形式:

```text
<type>(optional-scope): <summary>
```

summaryは日本語でよい。

例:

```text
feat: ステージ選択画面を追加
fix: ゴーレムがHP表示を隠す問題を修正
test: find系ターゲット判定のテストを追加
docs: 開発フローを文書化
chore: package-lockを追加
```

scopeを使う例:

```text
feat(battle): seed付き盤面生成を追加
fix(ui): モバイルでカードがはみ出す問題を修正
```

### 5.2 1 commit = 1つの論理的変更

無理に1PR=1commitにする必要はない。

途中の論理単位ごとにcommitしてよい。

例:

```text
feat: seed型と生成APIを追加
test: seed再現性のテストを追加
refactor: Battle定義をgeneratorから分離
```

最終的な`main`への取り込みは原則squash mergeとする。

### 5.3 意味のないcommit名を避ける

避ける例:

```text
update
fix
wip
changes
again
```

履歴だけで何をしたか判断できる名前にする。

---

## 6. Pull Request規約

### 6.1 PRは日本語で書く

PRタイトル・本文は原則日本語。

例:

```text
feat: JavaScriptのステージ選択画面を追加する
```

### 6.2 PRタイトルもConventional系typeを利用する

Issueとの対応を追いやすくするため、PRタイトルも以下を推奨する。

```text
feat: ...
fix: ...
docs: ...
test: ...
refactor: ...
chore: ...
```

### 6.3 PR本文の推奨構成

```md
## 概要
- 変更1
- 変更2

## 変更内容
- 実装上の要点

## 確認項目
- [ ] Acceptance Criteriaを満たす
- [ ] 既存挙動を壊していない
- [ ] CI成功
- [ ] Vercel Preview成功

## 影響範囲
影響する画面 / ロジック / データ。

Closes #123
```

### 6.4 Issueを自動closeする

PR本文に原則以下を含める。

```text
Closes #<issue番号>
```

merge後にIssueが自動closeされたことも確認する。

---

## 7. 自己レビュー規約

PRを作成したら、merge前に必ず実際の差分を読む。

「自分が書いたから大丈夫」ではなく、レビュー対象として確認する。

### 7.1 必須チェック

- 想定したファイルだけが変更されているか
- IssueのAcceptance Criteriaを満たしているか
- unrelated changeが混ざっていないか
- 既存Battleロジックを意図せず変更していないか
- TypeScriptの型を不必要に緩めていないか
- dead code / debug code / console出力が残っていないか
- モバイル表示に影響しないか
- keyboard / focus / aria等のアクセシビリティを悪化させていないか
- 著作権・ライセンス上問題のある素材を追加していないか
- 外部入力を扱う場合にsecurity上の問題がないか
- テストが必要なロジック変更にテストがあるか
- README / docs更新が必要な仕様変更ではないか

### 7.2 ゲーム固有チェック

- 表示コードと内部効果が一致しているか
- 対象プレビューOFFの原則を意図せず壊していないか
- コードを読まず暗記だけで攻略できる方向へ悪化していないか
- 正しいJavaScriptの意味とゲーム上の「最適行動」を混同していないか
- 敵のHP / NEXT / コードが視認できるか
- 勝利不能なBattleを作っていないか
- 解放済みSkillや進行状態が意図せずリセットされないか

### 7.3 レビュー結果

問題なしの場合もレビューコメントを残す。

例:

```text
自己レビュー完了。変更範囲、既存ロジックへの影響、モバイル表示、CI、Vercel Previewを確認し、ブロッカーはありません。
```

問題があればmergeせず、同Branchで修正して再レビューする。

---

## 8. CI規約

### 8.1 merge前にCI成功が必須

原則、GitHub Actions CIが成功するまでmergeしない。

現在の最低条件:

```bash
npm install
npm run build
```

`package-lock.json`導入後は原則以下へ切り替える。

```bash
npm ci
npm run build
```

テスト導入後はCIに追加する。

例:

```bash
npm ci
npm run lint
npm test
npm run build
```

### 8.2 CI失敗時

- ログを読む
- 原因を修正
- 同じBranchへcommit
- CI再実行
- 差分を再レビュー

一時的にCIを無効化してmergeしない。

---

## 9. Vercel Preview規約

GitHub連携により、PR / branch push時にはVercel Preview Deploymentが作成される。

Previewで確認するもの:

- Buildが成功する
- 対象画面が開く
- 主要な操作ができる
- UI変更ならモバイル幅も崩れていない
- route追加なら直URLで開ける

大きなUI変更では、可能な範囲で実画面を確認する。

---

## 10. Merge規約

### 10.1 原則squash merge

PR内で複数commitがあっても、`main`には1つのまとまった変更として入れる。

理由:

- 1 Issue = 1 PRとmain履歴が対応しやすい
- revertしやすい
- 作業途中の細かいcommitをmainへ残さない

### 10.2 merge前条件

以下をすべて満たす。

- Issue範囲内の実装完了
- 自己レビュー完了
- blockerなし
- CI success
- Vercel Preview success
- merge対象head SHAがレビュー時から変わっていないことを確認

### 10.3 mainへの直接commitを避ける

通常の機能追加・修正・docs更新は必ずPR経由。

緊急時でも、可能ならhotfix Issue / Branch / PRを作る。

---

## 11. Production Deploy規約

正式Vercel Project:

```text
code-reading-rpg-live
```

Production URL:

```text
https://code-reading-rpg-live.vercel.app
```

GitHub repository:

```text
mui-1729/code-reading-rpg
```

`main`へのmergeをProduction Deployのトリガーとする。

### 11.1 merge後に必ず確認する

1. merge commitにVercel statusが付く
2. `pending`から`success`になる
3. Production DeploymentがREADYになる
4. 固定Production URLが利用可能
5. 必要に応じて今回の変更をsmoke testする

これを確認するまでIssueを「作業完了」と扱わない。

### 11.2 原則として手動deployしない

Git連携とProduction sourceの対応が分からなくなるため、通常開発ではVercelへの直接deployを使用しない。

例外:

- Vercel Git Integration自体の障害調査
- 明確な緊急対応
- ユーザーが手動deployを明示的に要求

例外時も、GitHub `main` とProductionの内容が乖離しないようにする。

### 11.3 Production失敗時

merge済みでもタスク完了ではない。

- Vercel build logを確認
- 原因を特定
- 必要なら新しいfix Issueを作成
- 1 Issue = 1 Branch = 1 PRで修正
- Production復旧を確認

失敗状態を放置して次の機能開発へ進まない。

---

## 12. 完了条件 Definition of Done

通常のIssueは以下を満たして初めて完了。

- [ ] Issueがある
- [ ] Issue専用Branchで作業した
- [ ] Conventional Commitsになっている
- [ ] PRが日本語で作成されている
- [ ] PRがIssueを参照している
- [ ] 実差分を自己レビューした
- [ ] 必要なテストを追加・実行した
- [ ] CI success
- [ ] Vercel Preview success
- [ ] squash merge済み
- [ ] Issue close確認
- [ ] Vercel Production success
- [ ] Productionで必要なsmoke test完了

ドキュメントのみの変更でも、CI / Preview / Production確認は基本フローとして維持する。

---

## 13. Issueを分ける判断

別Issueにするべき例:

- 新機能と無関係な既存バグを発見した
- UI改善とゲームロジック変更が独立している
- refactorしなくても現在Issueを実装できる
- 「ついでに」追加したい別機能

同じIssueでよい例:

- その修正なしではAcceptance Criteriaを満たせない
- 同じ不具合の原因箇所が複数ファイルにまたがる
- 新route追加に伴う最小限のnavigation変更

判断基準は「ファイル数」ではなく「目的が1つか」。

---

## 14. Refactor規約

- 動作変更と大規模refactorをできるだけ同じPRに混ぜない
- 新機能に必要な最小refactorは同じIssueでもよい
- 将来使うかもしれない抽象化を先に作りすぎない
- 現在の責務が明確に混ざってから分割する

特にこのプロジェクトでは、問題数が増える前にデータ / targeting / UIの責務を整理するが、フレームワークを増やすこと自体を目的にしない。

---

## 15. Dependency追加規約

新しいnpm packageを追加するときはPR本文またはIssueで理由を説明する。

確認すること:

- 標準APIや既存依存で十分ではないか
- bundle sizeへの影響
- maintenance状況
- license
- security
- 本当に現在の要件で必要か

候補技術は [`ROADMAP.md`](./ROADMAP.md) の導入判断基準に従う。

---

## 16. UI / Asset規約

現在の8-bit RPG風デザインは、特定の既存ゲームを直接コピーしない。

- オリジナルCSS表現
- 自作 / 生成した素材
- 適切なlicenseの素材

を使用する。

既存ゲームのsprite、UI画像、ロゴ、音源などを無断流用しない。

生成画像を使う場合も、特定作品のキャラクターや画面をそのまま再現する指示を避ける。

---

## 17. セキュリティ規約

このゲームでは表示コードをそのまま`eval()`して実行しない方針を維持する。

将来、ユーザーがコードを入力できる機能を追加する場合は、通常のブラウザ実行やサーバー実行を安易に導入しない。

必要になった時点でSandbox / worker isolation / timeout / resource limit等を含めて別Issueで設計する。

---

## 18. ドキュメント更新規約

以下を変更した場合はdocs更新を検討する。

- 開発フロー
- Branch / Commit / PR規約
- Production運用
- 技術スタック
- 大きなアーキテクチャ
- ロードマップ
- MVP / v1.0の定義

実装とdocsが矛盾した状態を放置しない。

---

## 19. 標準作業例

新機能「Stage Select」を実装する場合:

```text
1. Issue作成
   feat: JavaScriptのステージ選択画面を追加する

2. Branch作成
   feat/12-stage-select

3. 実装

4. Commit
   feat: JavaScriptステージ選択画面を追加
   test: ステージ状態表示のテストを追加

5. PR作成（日本語）
   feat: JavaScriptのステージ選択画面を追加する

6. 実差分を自己レビュー

7. CI / Vercel Preview確認

8. 必要なら修正・再レビュー

9. squash merge

10. Issue close確認

11. Vercel Production success確認

12. 本番smoke test
```

この一連を標準とする。
