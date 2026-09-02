# CODE//READ RPG Code Codex

## 目的

`Code Codex`は、Fieldへ学習看板を増やし続けなくてもJavaScript / TypeScriptの概念を確認できる学習アーカイブ。

Fieldは探索と重要な少数の看板、Codexは概念一覧を担当する。

```text
Field
├─ 重要な少数の看板
├─ Gate
└─ NPC

Code Codex
└─ JavaScript / TypeScriptの概念一覧
```

## 開き方

Worldの`MENU → CODEX`から利用する。Battleでは行動の合間の`BATTLE MENU → CODEX`から参照できる。

- 独立したCODEXボタンや`C` shortcutは持たない
- `Esc`でMENUを閉じ、起点へfocusを戻す
- header / section navigationを残し、長いconcept一覧だけをscrollする
- TypeScript Frontier上の`/world`、またはTypeScript Battleで開くとTypeScriptを初期選択する
- JavaScript / TypeScriptの選択状態を支援技術にも伝える

現在のSkillに即したBattle中の解説は`CODE HELP`を使う。現在の正解targetをCODEXやHELPで先に教えない。

## Source of truth

JavaScript:

```text
src/learning/learningHints.ts
```

TypeScript:

```text
src/learning/typescriptLearningHints.ts
```

Fieldの学習看板とCodexは同じhint dataを参照する。

各hint:

- `id`
- `concept`
- `title`
- `summary`
- `codeLines`
- `notes`

## Field看板との使い分け

すべての構文をFieldへ物理配置しない。

Fieldへ看板を置く条件:

1. 近くのBattleで特に重要
2. 初見Playerがその場で確認する価値が高い
3. Main RouteやGateへの通路を塞がない
4. reachability testを維持できる

それ以外はCodexだけに登録してよい。

## 現在のJavaScript Codex

基礎:

- `find()` / `filter()` / `map()` / `sort()`
- 比較演算子
- `&&` / `||`
- `some()` / `reduce()`

発展:

- `every()`
- destructuring
- optional chaining `?.`
- nullish coalescing `??`
- nested object

Battle 3では発展構文を単体で問わず、既存の配列処理と組み合わせた複数行variantとして使う。

例:

```js
const alive = enemies.filter(({ hp }) => hp > 0)
const wrapped = alive.map(enemy => ({ enemy, stats: { hp: enemy.hp } }))
wrapped.sort((a, b) => (a.stats?.hp ?? Infinity) - (b.stats?.hp ?? Infinity))[0].enemy
```

## 現在のTypeScript Codex

基礎〜中級:

- type annotation
- parameter / return type
- array type
- string literal
- union type
- optional property
- narrowing
- `keyof` / indexed access

発展:

- generic
- `Pick<T, K>`

Battle 6ではJavaScriptの配列method・destructuringと型情報を組み合わせる。

例:

```ts
type Scored<T> = { value: T; score?: number }
const candidates: Scored<Enemy>[] = enemies.map(enemy => ({
  value: enemy,
  score: enemy.attackDamage,
}))
```

```ts
type HpView = Pick<Enemy, 'hp'>
const readHp = (enemy: HpView): number => enemy.hp
```

## 今後の候補

- discriminated unionの発展
- nested object type
- generic function
- `Record` / `Partial`など別utility type
- 4〜5行以上の実行順序

構文網羅を目的にせず、Battleの判断へ意味が出るものを優先する。

## テスト方針

- JavaScript / TypeScriptを横断してhint IDが重複しない
- concept / title / summaryが空でない
- code lineが1行以上あり、空行だけではない
- noteが1件以上あり、空文字ではない
- Bossの発展variantが対応する構文を含む
- `codeHelpLines`数と物理行数が一致する
- 発展variantを序盤Battleへ混ぜない

Field配置はreachability testで確認する。
