# CODE//READ RPG アーキテクチャ

## 1. この文書の役割

この文書は、現在の技術構成・責務・データフローと、今後の拡張展望をまとめる。

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
Battle UI / Local State
  ↓
Game Domain
  ├── Battle Data
  ├── Skill Data
  └── Targeting Rules
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
- Vercel

現時点では以下を持たない。

- Backend API
- Database
- Authentication
- Server state
- Global state library

---

## 3. 現在の主要構成

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
│   ├── skills.ts
│   ├── battles.ts
│   └── targeting.ts
├── game.test.ts
├── styles.css
└── layout-fixes.css
```

### `main.tsx`

- Reactアプリの起点
- `AppRouter` のmount
- グローバルCSSの読み込み

### `AppRouter.tsx`

- TanStack Routerの`RouterProvider`を描画する
- router定義とReactコンポーネントの責務を分離する

### `router.tsx`

- route treeの定義
- URLとroute componentの対応付け
- Router instanceの生成
- TanStack Routerの型登録

現在のroute:

```text
/
/javascript/battle/$battleId
/javascript/complete
```

### `routeComponents.tsx`

- タイトル画面
- Battle URLの解決
- Chapter完了画面
- 存在しないBattle IDの表示

### `App.tsx`

- Battle画面
- Battle中のlocal state
- Skill選択 / 発動
- 敵ターン
- 勝利 / 敗北 / unlock状態
- Battle間navigation

主なstate:

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

---

## 4. Game Domain

`src/game/` はゲームのデータと純粋ロジックをUIから分離する。

### `index.ts`

Game Domainの公開口。

UIやテスト側は原則 `./game` から必要な値・型をimportする。

### `types.ts`

- `Enemy`
- `SkillCard`
- `Battle`
- `TargetRule`

### `skills.ts`

- Skill定義
- 表示コード
- POWER
- target rule
- concept / explanation

### `battles.ts`

- 固定Battle定義
- 敵データ
- 利用可能Skill
- unlock Skill

### `targeting.ts`

- `getTargets()`
- target ruleの評価

表示されているJavaScriptコード自体を`eval()`せず、`TargetRule`を安全な内部表現として評価する。

---

## 5. 現在のデータモデル

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

現在:

- firstBelow
- allBelow
- named
- lowestHp
- firstAbove
- allAbove

---

## 6. Battle開始時の流れ

```text
URLからbattleIdを取得
↓
route componentがBattle存在確認
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

Battle定義は元データとして扱い、現在HPなどの実行時状態はReact state側に持つ。

---

## 7. Skill発動の流れ

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

表示コードと内部target ruleは常に同じ意味になるよう管理する。

---

## 8. 状態管理

### 現在

Battle stateは`App.tsx`のlocal state。

画面をまたいで永続的に共有する状態はほぼ存在しない。

### 今後

LocalStorage導入後は、例えば以下がBattle外でも必要になる。

- クリア済みBattle
- 解放済みSkill
- 最終プレイ位置
- 設定
- 学習記録

最初は専用のpersistence moduleとReact stateで扱う。

複数画面で同じclient stateを広範囲に共有する必要が生じた場合に、global state管理を検討する。

---

## 9. 問題生成の展望

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

必要になった段階で次を追加する。

```text
src/game/
├── generator.ts
└── solvability.ts
```

空ファイルや将来用抽象化を先に作らない。

表示コード・target rule・解説に必要な値は、同じ問題定義から生成できる構造を目指す。

---

## 10. 進捗保存の展望

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

## 11. クラウド機能の展望

複数端末同期やアカウントが必要になった段階でserver-side storageを追加する。

```text
React App
  ↓
Server-state layer
  ↓
Backend / Database
```

クラウド化後も、targetingや盤面生成などのゲームロジックは可能な限り純粋なGame Domainとして保つ。

---

## 12. テスト構造

現在はVitestでGame Domainのunit testを実行している。

主な対象:

- targeting
- Skill progression

CIでは次を実行する。

```text
npm ci
↓
npm run lint
↓
npm test
↓
npm run build
```

今後は必要性に応じて段階的に追加する。

### Component

候補:

- 2回押し発動
- Skill選択状態
- modal / unlock
- UI上の状態遷移

### E2E

候補:

- Stage Select → Battle → Victory → Unlock → Next Stage
- 保存 / 再読み込み
- 主要route

詳細は [`TESTING.md`](./TESTING.md) を参照する。

---

## 13. デプロイ構成

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

## 14. 将来の構成イメージ

責務が実際に増えた段階で、必要な部分から拡張する。

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

この形を先に完成させるのではなく、実際の要件に合わせて移行する。

---

## 15. 更新タイミング

次の変更が入ったら、この文書も更新する。

- Game Domainの責務を変更した
- routing方式を変えた
- LocalStorageを導入した
- global stateを導入した
- backend / databaseを追加した
- 問題生成方式を変更した
- test layerを追加した
- Production構成を変更した
