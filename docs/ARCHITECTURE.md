# CODE//READ RPG アーキテクチャ

## 1. 目的

現在の責務分割と、Areaや学習コンテンツを増やすときの境界を定義する。

原則は、**コード読解のGame Domain、RPG進行、Field / Dialogue、Audio / Motion、Routingを必要以上に密結合させない**こと。

---

## 2. 現在の全体構成

```text
Browser
  ↓
React 19 + TanStack Router
  ├── World / Area UI
  ├── Field / Dialogue UI
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
Progression
  ├── EXP / Level
  ├── Stage / Area CLEAR
  └── Skill unlock
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
├── router.tsx                    # JavaScript / TypeScript route tree
├── routeComponents.tsx           # Title / Area Stage Select / Complete
├── world/
│   └── WorldPage.tsx
├── field/
│   ├── field.ts                  # movement / collision / interaction
│   ├── JavaScriptFieldPage.tsx
│   ├── JavaScriptFieldRoute.tsx
│   ├── javascriptField.ts
│   ├── TypeScriptFieldPage.tsx
│   ├── TypeScriptFieldRoute.tsx
│   └── typescriptField.ts
├── dialogue/
│   ├── dialogue.ts
│   ├── npcs.ts
│   └── types.ts
├── learning/
│   ├── learningHints.ts
│   └── typescriptLearningHints.ts
├── game/
│   ├── areas.ts
│   ├── areaProgression.ts
│   ├── battles.ts
│   ├── generator.ts
│   ├── skillDefinitions.ts       # JavaScript Skill
│   ├── typescriptSkillDefinitions.ts
│   ├── skills.ts                 # Area別definitionを統合
│   ├── targeting.ts
│   ├── random.ts
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

### Area route metadata

Area固有の遷移先は`src/game/areas.ts`へ集約する。

```ts
AreaDefinition = {
  id,
  label,
  title,
  description,
  availability,
  routes: {
    stageSelect,
    field,
    complete,
  },
  bossBattleId,
}
```

`comingSoon` Areaはrouteを`null`にし、空Fieldや架空Battleを先に作らない。

---

## 5. Area / Battle関係

Battleはglobalに一意なnumber IDと`areaId`を持つ。

```text
JavaScript Kingdom: 1, 2, 3
TypeScript Frontier: 4, 5, 6
```

UIが独自にArea判定を持たず、次を使う。

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

Unit Testで固定する。

---

## 6. Game Domain / Skill definitions

`src/game/`はUIから独立した定義と純粋ロジックを担当する。

JavaScriptとTypeScriptの表示コンテンツはdefinition fileを分離するが、Battle engineからは統合したSkill registryとして扱う。

```text
skillDefinitions.ts
          ┐
          ├→ skills.ts → allSkillDefinitions / skills
          │
typescriptSkillDefinitions.ts
```

これによりTypeScriptのために別Battle engineを作らない。

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

TypeScript codeもruntimeで評価しない。型注釈を含むdisplay codeと、安全な内部TargetRuleを対応させる。

---

## 7. Seeded Generator / Solvability

Battle ID + seedから、

- Enemy HP
- Enemy順
- Skill順
- code variant

を決定的に再現する。

JavaScript / TypeScriptとも同じgeneratorとsolvabilityを使用する。生成時にvalid target / learning constraint / solvabilityを検証する。

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

これらをPlayerProgressやLocalStorageへ保存しない。

Battle自身の`areaId`から、次Battle / Area Complete / return先を決める。Area固有のdamage engineは作らない。

---

## 9. Progression / Persistence

```ts
PlayerProgress = {
  exp,
  clearedStageIds,
  clearedAreaIds,
  unlockedStageIds,
  unlockedSkillIds,
}
```

Level / maxHP / POWER倍率はEXPから導出する。

```text
Battle Victory
↓
applyBattleVictory()
↓
EXP / CLEAR / unlock
↓
ProgressProvider
↓
LocalStorage
```

各Playable Areaの入口Stageとbaseline Skillは初期progressへ含める。旧save復元時は、既存CLEAR / EXP / unlockを保持したまま不足しているbaselineだけを追加する。

保存しないもの:

- Battle中HP
- turn
- selected Skill
- animation state
- BGM再生位置

---

## 10. Field / Learning / Dialogue

movement / collision / interaction判定は`field.ts`の純粋ロジック。

```text
Area Field UI
├── movement
├── interaction
├── LearningHint
├── optional NPC / Dialogue
└── Battle Gate
       ↓
Battle route
```

JavaScriptとTypeScriptはField definition / Pageを分離し、1つの巨大Area分岐へしない。

学習看板はinteraction tileなのでsolid。看板追加によってMain routeを塞がないよう、各FieldにBFS reachability testを持ち、全Gate / 看板 / Exitの隣接tileへ到達可能であることを確認する。

DialogueはPlayerProgressの必要部分だけを読み、Battle targetingやdamage計算を知らない。

---

## 11. World Map

World MapはArea metadataとPlayerProgressのArea CLEARだけを参照する。

```text
World Map
↓
AreaDefinition.availability
├── available → routes.field
└── comingSoon → disabled
```

World MapはBattle生成、Enemy stats、Skill targetingを知らない。

Area追加手順:

1. Area metadata
2. globalに一意なBattle ID
3. Skill / LearningHint
4. Router
5. Field / Stage Select / Complete
6. Progression baseline / old save compatibility
7. Area / Battle / Field reachability / solvability test

---

## 12. Audio / Motion

Audio / Motionはpresentation layer。

Audio:

- `menu` / `field` / `battle` BGM
- SE channel
- BGM / SE別GainNode
- Mute / volume
- user gestureでAudioContext unlock
- `useBgm()`でlifecycle管理

Motion:

- Skill windup
- hit / damage / defeat
- victory / defeat / reward
- `prefers-reduced-motion`

presentation状態をTargetRuleやdamage式のsource of truthにしない。

---

## 13. Backend

現在は不要。Login / Cloud Save / Ranking / Shared Challenge等が必要になった時点で比較して導入する。

---

## 14. 品質保証

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
- progression / old save compatibility
- Field movement / reachability
- LearningHint参照
- Dialogue条件
- Area metadata / Area-Battle整合性
- Audio helpers

---

## 15. 設計原則

1. 表示コードを`eval()`しない
2. Player成長でコード読解を不要にしない
3. Enemyをcurrent Levelへ自動追従させない
4. Battle transient stateをsaveへ混ぜない
5. World / Field / Dialogue / AudioをBattle Domainへ混ぜない
6. COMING SOONの機能を架空実装しない
7. 既存route / save互換を壊す変更はmigrationなしに行わない
8. Area追加でBattle engineを複製しない
9. 学習object追加でFieldの進行を塞がない
10. data-drivenでUnit Testできる境界を優先する
