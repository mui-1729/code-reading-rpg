# CODE//READ RPG

コードを「書く」のではなく、**表示されたコードを読んで戦う2D RPG**です。

普通のRPGらしい探索・成長・装備・仲間を持たせつつ、誰を攻撃するかの判断はコード読解から外さないことを中心にしています。

## Current game flow

```text
Title
↓
REAL WORLD briefingからCODE WORLDへCONNECT
↓
Overworldを入口にVillage / Forest / Deep Forest / TypeScript Frontierを行き来
↓
固定Lesson / Random Encounter / MID BOSS / Final Bossでコードを読む
↓
SkillをSELECT → 同じSkillをもう一度押してEXECUTE
↓
EXP / Gold / Level Up等を段階表示
↓
元のmap・座標へ戻り、次の地域やBossへ進む
```

Stage SelectやArea Selectへ戻って進行する構造ではありません。旧Area / Field URLは`/world`へredirectします。

## Implemented

### Open World

- Overworld / Greenfield Village / Forest / Deep Forest / TypeScript Frontierの5 map
- Overworldは40×28、各regionは独立した意味のあるmapとして接続
- 11×9 viewport / Player追従camera
- 上下左右の画面外へ移動可能
- tileは固定正方形
- JavaScript地方 = Village preparation → 最初のlive incident → Forest trace → 二つ目のincident → Deep Forest root trace → Code Core
- TypeScript地方 = TypeScript Frontier
- Central Hub / Road / Water / Mountain
- 固定Boss地点
- HubのShop / 仲間NPC BYTE
- World座標をLocalStorage保存
- Desktop: Arrow / WASD、Mobile: D-Pad + INTERACT

### Random Encounter

- JavaScript Forest / Deep Forestではclear済みLessonを段階的に再出題
- JavaScriptのincident Battle 1 / 2はStory上の固定beatとして発生し、未clear中はRandom復習にしない
- TypeScript FrontierではBattle 4 / 5を進行に応じて出題
- 最低5歩のcooldown
- terrainごとの遭遇率
- Road / Hubは安全地帯
- Battle後は元のWorld位置へ復帰
- JavaScript Storyは`7 → 8 → 9 → 1 → 10 → 11 → 12 → 13 → 14 → 2 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 3`
- numeric `battleId`はsave / URL互換用IDであり、Story chapter順そのものには使わない

### Battle / code reading

- 1回目SELECT、同じcardの2回目EXECUTE
- 表示コードと安全な内部`TargetRule`を対応
- Enemy HP / NEXT行動
- CODE HELP / CODE DATA
- seeded generation / solvability
- code variants / multi-line code / 行別HELP
- Battle + seedごとに表示コードを固有化し、別Battleで同じ文字列を再利用しない
- 既存の1行 / 3行読解構造は維持

### RPG progression

- EXP / Level
- Max HP / Attack / Defense
- Gold
- Weapon / Armor / Accessory
- 装備bonusをdamage / defenseへ反映
- PATCH KIT
- Boss clearで上位装備を入手
- 仲間BYTE
- BYTEはコードが選んだ**同じtarget**へ追撃し、読解を自動化しない

既存のPlayerProgress schemaとは別にRPG stateを保存し、旧saveを壊さずWorld位置・装備・仲間を追加します。

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

## Routes

```text
/
/world
/javascript/battle/$battleId?seed=...&returnTo=/world
/typescript/battle/$battleId?seed=...&returnTo=/world
```

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
