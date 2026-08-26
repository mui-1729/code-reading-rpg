# CODE//READ RPG ロードマップ

## 目的

`CODE//READ RPG`を、**普通の2D RPGを遊びながらコードを読むゲーム**として育てる。

探索・成長・装備・仲間はRPGとして楽しめるようにする。一方で、Battleで誰を対象にするかは表示コードを読まないと判断しにくい状態を守る。

## 現在のコア導線

```text
Title
↓
Open World
├─ JavaScript Grassland
├─ Central Hub
└─ TypeScript Forest
↓
Random Encounter / 固定Boss
↓
Code Reading Battle
↓
Worldへ復帰
```

Stage Select / Area Selectは使わない。

## 守る原則

1. コードを読まないと正しい行動を選びにくい
2. 同じ表示コードの丸暗記だけで攻略できない
3. Level / Equipment / Partyだけで読解を不要にしない
4. Worldは上下左右へ探索でき、画面外にも続く
5. terrainから学習地域が直感的に分かる
6. 1画面へ情報・説明・buttonを詰め込みすぎない
7. EXP / Gold / Items / Equipment / PartyはPauseへ集約する
8. Tutorialで教えた操作説明を常設しない
9. 読解に必要な実値は確認できるが、正解targetは先に見せない
10. World / Battle / saveの重要ロジックは自動テストする

## 実装済み

### Open World / encounter

- 40×28 World
- 11×9 camera viewport
- 上下左右探索
- JavaScript = 草原 / 草むら
- TypeScript = 森
- Hub / Road / Mountain / Water
- 草むら / 森のRandom Encounter
- encounter cooldown
- 固定Boss地点
- World位置save

### Battle / learning

- JavaScript Battle 1〜3
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- seeded generation / solvability
- code variants / multi-line code
- Battle + seed固有の表示code
- duplicate code test
- CODE HELP / CODE DATA
- Battle motion / result sequence

### RPG system

- EXP / Level / Gold
- Max HP / Attack / Defense
- Weapon / Armor / Accessory
- Equipment bonus
- PATCH KIT / Hub Shop
- Party member BYTE
- 仲間follow-up attack
- Boss clear equipment reward
- Pause: STATUS / ITEMS / EQUIPMENT / PARTY / SYSTEM
- RPG state LocalStorage

### UI / onboarding

- 初回Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- World cameraでもWorld座標でMOVE判定
- Title HOW TO PLAY廃止
- Stage Select / Complete専用画面廃止
- 常設Quest Tracker廃止
- Battle結果の段階表示
- fixed square tile
- reduced motion

## 次に拡張するなら

### 1. World content density

Open World基盤を増やすより、今あるWorldへ意味のある場所を足す。

候補:
- 小さな町 / Inn
- 宝箱
- 装備Shop
- 回復地点
- 仲間イベント
- landmark

ただし空間を埋めるためだけのUIやNPCは増やさない。

### 2. 3つ目のlearning region

SQL / Reactなどを同一Worldの別regionとして追加する。

例:
- SQL = 洞窟 / 地下遺跡
- React = 町 / 工房

Area Selectは作らず、Worldを歩いてregionへ入る。

### 3. Party depth

必要になった段階で:
- 2人目以降の仲間
- heal / support
- party equipment
- member固有skill

自動戦闘でcode readingを代替しない。

### 4. Equipment / item depth

必要性があるものだけ追加する。

- equipment shop
- treasure drop
- recovery item variation
- accessory特性

単純なAttack inflationだけにしない。

### 5. Boss-specific mechanic

Bossだけの読解パターンや戦略を追加する。説明を増やしすぎず、表示コードからルールを読み取れる形を優先する。

## 当面増やさないもの

- Stage Select
- Area Select
- 複雑なQuest Log
- 大量の常設HUD
- Backend / Login / Cloud Save / Ranking

Backendは複数端末同期や共有Challengeが必要になった時点で検討する。

## Quality gate

PR前に必ず次を通す。

```bash
npm ci
npm run lint
npm test
npm run build
```

その後、Cloudflare Preview・self-review・merge・main CI・Productionを確認する。
