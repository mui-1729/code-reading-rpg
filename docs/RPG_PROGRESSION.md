# CODE//READ RPG 成長・探索ループ

## 1. 目的

Battleだけで完結せず、探索・成長・報酬利用・再挑戦までを1つのRPG loopとして扱う。

```text
World Map
↓
Area / Field
↓
Quest / NPC / Gate
↓
Battle
↓
EXP / Gold / CLEAR / unlock
↓
必要ならSHOPでsupport item購入
↓
Fieldへ戻る
↓
Boss / Area CLEAR
↓
Side Quest / 再攻略
```

## 2. PlayerProgress

現行schema:

```ts
PlayerProgress = {
  exp: number
  gold: number
  inventory: {
    patchKit: number
  }
  clearedStageIds: number[]
  clearedAreaIds: string[]
  completedSideQuestIds: string[]
  unlockedStageIds: number[]
  unlockedSkillIds: string[]
}
```

Level / maxHP / POWER倍率はEXPから導出し、保存しない。

初期状態:

```text
EXP 0
Gold 0
PATCH KIT 0
Lv1
maxHP 100
Stage 1 / 4 unlocked
JavaScript / TypeScript baseline Skills unlocked
```

## 3. Level / EXP

```text
累計必要EXP = 20 * level * (level - 1)
maxHP = 100 + (level - 1) * 8
powerMultiplier = 1 + (level - 1) * 0.02
```

例:

- Lv1: 0 EXP
- Lv2: 40 EXP
- Lv3: 120 EXP
- Lv4: 240 EXP

Skill damage:

```text
Math.round(basePower * powerMultiplier)
```

## 4. Battleと成長の分離

Enemyはcurrent Player Levelへ追従させない。

```text
世界側
= Enemy HP / attack / composition / learning theme

Player側
= Level / maxHP / POWER倍率 / unlock / support item
```

LevelやItemはコード読解を不要にするためではなく、戦える余裕を少し増やすために使う。

## 5. Stage / Area / Gold

```text
JavaScript Kingdom
1 → 2 → 3 Boss

TypeScript Frontier
4 → 5 → 6 Boss
```

初回CLEAR:

- EXP
- Gold
- Stage CLEAR
- next Stage unlock
- Skill unlock
- BossならArea CLEAR

replay:

- Battle EXP / Goldは再獲得可能
- CLEAR / unlockは重複しない

Gold rewardはBattle dataの`goldReward`がsource of truth。

## 6. Shop / PATCH KIT

Area画面のheaderから必要時だけ`SHOP`を開く。

現在の商品:

```text
PATCH KIT
price: 30 G
heal: max 24 HP
```

Battle中:

- 所持している時だけcompact actionを表示
- HP満タンなら使用不可
- 1Battleにつき1回だけ
- 1個消費
- 最大HPを超えて回復しない

PATCH KITはTargetRule / Skill POWER / generator / solvabilityへ影響しない。

## 7. 再攻略

強い敵に負けた場合:

```text
前Stageへ戻る
↓
別seedで再攻略
↓
EXP / Gold
↓
Level Up / 必要ならPATCH KIT購入
↓
再挑戦
```

Area CLEAR後も過去Stageへ戻れる。

Side Questはこの再攻略へRPG上の目的を追加する。

### JavaScript

```text
AREA CLEAR
→ SECOND PASS
→ Stage 1 replay
→ +40 bonus EXP
```

### TypeScript

```text
AREA CLEAR
→ TYPE RECHECK
→ Stage 4 replay
→ +50 bonus EXP
```

bonusはSide Questごとに1回だけ。

## 8. QuestとProgress

Main Quest:

- Stage / Area CLEARから導出
- 専用save stateなし

Side Quest:

- Area CLEARでunlock
- 対象Battle replayでcomplete
- 一度だけの報酬保証のため`completedSideQuestIds`だけ保存

Quest UIはBattle中へ常設しない。

## 9. LocalStorage

schema version: `4`

保存:

- EXP
- Gold
- PATCH KIT所持数
- Stage CLEAR
- Area CLEAR
- Side Quest complete ID
- Stage unlock
- Skill unlock

保存しない:

- Level / maxHP / POWER倍率
- Battle turn
- Enemy current HP
- selected Skill
- PATCH KITのBattle内使用済みstate
- animation state

migration:

- v1 → 既存進行を復元しEconomyは0から開始
- v2 → Area進行を維持しEconomyは0から開始
- v3 → Side Quest進行を維持しEconomyは0から開始
- v4 → current schema
- 不正data / 未知version → 初期状態へfallback

## 10. Field / World

現在:

- World Map
- Area Select
- JavaScript / TypeScript Field
- 4方向移動 / collision
- NPC / Dialogue
- Battle Gate
- Main Quest marker
- 学習看板
- Code Codex
- Area SHOP

Field objectを増やしすぎない。新しい学習概念はCodexを優先し、施設やNPCが増えて1画面が窮屈になったら複数screen / camera追従へ移行する。

## 11. 今後のRPG拡張

優先候補:

```text
Side Quest（実装済み）
↓
Gold / Shop / PATCH KIT（実装済み）
↓
3つ目のArea
↓
Boss固有mechanic
↓
複数screen Field
```

避けること:

- 装備やItemだけでコードを読まず勝てる
- Rare Itemが全Skillの上位互換
- Grind量だけで攻略が決まる
- Player Levelに合わせてEnemyを自動弱体化する
