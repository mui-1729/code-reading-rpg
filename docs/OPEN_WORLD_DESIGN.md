# CODE//READ RPG Open World Design

## 目的

現在のCODE//READ RPGは、Area Select / Stage Select中心ではなく、**1つの2D Worldを探索してRandom Encounterと固定Bossへ入るコード読解RPG**である。

この文書を、Open World化後の全体設計と今後の優先順位のsource of truthとする。

## 現在のゲームループ

```text
Title
↓
Open World
├─ JavaScript Grassland
├─ Central Hub
└─ TypeScript Forest
↓
Random Encounter / Fixed Boss
↓
Code Reading Battle
↓
EXP / Gold / Unlock / Equipment reward
↓
Worldの元座標へ復帰
```

Stage Select / Area Select / 専用Complete画面は通常導線へ戻さない。

## World

現在:

- 40 × 28 tile
- camera viewport 11 × 9
- 4方向移動
- JS = grass / tall-grass
- TS = forest
- Hub / road = safe zone
- Random Encounterは最低5歩cooldown後にterrainごとの確率で発生
- Battle 3 / 6は固定Boss
- World座標 / encounter counterをsave

`src/world/worldMap.ts`はterrain / region / viewport / encounter候補のpure logicを担当する。

`WorldPage.tsx`は現在movement・interaction・encounter遷移のorchestrationも持つ。今後World interactionが増える場合は、UIへ条件分岐を足し続けずpure resolverへ分離する。

## Battle

Battleの中心責務は変えない。

- 表示コードを読む
- SkillをSELECT
- 同じSkillを再度押してEXECUTE
- TargetRuleで対象を決定
- POWER + Player側補正でdamageを決定

装備や仲間は読解結果を置き換えない。

```text
code reading → target決定
equipment → damage / defense / max HP補正
party → codeが選んだ同じtargetへの補助
```

正解target / 正解Skill / damage previewを先に表示しない。

## State ownership

永続stateは責務ごとに分ける。

### PlayerProgress v4

```ts
{
  exp,
  gold,
  inventory,
  clearedStageIds,
  clearedAreaIds,
  completedSideQuestIds, // legacy save compatibility
  unlockedStageIds,
  unlockedSkillIds,
}
```

担当:

- EXP / Level元データ
- Gold / consumable
- Battle clear / area clear
- Stage / Skill unlock

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

担当:

- World exploration
- Equipment
- Party
- Encounter pacing

### TutorialState v1

PlayerProgress / RpgStateと分離する。

`RESET PROGRESS`はProgressProviderが汎用reset eventをdispatchし、RpgProvider / TutorialProviderがそれぞれ自分のstateをresetする。

## Progress guidance

Open Worldでは「次Stageへ移動する」UIがないため、Playerが次に何をすれば進行するかを見失いやすい。

今後は旧Quest UIを復活させるのではなく、**World Objective**をPlayerProgressからpureに導出する。

例:

```text
JavaScript Grassland
0/3 → tall-grassでEncounter
1/3 → tall-grassで次の読解Battle
2/3 → 西のBossへ
3/3 → CLEAR

TypeScript Forest
0/3 → forestでEncounter
1/3 → forestで次の読解Battle
2/3 → 東のBossへ
3/3 → CLEAR
```

表示場所はPause STATUSを基本とし、常設HUDを増やさない。Battle victory時は短い一時feedbackだけ許可する。

## Questの扱い

現在Side Quest definitionは空で、`completedSideQuestIds`は旧save互換のためだけに残っている。

Main Quest definition / QuestVictoryFeedbackには旧Gate / Field用語が残っている。

方針:

1. World Objectiveを導入する
2. Battle結果のprogress feedbackをWorld Objectiveへ置換する
3. 通常runtimeからSide Quest処理・旧Quest feedback・旧Field focus依存を外す
4. save schemaの`completedSideQuestIds`はmigration互換のため当面保持する

つまり「save互換」と「現在のゲーム機能」を分ける。

## Legacy Area / Field

旧route `/javascript`, `/typescript`, `/javascript/field`, `/typescript/field`, `*/complete` は互換redirect用途だけにする。

旧Field / Area UIのdomain codeを即削除する必要はないが、新機能はそこへ追加しない。

通常runtimeから参照されなくなったことを確認できた単位で整理する。

## Equipment / Party

現在:

- Weapon / Armor / Accessory
- starter equipment
- Boss clear equipment reward
- BYTE 1人
- BYTE follow-up attack

次の拡張では数を増やす前に「選択に意味があるか」を優先する。

避ける:

- Attack数値だけ違う大量装備
- Partyが自動で正解targetを選ぶ
- Level / Item grindだけでコードを読まず勝つ

## World content

Worldを広げたため、次は地図サイズではなく**意味のある地点密度**を増やす。

候補:

- recovery point / Inn
- treasure
- equipment shop
- landmark
- companion event

ただし空間を埋めるだけのNPC・説明看板は追加しない。

## Testing boundary

Unit Testで固定する:

- World terrain / viewport / bounds
- encounter cooldown / battle selection
- World Objective derivation
- PlayerProgress / RpgState persistence
- Equipment combat stats
- Party follow-up
- Battle code uniqueness / solvability
- reset propagation

Manual / E2Eで確認する:

```text
Title
→ World move
→ Random Encounter
→ Victory
→ World同座標へreturn
→ Pause確認
→ BYTE join
→ Equipment変更
→ Battle反映
```

World interactionがさらに増える前に、主要loopのbrowser E2Eを導入する価値が高い。

## 優先順位

### P0: 現行設計の整合性

1. World Objective / progress feedback
2. 旧Quest / Side Quest runtime cleanup
3. stale docs / UI wording cleanup

### P1: World基盤を壊れにくくする

1. movement / interaction / encounter orchestrationをpure resolverへ分離
2. RpgState restore時のWorld bounds / known equipment / known party validation
3. 主要Open World loopのE2E

### P1: World content density

1. recovery point
2. treasure / equipment acquisition
3. landmark / companion event

### P2: 学習コンテンツ

1. Boss-specific mechanic
2. third learning region（SQL / React候補）

## 守る原則

1. コード読解がtarget判断の中心
2. RPG成長は読解の代替ではなく余裕を作る
3. World / Battle / Progression / RPG stateを密結合させない
4. 常設HUDへ情報を詰め込まない
5. legacy save互換と現行featureを混同しない
6. UI条件分岐よりpure functionへ寄せる
7. 新機能はtest可能な境界を先に作る
