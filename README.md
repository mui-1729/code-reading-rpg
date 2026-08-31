# CODE//READ RPG

コードを「書く」のではなく、**表示されたコードを読んで戦う2D RPG**です。

普通のRPGらしい探索・成長・装備・仲間を持たせつつ、誰を攻撃するかの判断はコード読解から外さないことを中心にしています。

## Current game flow

```text
Title
↓
REAL WORLD briefingからCODE WORLDへCONNECT
↓
Openingで最初の異変を実際に体験
↓
Villageで「さっき読めなかった部分」だけを小さく確認
↓
Forest / Deep Forestへ同じincidentのtraceを追う
↓
Code Coreでroot causeを止める
↓
REAL WORLDへRETURNしてincident close
```

Stage SelectやArea Selectへ戻って進行する構造ではありません。旧Area / Field URLは`/world`へredirectします。

## Implemented

### Open World

- Overworld / Greenfield Village / Forest / Deep Forest / TypeScript Frontierの5 map
- Overworldは40×28、各regionは独立した意味のあるmapとして接続
- 11×9 viewport / Player追従camera
- 上下左右の画面外へ移動可能
- tileは固定正方形
- JavaScript地方 = first live incident → Village preparation → Forest trace → second symptom → Deep Forest root trace → Code Core
- TypeScript地方 = TypeScript Frontier
- Central Hub / Road / Water / Mountain
- 固定Boss地点
- HubのShop / 仲間NPC BYTE
- World座標をLocalStorage保存
- Desktop: Arrow / WASD、Mobile: D-Pad + INTERACT

### JavaScript story progression

プレイヤーへ見せるStory番号は、JavaScript編内で`JS-01`から連番にします。

```text
JS-01  LIVE INCIDENT
↓
JS-02  hp / comparison
JS-03  name / ===
JS-04  find()
↓
JS-05〜09  Forest trace
↓
JS-10  SECOND SYMPTOM
↓
JS-11〜18  Deep Forest root trace
↓
JS-19  ROOT CAUSE / Code Core
```

重要な方針:

- **最初にincidentを見てから学ぶ。** syntaxを先に履修してからincidentへ戻る構造にはしない
- Villageは独立したtutorial syllabusではなく、JS-01で読めなかった`hp` / `name` / `find()`を切り出して確認する場所
- Forest / Deep Forestでは「次のsyntaxだから」ではなく、同じincidentのtraceを追う途中で必要になったcodeを読む
- Battle 22後は来た道を戻らず、Deep Forest西口からCode Coreへ直接進む

内部では既存save / URL互換のためnumeric `battleId`を維持しています。numeric IDはchapter番号ではなくlegacy runtime identifierです。Story順はsemantic progression keyで管理し、画面上の`JS-01...JS-19` / `TS-01...TS-03`とは分離します。

### Random Encounter

- JavaScript Forest / Deep Forestではclear済みLessonを段階的に再出題
- JavaScriptのfirst incident / second symptomはStory上の固定beatとして発生し、未clear中はRandom復習にしない
- TypeScript FrontierではBattle 4 / 5を進行に応じて出題
- 最低5歩のcooldown
- terrainごとの遭遇率
- Road / Hubは安全地帯
- Battle後は元のWorld位置へ復帰
- new conceptをRandom Encounterで初登場させない

### Battle / code reading

- 1回目SELECT、同じcardの2回目EXECUTE
- 表示コードと安全な内部`TargetRule`を対応
- Enemy HP / NEXT行動
- CODE HELP / CODE DATA
- seeded generation / solvability
- code variants / multi-line code / 行別HELP
- Battle + seedごとに表示コードを固有化し、別Battleで同じ文字列を再利用しない
- 既存の1行 / 3行読解構造は維持
- correct target / 正解Skillを実行前に表示しない

### RPG progression

- EXP / Level
- Max HP / Attack / Defense
- Gold
- Weapon / Armor / Accessory
- 装備bonusをdamage / defenseへ反映
- PATCH KIT
- Boss clearで上位装備を入手
- 仲間BYTE
- BYTEは1 ACTIONに1回、コードが選んだtargetのうちSkill後に生存する先頭1体へ追撃する

最初のlive incidentはLv1で体験できる難易度にし、Villageの3つの小Battleを経てForestへ入る頃にLv2へ到達する程度の成長速度にしています。Story順変更だけを理由にShop / InnのEconomy budgetは崩しません。

PlayerProgress v4とRpgState v5は責務を分けたまま、単一revision snapshotで同時保存します。旧分割saveから移行し、backup復旧・到達不可map位置の正規化・storage eventによる別tab同期に対応します。Battle開始snapshotを含むroot schema v2で、未完了Battleのreload・離脱時はHPとItemも一緒に開始状態へ戻します。

### Pause menu

通常画面へ情報を詰め込まず、`MENU`から確認します。

- STATUS: Level / EXP / Gold / Max HP / Attack / Defense
- ITEMS: PATCH KIT
- EQUIPMENT: Weapon / Armor / Accessory
- PARTY: 主人公 / 仲間
- SYSTEM: reset等

### Result presentation

Battle勝利後の結果は一気に並べず、EXP / Gold / Level Up / Unlock / Clear等を基本1イベントずつ表示します。関連項目だけ同じeventへまとめ、click / tap / auto advance / skipと`prefers-reduced-motion`に対応します。

## Tutorial

初回だけ既存UIを実際に操作して案内します。

```text
MOVE
↓
INTERACT
↓
SELECT
↓
EXECUTE
```

World camera追従後も実World座標の変化でMOVE成功を判定します。タイトル画面に常設HOW TO PLAYは置きません。

## Learning content

### JavaScript地方

- property access / 比較
- `find()` / `filter()` / `map()` / `sort()`
- `&&` / `||`
- `some()` / `every()` / `reduce()`
- 三項演算子
- destructuring
- optional chaining / nullish coalescing
- nested object / 中間変数 / 複数行code

### TypeScript Frontier

- primitive / type annotation
- function parameter / return type
- literal / union
- object / optional property
- narrowing / type predicate
- intersection
- `keyof` / indexed access
- generic / `Pick<T, K>`
- JavaScript配列処理 + 型情報の複合読解

TypeScript表示コードをruntimeで`eval()`することはありません。

## UI direction

- 1画面へ情報やbuttonを詰め込みすぎない
- status / inventory / equipmentはPauseへ集約
- Stage Select / Area Selectを増やさない
- Tutorialと重複する説明を常設しない
- 読解に必要な値は確認可能、targetや正解Skillは先に表示しない
- RPG成長でコード読解自体を不要にしない
- numeric legacy Battle IDをプレイヤー向けchapter番号として見せない

## Routes

```text
/
/world
/javascript/battle/$battleId?seed=...&returnTo=/world
/typescript/battle/$battleId?seed=...&returnTo=/world
```

`$battleId`は互換用のinternal IDです。Storyの表示番号とは一致を要求しません。

Legacy redirect:

```text
/javascript
/javascript/field
/javascript/complete
/typescript
/typescript/field
/typescript/complete
→ /world
```

## Quality gate

PR前に必ず以下を通します。

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

## Production

Cloudflare Workers Static Assetsで`dist`を配信します。WranglerはrepoのdevDependencyへexact pinし、`npm run deploy` / `npm run deploy:preview`から同じversionを使います。
