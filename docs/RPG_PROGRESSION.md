# CODE//READ RPG 成長・探索ループ

## 1. 目的

multi-map探索・Battle・成長・装備・仲間を1つのRPG loopとして扱う。

```text
Overworld / Village / Forest / Deep Forest / TypeScript Frontier
↓
Fixed Lesson / Story Incident / Random Encounter / MID BOSS / Final Boss
↓
Code Reading Battle
↓
EXP / Gold / CLEAR / unlock
↓
元のmap・座標へreturn
↓
Pauseで成長 / Item / Equipment / Party / Objective確認
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

`completedSideQuestIds`はlegacy save互換のため保持する。LevelはEXPから導出し、保存しない。

### RpgState v4

```ts
{
  equipment,
  ownedEquipmentIds,
  partyMemberIds,
  partyEquipment,
  worldMapId,
  worldPosition,
  stepsSinceEncounter,
  encounterCount,
  currentHp,
  openedTreasureIds,
}
```

PlayerProgressへWorld座標やEquipmentを混ぜない。

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
Village preparation
7 → 8 → 9
↓
first live incident
1
↓
Forest trace
10 → 11 → 12 → 13 MID BOSS → 14
↓
second live incident
2
↓
Deep Forest root trace
15 → 16 → 17 → 18 → 19 MID BOSS → 20 → 21 → 22
↓
Code Core Final Boss
3
```

TypeScript:

```text
JavaScript Boss 3 clear → 4 → 5 → Final Boss 6
```

`battleId`はsave / URL / runtime互換のためのstable identifierであり、Story chapter番号ではない。Story順とprerequisiteは`src/progression/progressionGraph.ts`のsemantic keyをcanonical sourceとする。

route accessibility / next Battle / unlockはcanonical graphから導出する。勝利処理はprerequisiteを飛ばしたunlockを作らず、clear bitを一部だけ偽装してもtransitive prerequisiteを満たさなければ後続Battleを解放しない。通常進行へStage Selectを戻さない。

初回CLEARはEXP / Gold / clear / unlockを適用し、replayはEXP / Goldだけを再獲得できる。

## 5. Multi-map World / Encounter

- `overworld` — Hub、Village入口、最初のlive incident、Code Core接続
- `js-village` — Battle 7〜9の固定Preparation。Random Encounterなし
- `js-forest` — first incidentから続くtraceをBattle 10〜14で追う
- `js-deep-forest` — 入口でsecond incident 2を確認し、Battle 15〜22でshared traceをroot causeまで追う
- `ts-frontier` — Battle 4〜6

JavaScriptのBattle 1 / 2は未clear時にStory上のfixed incidentとして発生する。Forest / Deep ForestのRandom Encounterはその時点でclear済みのLessonだけを反復し、MID BOSS / Final Bossを混ぜない。遭遇後はcooldownを持ち、安全地帯では遭遇しない。

Battle 22 clear後はDeep Forest西口からCode Core手前へ直接抜ける。旧`22 → Overworldへ戻る → 1 → 2`のbacktrackは行わない。

## 6. Equipment / Party / Economy

Equipment slotsは`weapon` / `armor` / `accessory`。Attack / Defense / maxHPへbonusを加えるが、code readingを代替しない。

現在の仲間`BYTE`はPlayerがcodeから選んだ同じtargetだけへfollow-upする。独自にcorrect targetを決めない。

`PATCH KIT`は30 G、Battle中1回、最大24 HP回復。現在HPと在庫はそれぞれRpgState / PlayerProgressへ保存する。

## 7. World Objective

ObjectiveはPlayerProgressからpureに導出し、World / Pause / Battle後feedbackが同じ`worldObjective` sourceを使う。

JavaScriptは19 Battle、TypeScriptは3 Battleのcanonical graphに沿って、次のPreparation / live incident / trace / MID BOSS / Final Boss / AREA CLEARを表示する。単なるsyntax syllabusではなく、**現在のincidentを解決するために次のcodeを読む理由**を示す。旧Gate表現のQuest Trackerは復活させない。

## 8. Save restore / reset

PlayerProgressはschema v4。旧v1 / v2 / v3からmigrationし、canonical progression graphからunlockを再導出する。

#261以前のv4 saveについても、すでにForest以降へ進んでいる場合はfirst incident 1、Deep Forest以降へ進んでいる場合はsecond incident 2を「論理的に通過済み」として補完する。JavaScript Boss 3 clear済みsaveはmodern JavaScript arc全体をcompletedとしてnormalizeし、後戻りを強制しない。

RpgStateはschema v4。旧v1 / v2 / v3からmigrationし、restore時に次をnormalizeする。

- map ID / map bounds / legacy TypeScript座標
- known Equipment / Party / Treasure ID
- Equipment slot / ownership / Party loadout
- non-negative Encounter counters
- current HP upper bound

`RESET PROGRESS`はPlayerProgress / RpgState / TutorialStateを初期化し、Sound settingsは保持する。

## 9. 再攻略

負けた場合はWorldへ戻るかRETRYする。Random EncounterでEXP / Goldを得られるが、EnemyをLevel連動で弱くせず、Equipmentを極端に強くせず、Partyがtargetを自動決定しない。

今後のprogression追加は先にsemantic canonical graph、map gate、Objective、route guard、save normalizationを更新し、同じ到達可能性をUnit / E2Eで固定する。
