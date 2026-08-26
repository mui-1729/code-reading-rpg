# CODE//READ RPG アーキテクチャ

## 1. 目的

現在の責務分割と、Areaや学習コンテンツを増やすときの境界を定義する。

原則は、**コード読解のGame Domain、RPG進行、Economy、Quest、Field / Dialogue、Audio / Motion、Routingを必要以上に密結合させない**こと。

---

## 2. 現在の全体構成

```text
Browser
  ↓
React 19 + TanStack Router
  ├── World / Area UI
  ├── Field / Dialogue UI
  ├── Quest / Codex UI
  ├── Shop UI
  ├── Battle UI / CODE DATA
  └── Audio / Motion presentation
        ↓
Game Domain
  ├── Area metadata
  ├── Battle definitions / Gold reward
  ├── JavaScript / TypeScript SkillDefinition
  ├── TargetRule
  ├── Seeded generator
  └── Solvability
        ↓
Progression / Economy / Quest
  ├── EXP / Level
  ├── Gold / Inventory
  ├── Stage / Area CLEAR
  ├── Skill unlock
  ├── Main Quest derivation
  └── Side Quest reward state
        ↓
LocalStorage persistence
```

FrontendはVite SPAとしてCloudflare Workers Static Assetsへdeployする。

---

## 3. 主なディレクトリ

```text
src/
├── App.tsx                       # Area共通Battle runtime / UI
├── AppRouter.tsx
├── RootLayout.tsx
├── router.tsx
├── routeComponents.tsx
├── world/
├── field/
├── dialogue/
├── learning/
├── inspector/                    # Battle CODE DATA
├── economy/
│   ├── economy.ts                # purchase / consume pure domain
│   ├── economy.test.ts
│   ├── AreaShop.tsx
│   └── index.ts
├── quests/
├── game/
│   ├── areas.ts
│   ├── areaProgression.ts
│   ├── battles.ts
│   ├── generator.ts
│   ├── skillDefinitions.ts
│   ├── typescriptSkillDefinitions.ts
│   ├── skills.ts
│   ├── targeting.ts
│   └── solvability.ts
├── progression/
│   ├── progression.ts
│   ├── storage.ts
│   ├── ProgressProvider.tsx
│   └── types.ts
├── audio/
└── motion/
```

---

## 4. Routing

公開route:

```text
/
/world
/javascript
/javascript/field
/javascript/battle/$battleId?seed=...&returnTo=...
/javascript/complete
/typescript
/typescript/field
/typescript/battle/$battleId?seed=...&returnTo=...
/typescript/complete
```

Shopは新routeを増やさずArea画面上の必要時modalとして提供する。

Area固有の遷移先は`src/game/areas.ts`へ集約する。`comingSoon` Areaは実routeを持たせない。

---

## 5. Area / Battle関係

Battleはglobalに一意なnumber IDと`areaId`を持つ。

```text
JavaScript Kingdom: 1, 2, 3
TypeScript Frontier: 4, 5, 6
```

Battle definitionはEXP rewardに加えて`goldReward`を持つ。Gold額はProgression側で推測せずBattle dataをsource of truthとする。

守る条件:

- 全Battleの`areaId`は実在Area
- Battle IDはAreaを跨いでも一意
- `bossBattleId`は同じAreaのBoss
- routeは別AreaのBattleを受け付けない
- next Battleは同じArea内だけ

---

## 6. Game Domain / Skill definitions

`src/game/`はUIから独立したコード読解定義と純粋ロジックを担当する。

TypeScriptのために別Battle engineを作らない。

表示JavaScript / TypeScriptをruntimeで`eval()`せず、安全な内部TargetRuleと対応させる。

Economyはこの境界へ入れない。PATCH KIT使用で次を変更してはいけない。

- TargetRule
- Skill POWER
- code variant
- generator
- solvability
- correct target判定

---

## 7. Seeded Generator / Solvability

Battle ID + seedからEnemy HP / Enemy順 / Skill順 / code variantを決定的に再現する。

JavaScript / TypeScriptとも同じgeneratorとsolvabilityを使用する。Quest / Level / Gold / Itemを追加しても、generatorの世界側難易度をcurrent Player Progressへ自動追従させない。

---

## 8. Battle Runtime

`App.tsx`はArea共通Battle runtime。

一時state:

- phase
- playerHp
- enemies
- selectedSkillId
- logs
- turn
- PATCH KIT使用済みstate
- animation state

これらのうちBattle固有stateはPlayerProgressへ保存しない。

Victory時の順序:

```text
Battle result
↓
applyBattleVictory()  // EXP + Gold + CLEAR / unlock
↓
applySideQuestVictory()
↓
ProgressProvider更新
↓
Victory / Quest feedback
```

PATCH KIT使用時:

```text
current PlayerProgress + current HP + maxHP
↓
consumePatchKit()
↓
Inventory -1 / HP回復
↓
Battle内used state = true
```

Item使用はEnemy turnやtargetingロジックのsource of truthにしない。

---

## 9. Progression / Economy / Persistence

```ts
PlayerProgress = {
  exp,
  gold,
  inventory: { patchKit },
  clearedStageIds,
  clearedAreaIds,
  completedSideQuestIds,
  unlockedStageIds,
  unlockedSkillIds,
}
```

Level / maxHP / POWER倍率はEXPから導出する。

Economy domainは`src/economy/economy.ts`のpure functionをsource of truthにする。

- `purchasePatchKit(progress)`
- `consumePatchKit(progress, hp, maxHp, usedThisBattle)`

LocalStorage schemaはv4。

```text
v1 → 既存進行を復元 + Gold 0 / PATCH KIT 0
v2 → Area進行を維持 + Gold 0 / PATCH KIT 0
v3 → Side Quest進行を維持 + Gold 0 / PATCH KIT 0
v4 → current PlayerProgress
```

各Playable Areaの入口Stageとbaseline Skillは初期progressへ含める。旧save復元時は既存CLEAR / EXP / unlockを保持したまま不足baselineだけ追加する。

保存しないもの:

- Battle中HP
- turn
- selected Skill
- PATCH KITのBattle内使用済みstate
- animation state
- BGM再生位置
- Main Questの導出可能なstatus

---

## 10. Quest

`src/quests/quests.ts`をMain / Side Quest definitionと判定のsource of truthにする。

Main QuestはStage / Area CLEARからpureに導出する。Side QuestはArea CLEARでunlockし、指定Battleの再攻略で一度だけbonus EXPを付与する。

Battle側は「どのSide Questか」を知らず、勝利したBattle IDだけをQuest domainへ渡す。

EconomyとSide Quest bonusは別責務とし、現在のSide Quest bonusはEXPのみ。

---

## 11. Field / Learning / Dialogue

movement / collision / interaction判定はFieldの純粋ロジック。

学習看板はsolid tile。BFS reachability testでGate / 看板 / NPC / Exitへ到達できることを確認する。

新しい学習概念だけを理由にField objectを増やさず、Codexへ寄せる。

---

## 12. World Map / UI補助機能

World MapはArea metadataとArea CLEARを参照するだけで、Battle生成やSkill targetingを知らない。

Quest Tracker / Code Codex / Sound Settings / Shop / CODE DATAは長い常設詳細panelにせず必要時だけ開く。Areaでは`SHOP`をheader actionへ置き、Battleではコード・Enemy・Player状態を優先する。

---

## 13. Audio / Motion

Audio / Motionはpresentation layer。

presentation状態をTargetRuleやdamage式のsource of truthにしない。

---

## 14. Backend

現在は不要。Login / Cloud Save / Ranking / Shared Challenge等が必要になった時点で比較して導入する。

---

## 15. 品質保証

PR作成前:

```text
npm ci
npm run lint
npm test
npm run build
```

PR後:

```text
GitHub Actions CI
Cloudflare Preview
Self Review
Squash Merge
main CI
Cloudflare Production
```

主なUnit Test対象:

- targeting
- seeded random / generator / solvability
- JavaScript / TypeScript SkillDefinition
- code variants / multiline help
- CODE DATA resolver
- progression / Gold reward
- Economy purchase / consume / heal cap / one-use
- save v1 / v2 / v3 → v4 migration
- Main / Side Quest
- Field movement / reachability
- LearningHint / Dialogue
- Area metadata / Area-Battle整合性
- Audio helpers

---

## 16. 設計原則

1. 表示コードを`eval()`しない
2. Player成長やItemでコード読解を不要にしない
3. Enemyをcurrent Levelへ自動追従させない
4. Battle transient stateをsaveへ混ぜない
5. World / Field / Dialogue / Quest / Economy / AudioをBattle Domainへ密結合させない
6. COMING SOONの機能を架空実装しない
7. 既存route / save互換をmigrationなしに壊さない
8. Area追加でBattle engineを複製しない
9. 学習object追加でFieldの進行を塞がない
10. UIから分かる説明文を常設しない
11. data-drivenでUnit Testできる境界を優先する
