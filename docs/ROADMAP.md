# CODE//READ RPG ロードマップ

この文書は**次に何を作るか**だけを管理する。現在の実装一覧は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、守る設計原則は[`GAME_DESIGN.md`](./GAME_DESIGN.md)を参照する。

## North Star

`CODE//READ RPG`を、**1つの2D Worldを探索し、エンジニアとして起きている問題をコードを読んで解決するRPG**として育てる。

優先順位は「機能数」ではなく次で決める。

1. コード読解が実際の意思決定になっているか
2. 既存contentがstory / learningとして一貫しているか
3. 新機能を足す前にcurrent runtimeを保守できるか
4. RPG要素が読解を代替していないか

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

## P0 — TypeScript編を現在のJavaScript品質へ揃える

TypeScript regionはplayableだが、story / objective / character presentationの統一度がJavaScriptより低い。

### Goal

3つのBattleを「型の食い違いを追う1つの仕事」としてつなぐ。

候補:

1. Chapter 1 — API / data contractの型ずれを発見
2. Chapter 2 — optional / unionを含む複数箇所へ影響が広がる
3. Final — shared contract / compiler-side failureの根本原因を止める

### Acceptance direction

- 前Chapterのsyntaxを後Chapterでも使う
- World Objective / NPC / briefing / result copyを同じ事件へ揃える
- BossがTypeScriptの型情報を読む総合問題になる
- JavaScript編をコピーしただけのstoryにしない
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

## P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS Boss共通。TypeScript側では型情報そのものを読む意味が出るmechanicを検討する。

候補:

- union / narrowingで解除対象を判断
- optional property有無でBoss stateが変わる
- `keyof` / indexed accessで読む値を切り替える

条件:

- 表示コードから理解できる
- target / correct previewを出さない
- 常設説明panelを増やさない
- pure resolver + testで固定できる

## P2 — Third learning region prototype

本実装の前に**1 Battleだけprototype**し、現在のcode-reading Battle loopと相性を確認する。

### React候補

長所:

- JS → TS → ReactのWeb frontend学習順が自然
- props / state / render flow / derived dataを扱える

難所:

- 現在のtarget-selection Battleへcomponent lifecycle / state問題を自然に写像する設計が必要

### SQL候補

長所:

- WHERE / AND / OR / ORDER BY / LIMIT / JOINが現在のdata-selection Battleと相性がよい
- 「どのrowが返るか」をゲーム結果へ対応させやすい

難所:

- JS → TSの直後の学習順として何をstory上の仕事にするか決める必要がある

prototypeで確認するもの:

- コードを読まないと結果を判断しにくいか
- 現行`TargetRule`相当のsafe domainへ落とせるか
- 3 Chapterへ難易度を累積できるか
- Open Worldへregionを増やす価値があるか

## P2 — Party / Equipment depth

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
- Backend / Login / Cloud Save / Ranking

Backendは複数端末同期、共有challenge、account等の具体的要件が出た時点で検討する。

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
