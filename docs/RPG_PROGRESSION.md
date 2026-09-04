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
EXP / Gold / CLEAR / mastery
↓
元のmap・座標へreturn、またはtraceの先のmapへ前進
↓
Pauseで成長 / Item / Equipment / Party / Objective確認
```

JavaScript編では、**教材を先に終えてからincidentへ戻るのではなく、incidentを先に見て「何が読めないか」を知ってから必要なcodeを学ぶ**。

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

`unlockedStageIds` / `unlockedSkillIds`はどちらも**clear履歴から再導出できるcache**として扱い、stored bitそのものをauthorityにしない。

### RpgState v6

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

Level `L` に対して `n = L - 1` とする。

```text
累計必要EXP = 5n^3 + 15n^2 + 20n
base maxHP = 100 + n * 8
base powerMultiplier = 1 + n * 0.02
```

主なEXP境界:

```text
Lv1       0 EXP
Lv2      40 EXP
Lv3     140 EXP
Lv4     330 EXP
Lv5     640 EXP
Lv6   1,100 EXP
Lv7   1,740 EXP
Lv8   2,590 EXP
```

必要EXPは高Levelほど強く増やす。目的はgrindを禁止することではなく、**序盤の弱いBattleだけを周回するほど時間効率が自然に落ちる普通のRPG成長**にすること。

Equipment bonusを加えた`CombatStats`をBattleへ渡す。Skill damage、Defense mitigation、BYTE follow-up、Boss Guard、persistent HPはpure combat turn resolverで解決し、runtimeとsolvabilityが同じ計算を使う。

Level / Equipmentはdamageと生存余地を増やすが、`TargetRule`を変更しない。十分に時間をかけてLevelを上げたPlayerが多少楽になること自体は許容するが、通常進行ではcode readingを主な攻略手段にする。

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

初回CLEARはEXP / Gold / clear / masteryを適用する。ReplayもEXPは同量獲得でき、Goldだけ50%へ減衰する。

## 5. Skill mastery / trial

`unlockedSkillIds`は、Playerが**以後のBattleで通常利用できるMASTERED Skill**を表す。

Fresh saveのstarter Skill:

```text
TRACE
PULSE
NOVA
```

新しいSkillは原則として次の流れにする。

```text
Lesson Battle
→ そのBattle中だけTRIALとして利用可能
↓ clear
MASTERED
↓
後続Battleのauthored skill poolで通常利用可能
```

Battle UIは、

- そのStory beat開始時点までにMASTERED済み
- current LessonでTRIAL指定される

のどちらかを満たすSkillだけを表示する。generator / solvabilityも同じavailabilityを使う。

TRIALはcurrent Lessonで実際に読むSkillだけへ絞る。later incident / Boss用の派生Skillは、同conceptという理由だけで早期解放せず、**そのSkillが使うsyntaxがすべて学習済みになったStory beatでMASTERED**へする。

例:

```text
JS-05 &&
→ TRIAL LINK
→ clear後 LINK MASTERED

JS-06 ||
→ TRIAL FORK
→ clear後 FORK MASTERED

JS-09 filter()
→ TRIAL GATHER
→ clear後 GATHER / VIPER / LOCK / ALERT MASTERED

JS-13 some()
→ TRIAL SIGNAL
→ clear後 SIGNAL / SWEEP MASTERED

JS-16 sort()
→ TRIAL ORDER
→ clear後 ORDER / MOON EDGE MASTERED

JS-18 reduce()
→ TRIAL REDUCE FOCUS
→ clear後 REDUCE FOCUS / JUDGE MASTERED
```

TypeScriptもTS-01 / TS-02 / TS-03で同じTRIAL → MASTERED規則を使う。

これにより「SKILL UNLOCKED」というrewardが単なる表示ではなく、後続のincident / Bossで実際のplayer agencyへつながる一方、未学習syntaxを含む派生Skillが早く出ることも防ぐ。PauseのCODEXでは現在のMASTERED Skillを確認できる。

## 6. Multi-map World / Encounter

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

## 7. Learning pacing / Level pacing

main Story初回clearだけの累計EXPは、JS-19 clear時に640 EXP = Lv5へ到達する。

Final recommended Lv5はhard gateではなくstretch target。Final直前はLv4で、Random / Replayを少し挟めば事前にLv5へ近づける一方、寄り道なしでもcodeを正しく読めれば挑戦できる余地を残す。

JS-01（12 EXP）だけを繰り返す場合はLv5まで約54勝、Lv6まで約92勝、Lv8まで約216勝必要。長時間育成するplaystyleは許容するが、普通にStoryを進める方が大幅に効率的になる。

Battle 1のGoldは既存Economy budgetを守るため20 Gを維持し、Story reorderやEXP curveだけを理由にShop / Inn価格や初回予算を崩さない。

## 8. Equipment / Party / Economy

Equipment slotsは`weapon` / `armor` / `accessory`。Attack / Defense / maxHPへbonusを加えるが、code readingを代替しない。

現在の仲間`BYTE`は1 ACTIONに1回、Playerがcodeから選んだtarget群のうちSkill後に生存する先頭1体だけへfollow-upする。全滅時は追撃しない。複数targetで追撃damageを乗算せず、選択外の相手へ自動攻撃しない。仲間に独立HP / Defense / Equipmentは持たせず、育成grindでcode readingを迂回できない構造を維持する。

### Party Rank

仲間にはPlayer Levelそのものをdamage bonusとして流用せず、**仲間自身の軽量成長stateとしてRank 1〜5**を定義する。現時点では個別EXPを保存せず、冒険全体の成長に同期する次の節目からpureに導出する。

```text
Player Lv1〜2 → Party Rank 1
Player Lv3〜4 → Party Rank 2
Player Lv5〜6 → Party Rank 3
Player Lv7〜8 → Party Rank 4
Player Lv9〜   → Party Rank 5
```

BYTEはRank 1でfollow-up 7、Rankが1上がるたびに+2、Rank 5で15。将来memberも`baseFollowUpDamage`と`followUpDamagePerRank`をdefinitionに持ち、同じRank progressionを使う。Pause → PARTYには現在Rank、実効follow-up、次RankのPlayer Level条件、Rankごとの伸びを表示する。

Rankは保存せずPlayer Levelから導出するため、RpgState schema v6にfield追加はなく**Rank用のsave migration不要**。既存save・途中加入member・将来追加memberも現在の冒険Levelに対応したRankから開始する。BattleとPauseはどちらも`getPartyMemberGrowth()` / `getPartyFollowUpDamage()`の同一計算を使い、表示値と実damageを分岐させない。

`PATCH KIT`は30 G、Battle中1回、最大24 HP回復。Battle中の消費/回復はattempt transaction内のtentative stateで、VICTORY時だけpersistent結果としてcommitする。RETRY / RETURN / RUN / reloadではBattle開始snapshotへ戻す。

## 9. World Objective

ObjectiveはPlayerProgressからpureに導出し、World / Pause / Battle後feedbackが同じ`worldObjective` sourceを使う。

JavaScriptは19 Story beat、TypeScriptは3 Story beatのcanonical graphに沿って、次のlive incident / preparation / trace / second symptom / root trace / Final Boss / AREA CLEARを表示する。

単なるsyntax syllabusではなく、**現在のincidentを解決するために次のcodeを読む理由**を示す。旧Gate表現のQuest Trackerは復活させない。

player-facing objectiveへlegacy numeric Battle IDを露出しない。

## 10. Save restore / reset

PlayerProgressはschema v4。旧v1 / v2 / v3からmigrationし、canonical progression graphからstage unlockを、validなtransitive clear履歴からSkill masteryを再導出する。stored `unlockedSkillIds`へ後半Skillを書き足しても先取りできない。

#261以前のsaveは旧順序を前提にしているため、進行済み地域から必要なStory beatを補完して**既存Playerを新しい序盤へ強制的に戻さない**。

- 旧saveでTraining 7以降へ進んでいる → 新しいJS-01は論理的に通過済みとして補完
- 旧saveでDeep Forest相当へ進んでいる → second symptomも論理的に通過済みとして補完
- JavaScript Boss 3 clear済み → modern JavaScript arc全体をcompletedとしてnormalize

RpgStateはschema v6。旧v1 / v2 / v3 / v4 / v5からmigrationし、未使用のpartyEquipmentを除去する。v5以前の旧Overworld TypeScript座標は`ts-frontier`へ移し、v6のexpanded Overworld座標はそのまま保持する。Party Rankは保存fieldではなくPlayer Levelからの派生値なので、Rank導入のためのschema更新・migrationは行わない。restore時に次をnormalizeする。

- map ID / map bounds / legacy TypeScript座標
- known Equipment / Party / Treasure ID
- Equipment slot / ownership
- non-negative Encounter counters
- current HP upper bound

`code-reading-rpg:game-state`の1回の`setItem`がcommit point。直前のvalid snapshotをbackupへ保持し、壊れたrootからは最新のvalid revisionを復旧する。旧Progress / RPG分割keyは初回migration入力のみで、root保存後は削除する。片側だけのlegacy saveはvalid側を保持し、他方を初期化する。

World portal graphとProgressから到達可能mapを導出し、locked Forest / Deep Forest / TypeScript内だけに位置がある不整合はOverworld開始地点へ戻す。`storage` eventでnewer revisionを取り込み、保存前に新しいrevisionを検出したstale tabは上書きせず新snapshotを採用する。LocalStorageにcompare-and-swapはないため完全同時書き込みの排他までは保証しない。

unfinished `battleSession`がroot saveに残っている場合はreload時にSTART snapshotへrollbackし、Enemy/turnだけ初期化されてPlayer HP/Itemだけ減ったpartial restoreを作らない。

`RESET PROGRESS`はPlayerProgress / RpgState / TutorialStateを初期化し、Sound settingsは保持する。

## 11. 再攻略 / Defeat

ReplayでもEXPは100%、Goldは50%。EnemyをLevel連動で弱くせず、Equipmentを極端に強くせず、Partyがtargetを自動決定しない。

Defeatは即commit / full healしない。

```text
DEFEAT
├─ RETRY BATTLE
│   → START HP / Item / Progressへrollback
│   → 同じBattle / seed
└─ RETURN TO CHECKPOINT
    → START map / local position / HP / Itemへrollback
    → no full heal
    → encounter cooldownだけreset
```

RUN / browser back / route abort / reloadもSTART snapshotへrollbackする。VICTORYだけがBattle中HP / Itemとrewardをpersistent outcomeとしてcommitする。詳細は[`BATTLE_SESSION.md`](./BATTLE_SESSION.md)を参照する。

今後のprogression追加は先にsemantic canonical graph、player-facing numbering、Skill mastery/trial、map gate、Objective、route guard、save normalizationを更新し、同じ到達可能性をUnit / E2Eで固定する。
