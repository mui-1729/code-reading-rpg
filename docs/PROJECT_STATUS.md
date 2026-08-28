# CODE//READ RPG — Project Status

最終更新: 2026-08-28

この文書は、**このゲームが何を目指していて、今どこまで実装され、次に何を作るべきか**を短く把握するためのcurrent snapshotです。

## 1. 目的

`CODE//READ RPG`は、コードを書く練習ではなく、**既存コードを読んで「現在のstateに対して何が起きるか」を判断する力をRPGとして鍛えるゲーム**です。

現在採用する世界観:

> **新人エンジニアとしてREAL WORLDでsystem problemを受け、fantasyなCODE WORLDへ潜り、実際のコードを読んで世界の異変とincidentのroot causeを解決する。**

詳細は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)。

コア原則:

- Battleのtarget判断は表示コードを読んで行う
- codeはCODE WORLDのtarget / effect / stateを決めるruleとして扱う
- REAL WORLD problemとCODE WORLD symptomを同じ原因としてつなぐ
- fantasy RPGらしさを残し、office simulatorへ寄せ切らない
- RPG成長は読解を代替せず、HP / damage / defenseの余裕を作る
- 同じSkill名や固定手順の暗記だけで攻略しにくくする
- 1つのWorldを探索しながらlearning contentへ入る
- framework固有mental modelが大きいものは無理に統合しない

## 2. 現在のプレイ構造

```text
Title
↓
REAL WORLD briefing
新人エンジニアとしてincidentを受ける
↓ CONNECT
CODE WORLD
Open Worldを探索
├─ JavaScript Grassland
├─ Central Hub
└─ TypeScript Forest
↓
Random Encounter / Fixed Boss
↓
Code Reading Battle
↓
EXP / Gold / Level / Item / Equipment / Story
↓
root cause修復
↓ RETURN
REAL WORLD
incident close
```

通常導線にStage Select / Area Select /専用Complete画面はありません。旧URLは互換redirectだけ残します。

## 3. World framing — 最小実装済み

Issue #194で、`WORLD_DIRECTION.md`の二層構造を既存Story systemへ載せた。

### Opening

初回START:

1. `REAL WORLD` — Development Roomで新人エンジニアとして最初のincidentを受ける
2. `REAL WORLD` — monitor / logからtarget bugを確認
3. `CONNECT` — systemを探索可能なCODE WORLDとして展開
4. `CODE WORLD` — JavaScript Grasslandで同じbugが異変として見える
5. `CODE WORLD` — BYTE合流と最初の調査目的を受ける

Openingでは「code = CODE WORLDのrule」を明示する。

### Battle Story

既存`BattleStoryEvent`へline単位のworld layer metadataを追加。

表示可能なlayer:

- `REAL WORLD`
- `CONNECT`
- `CODE WORLD`
- `REMOTE LINK`
- `RETURN // REAL WORLD`

新しいStory engineは作っていない。

### JavaScript

- REAL WORLD: 戦闘systemが違うenemyをtargetにするincident
- CODE WORLD: JavaScript Grasslandの戦闘異常
- root cause: Code Core
- Final後: CODE WORLD修復 → RETURN → REAL WORLD monitor正常化 → incident close

### TypeScript

- Battle 4前に別のREAL WORLD incidentとしてbriefing
- Enemy API update後のtarget / config異常
- CODE WORLD: TypeScript Frontierのcontract異常
- root cause: Shared Contract / Frontier Compiler
- Final後: RETURN → REAL WORLD incident close

### World Objective

調査目的を:

- `INVESTIGATE`
- `ROOT CAUSE`
- `INCIDENT CLOSED // RETURN`

として表現する。

JavaScript Grassland / TypeScript Forest / Gold / Equipment / monster等はCODE WORLDのfantasy RPG要素として維持する。

## 4. Story / onboarding

実装済み:

- REAL WORLD → CONNECT → CODE WORLD Opening
- JavaScript 3章の一続きのstory
  - Chapter 1: 最初のバグ
  - Chapter 2: 広がるバグ
  - Final: 暴走するCode Core
- TypeScript 3章の一続きのstory
  - Chapter 1: API契約の食い違い
  - Chapter 2: 消える設定値
  - Final: 壊れたShared Contract
- Chapter間 / Boss前 / clear後Story event
- REAL WORLD / CODE WORLD / REMOTE / RETURN layer presentation
- World NEXT OBJECTIVE
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- Tutorial skip / replay

## 5. World

- 40 × 28連続World
- 11 × 9 viewport + camera follow
- 4方向探索
- JavaScript / TypeScript / Hub terrain分離
- Random Encounter + cooldown
- fixed Boss
- Hub Shop
- Hub Inn / Rest
- JS / TS one-shot Treasure
- BYTE join / previous-tile follower
- World Objective / progress feedback
- movement / encounter / interaction pure resolver

## 6. Battle / learning

- JavaScript Battle 1〜3
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- safe internal `TargetRule`。表示コードを`eval()`しない
- seeded Enemy / Skill / code variation
- Encounterごとのsemantic code variation
- multiline code + line-by-line CODE HELP
- CODE DATA inspector
- solvability / uniqueness regression tests
- Boss GUARD mechanic
- staged result sequence

## 7. RPG / Economy — 完成済み

Epic #178 / #179〜#184はcompleted。

### Equipment

- Weapon / Armor / Accessory
- 全8装備の共通pixel SVG visual
- Shop / Pause / Reward共通presentation
- currentとの差分
- owned / equipped / unavailable表示
- purchaseしても自動equipせず明示equip

### Item

PATCH KIT:

- 30 G
- HP +24
- Battle only
- 1 use / Battle
- common item definition / visual
- READY / NO STOCK / HP FULL / USED / ACTION LOCKED

### Gold / Shop / Inn

- Shop: WALLET / PRICE / AFTER / SHORT
- Inn: fixed 20 G full recovery
- HP full no charge
- insufficient Gold no state mutation
- first-clear Gold 100%
- replay Gold 50% floor

JavaScript:

```text
first clear 3 battles = 100 G
DEBUG CACHE           =  20 G
one full replay       =  50 G
current Shop total    = 195 G
```

1周replayだけでShopを即買い切れない。

### Economy integration

E2Eで:

```text
Battle Gold
→ Shop purchase
→ EQUIP NOW
→ Inn
→ reload
→ next Battle
```

を検証済み。

## 8. Persistence / quality

- `PlayerProgress` schema v4
- `RpgState` schema v3
- Tutorial state別storage
- Sound settingsをprogress resetから分離
- old save migration / invalid value normalization
- Economyを含むlegacy simultaneous restore test
- reset behavior test
- mobile Shop / Inn / Pause overflow regression
- Vitest Unit Test
- Playwright E2E
- GitHub Actions
- Cloudflare Workers Preview / Production

## 9. 現在残っている整理対象

### Legacy code

Open World化前のField / Quest / Area dataの一部が残る。

- `/javascript/field` / `/typescript/field`は`/world`へredirect
- 旧Field content definitionはlearning / story regression testで一部利用
- 旧Field React page / route componentは削除済み
- `completedSideQuestIds`はsave migration互換で残す

unused UIと、互換・test fixtureとして意味があるdataを分ける。

### Large orchestration components

- `src/App.tsx` — Battle runtime orchestrationが大きい
- `src/world/WorldPage.tsx` — resolver分離済みだがUI adapter責務が多い
- `src/ui/PauseMenu.tsx` — 6 tabs presentationが1file

挙動変更と混ぜず、必要性が明確なIssueで分割する。

## 10. 次に実装する優先候補

### P1 — Battle runtime responsibility split

- session state / transitions
- player action execution
- enemy turn
- story event bridge
- result handoff
- presentation

framing実装でStory presentationの境界が明確になったため、Database拡張前の整理候補。

### P1 — Database編 prototype

3つ目のlearning regionはDatabase編を優先。

candidate:

- table / row / column
- SELECT / WHERE
- AND / OR
- ORDER BY / LIMIT
- JOIN
- NULL
- GROUP BY / aggregate
- index / transaction入口

prototypeではBattle成立だけでなく:

- rowをmonster / record / card / world objectのどれで見せるか
- underground archive / library等のfield表現が理解を助けるか
- REAL WORLD data problemとCODE WORLDの異変を同じroot causeへつなげられるか

を確認する。

### P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS共通。

TypeScriptではunion / narrowing / optional / `keyof`がBoss stateへ直接関わるmechanicを検討する。

## 11. 長期learning content

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

## 12. 当面やらない

- Stage Select / Area Select復活
- 大量Quest Log /常設HUD
- Login / Cloud Save / Ranking
- auto target / auto battle
- 数値だけ違うEquipment大量追加
- Worldサイズだけを増やすmap expansion
- office map / meeting / Slack操作等のreal-world simulation
- fantasy要素をtechnical UIへ全面置換するredesign

Backend / API編はlearning contentとして作る。ゲーム自体へserver / loginを導入する意味ではない。

## 13. 決定済みの大きな方向

- REAL WORLD新人エンジニア + fantasy CODE WORLD二層構造
- codeはCODE WORLDのruleとして実際のtarget / effectを決める
- JavaScript Grassland / TypeScript Forestは残す
- 現実側problemとCODE WORLD側symptomを同じ原因へ接続
- Final後はRETURNしてREAL WORLD incidentをclose
- RPG systemをengineering metaphorへ無理に変換しない
- JavaScript / TypeScriptは3 Chapter構造
- 3つ目の新規regionはDatabase編
- Databaseの次はBackend / API、その後React / Next.js / TanStack候補
- RPG Economy / Equipment loopは完成済み

今後は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)を世界観のsource of truthとして、新Regionも必ずREAL WORLD problem → CODE WORLD symptom → root cause → RETURNを定義してから実装する。
