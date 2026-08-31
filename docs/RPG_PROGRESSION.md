# CODE//READ RPG 成長・探索ループ

## 1. 目的

multi-map探索・Battle・成長・装備・仲間を1つのRPG loopとして扱う。

```text
Overworld / Village / Forest / Deep Forest / TypeScript Frontier
↓
Fixed Lesson / Random Encounter / MID BOSS / Final Boss
↓
Code Reading Battle
↓
EXP / Gold / CLEAR / unlock
↓
元のmap・座標へreturn
↓
Pauseで成長 / Item / Equipment / Party / Objective確認
```

## 2. 永続stateの責務と2つの構造

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

`completedSideQuestIds`はlegacy save互換のため保持する。LevelはEXPから導出し、保存しない。

### RpgState v5

```ts
{
  equipment,
  ownedEquipmentIds,
  partyMemberIds,
  worldMapId,
  worldPosition,
  stepsSinceEncounter,
  encounterCount,
  currentHp,
  openedTreasureIds,
}
```

PlayerProgressへWorld座標やEquipmentを混ぜない。両stateはGameStateProviderの同じReact stateに属し、同期的な1操作の更新を単一revision snapshotとしてLocalStorageへcommitする。

## 3. Level / combat stats

```text
累計必要EXP = 20 * level * (level - 1)
base maxHP = 100 + (level - 1) * 8
base powerMultiplier = 1 + (level - 1) * 0.02
```

Equipment bonusを加えた`CombatStats`をBattleへ渡す。Skill damage、Defense mitigation、BYTE follow-up、Boss Guard、persistent HPはpure combat turn resolverで解決し、runtimeとsolvabilityが同じ計算を使う。

Level / Equipmentはdamageと生存余地を増やすが、`TargetRule`を変更しない。

## 4. Canonical progression graph

JavaScript:

```text
7 → 8 → 9
→ 10 → 11 → 12 → 13 MID BOSS → 14
→ 15 → 16 → 17 → 18 → 19 MID BOSS → 20 → 21 → 22
→ Overworld final incident 1 → 2
→ Code Core Final Boss 3
```

TypeScript:

```text
JavaScript Boss 3 clear → 4 → 5 → Final Boss 6
```

`src/progression/progressionGraph.ts`をroute accessibility / next Battle / unlockのcanonical sourceとする。勝利処理はprerequisiteを飛ばしたunlockを作らない。通常進行へStage Selectを戻さない。

初回CLEARはEXP / Gold / clear / unlockを適用し、replayはEXP / Goldだけを再獲得できる。

## 5. Multi-map World / Encounter

- `overworld` — Hub、final incident、Code Core接続
- `js-village` — Battle 7〜9の固定Training。Random Encounterなし
- `js-forest` — Battle 10〜14
- `js-deep-forest` — Battle 15〜22
- `ts-frontier` — Battle 4〜6

Random Encounterは各mapで学習済みのLessonだけを反復し、MID BOSS / Final Bossを混ぜない。遭遇後はcooldownを持ち、安全地帯では遭遇しない。

## 6. Equipment / Party / Economy

Equipment slotsは`weapon` / `armor` / `accessory`。Attack / Defense / maxHPへbonusを加えるが、code readingを代替しない。

現在の仲間`BYTE`は1 ACTIONに1回、Playerがcodeから選んだtarget群のうちSkill後に生存する先頭1体だけへfollow-upする。全滅時は追撃しない。複数targetで追撃damageを乗算せず、選択外の相手へ自動攻撃しない。仲間に独立HP / Defense / Equipmentはなく、Pauseでは実効のfollow-up情報だけを示す。

`PATCH KIT`は30 G、Battle中1回、最大24 HP回復。現在HPと在庫はそれぞれRpgState / PlayerProgressへ保存する。

## 7. World Objective

ObjectiveはPlayerProgressからpureに導出し、World / Pause / Battle後feedbackが同じ`worldObjective` sourceを使う。

JavaScriptは19 Battle、TypeScriptは3 Battleのcanonical graphに沿って、次のLesson / MID BOSS / incident / Final Boss / AREA CLEARを表示する。旧Gate表現のQuest Trackerは復活させない。

## 8. Save restore / reset

PlayerProgressはschema v4。旧v1 / v2 / v3からmigrationし、canonical progression graphからunlockを再導出する。

RpgStateはschema v5。旧v1 / v2 / v3 / v4からmigrationし、未使用のpartyEquipmentを除去する。restore時に次をnormalizeする。

- map ID / map bounds / legacy TypeScript座標
- known Equipment / Party / Treasure ID
- Equipment slot / ownership
- non-negative Encounter counters
- current HP upper bound

`code-reading-rpg:game-state`の1回の`setItem`がcommit point。直前のvalid snapshotをbackupへ保持し、壊れたrootからは最新のvalid revisionを復旧する。旧Progress / RPG分割keyは初回migration入力のみで、root保存後は削除する。片側だけのlegacy saveはvalid側を保持し、他方を初期化する。

World portal graphとProgressから到達可能mapを導出し、locked Forest / Deep Forest / TypeScript内だけに位置がある不整合はOverworld開始地点へ戻する。`storage` eventでnewer revisionを取り込み、保存前に新しいrevisionを検出したstale tabは上書きせず新snapshotを採用する。LocalStorageにcompare-and-swapはないため完全同時書き込みの排他までは保証しない。

`RESET PROGRESS`はPlayerProgress / RpgState / TutorialStateを初期化し、Sound settingsは保持する。

## 9. 再攻略

負けた場合はWorldへ戻るかRETRYする。Random EncounterでEXP / Goldを得られるが、EnemyをLevel連動で弱くせず、Equipmentを極端に強くせず、Partyがtargetを自動決定しない。

今後のprogression追加は先にcanonical graph、map gate、Objective、route guard、save normalizationを更新し、同じ到達可能性をUnit / E2Eで固定する。
