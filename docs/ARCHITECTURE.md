# CODE//READ RPG アーキテクチャ

## 1. 目的

Open World化後の責務境界を定義する。詳細な設計判断と今後の優先順位は`docs/OPEN_WORLD_DESIGN.md`をsource of truthとする。

原則は、**Game Domain / World / Player Progression / RPG state / Tutorial / Presentationを必要以上に密結合させない**こと。

## 2. 全体構成

```text
Browser
  ↓
React 19 + TanStack Router
  ├── Open World UI
  ├── Pause / Codex / Tutorial
  ├── Battle UI / CODE DATA / Result Sequence
  └── Audio / Motion
        ↓
Game Domain
  ├── Battle definitions
  ├── SkillDefinition / TargetRule
  ├── seeded generator
  └── solvability
        ↓
World Domain
  ├── terrain / region
  ├── viewport
  └── encounter candidate selection
        ↓
Player Domains
  ├── PlayerProgress: EXP / Gold / clear / unlock / consumable
  └── RpgState: World position / Equipment / Party / encounter pacing
        ↓
LocalStorage persistence
```

Vite SPAとしてCloudflare Workers Static Assetsへdeployする。

## 3. 主なディレクトリ

```text
src/
├── App.tsx                     # 共通Battle runtime
├── AppRouter.tsx
├── RootLayout.tsx
├── router.tsx
├── world/
│   ├── WorldPage.tsx           # World UI + current orchestration
│   ├── worldMap.ts             # pure terrain / viewport / encounter helpers
│   └── worldMap.test.ts
├── rpg/
│   ├── state.ts                # RpgState schema / persistence
│   ├── equipment.ts
│   ├── party.ts
│   ├── combat.ts
│   └── RpgProvider.tsx
├── progression/
│   ├── progression.ts
│   ├── storage.ts              # PlayerProgress schema v4
│   └── ProgressProvider.tsx
├── game/
│   ├── battles.ts
│   ├── generator.ts
│   ├── skillDefinitions.ts
│   ├── typescriptSkillDefinitions.ts
│   ├── skills.ts
│   ├── targeting.ts
│   └── solvability.ts
├── inspector/
├── results/
├── tutorial/
├── learning/
├── economy/
├── quests/                     # legacy/main progress helpers。通常導線は縮小方針
├── audio/
└── motion/
```

旧`field/`やArea関連codeはlegacy route / 過去仕様互換のため残る場合があるが、新しいWorld featureのsource of truthにはしない。

## 4. Routing

通常route:

```text
/
/world
/javascript/battle/$battleId?seed=...&returnTo=/world
/typescript/battle/$battleId?seed=...&returnTo=/world
```

Legacy redirect:

```text
/javascript          → /world
/javascript/field    → /world
/javascript/complete → /world
/typescript          → /world
/typescript/field    → /world
/typescript/complete → /world
```

通常導線へStage Select / Area Selectを再導入しない。

## 5. World Domain

`src/world/worldMap.ts`が現在のpure logicを持つ。

- World size / viewport size
- region判定
- terrain判定
- walkable / encounter terrain
- encounter chance
- progressに応じたBattle candidate選択
- adjacency

現在`WorldPage.tsx`がmovement・random roll・interaction・route transitionをまとめてorchestrateする。

World objectが増える場合は、`WorldPage.tsx`へif文を積み続けず次のようなpure resolverへ分離する。

```text
current world state + player progress + input
↓
resolve world action
↓
next state / interaction / encounter intent
↓
UIがstate更新・navigate・SEを実行
```

## 6. Game Domain / Battle

`src/game/`はコード読解ルールと盤面生成を担当する。

表示JavaScript / TypeScriptをruntimeで`eval()`しない。表示コードの意味と安全な内部`TargetRule`を対応させる。

Battle ID + seedからEnemy / Skill order / code variantを決定的に生成する。

Battle + seedごとに表示code文字列を固有化するが、次は維持する。

- TargetRule
- POWER
- concept
- code行数
- CODE HELP行対応
- solvability

## 7. Battle Runtime

`App.tsx`はArea共通Battle runtime。

Battle transient state:

- phase
- playerHp
- enemies
- selectedSkillId
- turn
- logs
- PATCH KIT used
- motion state

保存しない。

Player側補正:

```text
base PlayerStats(EXP)
+ Equipment bonus
→ CombatStats
```

Party follow-upはコードが決めた同じtargetにだけ追加damageを与える。Partyが独自に正解targetを選んではいけない。

## 8. State ownership

### PlayerProgress v4

担当:

- EXP / Gold
- PATCH KIT
- Battle / Area clear
- Stage / Skill unlock
- legacy `completedSideQuestIds`

### RpgState v1

担当:

- Equipment / owned equipment
- Party / party equipment
- World position
- encounter steps / count

### TutorialState v1

Tutorial専用。Battle/World domainへ混ぜない。

## 9. Reset

`ProgressProvider.resetProgress()`が汎用event `code-reading-rpg:progress-reset`をdispatchする。

- ProgressProvider → PlayerProgress reset
- RpgProvider → RpgState reset
- TutorialProvider → Tutorial reset

各providerが他moduleを直接importしてresetしない。

## 10. Economy / Equipment / Party

Economy:

- `purchasePatchKit()`
- `consumePatchKit()`

Equipment:

- loadout = weapon / armor / accessory
- CombatStatsへbonusを反映

Party:

- 現在BYTE 1人
- follow-up attackのみ

これらはTargetRule / generator / solvabilityを変更しない。

## 11. Progress guidance / Quest

Open WorldではStage Gateを直接選ばないため、旧Quest文言は現在の導線と一致しない。

今後はPlayerProgressから**World Objective**をpureに導出し、Pause STATUSとBattle後の短いfeedbackへ使用する。

Side Quest definitionsは現在空。`completedSideQuestIds`はsave互換のため残すが、現行runtime featureとして扱わない。

World Objective導入後、旧Quest feedback / Side Quest victory処理 / Field focus依存を通常runtimeから外す。

## 12. UI / Presentation

常設表示は現在の判断に必要なものだけにする。

World:

- region / terrain
- map viewport
- short field log
- D-Pad / INTERACT

Battle:

- Player HP / Level
- Enemy HP / NEXT
- Skill code / POWER
- selected state

EXP / Gold / Equipment / Party詳細はPauseへ集約する。

Audio / Motionはpresentationでありdomainのsource of truthにしない。

## 13. Persistence

PlayerProgressとRpgStateは別schema。

PlayerProgress schema v4は旧v1/v2/v3からmigrationする。

RpgState schema v1は未知version / invalid JSONでinitial stateへfallbackする。今後validationを強化し、World boundsやknown IDも検証する。

## 14. Backend

現在不要。Login / Cloud Save / Ranking / Shared Challenge等が必要になった時点で検討する。

## 15. Quality gate

PR前:

```bash
npm ci
npm run lint
npm test
npm run build
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

## 16. 設計原則

1. 表示コードを`eval()`しない
2. Player成長でコード読解を不要にしない
3. EnemyをPlayer Levelへ自動追従させない
4. World / Battle transient stateをPlayerProgressへ混ぜない
5. PlayerProgressとRpgStateの責務を分ける
6. legacy save互換とcurrent featureを分ける
7. World UIへ分岐を増やす前にpure resolverを検討する
8. Area追加でBattle engineを複製しない
9. 常設HUDを増やしすぎない
10. data-drivenでUnit Testできる境界を優先する
