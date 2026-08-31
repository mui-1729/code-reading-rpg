# CODE//READ RPG — Engineer Story Roadmap

## 目的

この文書は、長期的なlearning contentを**新人エンジニアとしてどんな仕事を経験し、何を読むようになるか**で整理する。

世界観そのものは[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)をsource of truthとする。

各「〜編」は、

```text
REAL WORLDで仕事 / incidentを受ける
↓
CODE WORLDでまず同じproblemの現象を体験する
↓
「何が読めないか」「何を調べる必要があるか」が生まれる
↓
必要なcode / dataを少しずつ読む
↓
同じtraceを追いながら新しい読み方を追加する
↓
root causeへ到達
↓
Boss / Finalで総合して解決
```

という共通framingを持つ。

**先に教材を一式履修してからincidentへ戻る構造にしない。**

細かなStory台本、NPC名、台詞、Region固有名はこの文書で固定しない。

---

## 編をまとめる基準

まとめる:

- 同じ実務上の問題を解くために一緒に使う
- 前の概念がそのまま次の概念の土台になる
- 1つのincident / taskとして自然につながる
- Battle上でも同じ種類の「コードを読んで結果を判断する」体験になる

分ける:

- framework固有のruntime / data flow / mental modelが中心になる
- 同じ名前の概念でも読み方が大きく変わる
- 1編へ入れると未習概念が多すぎる
- Story上の仕事が別物になる

共通ルール:

- **各編を固定3 Chapterへ押し込まない**
- Story beat数はincidentの因果と認知負荷から決める
- player-facing番号はarea内Story順で連番にする
- numeric runtime IDはsave / URL互換用であり、chapter番号として使わない
- 新しく学んだ読み方は後beatでも再登場する
- 前の編で学んだ読み方も後の編で再利用する
- Battleはクイズではなくcurrent stateとcodeを読んで意思決定する
- REAL WORLDのproblemとCODE WORLDの異変を同じ原因へつなぐ
- Bossはその編で追っていたroot causeを象徴する
- 未習syntaxを大量に出して難しくしない
- Region表現はlearningを助けるために使い、技術名の装飾だけにしない
- new conceptはRandom Encounterより先にfixed / contextualな導入を置く

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
- `some` / `every`
- `sort`
- optional chaining / nullish coalescing
- `reduce`

### CODE WORLD方向

JavaScriptは自然系Regionとして、Grassland / Village / Forest / Deep Forestを使う。

generic fantasyを消さず、codeはworldのtarget / effectを決めるruleとして存在する。

### 現在採用しているStory構造

JavaScriptは固定3 Chapterではなく19 Story beat。

```text
JS-01  first live incident
↓
JS-02〜04  Villageで読めなかった基礎を確認
↓
JS-05〜09  Forestで同じtraceを追う
↓
JS-10  second symptom
↓
JS-11〜18  Deep Forestでshared traceをroot causeへ追う
↓
JS-19  Code Core Final
```

重要なのはJS-01を最初に置くこと。

Playerは最初から全部のcodeを理解する必要はない。まず症状を体験し、何を読めるようになる必要があるかを知ってからVillageへ進む。

internal Battle IDはlegacy互換のため1 / 7〜22 / 2 / 3等を維持するが、Story順のauthorityにはしない。

---

## 02. TypeScript編 — 型を含むコード読解

JavaScriptの次の1編として扱うが、JavaScriptの番号続きを使わない。player-facing番号は`TS-01...`として独立させる。

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

JavaScript自然Regionの色違いにはしない。

- crystal
- rune
- stone structure
- boundary

など、type / contractを薄く感じるmotifをcandidateとする。

ただし「TypeScriptだから全部青い結晶」に固定しない。

### 現状

現在は3 Story beat:

```text
TS-01 CONTRACT TRACE
→ TS-02 DATA SHAPE
→ TS-03 ROOT CAUSE
```

internal compatibility IDは4 / 5 / 6。

今後beginner Storyを改善する場合も、最初にtechnical termを説明するのではなく、**data shapeの異常を先に体験 → 普通の言葉 → 型情報**の順にする。

必要ならbeat数を増やしてよい。3つを維持すること自体を目標にしない。

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

### 読解theme candidate

前半:

- table / row / column
- `SELECT`
- `WHERE`
- `AND` / `OR`
- `ORDER BY`
- `LIMIT`

中盤:

- `JOIN`
- `NULL`
- `GROUP BY`
- aggregate

root cause側:

- indexの入口
- transaction
- 複数queryの依存関係
- correct resultとslow queryの切り分け

これを固定3分割とは扱わない。1beatに詰め込みすぎるなら分割する。

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

最初は1つの**現象 + 1 Battle**だけ作る。

```text
期待と違う検索結果を見る
↓
queryを読む必要が生まれる
↓
1 Battleで既存queryの結果を判断する
```

確認する:

- queryを読まないとresult rowを判断しにくいか
- safe internal ruleへ落とせるか
- CODE HELP / CODE DATAをDB向けに一般化できるか
- field表現がlearningを助けるか
- REAL WORLDのdata issueとCODE WORLDの異変が同じproblemに見えるか

成功後に、必要なbeat数とfull Regionへ広げる。

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

Storyは「Reactの説明」から始めず、**表示が期待と違う現象を先に体験**してからprops / state / render flowを追う。

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
2. **Playerが最初に体験する現象は何か**
3. その時点で全部理解できなくても、何がおかしいかは感じられるか
4. CODE WORLDでは同じproblemがどう異変として見えるか
5. その問題を理解するために何のcode / dataを読む必要が生まれるか
6. Region表現はmental modelを助けるか
7. 次のStory beatで何が新しく増えるか
8. 前beat・前編の知識をどこで再利用するか
9. Bossは何のroot causeを象徴し、何を総合して読ませるか
10. Battle以外にNPC / World / clueで何を体験させるか
11. 同じ仕事としてまとめられる概念を無駄に別編へ分けていないか
12. framework固有mental modelを無理に混ぜていないか
13. クイズに答えるだけになっていないか
14. engineering framingのためにfantasy RPGの面白さを消していないか
15. 固定Chapter数のために不自然なStory beatを作っていないか
16. player-facing番号とlegacy runtime IDを混同していないか
