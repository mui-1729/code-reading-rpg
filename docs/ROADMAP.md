# CODE//READ RPG ロードマップ

この文書は**次に何を作るか**を管理する。

- 現在の実装一覧: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- game design原則: [`GAME_DESIGN.md`](./GAME_DESIGN.md)
- 世界観 / theme: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- 長期的な学習編: [`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md)
- Economy current rule: [`ECONOMY.md`](./ECONOMY.md)

## North Star

`CODE//READ RPG`を、

> **新人エンジニアがREAL WORLDでproblem / incidentを受け、fantasyなCODE WORLDへ潜り、実際のコードを読んで世界の異変とsystem障害のroot causeを解決するRPG**

として育てる。

優先順位は機能数ではなく次で決める。

1. code readingが実際のgame decisionになっているか
2. REAL WORLDのproblemとCODE WORLDの異変が同じ原因としてつながっているか
3. fantasy RPGとして探索・戦闘・成長する面白さがあるか
4. RPG成長がcode readingを代替していないか
5. current runtime / save / testsを壊さず拡張できるか
6. 同じ仕事・同じmental modelでまとめられる概念を細かく分割しすぎていないか

---

## Baseline — 実装済み

### World / progression

- 40 × 28 Open World + 11 × 9 camera viewport
- JavaScript Grassland / Central Hub / TypeScript Forest
- Random Encounter / cooldown / fixed Boss
- World action pure resolver
- World Objective / progress feedback
- persistent HP
- one-shot Treasure
- selectable Hub Shop
- paid Hub Inn / Rest
- BYTE join / follower
- `PlayerProgress v4` / `RpgState v3` + migration / validation

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

### RPG / Economy

Issue #178は**完了**。

```text
探索 / Battle
→ Gold / Treasure
→ Shopで比較・購入
→ Item / Equipmentを準備
→ InnでGoldを使って回復
→ 次の探索 / Battle
```

実装済み:

- Weapon / Armor / Accessory全8装備の共通pixel visual registry
- Shop / Pause / Rewardで共通Equipment presentation
- current装備との差分
- AVAILABLE / OWNED / EQUIPPED / UNAVAILABLE
- purchase → owned → explicit equip
- PATCH KIT共通Item catalog / visual / usage reason
- Shop quote: WALLET / PRICE / AFTER / SHORT
- Inn 20 G fixed full recovery
- HP full no charge / insufficient Gold no mutation
- first-clear Gold 100% / replay Gold 50% floor
- Battle → Shop → Equip → Inn → reload → next Battleの統合E2E
- legacy save / reset / mobile dialog regression

#179〜#184はすべてcompleted。

---

## P0.5 — CODE WORLD framing pass

Issue #194。

`WORLD_DIRECTION.md`で決めた二層構造を、既存Story systemを再利用して**プレイヤーが実際に理解できるpresentation**へする。

### 実装する最小flow

```text
REAL WORLD
新人エンジニアとしてincidentを受ける
↓ CONNECT
CODE WORLD
同じproblemがfantasy worldの異変として見える
↓
code / stateを読んでroot causeへ進む
↓ RETURN
REAL WORLD
修復結果が同期されincident close
```

### Opening

- first STARTはREAL WORLDのDevelopment Roomから始める
- 新人エンジニアとして最初のtaskを受ける
- incident monitor / logを確認する
- `CONNECT`を明示する
- CODE WORLDではcodeがworld ruleであると伝える
- JavaScript Grasslandへ入った理由を同じincidentへ接続する

### Story presentation

既存`BattleStoryEvent`を再利用する。

lineごとに次のlayerを表示可能にする。

- `REAL WORLD`
- `CONNECT`
- `CODE WORLD`
- `REMOTE LINK`
- `RETURN // REAL WORLD`

Story engineを新設せず、既存event dataへpresentation metadataを足す。

### JavaScript / TypeScript

JavaScript:

- 草原のtarget異常 = REAL WORLD戦闘systemのtarget bug
- Chapter間はCODE WORLD symptomとREAL WORLD traceを同じroot causeへ寄せる
- Code Core修復後にRETURN
- REAL WORLDで最初のincidentをclose

TypeScript:

- Battle 4開始前に別のREAL WORLD incidentとしてbriefing
- API update後の異常とTypeScript Frontierの症状を同じproblemとして扱う
- Frontier Compiler修復後にRETURN
- REAL WORLDでincident close

### World Objective

単なる「次のBattle」ではなく:

- `INVESTIGATE`
- `ROOT CAUSE`
- `INCIDENT CLOSED / RETURN`

として調査目的を明示する。

### Preserve

変更しない:

- JavaScript Grassland / TypeScript Forest
- monster / Treasure / Gold / Equipment / Shop / Inn
- Open World map構造
- Battle resolver
- `TargetRule`
- generator / correct target / solvability
- save schema

---

## P1 — Battle runtime responsibility split

`src/App.tsx`はBattle session / action / enemy turn / story / result handoff / presentationのorchestrationが集まっている。

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
- Unit / E2Eを境界として先に使う
- abstract化自体を目的にしない

---

## P1 — Database編 prototype

**次に追加する新規learning regionはDatabase編を優先する。**

Battle mechanicだけでなく、technical modelとCODE WORLD表現を同時にprototypeする。

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

- index入口
- transaction
- 複数queryの依存関係

### prototypeで確認するもの

- queryを読まないとresult rowを判断できないか
- current `TargetRule`相当のsafe domainへ落とせるか
- `WHERE → ORDER BY → LIMIT`をgame resultへ自然に反映できるか
- CODE HELP / CODE DATAをDB向けに一般化できるか
- rowをmonster / record / card / world objectのどれで見せるか
- underground archive / library / mine等の表現が理解を助けるか
- REAL WORLDのdata issueとCODE WORLDの異変を同じ原因へ接続できるか

prototype成功後に3 Chapter + full Regionへ広げる。

---

## P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS Boss共通。

TypeScriptでは型情報そのものを読む意味が出るmechanicを検討する。

候補:

- union / narrowingで解除対象を判断
- optional property有無でBoss stateが変わる
- `keyof` / indexed accessで読む値を切り替える

Shared Contract / Frontier Compilerというroot causeをgameplayへ寄せるための候補であり、単に難易度を上げるためには追加しない。

---

## 長期learning順序

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

詳細は[`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md)。

World / RPG基盤改善はこのlearning順序とは別軸で進めてよい。

---

## Party / Equipment depth

Economy loopは完成済み。追加は必要性が出た場合だけ行う。

候補:

- 2人目companion
- heal / support role
- party equipmentの意味を強化
- trade-offのある少数Equipment

追加しない:

- auto target
- auto battle
- 完全上位互換Equipmentの大量追加
- grindだけでcode readingを無視できる成長

---

## Maintenance backlog

- legacy Field / Quest content definitionの残存参照を段階的に減らす
- `WorldPage.tsx` / `PauseMenu.tsx`のpresentation分割は変更理由が明確なIssueで行う
- `App.tsx`の責務分割をgameplay変更と混ぜない
- historical docsはcurrent source of truthと混ざらないよう分類する
- save compatibility fieldはunusedだけを理由に即削除しない

---

## 当面増やさないもの

- Stage Select / Area Select
- 複雑なQuest Log
- 大量の常設HUD
- Worldサイズだけを増やすmap expansion
- Login / Cloud Save / Ranking
- office map / meeting / Slack等をmain gameplayにするreal-world simulator
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
