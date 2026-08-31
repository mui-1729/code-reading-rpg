# CODE//READ RPG Code Data

## 目的

Battleに表示されるcodeを読むために必要なruntime dataを、Playerが自分で確認できるようにする。

原則:

> code中に登場する値について、その値を知らないと読解できないのに画面のどこからも確認できない状態を作らない。

一方で、最終targetや正解Skillを直接表示してはいけない。

## 導線

Battle中は右下の`DATA`からCode Data panelを開ける。

Enemy cardをクリック / タップ / keyboard操作した場合もpanelを開き、そのEnemy objectを選択状態にする。

## Runtime Context

`enemies`は常に確認可能にする。

各要素について、code読解に必要な最低限の値を表示する。

```text
enemies
  { name: "Goblin", hp: 38, attackDamage: 8 }
  { name: "Slime", hp: 62, attackDamage: 4 }
```

Skill未選択時でも`enemies`は確認できる。

## Enemy Object

Enemyを選択すると現在のobject dataを表示する。

```text
name          "Goblin"
role          "standard"
hp            38
maxHp         60
attackName    "Slash"
attackDamage  8
```

Battle中にHPが変わった場合は表示も追従する。

## Code Values

SkillをSELECTすると、そのcodeで明示的に作られる途中のruntime valueを追加表示する。

例:

```js
const alive = enemies.filter(enemy => enemy.hp > 0)
const scored = alive.map(enemy => ({ enemy, score: enemy.attackDamage }))
```

```text
alive
  Goblin
  Slime

scored
  { name: "Goblin", score: 8 }
  { name: "Slime", score: 4 }
```

Enemyを選択している場合は、そのEnemy単体のderived valueも表示する。

```text
score  8
score = enemy.attackDamage
```

## 対応する値

現在の複数行codeで読解に必要なものを対象にする。

JavaScript:

- `enemies`
- `alive`
- `ordered`
- `wrapped`
- `scored`
- `hasWounded`
- `allStable`
- Enemy単体の`score`
- Enemy単体の`stats.hp`

TypeScript:

- `enemies`
- `limit`
- `scan.limit`
- `alive`
- `candidates`
- `ready`
- `key`
- Enemy単体の`enemy[key]`
- Enemy単体の`readHp(enemy)`
- score付きCandidate / Scoredの値

新しいcode variantでruntime変数を追加し、その値を知らないと読解できない場合はCode Data resolverも同時に更新する。

## Target Previewとの境界

表示してよい:

- source data
- object propertyの現在値
- code内で明示的に作られる途中配列
- code内で明示的に作られるscalar / boolean
- derived valueのexpression

表示しない:

- `TARGET`
- `CORRECT`
- 最終的に攻撃されるEnemyの強調
- damage予測
- 最適Skill
- reduce / sort等の最終回答だけを答えとして強調するUI

途中値は見せるが、Player自身がcodeを追って結論を出す。

## 実装

```text
src/inspector/
├── BattleCodeData.tsx
├── enemyInspection.ts
├── enemyInspection.test.ts
└── index.ts
```

`enemyInspection.ts`はpure resolver。

`BattleCodeData.tsx`はAppのReact/domain stateから渡されたEnemy[]とselected codeを表示する。敵cardの選択・dialog openもpropsで制御し、表示DOM・NEXT文言・pathnameをscrapeしない。

`attackDamage`はraw Enemy値、`incomingDamage`はPlayer DEF適用後のNEXT damage。`role`はstandard / elite / bossのstable値で、GUARDの表示codeと内部判定の双方から参照する。

TargetRule / damage calculation / Battle generatorは変更しない。

表示codeを`eval()`しない。対応する既知のcode patternに対して明示的にruntime valueを組み立てる。

## Accessibility

- Enemy cardはkeyboardでもData Inspectorを開ける
- `Enter` / `Space`に対応する
- focus-visibleを明示する
- panelはdialog semanticsを持つ
- `Esc`で閉じる
- close buttonにaccessible nameを付ける

## Mobile

- Enemy tapで開ける
- panelはbottom側へ配置する
- Skill card操作を恒常的に塞がない
- `DATA`導線はCODE HELP `?`と重ならない位置へ置く

## Test

最低限固定するもの:

- Enemy base data
- `score = enemy.attackDamage`
- `alive`
- `scored`
- `ordered`
- `hasWounded`
- `allStable`
- TypeScript `limit`
- TypeScript `scan.limit`
- resolverが入力をmutationしない

Manual QA:

- DATA button open / close
- Enemy click / tap / keyboard
- 別Enemyへの切り替え
- Skill未選択
- Skill SELECT後の中間値
- Skill選び直し
- damage後のHP更新
- defeated Enemy
- Victory / Defeat時に邪魔しない
- target / correct表示がない
