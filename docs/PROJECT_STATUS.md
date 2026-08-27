# CODE//READ RPG — Project Status

最終更新: 2026-08-28

この文書は、**このゲームが何を目指していて、今どこまで実装され、次に何を作るべきか**を短く把握するためのcurrent snapshotです。

## 1. 目的

`CODE//READ RPG`は、コードを書く練習ではなく、**既存コードを読んで「現在のstateに対して何が起きるか」を判断する力をRPGとして鍛えるゲーム**です。

コア原則:

- Battleのtarget判断は表示コードを読んで行う
- RPG成長は読解を代替せず、HP / damage / defenseの余裕を作る
- 「正解ボタンを当てるクイズ」ではなく、読んだ結果がそのままBattleへ反映される
- 同じSkill名や固定手順の暗記だけで攻略しにくくする
- 1つのWorldを探索しながら学習contentへ入る
- 技術名を細かく1つずつ章にせず、同じ仕事・同じ思考でまとめられるものは1つの編にまとめる
- React / Next.js等、固有のmental modelが大きいframeworkは無理に同じ編へまとめない

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

## 4. 現在残っている整理対象

### Legacy code

Open World化前のField / Quest / Area UIの一部dataがrepositoryに残っています。

現在の扱い:

- `/javascript/field` / `/typescript/field` routeは`/world`へredirect
- 旧Fieldのcontent definitionは学習 / story regression testで一部利用
- 旧FieldのReact page / route componentは削除済み
- `AreaShop`はWorld Shopへ置換済み
- `QuestVictoryFeedback`はWorld progress feedbackへ置換済み
- `completedSideQuestIds`はsave migration互換のため残す

**「unused UI」と「互換・test fixtureとしてまだ意味があるdata」を分けて整理する**のが方針です。

### Large orchestration components

- `src/App.tsx` — Battle runtime orchestrationが大きい
- `src/world/WorldPage.tsx` — resolver自体は分離済みだがUI adapter責務が多い
- `src/ui/PauseMenu.tsx` — 6 tabs分のpresentationが1fileに集まる

これらはdead code cleanupとは別Issueで、挙動変更と混ぜずに分割する方が安全です。

## 5. 次に実装する優先候補

### P0 — RPG Economy / Equipment loop

Equipment / Gold / Shop / Recoveryの基盤はあるが、RPGとしてのloopはまだ薄い。

次は次を1つのsystemとしてまとめる。

```text
探索 / Battle
→ Gold・Treasureを得る
→ Shopで比較して買う
→ Equipmentを装備する
→ InnでGoldを使って回復する
→ 次の探索へ
```

やること:

- Equipmentをpixel-art icon / cardで画像化し、Shop / Pause / rewardで共通利用する
- owned / equipped / unavailableを視覚的に分ける
- inventory / itemの所有と使用場所を分かりやすくする
- Gold source / sink / price balanceを整理する
- 無料Recovery PointをInn / Restとして意味のあるGold sinkへ再設計する
- 回復前後HP / price / 所持Gold不足をUIへ出す
- save schema互換を壊さずに実装する

RPGを強くしても、GoldやEquipmentだけでcode readingを無視して攻略できるbalanceにはしない。

### P1 — Battle runtimeの責務分割

`App.tsx`を機能単位に分ける候補:

- Battle session state / transition
- player action execution
- enemy turn
- story event integration
- result handoff
- presentation component

条件:

- `TargetRule` / generator / save schemaを変えない
- refactor前後でUnit / E2Eが同じ意味を保証する
- 大きなUI redesignと同時に行わない

### P1 — Database編 prototype

**3つ目のlearning regionはDatabase編を優先します。**

SQLだけを独立させず、DBを扱う仕事として次をまとめます。

- table / row / column
- SELECT / WHERE
- AND / OR
- ORDER BY / LIMIT
- JOIN
- NULL
- GROUP BY / aggregate
- indexの入口
- transactionの入口

現在のtarget-selection BattleとSQLは相性がよいため、まず1 Battle prototypeを作って成立を確認します。

prototypeで確認すること:

- queryを読まないと結果rowを判断しにくいか
- `TargetRule`相当のsafe domainへ落とせるか
- WHERE → ORDER BY → LIMITをゲーム結果へ自然に反映できるか
- CODE HELP / CODE DATAをDB向けに一般化できるか

成功後に3 Chapter + World regionへ広げます。

### P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS Bossで共通です。TypeScript側には、型情報を読む意味がもっと直接出る固有mechanicを検討できます。

例:

- union / narrowing条件を読んで解除対象を判断する
- optional propertyの有無でBoss stateが変わる
- `keyof` / indexed accessに対応するdataを読む

ただし「mechanic専用説明panel」を増やさず、表示コードから理解できることを条件にします。

### P2以降 — 長期的な学習編

現在の方向:

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

まとめる例:

- Database編: SQL + relational data + JOIN + NULL + aggregate + index / transaction入口
- Backend / API編: HTTP + validation + async + DB access + auth基礎
- Team Development / Delivery編: Git + PR + Testing + CI/CD
- Production / Performance編: logs + metrics + incident + performance

分ける例:

- React編
- Next.js編
- TanStack編

framework固有のruntime / data flow / mental modelが大きいものは別編にします。

詳細は`ENGINEER_STORY_ROADMAP.md`をsource of truthとします。

### Party depth

RPG Economy loopを整えた後、必要なら追加:

- 2人目のcompanion
- heal / support role
- member equipmentの意味を強化

ただしPartyが正解targetを自動判定する機能は追加しません。

## 6. 当面やらない

- Stage Select / Area Select復活
- 大量のQuest Log /常設HUD
- game infrastructureとしてのLogin / Cloud Save
- Ranking
- 読解を飛ばせるauto target / auto battle
- 数値だけ違うEquipment大量追加
- Worldを広げるだけのmap expansion

Backend / API編は**学習content**として作ります。ゲーム自体へserver / loginを導入する意味ではありません。

## 7. 決定済みの大きな方向

- JavaScript / TypeScriptは同じ3 Chapter構造の「〜編」として揃える
- TypeScript編もJavaScript編と同じく1つのincidentを追うstory structureにする
- まとめられる基礎概念は仕事単位でまとめる
- framework固有のmental modelは無理にまとめない
- 3つ目の新規regionはDatabase編を優先する
- Databaseの次はBackend / API、その後React / Next.js / TanStackを候補とする
- 新規learning regionより先にRPG Economy / Equipment loopを完成させる

この方向を前提に、今後は各編のprototypeとRPG基盤をIssue単位で進めます。
