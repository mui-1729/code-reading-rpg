# CODE//READ RPG

コードを「書く」のではなく、**読んで意味を判断して戦う**コードリーディングRPGです。

現在はWorld Mapから2つのAreaを選び、Fieldを探索し、必要ならNPC・看板・Codexで確認しながらBattleのコードを読んで攻略するRPGループを実装しています。

## Current main

現在実装済みの主な機能:

- World Map / Area Select
- JavaScript Kingdom: Battle 1〜3 + Boss
- TypeScript Frontier: Battle 4〜6 + Compiler Boss
- 各AreaのStage Select / Top-down Field / Battle Gate / Area CLEAR
- Arrow / WASD、Mobile D-Pad + INTERACT
- JavaScript / TypeScript FieldのNPC / Dialogue
- Field上の任意学習看板
- Code CodexによるJavaScript / TypeScript概念一覧
- Main Quest / Quest Tracker / FieldのNEXT・! marker
- Main Quest完了後の再攻略Side Quest
- Battle勝利後のQuest更新feedback
- コードカードを1回押して選択、同じカードを2回目に押して実行
- 表示コードが攻撃対象を決定し、POWERがダメージを決定
- 敵のHP / NEXT行動を見た戦略判断
- seeded generation / URL `seed`による盤面再現
- Enemy HP・Enemy順・Skill順・code variantの制約付きvariation
- valid target / solvability検証
- 複数code variant / 複数行code / 行別CODE HELP
- PlayerProgress / EXP / Level / 最大HP / POWER倍率
- Stage CLEAR / Skill unlock / Area CLEAR / 再挑戦
- version付きLocalStorage保存 / migration / reset
- Battle motion / damage feedback / `prefers-reduced-motion`
- menu / field / battle BGM、SE、Mute、SE・BGM別音量
- 必要時だけ開くSound Settings
- Vitest / ESLint / Prettier / GitHub Actions / Cloudflare Workers Builds

まだ入っていない主なRPG機能:

- SQL / Reactなど3つ目以降のArea
- 装備 / Item / Gold / Shop / Inn
- Backend / Database / Authentication / Cloud Save

## Learning content

### JavaScript Kingdom

Fieldの主要看板とCodexで概念を確認し、後半Battleで組み合わせます。

基礎〜中級:

- property access / 比較演算子
- `find()` / `filter()` / `map()` / `sort()`
- `&&` / `||`
- `some()` / `every()` / `reduce()`
- 三項演算子
- 中間変数 / object / 複数行code

発展:

- destructuring
- optional chaining `?.`
- nullish coalescing `??`
- nested object

Bossでは例として次のような処理順を追います。

```js
const alive = enemies.filter(({ hp }) => hp > 0)
const wrapped = alive.map(enemy => ({ enemy, stats: { hp: enemy.hp } }))
wrapped.sort((a, b) => (a.stats?.hp ?? Infinity) - (b.stats?.hp ?? Infinity))[0].enemy
```

### TypeScript Frontier

JavaScriptで身につけた「上から中間値を追う」読み方に、型情報を追加します。

基礎〜中級:

- primitive / type annotation
- function parameter / return type
- literal / union type
- object type
- optional property
- narrowing / type predicate
- intersectionの初歩
- `keyof` / indexed access

発展:

- generic
- `Pick<T, K>`
- destructuringや配列methodと型情報を組み合わせる複合読解

Stage 4は型注釈など単体の型情報、Stage 5はunion / optional、Stage 6 Bossはnarrowing・`keyof`・generic・utility typeをJavaScriptの配列処理と組み合わせた複数行codeを扱います。

TypeScriptの型注釈をruntimeで`eval()`することはありません。表示コードの意味と、安全な内部`TargetRule`を対応させます。

## Product direction

現在のRPGループ:

```text
World Map
↓
Areaを選ぶ
↓
Field
↓
Main Quest / markerで次の目的を確認
↓
必要なら看板 / NPC / Codex
↓
Battle Gate
↓
コードを読む
↓
Skillを選ぶ
↓
Battle結果
↓
EXP / Level / Stage CLEAR / Skill unlock / Quest更新
↓
Fieldへ復帰 or 次Stage
↓
Boss
↓
Area CLEAR
↓
Side Questで過去Stageを再攻略
↓
World Map
```

学習看板は補助であり必須ではありません。構文数が増えてもFieldを看板で埋めず、発展概念はCodexでも確認できます。

Levelはコード読解を不要にするためのものではありません。**育成で戦える余裕を増やし、勝ち方はコード読解と戦略で決める**ことを基本原則とします。EnemyはPlayer Levelへ自動追従して弱体化しません。

## World Map / Area progression

`/world`は複数Areaを選ぶ入口です。

- JavaScript Kingdom: `AVAILABLE`
- TypeScript Frontier: `AVAILABLE`
- CLEAR済みAreaは`AREA CLEAR`
- 各Areaは独立したBattle列 / Boss / routeを持つ
- 表示名・説明・availability・routeは`src/game/areas.ts`がsource of truth
- `src/game/areaProgression.ts`でArea ↔ Battle / Bossを共通lookup

現在のBattle ID:

```text
JavaScript Kingdom: 1 → 2 → 3 (Boss)
TypeScript Frontier: 4 → 5 → 6 (Boss)
```

## Field exploration

- `/javascript/field` — JavaScript Kingdom
- `/typescript/field` — TypeScript Frontier
- 4方向移動 / collision
- Enter / Space / `INTERACT`で正面を調べる
- Battle GateはPlayerProgressのunlock状態を参照
- CLEAR済みGateは表示で区別
- 次のMain Quest Gateには`NEXT` marker
- Objective Guide NPCには`!` marker
- Stage Selectへの出口
- Mobile D-Pad + INTERACT
- Battleへ`returnTo`を渡し、終了後に元のFieldへ戻れる
- 看板はsolid tileだが、中央〜奥のGateまで通路を確保
- Field layoutには到達可能性testを置き、看板追加で進行不能にならないようにする

座標・collision・interaction判定は`src/field/`へ分離し、Battle Domainへ混ぜません。

## NPC / Dialogue

JavaScript KingdomとTypeScript Frontierに進行連動NPCを配置しています。Dialogueは`src/dialogue/`へ分離し、Stage CLEAR / Area CLEARなどで会話を切り替えられます。

## Quest

Main QuestはStage / Area CLEARから導出します。Area CLEAR後はQuest Log内に再攻略Side Questが現れます。

- JavaScript: `SECOND PASS` — FIRST READを再攻略、+40 EXP
- TypeScript: `TYPE RECHECK` — TYPED ENTRYを再攻略、+50 EXP
- Side Quest報酬は各Questにつき1回だけ
- Side QuestはQuest Log内だけに表示し、常設UIは増やさない

## Code Codex

World Map / Area Select / Fieldで`C`または`CODEX`から開きます。Battle中は非表示です。

- JavaScript / TypeScript tab
- 概念ごとのsummary / code例 / note
- Field看板と同じhint dataをsource of truthとして利用
- 発展構文はFieldへ看板を増やさなくてもCodexへ追加可能

## Audio

Web Audio APIで外部音源に依存しない8-bit風Audioを生成します。

- 最初のpointer / touch / key操作でAudioContextをunlock
- Title / World Map / Stage Select: menu BGM
- 各Area Field: field BGM
- Battle: battle BGM
- SE / BGM別channel
- Sound Settings内でMute、SE / BGM音量を変更

ブラウザのautoplay制約上、ページ表示だけでは音を開始せず、最初のユーザー操作後に再生します。

## Progress persistence

RPG進行はLocalStorageへversion付きschemaで保存します。

保存対象:

- EXP
- Stage CLEAR
- Area CLEAR
- Side Quest完了ID
- Stage unlock
- Skill unlock

Main Questの状態はStage / Area CLEARから導出します。Side Questは一度だけ報酬を受け取る必要があるため、完了IDだけを保存します。

Level / 最大HP / POWER倍率はEXPから導出し、重複保存しません。旧saveはクリア情報を保ったまま復元し、現在の各Area入口Stageとbaseline Skillを不足分だけ追加します。v1 / v2 saveからv3へmigrationし、Side Questは未完了から開始します。壊れたJSONや未知schema versionは初期状態へ安全にfallbackします。

Battle中のturn / Enemy残HPなど一時的な戦闘状態は保存しません。

## Routes

TanStack Routerで画面遷移とBattle URLを管理しています。

```text
/
/world

/javascript
/javascript/field
/javascript/battle/$battleId?seed=...&returnTo=...
/javascript/complete

/typescript
/typescript/field
/typescript/battle/$battleId?seed=...&returnTo=...
/typescript/complete
```

同じBattle IDとseedなら同じ可変盤面を再現できます。`returnTo`は各AreaのFieldからBattleへ入った場合の戻り先だけを許可します。

## Docs

- [ロードマップ](./docs/ROADMAP.md)
- [ゲーム設計](./docs/GAME_DESIGN.md)
- [RPG成長ループ](./docs/RPG_PROGRESSION.md)
- [Quest](./docs/QUEST_SYSTEM.md)
- [アーキテクチャ](./docs/ARCHITECTURE.md)
- [コンテンツ作成ガイド](./docs/CONTENT_GUIDE.md)
- [Code Codex](./docs/CODE_CODEX.md)
- [UIガイド](./docs/UI_GUIDE.md)
- [テスト方針](./docs/TESTING.md)
- [開発フロー](./docs/DEVELOPMENT_WORKFLOW.md)
- [PR前チェック](./docs/PRE_PR_CHECKS.md)
- [デプロイ運用](./docs/DEPLOYMENT.md)

## Production

正式なデプロイ先はCloudflare Workers Static Assetsです。

- Production: https://code-reading-rpg.profuse-comb.workers.dev
- Production branch: `main`
- PR / branch: Cloudflare Workers Builds Preview
- `main` merge: Cloudflare Workers Production Build
- deploy設定のsource of truth: `wrangler.jsonc`

## Run

```bash
npm install
npm run dev
```

## Quality checks

PRを作る前に必ずすべて成功させます。

```bash
npm ci
npm run lint
npm test
npm run build
```

PR CIはこの確認の代替ではなく二重確認です。

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
- Cloudflare Workers Static Assets / Workers Builds

## Design note

表示コードを`eval()`してゲームロジックとして実行しません。コード表示と安全な内部ルールを同じ定義から対応させ、JavaScript / TypeScript上の意味とゲーム効果がずれない構造を維持します。
