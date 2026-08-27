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
- REAL WORLDのproblemとCODE WORLDの異変を同じ原因としてつなぐ
- fantasy RPGらしさを残し、office simulatorへ寄せ切らない
- RPG成長は読解を代替せず、HP / damage / defenseの余裕を作る
- 「正解ボタンを当てるクイズ」ではなく、読んだ結果がそのままBattleへ反映される
- 同じSkill名や固定手順の暗記だけで攻略しにくくする
- 1つのWorldを探索しながらlearning contentへ入る
- 同じ仕事・同じ思考でまとめられる概念は1つの編にまとめる
- React / Next.js等、固有mental modelが大きいものは無理に統合しない

## 2. 現在のプレイ構造

```text
Title
↓
JavaScript Opening（初回）
↓
Open World
├─ JavaScript Grassland
├─ Central Hub
└─ TypeScript Forest
↓
Random Encounter / Fixed Boss
↓
Code Reading Battle
↓
EXP / Gold / Level / Equipment / Story event
↓
残HP・World座標を保持してWorldへ戻る
```

通常導線にStage Select / Area Select /専用Complete画面はありません。旧URLは互換redirectだけ残します。

現時点ではREAL WORLD → CODE WORLDの二層構造は**方向性として決定済みだが、Opening / CONNECT表現はまだ専用実装されていません**。

現在のGrassland / Forestは削除せず、CODE WORLDの技術regionとして再解釈します。

## 3. 実装済み

### Story / onboarding

- 初回JavaScript Opening
- JavaScript 3章の一続きのstory
  - Chapter 1: 最初のバグ
  - Chapter 2: 広がるバグ
  - Final: 暴走するCode Core
- TypeScript 3章の一続きのstory
  - Chapter 1: API契約の食い違い
  - Chapter 2: 消える設定値
  - Final: 壊れたShared Contract
- TypeScriptはEnemy API更新後のincidentを、型注釈 → union / optional → narrowing / generic / keyofの順に追う
- Chapter間 / Boss前 / clear後のstory event
- JavaScript / TypeScript共通のbattle story resolver
- World上のNEXT OBJECTIVE
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- Tutorial skip / replay

### World

- 40 × 28の連続World
- 11 × 9 viewport + camera follow
- 4方向探索
- JavaScript / TypeScript / Hubのterrain分離
- Random Encounter + cooldown
- fixed Boss
- Hub Shop
- Hub Recovery Point
- JS / TSのone-shot Treasure
- BYTE join / previous-tile follower
- World Objective / progress feedback
- movement / encounter / interactionはpure resolver経由

### Battle / learning

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

### RPG

- EXP / Level / Gold
- persistent current HP
- Attack / Defense / Max HP
- Weapon / Armor / Accessory
- role差のあるEquipment
- PATCH KIT
- selectable Hub Shop
- BYTE party follow-up
- Boss / Treasure equipment reward
- Pause: STATUS / ITEMS / EQUIPMENT / PARTY / CODEX / SYSTEM

### Persistence / quality

- `PlayerProgress` schema v4
- `RpgState` schema v3
- Tutorial stateを別storageで管理
- Sound settingsをgame progress resetから分離
- old save migration / invalid value normalization
- Vitest Unit Test
- Playwright E2E
- GitHub Actions
- Cloudflare Workers Preview / Production

## 4. World direction — 決定済み / 未実装

現在の大きな方向は次。

```text
REAL WORLD
新人エンジニアとしてtask / incidentを受ける
↓ CONNECT
CODE WORLD
softwareがfantasy worldとして見える
↓
NPC / Treasure / Battle / Boss
↓
code / dataからroot causeを理解する
↓ RETURN
REAL WORLD
incident解決
```

### 残すもの

- JavaScript Grassland
- TypeScript Forest
- monster
- Treasure
- Gold
- Equipment
- Item
- Shop
- Inn / Recovery
- Party
- Battle engine

### 今後追加 / 改修するもの

- REAL WORLDでのshort task / incident briefing
- CODE WORLDへ入ったと分かるCONNECT transition
- Final後のRETURN / closure
- World Objectiveと調査目的の接続
- REAL WORLD NPCとCODE WORLD NPCの役割整理
- 技術ごとのRegion identity
- Bossをroot causeの象徴として見せるpresentation
- Database以降でtechnical modelとfantasy representationを同時prototype

### やらないこと

- 草原を全部server roomへ置換する
- monsterを全部technical cardへ置換する
- Gold / Inn / Equipmentをengineering metaphorへ強制変換する
- office simulationをmain gameplayにする
- 世界観変更を理由にOpen World / Battleを作り直す

## 5. 現在残っている整理対象

### Legacy code

Open World化前のField / Quest / Area UIの一部dataがrepositoryに残っています。

現在の扱い:

- `/javascript/field` / `/typescript/field` routeは`/world`へredirect
- 旧Fieldのcontent definitionは学習 / story regression testで一部利用
- 旧FieldのReact page / route componentは削除済み
- `AreaShop`はWorld Shopへ置換済み
- `QuestVictoryFeedback`はWorld progress feedbackへ置換済み
- `completedSideQuestIds`はsave migration互換のため残す

**unused UIと、互換・test fixtureとしてまだ意味があるdataを分ける**。

### Large orchestration components

- `src/App.tsx` — Battle runtime orchestrationが大きい
- `src/world/WorldPage.tsx` — resolverは分離済みだがUI adapter責務が多い
- `src/ui/PauseMenu.tsx` — 6 tabs分のpresentationが1fileに集まる

挙動変更と混ぜず、必要性が明確なIssueで分割する。

## 6. 次に実装する優先候補

### P0 — RPG Economy / Equipment loop

Issue #178配下の#180〜#184。

```text
探索 / Battle
→ Gold・Treasure
→ Shop
→ Item / Equipment
→ Inn
→ 次の探索
```

やること:

- Equipmentをpixel-art icon / card化
- owned / equipped / unavailableを視覚化
- Item / Inventory UX
- Gold source / sink / price balance
- 無料Recovery PointをInn / Restへ再設計
- save compatibility / E2E

このworld directionでも、Gold / Equipment / InnはCODE WORLD側のRPG systemとしてそのまま重要。

### P0.5 — CODE WORLD framing pass

RPG Economy後、Database region追加前に最低限実装する。

- first task / incident briefing
- REAL WORLD → CODE WORLD CONNECT
- Final後のRETURN / closure
- JavaScript / TypeScriptのStory copyを二層構造へ合わせる
- Region identityの最小整理
- World Objectiveを調査目的へ接続

大規模map rewriteはしない。

### P1 — Battle runtime responsibility split

候補:

- Battle session state / transition
- player action execution
- enemy turn
- story event integration
- result handoff
- presentation

### P1 — Database編 prototype

3つ目のlearning regionはDatabase編を優先。

扱うcandidate:

- table / row / column
- SELECT / WHERE
- AND / OR
- ORDER BY / LIMIT
- JOIN
- NULL
- GROUP BY / aggregate
- index / transaction入口

prototypeではBattle成立だけでなく、

- rowをmonster / record / cardのどれで見せるか
- underground archive等のfield表現が理解を助けるか
- REAL WORLDのdata problemとCODE WORLDの異変がつながるか

も確認する。

### P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS共通。

TypeScriptではunion / narrowing / optional / `keyof`等がBoss stateへ直接関わるmechanicを検討する。

### P2以降 — 長期learning content

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

## 7. 当面やらない

- Stage Select / Area Select復活
- 大量のQuest Log /常設HUD
- game infrastructureとしてのLogin / Cloud Save
- Ranking
- auto target / auto battle
- 数値だけ違うEquipment大量追加
- Worldサイズだけを増やすmap expansion
- office map / meeting / Slack操作等のreal-world simulation
- fantasy要素をtechnical UIへ全面置換するredesign

Backend / API編はlearning contentとして作る。ゲーム自体へserver / loginを導入する意味ではない。

## 8. 決定済みの大きな方向

- REAL WORLDの新人エンジニア + fantasy CODE WORLDの二層構造を採用
- codeはCODE WORLDのruleとして実際のtarget / effectを決める
- JavaScript Grassland / TypeScript Forestは消さず、技術regionとして活かす
- 現実側のproblemとCODE WORLD側の異変を同じ原因へ接続する
- RPG systemをengineering metaphorへ無理に変換しない
- JavaScript / TypeScriptは同じ3 Chapter構造の「〜編」として揃える
- TypeScript編も1つのincidentを追うstory structureに統一済み
- まとめられる基礎概念は仕事単位でまとめる
- framework固有mental modelは無理にまとめない
- 3つ目の新規regionはDatabase編を優先
- Databaseの次はBackend / API、その後React / Next.js / TanStackを候補とする
- 新規learning regionより先にRPG Economy / Equipment loopを完成させる
- Database region追加前にCODE WORLD framingの最低限を実装する

今後は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)を世界観のsource of truthとして、各編のprototypeとRPG基盤をIssue単位で進めます。
