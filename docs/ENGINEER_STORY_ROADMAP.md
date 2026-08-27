# CODE//READ RPG — Engineer Story Roadmap

## 目的

この文書は、長期的なlearning contentを**新人エンジニアとしてどんな仕事を経験し、何を読むようになるか**で整理する。

世界観そのものは[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)をsource of truthとする。

各「〜編」は、

```text
REAL WORLDで仕事 / incidentを受ける
↓
CODE WORLDで同じproblemが異変として見える
↓
code / dataを読む
↓
Chapterを進めながらroot causeへ近づく
↓
Boss / Finalで総合して解決
```

という共通framingを持つ。

細かなStory台本、NPC名、台詞、Region固有名はこの文書で固定しない。

---

## 編をまとめる基準

まとめる:

- 同じ実務上の問題を解くために一緒に使う
- 前の概念がそのまま次の概念の土台になる
- 1つの3 Chapter arcとして自然につながる
- Battle上でも同じ種類の「コードを読んで結果を判断する」体験になる

分ける:

- framework固有のruntime / data flow / mental modelが中心になる
- 同じ名前の概念でも読み方が大きく変わる
- 1編へ入れると未習概念が多すぎる
- Story上の仕事が別物になる

共通ルール:

- 各編は原則 Chapter 1 → Chapter 2 → Final
- 新しく学んだ読み方は後Chapterでも再登場する
- 前の編で学んだ読み方も後の編で再利用する
- Battleはクイズではなくcurrent stateとcodeを読んで意思決定する
- REAL WORLDのproblemとCODE WORLDの異変を同じ原因へつなぐ
- Bossはその編で追っていたroot causeを象徴する
- 未習syntaxを大量に出して難しくしない
- Region表現はlearningを助けるために使い、技術名の装飾だけにしない

---

## 01. JavaScript編 — コード読解の基礎

### REAL WORLDでの役割

開発チームに入った新人エンジニアとして、最初のbug investigationを任される。

### 主なproblem theme

- 初めてのbug report
- 原因dataの特定
- 類似bugの影響範囲調査
- 共通処理の障害

### 読解theme

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

### CODE WORLD方向

現在のJavaScript Grasslandを残す。

最初に「codeがworld ruleとしてtarget / effectを決める」ことを体験するRegionにする。

generic fantasyを消さず、今後必要に応じてJavaScriptのruntime / object / arrayを感じるobject / landmarkを薄く足す。

### 現状

Battle 1〜3、3 Chapter Storyは実装済み。

今後は詳細Storyの全面rewriteではなく、REAL WORLD → CONNECT → Grasslandというframingを強化する。

---

## 02. TypeScript編 — 型を含むコード読解

JavaScript編と同じ粒度・同じ3 Chapter構造の1編として扱う。

### REAL WORLDでの役割

複数人で触るcodebaseへ参加し、型情報を使って不具合の原因を追う。

### 主なproblem theme

- API responseと想定型の不一致
- `undefined`を考慮していない処理
- union typeの分岐
- optional property
- shared contractの崩れ

### 読解theme

- type annotation
- interface / type
- union
- optional property
- narrowing
- discriminated union
- `keyof`
- indexed access
- genericの入口

### CODE WORLD方向

現在のTypeScript Forestを残す。

今後visualを整える場合、

- crystal
- rune
- structure
- boundary

など、type / contractを薄く感じるmotifをcandidateとする。

ただし「TypeScriptだから全部青い結晶」に固定しない。

### 現状

Battle 4〜6とEngineer Storyは実装済み。

現在のarcは、

- API契約の食い違い
- optional / unionへの波及
- Shared Contract / Frontier Compilerのroot cause

へ接続済み。

今後はこれをCODE WORLD側のForestの異変 / root cause entityとして自然につなぐ。

---

## 03. Database編 — データを正しく取り出し、壊さない

**次に追加する新規learning編の第一候補。**

`SQL編`として細かく切らず、DBを扱う仕事として必要な基礎をまとめる。

### REAL WORLDでの役割

本番dataを調査し、必要なrowを正しく取得・更新するapplication engineer。

### 主なproblem theme

- 欲しいrowが取れない
- 条件漏れで対象が多すぎる
- JOINで重複する
- NULLを誤る
- 集計結果が合わない
- queryが遅い
- transaction途中で状態が不整合になる

### 読解theme

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
- aggregate

Final:

- indexの入口
- transaction
- 複数queryの依存関係
- correct resultとslow queryの切り分け

### CODE WORLD方向

technical modelとfantasy representationを**最初から一緒にprototypeする最初の編**にする。

candidate:

- underground archive
- giant library
- mine / storage layer

Battle representationは固定しない。

検証候補:

- rowをmonsterとして見せる
- record / cardとして見せる
- world objectとして並べる

`WHERE → ORDER BY → LIMIT`を読む意味が最も自然に出る表現を選ぶ。

### prototype

最初は1 Battleだけ作る。

確認する:

- queryを読まないとresult rowを判断しにくいか
- safe internal ruleへ落とせるか
- CODE HELP / CODE DATAをDB向けに一般化できるか
- field表現がlearningを助けるか
- REAL WORLDのdata issueとCODE WORLDの異変が同じproblemに見えるか

成功後に3 Chapter + full Regionへ広げる。

---

## 04. Backend / API編 — requestからresponseまでを追う

framework名ではなくbackend全般に共通するrequest flowをまとめる。

### REAL WORLDでの役割

Frontend・DB・external serviceをつなぐAPIを担当する。

### 読解theme

- HTTP method / status code
- request / response
- JSON
- validation
- async / await / Promise
- error handling
- pagination
- timeout / retry
- DB access
- authentication / authorization基礎
- session / token基礎

### CODE WORLD方向

request / responseがsystem間を移動する感覚をfieldへ反映できる。

candidate:

- gate city
- road network
- port
- message transport

「APIだから道路」と固定するのではなく、request flowがplayerに読めるかで決める。

Express / Hono / Nest等はこの編の中心にしない。

---

## 05. React編 — componentとstateを読む

Reactは固有mental modelが大きいため独立編。

### REAL WORLDでの役割

Frontend UI機能を担当する。

### problem theme

- propsの渡し間違い
- state更新後の表示不整合
- derived stateの二重管理
- list keyによる表示崩れ
- Effect dependency
- stale value / render問題

### 読解theme

- component
- props
- state
- event handler
- render flow
- derived data
- `map` + key
- `useEffect`
- memoizationの必要性判断

### CODE WORLD方向

candidate:

- machine city
- living UI district
- componentごとに構成されたstructure

state changeがworld presentationへ反映される表現と相性がよい。

Boss candidate: Render Core / Stale State系。

---

## 06. Next.js編 — Full-stack Reactの境界を読む

Reactと分け、Next.js固有の実行場所・routing・data flowを読む。

### 読解theme

- App Router
- layout / route
- Server / Client Component
- server-side data fetching
- Server Action
- cache / revalidation
- loading / error boundary
- request-time / build-time

### CODE WORLD方向

candidate:

- server citadel
- layered city
- client / server boundaryをまたぐdistrict

Reactが分かれば自動的にNext.jsも分かるとは扱わない。

---

## 07. TanStack編 — Router / Query / Startのdata flowを読む

最初から全packageを詰め込まない。

候補:

- TanStack Router: route / loader / search params
- TanStack Query: server state / cache / invalidation
- TanStack Start: full-stack boundary

CODE WORLDではroute network / terminal district等をcandidateとする。

Router / Queryだけで十分なら1編。Startまで含めて大きければ将来分割してよい。

---

## 08. Team Development / Delivery編 — 安全に変更を出す

Git・Testing・CI/CDを、**変更を安全にproductionへ届ける1つの仕事**としてまとめる。

### 読解theme

- diff / commit / branch
- merge / rebase
- PR / review
- unit / integration / E2E
- fixture / mock / assertion
- CI workflow
- lint / test / build
- environment
- preview deploy
- rollback

CODE WORLDではworkshop / release facility等をcandidateとする。

Boss candidate: Broken Release / Build Pipeline。

---

## 09. Security編 — trust boundaryを読む

Backend編でauth基礎を扱っても、security固有判断は独立編にする。

### 読解theme

- authentication vs authorization
- server-side permission check
- input validation
- session / token
- trust boundary
- XSS / injection / CSRFの考え方
- secret / credential

CODE WORLDではfortress / guarded boundary等をcandidateとする。

攻撃手順を競う章ではなく、安全な実装を読んで判断する章。

---

## 10. Production / Performance編 — 動いているsystemを調査する

Observability・Incident Response・Performanceをproduction調査としてまとめる。

### 読解theme

- log / stack trace
- metrics / traces
- incident timeline
- deployとの相関
- latency
- N+1
- repeated work
- cache / batching
- query count

CODE WORLDではobservatory / control tower等をcandidateとする。

Boss candidate: Major Incident / Traffic Spike。

---

## 11. Architecture / Refactoring編 — system全体を読む

最後の総合編。

### 読解theme

- responsibility
- dependency
- module boundary
- data flow
- duplicated logic
- state ownership
- backward compatibility
- migration strategy

CODE WORLDではold capital / legacy ruins等をcandidateとする。

Boss candidate: Legacy Monolith。

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

順序は流行ではなく、後の編を読む前提が自然に積み上がるかで決める。

DatabaseをReactより先に置く理由:

- current Battle systemとSQLの相性がよい
- Backend編の前提としてDBを理解した方がrequest → DB → responseを追いやすい
- Frontendだけに偏らず早期にsystem全体を見る
- CODE WORLD representationを新方針でprototypeする題材として適している

---

## 各編を作るときのチェック

1. REAL WORLDで何の仕事を任されたか
2. 現場で何が壊れた /困っているか
3. CODE WORLDでは同じproblemがどう異変として見えるか
4. その問題を理解するために何のcode / dataを読むか
5. Region表現はmental modelを助けるか
6. Chapterごとに何が新しく増えるか
7. 前Chapter・前編の知識をどこで再利用するか
8. Bossは何のroot causeを象徴し、何を総合して読ませるか
9. Battle以外にNPC / World / clueで何を体験させるか
10. 同じ仕事としてまとめられる概念を無駄に別編へ分けていないか
11. framework固有mental modelを無理に混ぜていないか
12. クイズに答えるだけになっていないか
13. engineering framingのためにfantasy RPGの面白さを消していないか
