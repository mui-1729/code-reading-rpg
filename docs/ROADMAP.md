# CODE//READ RPG ロードマップ

この文書は**次に何を作るか**を管理する。

- 現在の実装一覧: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- game design原則: [`GAME_DESIGN.md`](./GAME_DESIGN.md)
- 世界観 / theme: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- 長期的な学習編: [`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md)

## North Star

`CODE//READ RPG`を、

> **新人エンジニアがREAL WORLDで問題を受け、fantasyなCODE WORLDへ潜り、実際のコードを読んで世界の異変とsystem障害を解決するRPG**

として育てる。

優先順位は機能数ではなく次で決める。

1. code readingが実際のgame decisionになっているか
2. REAL WORLDの問題とCODE WORLDの異変が同じ原因としてつながっているか
3. fantasy RPGとして探索・戦闘・成長する面白さがあるか
4. RPG成長がcode readingを代替していないか
5. 新機能を足す前にcurrent runtimeを保守できるか
6. 同じ仕事として自然にまとめられる概念を細かく分割しすぎていないか

---

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
- JavaScript: Chapter 1 → Chapter 2 → Final Chapter
- TypeScript: Chapter 1 → Chapter 2 → Final Chapter
- Battle間story event / Final briefing / ending
- World NEXT OBJECTIVE
- JavaScript / TypeScriptの累積学習
- TypeScriptはAPI contract incident → optional / unionの波及 → Shared Contract / Frontier Compilerのroot causeまで接続済み

### World direction

方向性として次を採用する。

```text
REAL WORLD
新人エンジニアとしてproblem / incidentを受ける
↓ CONNECT
CODE WORLD
fantasy fieldで同じproblemが異変として現れる
↓
code / dataを読む
↓
Battle / Bossでroot causeへ近づく
↓ RETURN
REAL WORLD
incident解決
```

現在のGrassland / Forest / Gold / Equipment / Treasure等は削除せず、CODE WORLDのRPG表現として活かす。

詳細は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)。

---

## P0 — RPG Economy / Equipment loopを完成させる

Issue: #178

現在はEquipment / Gold / PATCH KIT / Shop / Recoveryの基盤はあるが、

```text
探索 / Battle
→ Gold・Treasureを得る
→ Shopで比較して買う
→ Itemを持つ / Equipmentを装備する
→ InnでGoldを使って回復する
→ 次の探索へ
```

というloopの完成度がまだ低い。

このworld directionでもRPG Economyはそのまま重要なので、先に完成させる。

### #180 — Equipment visual / comparison

- Weapon / Armor / Accessoryをpixel-art icon / card化
- Shop / Pause / Rewardで同じvisual source of truthを利用
- owned / equipped / unavailableを視覚化
- current Equipmentとの差分を比較

### #181 — Item / Inventory

- Equipmentとconsumableの所有状態を分かりやすくする
- Battle / Worldのどこで使えるか明示
- PATCH KIT以外は役割が明確な少数itemだけ追加

### #182 — Gold / Shop

- Battle / Boss / TreasureのGold source整理
- Shopを主要Gold sinkにする
- 所持Gold / price / purchase後残額を分かりやすくする
- grind必須にしない

### #183 — Inn / Recovery

- 無料Recovery PointをInn / Restへ再設計
- Goldを使ったfull recovery
- full HP / insufficient Gold等のfeedback

### #184 — Integration / balance / E2E

- purchase → own → equip
- Battle → reward → Shop → Inn → next Battle
- save compatibility
- balance
- E2E

設計source of truthは[`RPG_ECONOMY_EQUIPMENT_DESIGN.md`](./RPG_ECONOMY_EQUIPMENT_DESIGN.md)。

---

## P0.5 — CODE WORLD framing pass

RPG Economyの後、Database regionを増やす前に、今回決めた二層構造を**最低限プレイヤーへ伝わる実装**へする。

ここで大規模Story rewriteや全map作り直しはしない。

### Opening / CONNECT

- JavaScript Openingで新人エンジニアとして最初のtaskを受ける
- REAL WORLD → CODE WORLDへCONNECTしたと分かるtransition
- 初めてGrasslandへ入った理由を短く伝える
- codeがCODE WORLDのruleであることを最初のplayで理解できる

### Incident framing

- 各編開始時に「何が現実側で壊れているか」を短く提示
- World Objectiveを調査目的へ接続
- Chapter間ではCODE WORLD側の異変がroot causeへ近づくようにする
- Final後はREAL WORLDで解決したことを短く返す

### Region identity

- JavaScript Grasslandは残す
- TypeScript Forestも残す
- generic fantasyだけでなく、その技術のmental modelを薄く感じるvisual motifを足す
- current mapを全削除して作り直さない

### Story presentation

既存story event systemをまず再利用する。

必要になった場合だけ、

- REAL WORLD event
- CODE WORLD event
- remote communication

のpresentation差を追加する。

世界観のためだけに大きなStory engineを先行実装しない。

### Acceptance direction

- 初見で「なぜエンジニアなのに草原で戦っているか」が理解できる
- 草原でコードを読んで戦う面白さを残す
- REAL WORLDとCODE WORLDが別々のStoryにならない
- Gold / Equipment / Inn等のRPG systemを無理にengineering用語へ置換しない

---

## P1 — Battle runtimeを小さな責務へ分ける

`src/App.tsx`は共通Battle runtimeとして成長し、session / action / enemy turn / story / result handoff / presentationのorchestrationが集まっている。

分割候補:

- battle session state / transitions
- player action execution
- enemy turn
- story event bridge
- result handoff
- Battle presentation

条件:

- gameplay変更と混ぜない
- `TargetRule` / generator / solvability / save schemaを変更しない
- Unit / E2Eを先に境界として使う
- abstract化自体を目的にしない

CODE WORLD framingでStory presentationへ変更が必要になる場合、責務分割との競合を見て順番を調整する。

---

## P1 — Database編 prototype

**次に追加する新規learning regionはDatabase編を優先する。**

ただし、今回からBattle mechanicだけでなく**CODE WORLD表現も同時にprototypeする**。

### 学習candidate

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

### prototypeで確認するもの

- queryを読まないと結果rowを判断しにくいか
- current `TargetRule`相当のsafe domainへ落とせるか
- `WHERE → ORDER BY → LIMIT`をgame resultへ自然に反映できるか
- CODE HELP / CODE DATAをDB向けに一般化できるか
- rowをmonsterとして表現する方がよいか、record/cardとして見せる方がよいか
- underground archive / library等のfield representationが理解を助けるか
- REAL WORLDのdata issueとCODE WORLD側の異変が自然につながるか

prototype成功後に3 Chapter + full Regionへ広げる。

---

## P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS Boss共通。

TypeScriptでは型情報そのものを読む意味が出るmechanicを検討する。

候補:

- union / narrowingで解除対象を判断
- optional property有無でBoss stateが変わる
- `keyof` / indexed accessで読む値を切り替える

World direction上は、Shared Contract / Frontier Compilerのroot cause感をgameplayへ寄せる目的も持つ。

---

## P2 — Backend / API編

Database編の次に、request → validation → DB / external API → responseを追う編を作る。

framework固有ではなくbackend共通の読解をまとめる。

候補:

- HTTP method / status
- request / response
- JSON / validation
- async / await
- error handling
- DB access
- timeout / retry
- authentication / authorization基礎

CODE WORLDではgate / road / port / network等、「何かがsystem間を移動する」field表現をcandidateとするが、Story詳細とbiomeは実装時に決める。

---

## P2 — React編

Reactはcomponent / props / state / render flowという固有mental modelがあるため独立編。

候補:

- props
- state
- event handler
- derived state
- list key
- Effect
- stale state / render loop

CODE WORLDではmachine city / living UI district等、state変化でworld presentationが変化する表現を検討する。

---

## P3 — framework固有編

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

framework固有のruntime / data flow / mental modelが大きいものは無理に統合しない。

---

## P3 — 横断的な実務編

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

最終的な総合編。

各編はREAL WORLDの仕事とCODE WORLDのRegion表現を同じproblemへつなぐ。

---

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

この順序はlearning contentの順序。

World / RPG基盤の改善は別軸で先に進めてよい。

---

## Party / Equipment depth

RPG Economy loopを完成させた後、必要性が出たときだけ追加する。

候補:

- 2人目companion
- heal / support role
- party equipmentの意味を強化
- trade-offのある少数Equipment

追加しない:

- 自動target判定
- auto battle
- 完全上位互換Equipmentの大量追加
- grindだけでcode readingを無視できる成長

---

## Maintenance backlog

機能開発とは分けて扱う。

- legacy Field / Quest content definitionの残存参照を段階的に減らす
- `WorldPage.tsx` / `PauseMenu.tsx`のpresentation分割は変更理由が明確になった時点で行う
- historical docsはcurrent source of truthと混ざらないよう分類
- save compatibility fieldはunusedだけを理由に即削除しない

---

## 当面増やさないもの

- Stage Select / Area Select
- 複雑なQuest Log
- 大量の常設HUD
- Worldサイズだけを増やすmap expansion
- Login / Cloud Save / Ranking
- office map / meeting / Slack等を主gameplayにするreal-world simulator
- 全Enemy / Gold / Inn等をengineering metaphorへ置換するredesign

---

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
