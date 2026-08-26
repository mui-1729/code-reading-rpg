# CODE//READ RPG 成長・探索ループ

## 1. 目的

Open World探索・Battle・成長・装備・仲間を1つのRPG loopとして扱う。

```text
Open World
↓
Random Encounter / Fixed Boss
↓
Code Reading Battle
↓
EXP / Gold / CLEAR / unlock
↓
Worldへreturn
↓
Pauseで成長 / Item / Equipment / Party確認
↓
再探索
```

## 2. 永続stateは2系統

### PlayerProgress v4

```ts
{
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

`completedSideQuestIds`はlegacy save互換のため保持する。現在Side Quest definitionは空。

### RpgState v1

```ts
{
  equipment,
  ownedEquipmentIds,
  partyMemberIds,
  partyEquipment,
  worldPosition,
  stepsSinceEncounter,
  encounterCount,
}
```

PlayerProgressへWorld座標やEquipmentを混ぜない。

## 3. Level / EXP

```text
累計必要EXP = 20 * level * (level - 1)
base maxHP = 100 + (level - 1) * 8
base powerMultiplier = 1 + (level - 1) * 0.02
```

Level / base statsはEXPから導出し、保存しない。

Equipment bonusを加えた最終値をCombatStatsとしてBattleへ渡す。

## 4. Battle progression

JavaScript:

```text
Battle 1 → Battle 2 → Battle 3 Boss
```

TypeScript:

```text
Battle 4 → Battle 5 → Battle 6 Boss
```

ただしPlayerはStage Selectから選ばない。

- JS tall-grass encounterが1 / 2へ進行
- TS forest encounterが4 / 5へ進行
- 3 / 6はWorld上の固定Boss

初回CLEAR:

- EXP
- Gold
- clear state
- next Battle unlock
- Skill unlock
- BossならArea clear

replay:

- EXP / Goldは再獲得可能
- clear / unlockは重複しない

## 5. World / Encounter

現在:

- JS terrain encounter chance: tall-grass 0.18
- TS terrain encounter chance: forest 0.16
- encounter後は最低5歩cooldown
- Hub / roadはsafe

進行中の未clear Battleを優先してencounterする。

例:

```text
JS Stage 1未clear → Battle 1
Stage 1 clear / Stage 2未clear → Battle 2
両方clear → Battle 1 / 2をrandom replay
```

Bossはrandom encounterに混ぜない。

## 6. Equipment

slots:

```text
weapon
armor
accessory
```

EquipmentはRpgStateへ保存する。

Battleへの影響:

- Attack → Skill damage補正
- Defense → incoming damage軽減
- maxHP → Battle開始HP上限

EquipmentはTargetRuleを変更しない。

Boss clear rewardとして上位Equipmentを取得できる。

## 7. Party

現在のmember:

```text
BYTE
```

加入:

- Hub付近のBYTEへINTERACT
- RpgStateへ保存

Battle:

- Playerがコードからtargetを決定
- BYTEは同じtargetへfollow-up

Party自身が別targetを判断してコード読解を代替してはいけない。

## 8. Economy / PATCH KIT

Hub上のSHOP objectへINTERACTして購入する。

```text
PATCH KIT
price: 30 G
heal: max 24 HP
```

Battle中:

- 所持時だけ表示
- 1 Battle 1回
- 1個消費
- maxHPを超えない

## 9. World Objective

Stage Selectを廃止したため、PlayerProgressから次の目的をpureにderiveする。

予定:

```text
JS 0/3 → tall-grass encounter
JS 1/3 → 次のtall-grass encounter
JS 2/3 → west Boss
JS 3/3 → clear

TSも同様
```

表示はPause STATUSを基本とし、Battle後は短い一時feedbackだけ表示する。

旧Gate表現のQuest Trackerは復活させない。

## 10. Reset

`RESET PROGRESS`で:

- PlayerProgress
- RpgState
- TutorialState

を同時に初期化する。

各Providerは共通reset eventを受け、自分のstateだけをresetする。

## 11. LocalStorage

### PlayerProgress

schema v4。

旧v1 / v2 / v3からmigrationし、既存EXP / clear / unlockを保持する。

### RpgState

schema v1。

invalid JSON / unknown versionは初期状態へfallbackする。

今後:

- World bounds
- known Equipment ID
- known Party ID

のvalidationを強化する。

## 12. 再攻略

負けた場合はWorldへ戻るかRETRYする。

Worldで通常Encounterを繰り返すとEXP / Goldを得られる。

ただしgrindだけで読解を不要にしないため:

- EnemyをLevel連動で弱くしない
- Equipmentを極端に強くしない
- Partyがtargetを自動決定しない

## 13. 今後

優先:

1. World Objective
2. legacy Quest runtime cleanup
3. World action resolver
4. RpgState validation
5. recovery point / treasure等のWorld content
6. Boss-specific mechanic
7. third learning region
