# CODE//READ RPG — Engineer Story Roadmap

## 目的

このゲーム全体を「新人エンジニアが、実務上の問題を解決しながら成長するRPG」として構成する。

各「〜編」は技術名を覚える章ではなく、**その技術を使う現場で実際に起こりやすい問題を、コードを読んで解決する章**にする。

共通ルール:

- 新しく学んだ構文・読み方は後のChapterでも再登場する
- 以前の編で覚えた読み方も後の編で再利用する
- Battleはクイズではなく、現在のstateとコードを読んで意思決定する
- Story上の仕事と学習内容を一致させる
- Bossはその編で学んだ内容の総合問題にする
- 未習構文を大量に出して難しくしない
- エンジニアの仕事を「コードを書くこと」だけに限定しない

---

## 01. JavaScript編 — 新人エンジニア / 初めての障害対応

### 役割

開発チームに入った新人エンジニア。

### 主な問題

- 初めてのbug report
- 1件の原因データ特定
- 類似bugが複数件発生
- 影響範囲調査
- 本番障害

### 読解テーマ

- object / array
- callback
- 条件式
- `find`
- `filter`
- `&&` / `||`
- `map`
- `sort`
- `reduce`

### Story

1. Your First Bug Fix
2. Bug Reports Keep Coming
3. Production Incident

Boss: Production Bug

---

## 02. TypeScript編 — チーム開発 / 型の食い違い

### 役割

複数人で触るコードベースへ参加。

### 主な問題

- API responseと想定型の不一致
- `undefined`を考慮していない処理
- union typeの分岐漏れ
- optional propertyの読み間違い
- refactor後の型崩れ

### 読解テーマ

- type annotation
- interface / type
- union
- optional property
- narrowing
- discriminated union
- `keyof`
- genericの入口

Boss案: Broken Contract / Type Drift

---

## 03. React編 — UI開発 / stateの混乱

### 役割

フロントエンド機能を担当。

### 主な問題

- propsの渡し間違い
- state更新後に表示が合わない
- derived stateの二重管理
- 不要な再レンダリング
- list keyによる表示崩れ
- Effect依存関係による古い値

### 読解テーマ

- component
- props
- state
- event handler
- render flow
- derived data
- `map` + key
- `useEffect`
- `useMemo`は必要性も含めて読む

Boss案: Infinite Render / Stale State

---

## 04. SQL / Database編 — データ調査 / 本番データ事故

### 役割

DBを調査するアプリケーションエンジニア。

### 主な問題

- 欲しいrowが取得できない
- 条件漏れで対象が多すぎる
- JOINで重複する
- NULLの扱い
- 並び順 / LIMITの誤り
- 遅いquery
- transaction途中の不整合

### 読解テーマ

- SELECT
- WHERE
- AND / OR
- ORDER BY
- LIMIT
- JOIN
- GROUP BY
- aggregate
- NULL
- indexの入口
- transactionの入口

Boss案: Data Corruption / Slow Query

---

## 05. API編 — 外部連携 / 通信は成功するとは限らない

### 役割

フロントとバックエンド、外部serviceをつなぐ。

### 主な問題

- 4xx / 5xx
- timeout
- retry
- response schema変更
- pagination
- loading / error state
- race condition
- 同じrequestの二重送信

### 読解テーマ

- `fetch`
- async / await
- Promise
- status code
- JSON
- try / catch
- request / response
- abort / timeoutの考え方

Boss案: Unstable API

---

## 06. Authentication / Security編 — 認証できるだけでは安全ではない

### 役割

ユーザー機能を持つserviceの改修。

### 主な問題

- authenticationとauthorizationの混同
- 他人のresourceへアクセスできる
- client側チェックだけに依存
- session / tokenの扱い
- inputを信用しすぎる
- XSS / SQL injection等の入口

### 読解テーマ

- auth flow
- permission check
- server-side validation
- session / token
- trust boundary
- input / output escapingの考え方

Boss案: Privilege Escalation

※攻撃手順を学ぶ章ではなく、安全な実装を読んで判断する章にする。

---

## 07. Testing編 — 「動いた」と「壊れない」は違う

### 役割

変更を安全に出すためのテスト担当も経験する。

### 主な問題

- happy pathしかtestしていない
- edge case漏れ
- mockが実装と乖離
- flaky test
- regression
- Unit / Integration / E2Eの役割混同

### 読解テーマ

- arrange / act / assert
- fixture
- mock
- assertion
- unit test
- integration test
- PlaywrightなどのE2E

Boss案: Flaky Suite / Regression

---

## 08. Git / Team Development編 — コード以外でも事故は起こる

### 役割

複数人開発へ本格参加。

### 主な問題

- merge conflict
- 間違ったbranch
- revertが必要な変更
- 巨大PR
- reviewで見つかる仕様漏れ
- migrationとcodeのmerge順

### 読解テーマ

- commit history
- diff
- branch
- merge / rebaseの意味
- PR
- code review

Boss案: Release Conflict

---

## 09. CI/CD編 — 自分のPCでは動く

### 役割

変更をproductionへ届ける。

### 主な問題

- lint failure
- test failure
- build failure
- environment variable不足
- deploy後だけ壊れる
- migration順序
- rollback判断

### 読解テーマ

- pipeline
- workflow
- build / test / deploy
- environment
- artifact
- preview deployment
- rollback

Boss案: Red Pipeline / Broken Release

---

## 10. Observability / Incident Response編 — 原因がコードのどこか分からない

### 役割

オンコール / 障害対応。

### 主な問題

- error logから原因追跡
- stack trace
- metric急増
- latency悪化
- 部分障害
- deployとの相関
- 一時復旧と根本修正の違い

### 読解テーマ

- logs
- stack trace
- metrics
- traces
- correlation
- incident timeline

Boss案: Major Incident

---

## 11. Performance編 — 正しいけど遅い

### 役割

ユーザー増加後の改善。

### 主な問題

- N+1
- 不要なloop
- 大量render
- heavy calculation
- cache不備
- DB query過多

### 読解テーマ

- complexityの入口
- repeated work
- cache
- batching
- memoization
- query count

Boss案: Traffic Spike

---

## 12. Architecture / Refactoring編 — 動く巨大コードをどう変えるか

### 役割

中堅へ近づき、既存systemの改善を任される。

### 主な問題

- 1つのfunctionが多くの責務を持つ
- stateが複数箇所に散る
- tightly coupled module
- duplicated logic
- 変更影響範囲が読めない
- backward compatibility

### 読解テーマ

- responsibility
- dependency
- module boundary
- data flow
- interface
- refactoring
- migration strategy

Boss案: Legacy Monolith

---

## 長期的な主人公の成長

```text
新人
→ 小さなbugを直す
→ チームのcodebaseを読む
→ UI / DB / APIを担当
→ securityとtestを意識する
→ PR / CI / deployまで責任を持つ
→ production incidentへ対応する
→ performanceを改善する
→ system全体を設計・refactorする
```

「Levelが高い = syntaxをたくさん暗記している」ではなく、

**Levelが高い = より広い状況で、既存コード・状態・失敗の原因を読めるエンジニアになった**

という成長にする。

---

## 各編を作るときのチェック

新しい編を実装する前に以下を決める。

1. プレイヤーはエンジニアとして何の仕事を任されたか
2. 現場で何が壊れた / 困っているか
3. その問題を理解するために何のコードを読むか
4. Chapterごとに何が新しく増えるか
5. 前Chapterの知識をどこで再利用するか
6. Bossは何を総合して読ませるか
7. 戦闘以外にNPC / log / issue / review等で何を体験させるか
8. 「クイズに答える」だけになっていないか
