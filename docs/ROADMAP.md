# CODE//READ RPG ロードマップ

## 目的

`CODE//READ RPG`を、**1つの2D Worldを探索しながらコードを読むRPG**として育てる。

機能を増やす前に、Open World化後の責務と導線を安定させる。

詳細設計は`docs/OPEN_WORLD_DESIGN.md`をsource of truthとする。

## 現在のコア導線

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
Worldへ復帰
```

Stage Select / Area Selectは通常導線に使わない。

## 守る原則

1. コードを読まないと正しいtargetを選びにくい
2. 同じ表示コードの丸暗記だけで攻略できない
3. Level / Equipment / Partyで読解を不要にしない
4. Worldは上下左右へ探索できる
5. terrainから学習regionが直感的に分かる
6. RPG詳細はPauseへ集約する
7. 常設Quest Trackerを復活させない
8. legacy save互換とcurrent featureを分ける
9. World UIへ分岐を増やす前にpure resolverを検討する
10. 主要loopを自動テストできる形へ寄せる

## 実装済み

### Open World

- 40×28 World
- 11×9 camera viewport
- 上下左右探索
- JavaScript Grassland / tall-grass
- TypeScript Forest
- Central Hub / road / mountain / water
- Random Encounter
- encounter cooldown
- fixed Boss
- World位置save

### Battle / learning

- JavaScript Battle 1〜3
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- seeded generation / solvability
- code variants / multiline
- Battle + seed固有表示code
- CODE HELP / CODE DATA
- result sequence

### RPG

- EXP / Level / Gold
- Max HP / Attack / Defense
- Weapon / Armor / Accessory
- Equipment bonus
- PATCH KIT / Hub Shop
- Party member BYTE
- follow-up attack
- Boss clear equipment reward
- Pause: STATUS / ITEMS / EQUIPMENT / PARTY / SYSTEM
- PlayerProgress v4
- RpgState v1

### UI / onboarding

- MOVE → INTERACT → SELECT → EXECUTE Tutorial
- World座標ベースMOVE判定
- Stage Select / Complete画面を通常導線から削除
- Battle結果の段階表示
- reduced motion

## P0: 現行Open Worldの設計整合性

### 1. World Objective / Progress Feedback

Stage Selectをなくしたため、次に何をすれば進むかをPauseから確認できるようにする。

要件:

- PlayerProgressからpureにderive
- JavaScript / TypeScriptごとのprogress
- Pause STATUSへ表示
- Battle勝利時に短い一時feedback
- Boss unlockを明確にする
- 常設HUDは増やさない

### 2. Legacy Quest runtime cleanup

World Objective導入後:

- 旧Gate文言のMain Quest feedbackを置換
- inactive Side Quest victory処理を通常Battle runtimeから外す
- QuestVictoryFeedbackをWorld progress feedbackへ置換
- legacy `completedSideQuestIds`はsave互換のため保持
- old Field focusは通常runtimeから外す

### 3. stale Area / Field wording cleanup

新しいfeatureやdocsでArea Select / Field Gateをcurrent flowとして扱わない。

## P1: World基盤

### 1. World action resolver

現在`WorldPage.tsx`にあるmovement / encounter / interactionの条件分岐をpure resolverへ分離する。

目的:

- object追加時のUI肥大化を防ぐ
- encounter testを強くする
- navigation intentとstate updateを分ける

### 2. RpgState validation

restore時に次を検証する。

- World bounds
- known Equipment ID
- known Party ID
- loadout consistency

### 3. Open World E2E

主要flow:

```text
Title
→ World move
→ Encounter
→ Victory
→ World return
→ Pause
→ BYTE join
→ Equipment
→ Battle
```

をbrowser E2Eで固定する。

## P1: World content density

地図をさらに広げる前に意味のある地点を増やす。

候補:

- recovery point / Inn
- treasure
- equipment shop
- landmark
- companion event

空間を埋めるだけのNPC / Signは追加しない。

## P2: Battle / learning depth

### Boss-specific mechanic

Bossだけの読解パターンを追加する。

条件:

- 表示コードから理解できる
- 新しい常設説明panelを必要としない
- TargetRule / solvabilityをtestできる

### Third learning region

候補:

- SQL = cave / ruins
- React = town / workshop

Area Selectは作らずWorldへ接続する。

## P2: Party / Equipment depth

必要性が確認できたら追加する。

- 2人目の仲間
- support / heal role
- party equipment利用
- equipment特性

単純なAttack inflationだけにしない。

## 当面増やさないもの

- Stage Select
- Area Select
- 複雑なQuest Log
- 大量の常設HUD
- 大量のsupport item
- Backend / Login / Cloud Save / Ranking

Backendは複数端末同期や共有Challengeが必要になった時点で検討する。

## Quality gate

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
