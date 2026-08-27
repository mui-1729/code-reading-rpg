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

責務:

- `src/world/worldMap.ts`: terrain / region / viewport / encounter候補
- `src/world/worldActions.ts`: movement / encounter / Shop / Party / Boss interactionのpure resolver
- `WorldPage.tsx`: resolver結果をstate更新・SE・navigateへ接続するUI adapter

World interactionを増やす場合も、`WorldPage.tsx`へ条件分岐を戻さずresolver側へ追加する。

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

### Encounter code variation

「Skill名と答えの対応を一度覚えれば以後読まなくてよい」状態を避ける。

- 通常Encounterは`encounterCount`を含むseedを使う
- 同じEncounter seedはreload / retryでも同じ表示コードを再現する
- 次のEncounterでは実コード表現を変える
- 同じSkillを複数Battleで使う場合はbase variant pool自体をBattleごとに分離する
- seed variationは学習範囲内の同値変換だけを使う
  - callback / base variant
  - 比較式の左右
  - dot access / bracket access
  - simple arrow parameter表記
- threshold値そのものは変えず、Skillの説明と表示コードの条件を一致させる
- `/* B2-... */`のような意味のない識別commentでunique扱いしない
- TargetRule / damage / solvabilityは表示variationから独立させる
- multiline codeは物理行数を変えず、CODE HELPの行対応を維持する

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

restore時はWorld bounds / known Equipment / known Party / slot整合性を正規化する。

### TutorialState v1

PlayerProgress / RpgStateと分離する。

`RESET PROGRESS`はProgressProviderが汎用reset eventをdispatchし、RpgProvider / TutorialProviderがそれぞれ自分のstateをresetする。Sound設定はユーザー設定として別LocalStorageに保存し、RESET PROGRESSでは保持する。

## Progress guidance

Open Worldでは「次Stageへ移動する」UIがないため、**World Objective**をPlayerProgressからpureに導出する。

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

表示場所はPause STATUSを基本とし、常設Quest HUDは置かない。Battle victory時は短い`WORLD PROGRESS / BOSS UNLOCKED / WORLD COMPLETE` feedbackだけを出す。

## Questの扱い

通常runtimeから旧Quest feedback / Side Quest bonus処理 / legacy Area Shop mountは外している。

`completedSideQuestIds`などのlegacy fieldは旧save互換のため当面保持するが、新機能のsource of truthにはしない。

つまり「save互換」と「現在のゲーム機能」を分ける。

## Legacy Area / Field

旧route `/javascript`, `/typescript`, `/javascript/field`, `/typescript/field`, `*/complete` は互換redirect用途だけにする。

旧Field / Area domain codeを即削除する必要はないが、新機能はそこへ追加しない。通常runtimeから参照されなくなったことを確認できた単位で整理する。

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

## Pause / fixed UI

通常画面の固定導線は基本的に`MENU`へ集約する。

Pause tabs:

```text
STATUS
ITEMS
EQUIPMENT
PARTY
CODEX
SYSTEM
```

- EXP / Gold / stats / World ObjectiveはSTATUS
- 学習参照はCODEX
- Sound ON/OFF / SE / BGM / Reset ProgressはSYSTEM
- 独立SOUND / CODEX overlayは通常画面へ戻さない

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
- Battle code variation / Battle間uniqueness / solvability
- multiline CODE HELP行対応
- reset propagation

Playwright E2Eで固定する:

```text
Title
→ World move
→ Random Encounter
→ Victory
→ World同座標へreturn
→ reload persistence
→ BYTE join / follow-up
→ Equipment変更 / Battle反映
→ Pause CODEX
→ Pause SYSTEM Sound persistence
```

Unit Testはdomainの意味、E2Eは主要loopの接続を担当し、同じ条件を両方へ重複させすぎない。

## 優先順位

### 完了した基盤

- World Objective / progress feedback
- 旧Quest / Side Quest runtime cleanup
- movement / interaction / encounter pure resolver
- RpgState restore validation
- Open World主要loop Playwright E2E
- Sound / CodexのPause集約
- Encounter code variation強化

### P1: World content density

1. recovery point
2. treasure / equipment acquisition
3. equipment shop
4. landmark / companion event

### P1: RPG選択の深さ

1. 装備ごとの差をAttack数値以外にも作る
2. Partyの役割差をコード読解を代替しない範囲で作る
3. 回復・消耗品の選択肢を増やしすぎず整理する

### P2: 学習コンテンツ

1. Boss-specific mechanic
2. third learning region（SQL / React候補）
3. 新region追加時も既存Worldへ自然につなぐ

## 守る原則

1. コード読解がtarget判断の中心
2. RPG成長は読解の代替ではなく余裕を作る
3. World / Battle / Progression / RPG stateを密結合させない
4. 常設HUDへ情報を詰め込まない
5. legacy save互換と現行featureを混同しない
6. UI条件分岐よりpure functionへ寄せる
7. 新機能はtest可能な境界を先に作る
8. 表示コードのvariationは学習上の意味を保ち、見た目だけのfake variationにしない
