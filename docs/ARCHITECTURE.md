# CODE//READ RPG アーキテクチャ

## 1. 目的

現在の責務分割と、Areaや学習コンテンツを増やすときの境界を定義する。

原則は、**コード読解のGame Domain、RPG進行、Quest、Field / Dialogue、Audio / Motion、Routingを必要以上に密結合させない**こと。

---

## 2. 現在の全体構成

```text
Browser
  ↓
React 19 + TanStack Router
  ├── World / Area UI
  ├── Field / Dialogue UI
  ├── Quest / Codex UI
  ├── Battle UI
  └── Audio / Motion presentation
        ↓
Game Domain
  ├── Area metadata
  ├── Battle definitions
  ├── JavaScript / TypeScript SkillDefinition
  ├── TargetRule
  ├── Seeded generator
  └── Solvability
        ↓
Progression / Quest
  ├── EXP / Level
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
├── RootLayout.tsx                # Quest / Codexなどroute外共通UI
├── router.tsx                    # JavaScript / TypeScript route tree
├── routeComponents.tsx           # Title / Area Stage Select / Complete
├── world/
├── field/
│   ├── field.ts                  # movement / collision / interaction
│   ├── JavaScriptFieldPage.tsx
│   ├── javascriptField.ts
│   ├── TypeScriptFieldPage.tsx
│   └── typescriptField.ts
├── dialogue/
├── learning/
│   ├── learningHints.ts
│   └── typescriptLearningHints.ts
├── quests/
│   ├── quests.ts                 # Main / Side Quest pure domain
│   ├── QuestTracker.tsx
│   └── QuestVictoryFeedback.tsx
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

JavaScript Kingdomの既存URLはbookmark / deep link互換のため維持する。TypeScript Frontierは別prefixで追加し、JavaScript routeからTypeScript Battleを開かない。

Area固有の遷移先は`src/game/areas.ts`へ集約する。`comingSoon` Areaは実routeを持たせない。

---

## 5. Area / Battle関係

Battleはglobalに一意なnumber IDと`areaId`を持つ。

```text
JavaScript Kingdom: 1, 2, 3
TypeScript Frontier: 4, 5, 6
```

共通lookup:

```text
getBattlesForArea(areaId)
getAreaForBattle(battleId)
getBossBattleForArea(areaId)
```

守る条件:

- 全Battleの`areaId`は実在Area
- Battle IDはAreaを跨いでも一意
- `bossBattleId`は同じAreaのBoss
- routeは別AreaのBattleを受け付けない
- next Battleは同じArea内だけ

---

## 6. Game Domain / Skill definitions

`src/game/`はUIから独立したコード読解定義と純粋ロジックを担当する。

```text
skillDefinitions.ts
          ┐
          ├→ skills.ts → unified registry
typescriptSkillDefinitions.ts
```

TypeScriptのために別Battle engineを作らない。

```ts
SkillDefinition = {
  id,
  name,
  power,
  rule,
  concept,
  explanation,
  codeVariants,
}
```

表示JavaScript / TypeScriptをruntimeで`eval()`せず、安全な内部TargetRuleと対応させる。

---

## 7. Seeded Generator / Solvability

Battle ID + seedからEnemy HP / Enemy順 / Skill順 / code variantを決定的に再現する。

JavaScript / TypeScriptとも同じgeneratorとsolvabilityを使用する。QuestやItemを追加しても、generatorの世界側難易度をcurrent Player Progressへ自動追従させない。

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
- animation state

これらをPlayerProgressへ保存しない。

Victory時の順序:

```text
Battle result
↓
applyBattleVictory()
↓
applySideQuestVictory()
↓
ProgressProvider更新
↓
Victory / Quest feedback
```

Quest判定はTargetRuleやdamage calculationへ混ぜない。

---

## 9. Progression / Persistence

```ts
PlayerProgress = {
  exp,
  clearedStageIds,
  clearedAreaIds,
  completedSideQuestIds,
  unlockedStageIds,
  unlockedSkillIds,
}
```

Level / maxHP / POWER倍率はEXPから導出する。

Main QuestはStage / Area CLEARから導出するため保存しない。Side Questは一回限りの報酬を保証するため、完了IDだけ保存する。

LocalStorage schemaはv3。

```text
v1 → Area CLEARを補完 + Side Quest []
v2 → Area進行を維持 + Side Quest []
v3 → current PlayerProgress
```

各Playable Areaの入口Stageとbaseline Skillは初期progressへ含める。旧save復元時は、既存CLEAR / EXP / unlockを保持したまま不足baselineだけ追加する。

保存しないもの:

- Battle中HP
- turn
- selected Skill
- animation state
- BGM再生位置
- Main Questの導出可能なstatus

---

## 10. Quest

`src/quests/quests.ts`をMain / Side Quest definitionと判定のsource of truthにする。

Main Quest:

- Stage / Area CLEARからpureに導出
- 次Gate / Guide NPC markerを返せる
- replayでは進行差分がなければfeedbackなし

Side Quest:

- Area CLEARでunlock
- 指定Battleの再攻略でcomplete
- bonus EXPを一度だけ付与
- LOCKED中はUIへ出さない
- Field markerを増やさずQuest Log内へ収める

Battle側は「どのSide Questか」を知らず、勝利したBattle IDだけをQuest domainへ渡す。

---

## 11. Field / Learning / Dialogue

movement / collision / interaction判定は`field.ts`の純粋ロジック。

```text
Area Field UI
├── movement
├── interaction
├── LearningHint
├── NPC / Dialogue
└── Battle Gate
       ↓
Battle route
```

学習看板はsolid tile。BFS reachability testでGate / 看板 / NPC / Exitへ到達できることを確認する。

新しい学習概念だけを理由にField objectを増やさず、Codexへ寄せる。

---

## 12. World Map / UI補助機能

World MapはArea metadataとArea CLEARを参照するだけで、Battle生成やSkill targetingを知らない。

Quest Tracker / Code Codex / Sound Settingsは常設詳細panelにせず、必要時だけ開く。Battle中はコード・Enemy・Player状態を優先する。

---

## 13. Audio / Motion

Audio / Motionはpresentation layer。

Audio:

- `menu` / `field` / `battle` BGM
- SE channel
- BGM / SE別GainNode
- settings modal
- user gestureでAudioContext unlock

Motion:

- Skill windup
- hit / damage / defeat
- victory / reward
- `prefers-reduced-motion`

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
- progression / v1・v2 migration
- Main / Side Quest
- one-time Side Quest reward
- Field movement / reachability
- LearningHint / Dialogue
- Area metadata / Area-Battle整合性
- Audio helpers

---

## 16. 設計原則

1. 表示コードを`eval()`しない
2. Player成長でコード読解を不要にしない
3. Enemyをcurrent Levelへ自動追従させない
4. Battle transient stateをsaveへ混ぜない
5. World / Field / Dialogue / Quest / AudioをBattle Domainへ密結合させない
6. COMING SOONの機能を架空実装しない
7. 既存route / save互換をmigrationなしに壊さない
8. Area追加でBattle engineを複製しない
9. 学習object追加でFieldの進行を塞がない
10. UIから分かる説明文を常設しない
11. data-drivenでUnit Testできる境界を優先する
