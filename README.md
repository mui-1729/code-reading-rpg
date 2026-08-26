# CODE//READ RPG

コードを「書く」のではなく、**読んで意味を判断して戦う**コードリーディングRPGです。

UIや補助機能を増やしすぎず、`Field → Battle → Boss` の流れとコード読解そのものを中心にしています。

## Current game flow

```text
Title
↓
World Map
↓
Area
↓
Field
↓
Battle Gate
↓
コードを読む
↓
SkillをSELECT → 同じSkillをもう一度押してEXECUTE
↓
Victory resultを1項目ずつ確認
↓
Fieldへ戻る / 次Battle
↓
Boss
↓
Area Clear
↓
World Map
```

独立したStage Select画面・Complete画面・常設Quest Trackerは使いません。旧URL `/javascript`、`/typescript`、各`/complete`は安全にWorld Mapへ戻します。

## Implemented

### Area / Field

- JavaScript Kingdom: Battle 1〜3、Battle 3がBoss
- TypeScript Frontier: Battle 4〜6、Battle 6がCompiler Boss
- World MapからAreaのFieldへ直接入る
- 4方向移動 / collision
- Arrow / WASD、Mobile D-Pad + INTERACT
- NPC / Dialogue
- 任意の学習看板
- Battle Gate / CLEAR状態 / 次のGateを示す最小marker
- Field tileは12×9の正方形gridとして固定

### Battle / code reading

- コードカードを1回押してSELECT、同じカードを2回目に押してEXECUTE
- 表示コードが攻撃対象を決定し、POWERがdamageを決定
- Enemy HP / NEXT行動
- CODE HELP
- CODE DATAでEnemyの実値と読解に必要なruntime中間値を確認
- seeded generation / URL `seed`で盤面再現
- Enemy HP・順番・Skill順・code variantのvariation
- valid target / solvability検証
- 複数行code / 行別CODE HELP

### Result presentation

Battle勝利後の結果を一気に並べず、基本的に1イベントずつ表示します。

例:

```text
EXP
↓
Gold
↓
LEVEL UP
↓
SKILL UNLOCK
↓
STAGE CLEAR / NEXT STAGE UNLOCK
↓
QUEST UPDATE
```

関連の強い内容は同じイベントにまとめます。click / tapで次へ進め、一定時間後の自動進行とSKIPにも対応します。`prefers-reduced-motion`も尊重します。

### Progression / economy

- EXP / Level
- Levelによる最大HP / POWER倍率
- Stage CLEAR / next Battle unlock
- Skill unlock
- Boss / Area CLEAR
- Battle Gold reward
- Field内の簡易SHOP
- PATCH KIT: 30 G / 最大24 HP回復 / 1Battle 1回
- LocalStorage save schema v4
- v1 / v2 / v3 migration
- reset

Side Quest layerはゲーム導線を単純化するため無効化しています。旧saveの`completedSideQuestIds`はmigration互換のため保持します。

## Tutorial

初回だけ、既存UIを実際に操作しながら次を案内します。

```text
MOVE
↓
INTERACT
↓
SELECT
↓
EXECUTE
```

タイトル画面の常設`HOW TO PLAY`は置きません。Tutorialは答えとなるSkillやEnemy targetを教えず、操作だけを案内します。SKIP / RESETに対応します。

## Learning content

### JavaScript Kingdom

- property access / 比較
- `find()` / `filter()` / `map()` / `sort()`
- `&&` / `||`
- `some()` / `every()` / `reduce()`
- 三項演算子
- destructuring
- optional chaining `?.`
- nullish coalescing `??`
- nested object
- 中間変数 / object / 複数行code

### TypeScript Frontier

- primitive / type annotation
- function parameter / return type
- literal / union type
- object type
- optional property
- narrowing / type predicate
- intersectionの初歩
- `keyof` / indexed access
- genericの初歩
- `Pick<T, K>`
- JavaScript配列処理と型情報を組み合わせる複合読解

TypeScriptの表示コードをruntimeで`eval()`することはありません。表示コードの意味と安全な内部`TargetRule`を対応させます。

## UI direction

- 1画面へ情報やbuttonを詰め込みすぎない
- Tutorialと重複する常設操作説明を置かない
- 同じ目的のnavigationを複数並べない
- 学習補助は必要時だけ開く
- RPG機能数よりコード読解Battleの分かりやすさを優先する
- 読解に必要な値は確認できるようにするが、targetや正解Skillは先に表示しない

## Routes

```text
/
/world
/javascript/field
/javascript/battle/$battleId?seed=...&returnTo=...
/typescript/field
/typescript/battle/$battleId?seed=...&returnTo=...
```

Legacy redirect:

```text
/javascript          → /world
/javascript/complete → /world
/typescript          → /world
/typescript/complete → /world
```

## Production

Cloudflare Workers Static Assetsで配信します。

- Production: https://code-reading-rpg.profuse-comb.workers.dev
- Production branch: `main`
- branch / PR: Cloudflare Workers Preview
- `main` merge: Cloudflare Workers Production Build
- deploy設定: `wrangler.jsonc`

## Quality checks

PR前に必ず実行します。

```bash
npm ci
npm run lint
npm test
npm run build
```

## Tech

- Vite
- React 19
- TypeScript
- TanStack Router
- CSS
- Web Audio API
- Node.js 24
- Vitest
- ESLint / Prettier
- GitHub Actions
- Cloudflare Workers

## Docs

- [ロードマップ](./docs/ROADMAP.md)
- [ゲーム設計](./docs/GAME_DESIGN.md)
- [RPG成長ループ](./docs/RPG_PROGRESSION.md)
- [Economy](./docs/ECONOMY.md)
- [アーキテクチャ](./docs/ARCHITECTURE.md)
- [UIガイド](./docs/UI_GUIDE.md)
- [テスト方針](./docs/TESTING.md)
- [デプロイ運用](./docs/DEPLOYMENT.md)
