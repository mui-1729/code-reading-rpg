# CODE//READ RPG ロードマップ

## 目的

`CODE//READ RPG`を、**コードを読む行為がそのままゲーム上の判断になるRPG**として育てる。

機能数を増やすこと自体を目的にしない。現在は一度増えた補助画面・常設UIを整理し、次のコア導線を基準にする。

```text
Title
↓
World Map
↓
Field
↓
Battle
↓
次Battle
↓
Boss
↓
Area Clear
```

## 守る原則

1. コードを読まないと正しい行動を選びにくい
2. 同じ手順の暗記だけで攻略できない
3. 読んだ結果がゲーム内の意思決定へつながる
4. Level / Itemだけでコード読解を不要にしない
5. 1画面へ情報・説明・buttonを詰め込みすぎない
6. 同じ役割の画面やnavigationを重複させない
7. Tutorialで教えた操作説明を常設しない
8. 読解に必要な実値は確認できるようにするが、正解targetは先に見せない
9. Fieldの進行経路とtile geometryを安定させる
10. コンテンツを増やしても自動テストできる

## 実装済み

### Battle / 読解

- JavaScript Kingdom: Battle 1〜3
- TypeScript Frontier: Battle 4〜6
- SELECT → EXECUTE
- seeded generation / solvability
- code variants / multi-line code
- CODE HELP
- CODE DATA / runtime中間値
- Battle motion / damage feedback

### RPG loop

- World Map
- AreaごとのField
- Battle Gate
- Boss / Area Clear
- EXP / Level / 最大HP / POWER倍率
- Gold
- PATCH KIT
- Field内の簡易SHOP
- Skill / Battle unlock
- LocalStorage schema v4 / migration / reset

### Field / learning

- Keyboard / Mobile移動
- collision / interaction
- NPC / Dialogue
- 任意学習看板
- Code Codex
- 次のGateを示す最小marker
- reachability test
- 12×9の固定正方形tile

### Onboarding / result UI

- 初回Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- Titleの常設HOW TO PLAYを廃止
- Battle結果をEXP / Gold / Level Up / Unlock / Clear等の順に段階表示
- click / tap / auto advance / skip
- `prefers-reduced-motion`

## 削除・無効化したもの

単純な導線を優先するため、次を通常ゲームから外す。

- 独立Stage Select画面
- 独立Complete画面
- 常設Quest Tracker
- 再攻略Side Quest / bonus EXP
- Tutorialと重複するField常設操作説明

Legacy URLや旧save dataは壊さず、安全にredirect / restoreする。

## 現在のArea

```text
JavaScript Kingdom
Battle 1 → Battle 2 → Battle 3 Boss

TypeScript Frontier
Battle 4 → Battle 5 → Battle 6 Boss
```

## 次に増やす場合の優先順位

### 1. 3つ目のArea

SQL / Reactなどを候補にする。

追加条件:

- 既存2Areaと違う「読み方」が必要
- Battle上の判断が変わる
- 新Areaのためだけに大量の補助UIを増やさない

### 2. Boss固有mechanic

Bossだけに意味のある読解・戦略要素を検討する。ただし説明量を増やしすぎない。

### 3. Field拡張

1画面が本当に窮屈になった場合だけ複数screen / camera追従を検討する。

## 当面増やさないもの

必要性が明確になるまで追加しない。

- 装備system
- Inn
- 大量のsupport item
- Side Quest layer
- 複雑なQuest Log
- 独立Stage Select
- Backend / Login / Cloud Save / Ranking

Backendは複数端末同期や共有機能が必要になった時点で検討する。

## Quality gate

PR前に必ず次を通す。

```bash
npm ci
npm run lint
npm test
npm run build
```

その後、Cloudflare Preview・self-review・merge・main CI・Productionを確認する。
