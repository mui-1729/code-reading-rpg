# CODE//READ RPG 成長・探索ループ

## 1. 目的

multi-map探索・Battle・成長・装備・仲間を1つのRPG loopとして扱う。

```text
Opening incident
↓
Overworld / Village / Forest / Deep Forest / TypeScript Frontier
↓
Fixed Story Beat / Fixed Lesson / Random Encounter / MID BOSS / Final Boss
↓
Code Reading Battle
↓
EXP / Gold / CLEAR / unlock
↓
元のmap・座標へreturn、またはtraceの先のmapへ前進
↓
Pauseで成長 / Item / Equipment / Party / Objective確認
```

JavaScript編では、**教材を先に終えてからincidentへ戻るのではなく、incidentを先に見て「何が読めないか」を知ってから必要なcodeを学ぶ**。

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

Story上の番号はplayer-facingな連番として表示する。

### JavaScript

```text
JS-01  LIVE INCIDENT
  最初のtarget異常を実際に体験
↓
JS-02  hp / comparison
JS-03  name / ===
JS-04  find()
  VillageでJS-01の読めなかった部分を切り出す
↓
JS-05  find() + &&
JS-06  find() + ||
JS-07  combined conditions
JS-08  Forest MID BOSS
JS-09  find() vs filter()
↓
JS-10  SECOND SYMPTOM
  複数target側にも同じ異常が広がったことを確認
↓
JS-11  filter() repetition
JS-12  map()
JS-13  some()
JS-14  every()
JS-15  Deep Forest MID BOSS
JS-16  sort() + [0]
JS-17  optional chaining / nullish coalescing
JS-18  reduce()
↓
JS-19  ROOT CAUSE / Code Core Final Boss
```

内部のnumeric `battleId`はsave / URL / runtime互換のstable identifierであり、Story chapter番号ではない。現在のsemantic routeとlegacy IDの対応は次のとおり。

```text
JS-01  -> battleId 1
JS-02  -> battleId 7
JS-03  -> battleId 8
JS-04  -> battleId 9
JS-05  -> battleId 10
JS-06  -> battleId 11
JS-07  -> battleId 12
JS-08  -> battleId 13
JS-09  -> battleId 14
JS-10  -> battleId 2
JS-11  -> battleId 15
JS-12  -> battleId 16
JS-13  -> battleId 17
JS-14  -> battleId 18
JS-15  -> battleId 19
JS-16  -> battleId 20
JS-17  -> battleId 21
JS-18  -> battleId 22
JS-19  -> battleId 3
```

Story順とprerequisiteは`src/progression/progressionGraph.ts`のsemantic keyをcanonical sourceとする。numeric IDの大小や配列定義順をStory順のauthorityにしない。

### TypeScript

TypeScriptはJavaScriptとは別系列でplayer-facing番号を持つ。

```text
JavaScript JS-19 clear
↓
TS-01  CONTRACT TRACE
↓
TS-02  DATA SHAPE
↓
TS-03  ROOT CAUSE
```

内部互換IDはそれぞれ4 / 5 / 6。

route accessibility / next Battle / unlockはcanonical graphから導出する。勝利処理はprerequisiteを飛ばしたunlockを作らず、clear bitを一部だけ偽装してもtransitive prerequisiteを満たさなければ後続Battleを解放しない。通常進行へStage Selectを戻さない。

初回CLEARはEXP / Gold / clear / unlockを適用し、replayはEXP / Goldだけを再獲得できる。

## 5. Multi-map World / Encounter

- `overworld` — Hub、JS-01のlive incident、Village入口、Code Core接続
- `js-village` — JS-02〜04の固定Preparation。Random Encounterなし
- `js-forest` — JS-05〜09でfirst incidentから続くtraceを追う
- `js-deep-forest` — 入口でJS-10のsecond symptomを確認し、JS-11〜18でshared traceをroot causeまで追う
- `ts-frontier` — TS-01〜03

JavaScriptのfirst incident / second symptomは未clear時にStory上のfixed beatとして発生する。Forest / Deep ForestのRandom Encounterはその時点でclear済みのLessonだけを反復し、MID BOSS / Final Bossを混ぜない。遭遇後はcooldownを持ち、安全地帯では遭遇しない。

### World gate

```text
Opening / JS-01未clear
→ Villageへは進ませない

JS-01 clear
→ Village解放

JS-04 clear
→ Forest解放

JS-09 clear
→ Deep Forest解放

JS-10 clear
→ Deep Forest learning route開始

JS-18 clear
→ Deep Forest西口からCode Core approach解放

JS-19 clear
→ JavaScript Area CLEAR / TypeScriptへ
```

JS-18 clear後はDeep Forest西口からCode Core手前へ直接抜ける。終盤に草原やVillageへ戻って古いBattleを消化するbacktrackは行わない。

## 6. Learning pacing / Level pacing

Story reorderでRPG成長を壊さない。

- JS-01はLv1で体験できる難易度
- JS-01だけで即Lv2にはしない
- Village JS-02〜04を終える頃にLv1後半〜Lv2へ近づく
- Forest調査を進めてJS-10へ到達する頃にrecommended Lv3と整合させる
- Deep Forestを通してFinal直前にrecommended Lv5へ自然に近づける

Battle 1のGoldは既存Economy budgetを守るため20 Gを維持し、Story reorderだけを理由にShop / Inn価格や初回予算を崩さない。

## 7. Equipment / Party / Economy

Equipment slotsは`weapon` / `armor` / `accessory`。Attack / Defense / maxHPへbonusを加えるが、code readingを代替しない。

現在の仲間`BYTE`はPlayerがcodeから選んだ同じtargetだけへfollow-upする。独自にcorrect targetを決めない。

`PATCH KIT`は30 G、Battle中1回、最大24 HP回復。現在HPと在庫はそれぞれRpgState / PlayerProgressへ保存する。

## 8. World Objective

ObjectiveはPlayerProgressからpureに導出し、World / Pause / Battle後feedbackが同じ`worldObjective` sourceを使う。

JavaScriptは19 Story beat、TypeScriptは3 Story beatのcanonical graphに沿って、次のlive incident / preparation / trace / second symptom / root trace / Final Boss / AREA CLEARを表示する。

単なるsyntax syllabusではなく、**現在のincidentを解決するために次のcodeを読む理由**を示す。旧Gate表現のQuest Trackerは復活させない。

player-facing objectiveへlegacy numeric Battle IDを露出しない。

## 9. Save restore / reset

PlayerProgressはschema v4。旧v1 / v2 / v3からmigrationし、canonical progression graphからunlockを再導出する。

#261以前のsaveは旧順序を前提にしているため、進行済み地域から必要なStory beatを補完して**既存Playerを新しい序盤へ強制的に戻さない**。

- 旧saveでTraining 7以降へ進んでいる → 新しいJS-01は論理的に通過済みとして補完
- 旧saveでDeep Forest相当へ進んでいる → second symptomも論理的に通過済みとして補完
- JavaScript Boss 3 clear済み → modern JavaScript arc全体をcompletedとしてnormalize

RpgStateはschema v4。旧v1 / v2 / v3からmigrationし、restore時に次をnormalizeする。

- map ID / map bounds / legacy TypeScript座標
- known Equipment / Party / Treasure ID
- Equipment slot / ownership / Party loadout
- non-negative Encounter counters
- current HP upper bound

`RESET PROGRESS`はPlayerProgress / RpgState / TutorialStateを初期化し、Sound settingsは保持する。

## 10. 再攻略

負けた場合はWorldへ戻るかRETRYする。Random EncounterでEXP / Goldを得られるが、EnemyをLevel連動で弱くせず、Equipmentを極端に強くせず、Partyがtargetを自動決定しない。

今後のprogression追加は先にsemantic canonical graph、player-facing numbering、map gate、Objective、route guard、save normalizationを更新し、同じ到達可能性をUnit / E2Eで固定する。
