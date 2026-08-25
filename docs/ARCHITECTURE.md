# CODE//READ RPG アーキテクチャ

## 1. この文書の役割

この文書は、現在の技術構成と責務、データフロー、今後の拡張展望をまとめる。

技術比較や「なぜ別の技術を使わなかったか」は扱わない。

---

## 2. 現在の構成

現在はクライアント完結のSPA。

```text
Browser
  ↓
React
  ↓
TanStack Router
  ↓
Battle UI / Game State
  ↓
Game Data + Targeting Rules
```

技術スタック:

- Vite
- React 19
- TypeScript
- TanStack Router
- CSS
- Node.js 24
- GitHub Actions
- Vercel

現時点では以下を持たない。

- Backend API
- Database
- Authentication
- Server state
- Global state library

---

## 3. 現在の主要ファイル

```text
src/
├── main.tsx
├── router.tsx
├── App.tsx
├── game.ts
├── styles.css
└── layout-fixes.css
```

### `main.tsx`

役割:

- Reactアプリの起点
- `AppRouter` のmount
- グローバルCSSの読み込み

### `router.tsx`

役割:

- ルート定義
- タイトル画面
- Battle URLの解決
- Chapter完了画面
- 存在しないBattle IDの処理

現在のroute:

```text
/
/javascript/battle/$battleId
/javascript/complete
```

### `App.tsx`

役割:

- Battle画面
- Battle中のlocal state
- Skill選択
- Skill発動
- 敵ターン
- 勝利 / 敗北 / unlock状態
- Battle間navigation

現在の主なstate:

- phase
- playerHp
- enemies
- selectedSkillId
- explainedSkill
- logs
- turn
- animatingIds
- isResolving

Battle単体で完結するため、現状はReact local stateで管理する。

### `game.ts`

役割:

- `Enemy`
- `SkillCard`
- `Battle`
- `TargetRule`
- Skill定義
- Battle定義
- 対象判定 `getTargets()`

現時点では小規模なので、データとtargeting logicを1ファイルに置いている。

### `styles.css`

役割:

- 8-bit RPG風の主要UI
- Battle / title / modal / card / spriteなどの見た目
- responsive対応
- reduced motion対応

### `layout-fixes.css`

役割:

- 大きい敵スプライトがHP/NEXT表示を隠さないための補助レイアウト

今後UI整理を行う際に統合候補。

---

## 4. 現在のデータモデル

### Enemy

```ts
{
  id
  name
  hp
  maxHp
  attackName
  attackDamage
  glyph
}
```

### SkillCard

```ts
{
  id
  name
  code
  power
  rule
  concept
  explanation
}
```

### Battle

```ts
{
  id
  label
  title
  subtitle
  enemies
  skillIds
  unlockSkillId?
}
```

### TargetRule

表示コードを直接実行せず、内部ルールで対象を決める。

現在の例:

- firstBelow
- allBelow
- named
- lowestHp
- firstAbove
- allAbove

---

## 5. Battle開始時の流れ

```text
URLからbattleIdを取得
↓
routerがBattle存在確認
↓
AppにbattleIdを渡す
↓
battlesからBattle定義を取得
↓
Enemy配列をcloneしてlocal stateへ
↓
skillIdsから利用可能Skillを解決
↓
Battle開始
```

Battle定義自体はimmutableな元データとして扱い、現在HPなどの実行時状態はReact state側に持つ。

---

## 6. Skill発動の流れ

```text
カード1回目押下
↓
selectedSkillIdを設定
↓
同じカードを2回目押下
↓
getTargets(enemies, skill.rule)
↓
対象IDを取得
↓
各対象へskill.powerの固定ダメージ
↓
Enemy state更新
↓
生存敵が敵ターンを実行
↓
勝利 / 継続 / 敗北を判定
```

表示コードとtarget ruleは同じ意味になるように管理する。

---

## 7. ルーティング

現在はcode-based routing。

```text
root
├── /
├── /javascript/battle/$battleId
└── /javascript/complete
```

Battle IDはURLで表現するため、特定Battleへ直接アクセスできる。

今後、以下が増えた場合はroute構成を整理する。

- Chapter Select
- Stage Select
- Reference
- Settings
- Challenge
- Profile

ルート数が増えてcode-based route treeの保守が煩雑になった段階でfile-based routingへの移行を検討する。

---

## 8. 状態管理

### 現在

Battle stateは`App.tsx`のlocal state。

画面をまたいで永続的に共有する状態はほぼ存在しない。

### 将来

LocalStorage導入後は、例えば次の状態がBattle外でも必要になる。

- クリア済みBattle
- 解放済みSkill
- 最終プレイ位置
- 設定
- 学習記録

最初は専用のpersistence moduleとReact stateで扱う。

複数画面で同じclient stateを広範囲に共有し、state liftingが不自然になった場合はglobal state管理を検討する。

---

## 9. 今後のgame領域分割

Battle数とテストが増えた段階で、`game.ts` を責務ごとに分割する。

候補:

```text
src/game/
├── types.ts
├── skills.ts
├── battles.ts
├── targeting.ts
├── generator.ts
├── solvability.ts
└── index.ts
```

### `types.ts`

- Enemy
- SkillCard
- Battle
- TargetRule
- 将来の生成用型

### `skills.ts`

- Skill定義
- Skill lookup

### `battles.ts`

- 固定Battle定義
- Chapter構成

### `targeting.ts`

- `getTargets()`
- target rule評価

### `generator.ts`

- seed付き盤面生成
- 敵HP / 並び順 / 閾値の制約付き可変化

### `solvability.ts`

- 生成盤面に勝ち筋があるかの検証
- テスト用の探索ロジック

分割は必要になった責務から順に行う。

---

## 10. 問題生成の将来像

固定Battleから、再現可能な制約付き生成へ段階的に拡張する。

```text
Battle Template
  + Seed
  + Generation Constraints
        ↓
Generated Battle
        ↓
Validation
  - learning intent
  - valid targets
  - solvability
        ↓
Battle UI
```

重要なのは、表示コードと内部ルールを別々にランダム生成しないこと。

同じ定義から、

- 表示コード
- target rule
- 解説に必要な値

を生成できる構造を目指す。

---

## 11. 進捗保存の将来像

第一段階はLocalStorage。

```text
React
  ↓
Progress Repository
  ↓
LocalStorage
```

保存候補:

- schema version
- cleared battles
- unlocked skills
- settings
- learning history

保存形式変更に備えてversionとmigration方針を持つ。

---

## 12. クラウド機能の将来像

複数端末同期やアカウントが必要になった段階でserver-side storageを追加する。

将来イメージ:

```text
React App
  ↓
Server-state layer
  ↓
Backend / Database
```

クラウド化した場合も、Battleのtargetingや盤面ロジック自体は可能な限り純粋なgame domainとして保つ。

---

## 13. テスト構造の将来像

段階的に次を追加する。

```text
Unit
  ↓
Component
  ↓
E2E
```

### Unit

主対象:

- targeting
- generator
- solvability
- persistence migration

### Component

主対象:

- 2回押し発動
- Skill選択状態
- modal / unlock
- UI上の状態遷移

### E2E

主対象:

- Stage Select → Battle → Victory → Unlock → Next Stage
- 保存 / 再読み込み
- 主要route

詳細は [`TESTING.md`](./TESTING.md) を参照する。

---

## 14. デプロイ構成

```text
GitHub PR / Branch
  ↓
GitHub Actions CI
  ↓
Vercel Preview

main merge
  ↓
Vercel Production
```

正式Project:

```text
code-reading-rpg-live
```

Production:

```text
https://code-reading-rpg-live.vercel.app
```

通常はGit Integration経由でデプロイする。

---

## 15. 将来の構成イメージ

機能が増えた場合の一例。

```text
src/
├── app/
│   ├── routes/
│   └── providers/
├── game/
│   ├── types.ts
│   ├── skills.ts
│   ├── battles.ts
│   ├── targeting.ts
│   ├── generator.ts
│   └── solvability.ts
├── features/
│   ├── battle/
│   ├── stage-select/
│   ├── progress/
│   └── reference/
├── persistence/
├── components/
└── styles/
```

この形を先に作るのではなく、責務が実際に増えた段階で移行する。

---

## 16. アーキテクチャ更新のタイミング

次の変更が入ったら、この文書も更新する。

- game domainを分割した
- routing方式を変えた
- LocalStorageを導入した
- global stateを導入した
- backend / databaseを追加した
- 問題生成方式を変更した
- test layerを追加した
- Production構成を変更した
