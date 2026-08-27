# CODE//READ RPG ロードマップ

この文書は**次に何を作るか**だけを管理する。現在の実装一覧は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、守る設計原則は[`GAME_DESIGN.md`](./GAME_DESIGN.md)、長期的な学習編の構成は[`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md)を参照する。

## North Star

`CODE//READ RPG`を、**1つの2D Worldを探索し、エンジニアとして起きている問題をコードを読んで解決するRPG**として育てる。

優先順位は「機能数」ではなく次で決める。

1. コード読解が実際の意思決定になっているか
2. 既存contentがstory / learningとして一貫しているか
3. 新機能を足す前にcurrent runtimeを保守できるか
4. RPG要素が読解を代替していないか
5. 同じ仕事として自然にまとめられる概念を細かく分割しすぎていないか

## Baseline — 実装済み

### World / progression

- 40 × 28 Open World + 11 × 9 camera viewport
- JavaScript Grassland / Central Hub / TypeScript Forest
- Random Encounter / cooldown / fixed Boss
- World action pure resolver
- World Objective / progress feedback
- persistent HP / Hub Recovery Point
- one-shot Treasure
- selectable Hub Shop
- BYTE join / follower
- PlayerProgress v4 / RpgState v3 + migration / validation

### Battle / learning

- JavaScript Battle 1〜3
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- seeded generation / solvability
- Encounterごとのsemantic code variation
- multiline + line-by-line CODE HELP
- CODE DATA inspector
- Boss GUARD
- staged result sequence

### RPG / UI

- EXP / Level / Gold
- Attack / Defense / Max HP
- Weapon / Armor / Accessory + role差
- PATCH KIT
- BYTE follow-up
- Pause: STATUS / ITEMS / EQUIPMENT / PARTY / CODEX / SYSTEM
- Tutorial + replay
- 8-bit World / character / weapon visual

### Story

- JavaScript Opening
- Chapter 1 → Chapter 2 → Final Chapterの因果関係
- Battle間story event / Final briefing / ending
- World NEXT OBJECTIVE
- JavaScript syntaxの累積学習

以前のRoadmapにあったWorld Objective、legacy runtime cleanup、World resolver、RpgState validation、Open World E2E、Treasure、Equipment Shop、Boss mechanicはすべてbaselineへ移動済み。

## P0 — TypeScript編をJavaScript編と同じ「編」の品質へ揃える

JavaScript / TypeScriptは別の仕組みとして扱うのではなく、どちらも**3 Chapterで1つの仕事を追う学習編**として統一する。

TypeScript regionはplayableだが、story / objective / character presentationの統一度がJavaScriptより低い。

### Goal

3つのBattleを「型の食い違いを追う1つの仕事」としてつなぐ。

方向:

1. Chapter 1 — 型の食い違いを発見
2. Chapter 2 — optional / unionを含む複数箇所へ影響が広がる
3. Final — shared contractの根本原因を止める

### Acceptance direction

- 前Chapterのsyntaxを後Chapterでも使う
- World Objective / NPC / briefing / result copyを同じ事件へ揃える
- BossがTypeScriptの型情報を読む総合問題になる
- JavaScript編と同じ構成品質にするがstory内容はコピーしない
- Battle engineを複製しない

## P1 — Battle runtimeを小さな責務へ分ける

`src/App.tsx`は共通Battle runtimeとして成長し、session / action / enemy turn / story / result handoff / presentationのorchestrationが集まっている。

分割候補:

- battle session state / transitions
- player action execution
- enemy turn
- story event bridge
- result handoff
- Battle presentation

### 条件

- gameplay変更と混ぜない
- `TargetRule` / generator / solvability / save schemaを変更しない
- Unit / E2Eを先に境界として使う
- 「抽象化すること」自体を目的にしない

## P1 — Database編 prototype

**次に追加する新規learning regionはDatabase編を優先する。**

`SQL編`として狭く切らず、DBを扱う仕事として次を段階的にまとめる。

### Chapter候補

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

### まず1 Battle prototypeする

SQL / DBは現在のtarget-selection Battleと相性がよいが、いきなり3 Chapterを作らない。

prototypeで確認するもの:

- queryを読まないと結果rowを判断しにくいか
- 現行`TargetRule`相当のsafe domainへ落とせるか
- Enemyではなくrowとして見せた方が理解しやすいか
- `WHERE → ORDER BY → LIMIT`をBattle結果へ自然に反映できるか
- CODE DATA / CODE HELPをDB用にどう一般化するか

prototype成功後にWorld region / story / 3 Chapter化する。

## P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS Boss共通。TypeScript側では型情報そのものを読む意味が出るmechanicを検討する。

候補:

- union / narrowingで解除対象を判断
- optional property有無でBoss stateが変わる
- `keyof` / indexed accessで読む値を切り替える

Database prototypeと独立して進められるが、Battle runtime分割と競合する場合はruntime整理を先にする。

## P2 — Backend / API編

Database編の次に、request → validation → DB / external API → responseを追う編を作る。

framework固有ではなく、backend共通の読解をまとめる。

候補:

- HTTP method / status
- request / response
- JSON / validation
- async / await
- error handling
- DB access
- timeout / retry
- authentication / authorization基礎

Express / Hono / Nest等はこの編の中心にしない。

## P2 — React編

Reactはcomponent / props / state / render flowという固有mental modelがあるため、Backend等とまとめず独立編にする。

候補:

- props
- state
- event handler
- derived state
- list key
- Effect
- stale state / render loop

Database編より後にする。

## P3 — framework固有編

frameworkは無理に1つへまとめない。

### Next.js編

- App Router
- Server / Client Component
- data fetching
- Server Action
- cache / revalidation

### TanStack編

- TanStack Router
- TanStack Query
- 必要ならTanStack Start

Router / Queryだけなら1編にまとめる。TanStack Startまで含めて大きくなりすぎる場合は将来分離する。

## P3 — 横断的な実務編

細かい技術名ごとに分けず、同じ仕事としてまとめる。

### Team Development / Delivery編

- Git / diff / branch / PR / review
- Unit / Integration / E2E
- CI / build / deploy / rollback

### Security編

- authn / authz
- permission
- validation
- trust boundary
- session / token
- XSS / injection等の入口

### Production / Performance編

- logs / stack trace
- metrics / traces
- latency
- N+1
- cache / batching
- incident response

### Architecture / Refactoring編

最終的な総合編として扱う。

## 推奨する長期順序

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

この順序は固定のカリキュラムではなく、各prototypeの結果で調整してよい。

## Party / Equipment depth

必要性が出たときだけ追加する。

候補:

- 2人目companion
- heal / support role
- party equipmentの意味を強化
- trade-offのある少数Equipment

追加しないもの:

- 自動target判定
- auto battle
- 完全上位互換Equipmentの大量追加
- grindだけでコード読解を無視できる成長

## Maintenance backlog

機能開発とは分けて扱う。

- legacy Field / Quest content definitionの残存参照を段階的に減らす
- `WorldPage.tsx` / `PauseMenu.tsx`のpresentation分割は、変更理由が明確になった時点で行う
- historical docsはcurrent source of truthと混ざらないようindex上で分類する
- save compatibility fieldは「unusedだから」で即削除しない

## 当面増やさないもの

- Stage Select / Area Select
- 複雑なQuest Log
- 大量の常設HUD
- Worldサイズだけを増やすmap expansion
- Login / Cloud Save / Ranking

Backend学習編は追加しても、ゲーム自体のbackend infrastructureを即導入する意味ではない。ゲーム側のBackendは複数端末同期、共有challenge、account等の具体的要件が出た時点で検討する。

## 新機能のQuality gate

PR前:

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

PR後:

```text
GitHub Actions
Cloudflare Preview
Self Review
Squash Merge
main CI
Cloudflare Production
```
