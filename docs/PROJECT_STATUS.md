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
- 技術名の章ではなく、エンジニアとして問題を解決するstoryへ寄せる

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
- Chapter間 / Boss前 / clear後のstory event
- World上のNEXT OBJECTIVE
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- Tutorial skip / replay
- TypeScript regionはplayableだが、story presentationはJavaScriptほど統一されていない

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

Open World化前のField / Quest / Area UIの一部がrepositoryに残っています。

現在の扱い:

- `/javascript/field` / `/typescript/field` routeは`/world`へredirect
- 旧Fieldのcontent definitionは学習 / story regression testで一部利用
- 旧FieldのReact page / route componentはcurrent runtimeから未使用
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

### P0 — TypeScript編のstory整合

JavaScript編だけstoryの密度が一段高くなったため、次はTypeScriptを同じ品質へ揃えるのが最優先候補です。

やること:

- TypeScript 3章を1つの問題へつなぐ
- Chapterごとの仕事 / bug /原因を明確にする
- 前章の構文を後章でも累積利用する
- World Objective / NPC / Battle briefing / result eventの文脈を統一する
- Bossを「型の情報を読んで解決する総合問題」にする

新しい機能基盤を増やすより、既存Battleの意味をstoryとして強くする段階です。

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

### P1 — TypeScript固有Boss mechanic

現在のGUARDはJS / TS Bossで共通です。TypeScript側には、型情報を読む意味がもっと直接出る固有mechanicを検討できます。

例:

- union / narrowing条件を読んで解除対象を判断する
- optional propertyの有無でBoss stateが変わる
- `keyof` / indexed accessに対応するdataを読む

ただし「mechanic専用説明panel」を増やさず、表示コードから理解できることを条件にします。

### P2 — 3つ目のlearning region

候補は`React`か`SQL`です。

#### Reactを先にする場合

- props / state / render flow / list key / effectの読解へ進める
- Web frontend学習の流れとしてJS → TS → Reactが自然
- ただし現在の「Enemy targetをコードで決める」Battle modelへ落とす設計がSQLより難しい

#### SQLを先にする場合

- WHERE / AND / OR / ORDER BY / LIMIT / JOINなどが既存のtarget-selection Battleと相性がよい
- 「どのrowが返るか」をEnemy / data selectionへ対応させやすい
- JS → TS → SQLは技術学習順としてはReactほど直線的ではない

新regionを実装する前に、**その技術を現在のBattle loopで本当に学べるかを1 Battle prototypeで検証**するのがよいです。

### P2 — Party / Equipment depth

必要なら追加:

- 2人目のcompanion
- heal / support role
- member equipmentの意味を強化

ただしPartyが正解targetを自動判定する機能は追加しません。

## 6. 当面やらない

- Stage Select / Area Select復活
- 大量のQuest Log /常設HUD
- Backend / Login / Cloud Save
- Ranking
- 読解を飛ばせるauto target / auto battle
- 数値だけ違うEquipment大量追加
- Worldを広げるだけのmap expansion

Backendは複数端末同期、共有challenge、account機能等の具体的要件が出てから検討します。

## 7. 判断が必要な点

今後の大きなproduct decisionは次の2つです。

1. **TypeScript storyをJavaScriptと同じ「新人エンジニアの仕事」路線で全面的に揃えるか**
2. **3つ目のregionをReactとSQLのどちらから始めるか**

この2点以外は、現状のarchitectureを保ったまま段階的に進められます。
