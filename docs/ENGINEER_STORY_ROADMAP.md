# CODE//READ RPG — Engineer Story Roadmap

## 目的

このゲーム全体を「新人エンジニアが、実務上の問題を解決しながら成長するRPG」として構成する。

各「〜編」は技術名を細かく1つずつ並べるのではなく、**同じ仕事・同じ思考で自然に学べるものは1つの編へまとめる**。

一方で、React / Next.jsのように実行モデルや設計思想そのものが変わるframeworkは、無理に同じ編へ押し込まない。

## 編をまとめる基準

まとめる:

- 同じ実務上の問題を解くために一緒に使う
- 前の概念がそのまま次の概念の土台になる
- 1つの3 Chapter storyとして自然につながる
- Battle上でも同じ種類の「コードを読んで結果を判断する」体験になる

分ける:

- framework固有のruntime / data flow / mental modelが中心になる
- 同じ名前の概念でも読み方が大きく変わる
- 1編へ入れると未習概念が多すぎる
- story上の仕事が別物になる

共通ルール:

- 各編は原則 Chapter 1 → Chapter 2 → Final の3段階
- 新しく学んだ読み方は後Chapterでも再登場する
- 前の編で学んだ読み方も後の編で再利用する
- Battleはクイズではなく、現在のstateとコードを読んで意思決定する
- Story上の仕事と学習内容を一致させる
- Bossはその編で学んだ内容の総合問題にする
- 未習構文を大量に出して難しくしない

---

## 01. JavaScript編 — コード読解の基礎

### 役割

開発チームに入った新人エンジニア。

### 主な問題

- 初めてのbug report
- 原因データの特定
- 類似bugの影響範囲調査
- 共通処理の障害

### 読解テーマ

- object / array
- callback
- 条件式
- `find`
- `filter`
- `&&` / `||`
- `map`
- `some`
- `sort`
- `reduce`

### Story

1. 最初のバグ
2. 広がるバグ
3. 暴走するCode Core

現在実装済み。以後の編のstory / cumulative learningの基準とする。

---

## 02. TypeScript編 — 型を含むコード読解

JavaScript編と**同じ粒度・同じ3 Chapter構造の1編**として扱う。

### 役割

複数人で触るコードベースへ参加し、型情報を使って不具合の原因を追う。

### 主な問題

- API responseと想定型の不一致
- `undefined`を考慮していない処理
- union typeの分岐漏れ
- optional propertyの読み間違い
- shared contractの崩れ

### 読解テーマ

- type annotation
- interface / type
- union
- optional property
- narrowing
- discriminated union
- `keyof`
- indexed access
- genericの入口

### Story方向

1. 型の食い違いを発見
2. optional / unionを含む複数箇所へ影響が広がる
3. shared contractの根本原因を修復

現在Battle 4〜6は実装済み。次はJavaScript編と同じstory品質へ揃える。

---

## 03. Database編 — データを正しく取り出し、壊さない

**次に追加する新規学習編の第一候補。**

`SQL編`として細かく切らず、DBを扱うために必要な基礎を1つの編へまとめる。

### 役割

本番データを調査し、必要なrowを正しく取得・更新するアプリケーションエンジニア。

### 主な問題

- 欲しいrowが取得できない
- 条件漏れで対象が多すぎる
- JOINで重複する
- NULLの扱いを誤る
- 集計結果が合わない
- queryが遅い
- transaction途中で状態が不整合になる

### 読解テーマ

Chapter 1:

- table / row / column
- `SELECT`
- `WHERE`
- `AND` / `OR`
- `ORDER BY`
- `LIMIT`

Chapter 2:

- `JOIN`
- `NULL`
- `GROUP BY`
- aggregate (`COUNT`, `SUM`等)

Final:

- indexの入口
- transaction
- 複数queryの依存関係
- 「結果は正しいが遅い」と「結果自体が間違っている」の切り分け

### Battleとの相性

現在の「コードがどの対象を選ぶか読む」Battleと特に相性がよい。

```text
Enemy / object
≈ row

TargetRule
≈ WHERE / JOIN / ORDER BY / LIMIT の結果
```

最初は1 Battle prototypeで成立を確認してから3 Chapterへ広げる。

---

## 04. Backend / API編 — requestからresponseまでを追う

framework名ではなく、backend全般に共通するrequest flowをまとめる。

### 役割

Frontend・DB・外部serviceをつなぐAPIを担当する。

### 読解テーマ

- HTTP method / status code
- request / response
- JSON
- validation
- async / await / Promise
- error handling
- pagination
- timeout / retry
- DB accessの流れ
- authentication / authorizationの基礎
- session / tokenの基礎

### Story例

1. 正しいrequestなのにresponseがおかしい
2. DB / external APIをまたぐ処理で失敗が広がる
3. auth / validation / transactionを含む障害を追う

Express / Hono / Nest等のframework固有知識をこの編の中心にはしない。必要になれば別contentとして扱う。

---

## 05. React編 — componentとstateを読む

Reactはframework / library固有のmental modelが大きいため独立編にする。

### 役割

Frontend UI機能を担当する。

### 主な問題

- propsの渡し間違い
- state更新後に表示が合わない
- derived stateの二重管理
- list keyによる表示崩れ
- Effect依存関係による古い値
- 不要な再render

### 読解テーマ

- component
- props
- state
- event handler
- render flow
- derived data
- `map` + key
- `useEffect`
- memoizationの必要性判断

Boss案: Stale State / Render Loop

---

## 06. Next.js編 — Full-stack Reactの境界を読む

Reactと一緒にせず、Next.js固有の実行場所・routing・data flowを読む編にする。

### 読解テーマ候補

- App Router
- layout / route
- Server / Client Component
- server-side data fetching
- Server Action
- cache / revalidation
- loading / error boundary
- request-time / build-timeの違い

「Reactが分かれば自動的にNext.jsも分かる」とは扱わない。

---

## 07. TanStack編 — Router / Query / Startのdata flowを読む

TanStack系もNext.jsとは別に扱う。

最初から全packageを詰め込まず、実際に教材として使う範囲を決めてからChapter化する。

候補:

- TanStack Router: route / loader / search params
- TanStack Query: server state / cache / invalidation
- TanStack Start: full-stack boundary

Router / Queryだけで十分な場合は1編にまとめる。TanStack Startまで扱って内容が大きくなる場合は、将来分割してよい。

---

## 08. Team Development / Delivery編 — 安全に変更を出す

Git・Testing・CI/CDは別々の用語集にせず、**変更を安全にproductionへ届ける1つの仕事**としてまとめる。

### 読解テーマ

- diff / commit / branch
- merge / rebase
- Pull Request / review
- unit / integration / E2E
- fixture / mock / assertion
- CI workflow
- lint / test / build
- environment
- preview deploy
- rollback

Boss案: Broken Release

---

## 09. Security編 — trust boundaryを読む

Backend編でauthの基礎は扱うが、security固有の判断は独立編にする。

### 読解テーマ

- authentication vs authorization
- server-side permission check
- input validation
- session / token
- trust boundary
- XSS / injection / CSRFの考え方
- secret / credentialの扱い

攻撃手順を競う章ではなく、安全な実装を読んで判断する章にする。

---

## 10. Production / Performance編 — 動いているsystemを調査する

Observability・Incident Response・Performanceはproduction上の調査としてまとめる。

### 読解テーマ

- log / stack trace
- metrics / traces
- incident timeline
- deployとの相関
- latency
- N+1
- repeated work
- cache / batching
- query count

Boss案: Major Incident / Traffic Spike

---

## 11. Architecture / Refactoring編 — system全体を読む

最後の総合編。

### 読解テーマ

- responsibility
- dependency
- module boundary
- data flow
- duplicated logic
- state ownership
- backward compatibility
- migration strategy

Boss案: Legacy Monolith

---

## 推奨する大きな学習順

```text
JavaScript
→ TypeScript
→ Database
→ Backend / API
→ React
→ Next.js
→ TanStack
→ Team Development / Delivery
→ Security
→ Production / Performance
→ Architecture / Refactoring
```

順序は「技術の流行」ではなく、後の編を読むための前提が自然に積み上がるかで決める。

特にDatabaseをReactより先に置く理由:

- 現在のBattle systemとSQLの相性がよく、新regionを成立させやすい
- Backend編の前提としてDBを理解している方がrequest → DB → responseを追いやすい
- Frontendだけに偏らず、早い段階でsystem全体を見る視点を作れる

## 各編を作るときのチェック

1. プレイヤーはエンジニアとして何の仕事を任されたか
2. 現場で何が壊れた / 困っているか
3. その問題を理解するために何のコード / dataを読むか
4. Chapterごとに何が新しく増えるか
5. 前Chapter・前編の知識をどこで再利用するか
6. Bossは何を総合して読ませるか
7. 戦闘以外にNPC / log / issue / review等で何を体験させるか
8. 同じ仕事としてまとめられる概念を無駄に別編へ分けていないか
9. framework固有のmental modelを無理に別frameworkと混ぜていないか
10. 「クイズに答える」だけになっていないか
