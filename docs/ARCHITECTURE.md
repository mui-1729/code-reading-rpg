# CODE//READ RPG アーキテクチャ

## 1. この文書の役割

この文書は、現在の技術構成・責務・データフローと、RPG拡張後の構成方針をまとめる。

重要なのは「将来使うかもしれない構造を先に完成させる」ことではなく、**現在の責務を分けたまま、RPGの外側のループを段階的に足せること**。

---

## 2. 現在の全体構成

現在の`main`はクライアント完結のVite SPA。

```text
Browser
  ↓
React 19
  ↓
TanStack Router
  ↓
Battle UI / Local State
  ↓
Game Domain
  ├── Battle base definitions
  ├── SkillDefinition / SkillCard
  ├── Targeting Rules
  ├── Seeded Random
  ├── Battle Generator
  └── Solvability
```

技術スタック:

- Vite
- React 19
- TypeScript
- TanStack Router
- CSS
- Node.js 24
- Vitest
- ESLint
- Prettier
- GitHub Actions
- Cloudflare Workers Static Assets
- Cloudflare Workers Builds

現在の`main`には以下を持たない。

- PlayerProgress / Level / EXP
- Stage Select
- LocalStorage進行保存
- 専用Audio layer
- 整理されたBattle animation layer
- Backend API
- Database
- Authentication
- Server state
- 専用global state library

---

## 3. 現在の主要構成

概念上の主な構造:

```text
src/
├── main.tsx
├── AppRouter.tsx
├── router.tsx
├── routeComponents.tsx
├── App.tsx
├── game/
│   ├── index.ts
│   ├── types.ts
│   ├── battles.ts
│   ├── skillDefinitions.ts
│   ├── skills.ts
│   ├── targeting.ts
│   ├── random.ts
│   ├── generator.ts
│   └── solvability.ts
└── *.css
```

テストはGame Domainの各責務に合わせて配置している。

---

## 4. Routing

現在のroute:

```text
/
/javascript/battle/$battleId?seed=...
/javascript/complete
```

`battleId`はpath、`seed`はsearch paramとして扱う。

同じBattle IDとseedから同じ可変盤面を再現できる。

RPG最小ループ導入後は次を追加する予定。

```text
/javascript                 # JavaScript Kingdom / Stage Select
/javascript/battle/$battleId
/javascript/complete        # Area Clearとして整理
```

Stage Selectは最終的な世界UIではない。将来トップダウンフィールドへ置き換えるときも、Battle route自体は再利用できるように保つ。

---

## 5. Game Domain

`src/game/`はUIから独立したゲームデータと純粋ロジックを担当する。

### `types.ts`

現在の主な型:

- `Enemy`
- `SkillCard`
- `Battle`
- `TargetRule`

### `battles.ts`

固定された**世界側の基準Battle**を持つ。

現在はBattle 1〜3の基準Enemy / Skill構成を定義する。

ここで定義される基準HPや攻撃力は、将来Player Levelが入ってもcurrent Playerに合わせてruntimeで弱体化しない。

### `skillDefinitions.ts`

Skillのsource definition。

```ts
SkillDefinition = {
  id,
  name,
  power,
  rule,
  concept,
  explanation,
  codeVariants,
}
```

`codeVariants`は、同じSkill / TargetRule / 学習概念を保ったまま表示コードを切り替えるための基盤。

現在は各Skillにdefault variantが1つ。今後#31でseed付きvariant選択を追加し、#32で一部multi-line variantへ拡張する。

### `skills.ts`

現在のBattle UIが使う`SkillCard`へ`SkillDefinition`を変換する。

現時点では先頭のdefault code variantを使用する。

### `targeting.ts`

表示コードの意味に対応した安全な内部`TargetRule`を評価する。

表示コード自体を`eval()`しない。

### `random.ts`

seedから決定的な乱数を作る。

用途:

- 敵HP
- 敵順
- Skill順
- 将来のcode variant選択

### `generator.ts`

現在の可変Battle生成を担当する。

```text
Battle base definition
+ seed
↓
HP倍率を85〜115%で生成
敵順をshuffle
Skill順をshuffle
↓
validation
  - initial valid target
  - base Battleで意味があったSkillのtargetを維持
  - solvability
↓
validなら採用
```

最大32回試行し、成立しなければ基準Battleのcloneへfallbackする。

これは「Playerが弱いから敵を自動で弱くする」仕組みではない。**学習意図を壊さない盤面variationを生成する仕組み**。

### `solvability.ts`

生成されたBattleに勝ち筋があるかを検証する。

現在のBattle MVPでは固定Player条件を前提にgenerator validationでも利用している。

Level導入後は、current Player Levelに合わせて敵を弱体化するためには使わない。Battleごとの**基準 / 推奨Player stats**で設計・生成品質を検証する方向へ整理する。

---

## 6. ProblemTemplateを採用しない決定

一度、問題生成のために`ProblemTemplate`という独立抽象を導入したが、現在は削除済み。

理由:

- 現在のSkill / TargetRuleと責務が重複しやすい
- 問題種類ごとの大きなテンプレート階層を先に作る必要がない
- コードvariantはSkillの意味と密接なので`SkillDefinition`に置く方が単純

現在の方針:

```text
Battle base definition
+ SkillDefinition
+ seed
+ generator constraints
```

必要な責務が実際に増えるまで、別の「問題テンプレート層」は作らない。

---

## 7. Battle中の状態

現在のBattle実行中stateはReact local stateが中心。

例:

- phase
- playerHp
- enemies
- selectedSkillId
- explainedSkill
- logs
- turn
- animatingIds
- isResolving

Battle中だけ必要な一時状態は、将来も進行保存データへ混ぜない。

`animatingIds`や`isResolving`のようなpresentation都合のstateは存在するが、今後の演出拡張ではGame Domainの勝敗・damage計算そのものと分離して整理する。

---

## 8. RPG進行の次期構成

次に追加するのはBattleをまたいで共有するPlayer進行。

予定する責務:

```text
src/
├── progression/
│   ├── types.ts
│   ├── constants.ts
│   ├── progression.ts
│   └── index.ts
├── features/
│   └── stage-select/
└── persistence/
```

初期PlayerProgress候補:

```ts
{
  exp,
  clearedStageIds,
  unlockedStageIds,
  unlockedSkillIds,
}
```

LevelはEXPから導出し、二重管理を避ける。

Battle transient stateとPlayerProgressは明確に分ける。

---

## 9. RPGデータフロー

RPG最小ループ完成時のイメージ:

```text
PlayerProgress
↓
Stage Select
↓
Stage / seedを選ぶ
↓
Battle
↓
Victory Reward
  - EXP
  - Stage CLEAR
  - Skill unlock
  - Next Stage unlock
↓
PlayerProgress更新
↓
Stage Selectへ戻る / 次へ
```

Level成長がBattleへ影響する場合も、Player statsをBattle開始時に入力として渡す。

```text
PlayerProgress
↓
PlayerStats
  - level
  - maxHp
  - powerMultiplier
↓
Battle Runtime
```

Enemy base statsはPlayerStatsを参照して書き換えない。

---

## 10. Persistence

第一段階はLocalStorage。

```text
React / Progress Provider
↓
Progress Repository
↓
LocalStorage
```

保存するもの:

- schema version
- EXP
- cleared Stage
- unlocked Stage
- unlocked Skill
- Area CLEAR等の長期進行

保存しないもの:

- 現在ターン
- Battle中の敵残HP
- animation state
- selected card

壊れたdata / 未知schema versionでは安全に初期状態へfallbackする。

---

## 11. Stage SelectからFieldへ

Stage SelectはRPG進行を先に成立させるための暫定UI。

最終的なRPG世界は次を目指す。

```text
Top-down Field / Hub
├── Player movement
├── Collision
├── Interactable objects
├── NPC / Dialogue
├── Battle entrance
└── Area exit
```

Battle終了後はFieldへ戻り、進行状態に応じてNPC会話・入口・Area状態が変わる。

重要なのは、Field rendering / movement / DialogueをBattle Domainへ混ぜないこと。

---

## 12. Audio / Animation presentation layer

#63 / #64では、音と動きをGame Domainのロジックそのものへ埋め込まず、**状態変化をプレイヤーへ返すpresentation layer**として扱う。

概念上の流れ:

```text
Player Input
↓
Battle Runtime / Game Domain
↓
Battle Result / Presentation Event
├── damage target
├── damage amount
├── defeated enemy
├── player hit
├── victory / defeat
└── reward / level up
↓
Presentation Layer
├── Animation
├── SFX
└── UI update
```

### Animation

候補責務:

- Skill executeの予備動作
- target hit flash / shake
- damage number
- enemy defeat
- player hit
- victory / defeat
- reward / level up

重要:

- CSS animationの終了そのものをGame Domainの正しさへ依存させない
- animation durationは散在させず、必要なら定数またはtimeline定義へ寄せる
- animation中の入力lockはUI / Battle controller側で扱う
- `prefers-reduced-motion`時もBattle stateは同じ結果になる

### Audio

候補構成:

```text
Audio Layer
├── BGM channel
├── SE channel
└── Settings
    ├── master volume
    ├── bgm volume
    ├── se volume
    └── mute
```

Audio再生は、

```text
onSkillExecute
onHit
onEnemyDefeat
onPlayerHit
onVictory
onLevelUp
```

のようなpresentation eventから行える構造を目指す。

Battleのtargeting / damage / victory判定関数の中で直接`audio.play()`しない。

ブラウザのautoplay policyに合わせ、最初の明示的なユーザー操作後にAudioContext等を有効化する。

### 音と動きの同期

最終的には、同じBattle eventに対してanimationとSEを同期させる。

例:

```text
HIT event
├── Enemy flash
├── Enemy shake
├── Hit SE
├── Damage number
└── HP update
```

ただし「演出が終了しないとGame Domain上のdamageが存在しない」という構造にはしない。

### Accessibility

- `prefers-reduced-motion`で大きなmotionを減らす
- Muteでも情報を失わない
- motion / sound / colorのどれか1つだけに重要stateを依存させない
- code reading中に不要なloop animationや過密なSEを鳴らさない

---

## 13. Backendの展望

Cloudflareへdeployしたが、backend選定は未決定。

現在はbackend不要。

必要になるトリガー:

- 複数端末同期
- アカウント
- クラウドセーブ
- ランキング
- 共有Challengeの永続保存
- 管理画面

候補:

```text
Cloudflare Workers + D1 / KV / R2
Supabase
その他のBaaS / API
```

選定時もtargeting、generator、solvability、progression計算などは可能な限り純粋Domainとして保つ。

---

## 14. テスト構造

現在のCI:

```text
npm ci
↓
npm run lint
↓
npm test
↓
npm run build
```

Unitの主対象:

- targeting
- seeded random
- Battle generator
- SkillDefinition
- solvability
- 将来のprogression / persistence

将来のComponent:

- card select / execute
- victory / defeat
- Stage Select状態
- EXP / Level表示
- animation中のinput lock
- reduced motion時の状態遷移
- audio setting UI

将来のE2E:

- Stage Select → Battle → Reward → Unlock
- reload → Progress復元
- Field → Battle → Field復帰
- Battle操作がanimation追加後も進行不能にならない

Audioそのものの波形や音質を自動テストすることを目的にせず、event発火・設定・mute等のlogicをテストする。

---

## 15. デプロイ構成

```text
PR / Branch
├─ GitHub Actions CI
└─ Cloudflare Workers Preview Build

main merge
├─ GitHub Actions CI
└─ Cloudflare Workers Production Build
```

正式Production:

```text
https://code-reading-rpg.profuse-comb.workers.dev
```

Vercelは現在のdeploy pathに含めない。

詳細は[`DEPLOYMENT.md`](./DEPLOYMENT.md)を参照する。

---

## 16. 将来構成イメージ

責務が実際に増えた段階で必要な部分から拡張する。

```text
src/
├── app/
│   ├── routes/
│   └── providers/
├── game/
│   ├── battles.ts
│   ├── skillDefinitions.ts
│   ├── targeting.ts
│   ├── random.ts
│   ├── generator.ts
│   └── solvability.ts
├── progression/
├── persistence/
├── audio/
│   ├── audioManager.ts
│   └── settings.ts
├── features/
│   ├── battle/
│   │   └── presentation/
│   ├── stage-select/
│   ├── field/
│   └── dialogue/
├── components/
└── styles/
```

これは設計イメージであり、このdirectory treeを先に作らない。

#63 / #64を実装する時点で必要な最小責務だけ追加する。

---

## 17. 更新タイミング

次の変更が入ったらこの文書も更新する。

- Game Domainの責務を変更
- SkillDefinition / generator方式を変更
- PlayerProgressを導入
- routing方式を変更
- LocalStorageを導入
- Audio / Animation layerを導入
- Field / Dialogueを追加
- backend / databaseを追加
- test layerを追加
- Production構成を変更
