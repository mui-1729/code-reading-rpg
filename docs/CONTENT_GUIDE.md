# CODE//READ RPG コンテンツ作成ガイド

## 1. この文書の役割

この文書は、新しいBattle、Skill、code variant、Field学習ヒントを追加するときの基準を定義する。

コンテンツが増えても、次を崩さないことを目的とする。

- 学習意図
- JavaScript / TypeScript上の意味
- Battleとしての戦略
- seed再現性
- RPG進行
- display codeと内部効果の一致

---

## 2. 基本原則

新しい要素は「構文を増やしたい」だけで追加しない。

実装前に最低限決める。

1. 何を読めるようにしたいか
2. 既習として扱うsyntax
3. Playerが盤面のどの情報を見るか
4. 読み間違えると何が起こるか
5. 正しく読んだ結果がどのgame decisionへつながるか
6. Stage内での難易度と役割
7. TargetRule / effectで安全に表現できるか

構文の意味がゲーム結果に現れないなら、Battleへ入れる優先度は低い。

---

## 3. 学習の役割分担

### Field学習看板

単体概念を短く確認する場所。

現在のJavaScript Kingdomでは、

- `find()`
- `filter()`
- `map()`
- `sort()`
- 比較演算子
- `&&`
- `||`
- `some()`
- `reduce()`

を任意に確認できる。

看板は必須ではない。知っているPlayerはそのままBattleへ進める。

### Battle

構文を盤面へ当てはめて結果を判断する場所。

### 後半Battle / Boss

既習構文を複数組み合わせ、実行順序・中間値・最終targetを追う場所。

```text
看板 = 単体概念
Battle = 適用
Boss = 複合読解
```

---

## 4. 現在のコンテンツ構造

```text
Battle definition
  = Enemy / Skill構成 / reward / area

SkillDefinition
  = Skillの意味 / TargetRule / codeVariants / explanation

CodeVariant
  = display code / single or multi / optional line help

LearningHint
  = Fieldで読む任意の構文解説

Seeded Generator
  = 同じ学習意図を保った盤面variation

Solvability
  = 生成 / 設計品質の検証
```

責務が実際に必要になるまで、別の巨大なProblemTemplate層は追加しない。

---

## 5. SkillDefinition

概念上の形:

```ts
{
  id,
  name,
  power,
  rule,
  concept,
  explanation,
  codeVariants: [
    {
      id,
      code,
      lineMode,
      codeHelpLines,
    },
  ],
}
```

### `id`

stable identifier。display name変更では変えない。

### `power`

base damage。Player LevelによるPOWER倍率とは分ける。

### `rule`

display codeの意味に対応する内部TargetRule。

### `concept`

CODE HELPや学習内容を示す短い名前。

### `explanation`

1. 構文が一般に何をするか
2. このSkillでは何を見るか
3. どの中間値を追うか

をできるだけ短く説明する。

---

## 6. CodeVariant

現在の形:

```ts
{
  id: string
  code: string
  lineMode: 'single' | 'multi'
  codeHelpLines?: readonly string[]
}
```

同じSkillには複数variantを持たせる。

変えてよいもの:

- callback variable名
- 既習範囲の同義表現
- line break
- intermediate variable名

変えてはいけないもの:

- TargetRuleの意味
- base POWER
- conceptの本質
- target集合

見た目だけを暗記して攻略できないようにする。

### `codeHelpLines`

複数行variantで、各物理行を上から追うための説明。

ルール:

- `code.split('\n').length`と同じ件数を持つ
- 1項目は対応する1行の意味だけを説明する
- 最終targetを最初から答えとして書かず、中間値の意味を説明する
- callback名が変わっても説明の意味を維持する

例:

```ts
code: [
  'const alive = enemies.filter(e => e.hp > 0)',
  'const ordered = [...alive].sort((a, b) => a.hp - b.hp)',
  'ordered[0]',
].join('\n')

codeHelpLines: [
  '生存Enemyだけをaliveへ残す。',
  'aliveをHPの小さい順に並べてorderedへ保存する。',
  'orderedの先頭を選ぶ。',
]
```

---

## 7. Display codeと内部効果

最重要ルール。

```js
enemies.filter(e => e.hp > 0 && e.hp < 100 && e.attackDamage >= 8)
```

なら、TargetRuleも、

> 生存中で、HPが100未満 **かつ** attackDamageが8以上のEnemy全員

でなければならない。

確認するずれ:

- `<` と `<=`
- `>` と `>=`
- `&&` と `||`
- `find()` と `filter()`
- current HPとmax HP
- array orderとHP order
- dead Enemyの扱い
- `sort()`の昇順 / 降順
- `some()`が返すbooleanとtarget配列
- `map()`後のobject property
- `reduce()`のaccumulator / tie時の挙動
- 最後の`.enemy`や`[0]`などの取り出し

Display code自体を`eval()`してgame logicとして使わない。

---

## 8. 現在扱うJavaScript概念

基礎:

- property access
- comparison operators
- `find()`
- `filter()`
- `map()`
- `sort()`

追加:

- `&&`
- `||`
- `some()`
- `reduce()`
- 三項演算子 `? :`
- object literal
- intermediate variable
- multi-line code
- method chaining / 処理順序

今後候補:

- `every()`
- optional chaining `?.`
- nullish coalescing `??`
- destructuring
- nested object
- status / shield property

新構文はField看板で単体説明し、Battleで利用する順を基本とする。

---

## 9. `filter()` / `map()` / `reduce()`の役割を混同しない

### `filter()`

要素を残す / 落とす。要素数は減る可能性がある。

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
```

### `map()`

各要素を別の形へ変換する。基本的に要素数は保つ。

```js
const scored = alive.map((enemy) => ({
  enemy,
  score: enemy.attackDamage,
}))
```

### `reduce()`

配列から1つの値・候補へ集約する。

```js
const danger = scored.reduce((best, candidate) =>
  candidate.score > best.score ? candidate : best,
)
```

Battleでは、これらの戻り値が「配列 / 配列 / 1候補」とどう変化するかを読むことに意味を持たせる。

---

## 10. `some()` / boolean / 三項演算子

`some()`はtargetを返さずbooleanを返す。

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const hasWounded = alive.some((enemy) => enemy.hp < 50)
hasWounded ? alive : []
```

読む順番:

1. `alive`に誰が残るか
2. `hasWounded`がtrueかfalseか
3. 三項演算子のどちら側が返るか

CODE HELPもこの順番に合わせる。

---

## 11. Multi-line / 複合code

複数行は長さを増やすためではなく、**中間結果を追わせるため**に使う。

良い構造:

```text
1行目: 対象集合を作る
2行目: 並べ替え / 変換 / boolean化する
3行目: 最終候補・target集合を返す
```

現在のBoss例:

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const ordered = [...alive].sort((a, b) => a.hp - b.hp)
ordered[0]
```

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const scored = alive.map((enemy) => ({ enemy, score: enemy.attackDamage }))
scored.reduce((best, candidate) => candidate.score > best.score ? candidate : best).enemy
```

Playerが、

1. 1行目の結果
2. 2行目の結果
3. 最終target

を順に追えること。

未習構文を3つ以上まとめて初出させない。JUDGEの`map()`のように新しく加える構文はField看板でも単体確認できるようにする。

---

## 12. LearningHint

Field学習ヒントはdata-drivenに管理する。

最低限:

```ts
{
  id,
  concept,
  title,
  summary,
  codeLines,
  notes,
}
```

ルール:

- 1看板1概念を基本にする
- summaryは短くする
- code例はBattleで出る形に近づける
- notesで読み間違いやすい点を補足する
- 読まなくても進行できる
- Field上の`learningHintId`はunit testで存在確認する

---

## 13. Seeded Generator

現在は基準Battleへ制約付きvariationを加える。

- Enemy HP: base maxHPの85〜115%
- Enemy順shuffle
- Skill順shuffle
- code variant選択

候補盤面は、

1. initial valid targetがある
2. base Battleで初期targetがあったSkillが生成後もtargetを持つ
3. `isBattleSolvable()`を満たす

場合のみ採用する。

最大32回試し、成立しなければbase Battle cloneへfallbackする。

---

## 14. GeneratorとRPG Levelを混ぜない

seed generationは同じStage内のvariation。

```text
Player Levelが低い
→ 過去Stageへ戻る
→ EXPを得る
→ Level Up
→ 再挑戦
```

Enemy HPをPlayer Levelへ自動追従させない。

---

## 15. Battle balance

確認する。

- threshold上下にEnemyがいる
- すべてのSkillが同じtargetにならない
- NEXTを見る意味がある
- HP変化でtarget条件が変わる余地がある
- highest POWERだけで解けない
- multi-targetが完全上位互換にならない
- 複合codeの中間値に盤面差が反映される
- recommended Levelで合理的な勝ち筋がある

---

## 16. Solvability

目的:

- 理不尽な詰みを防ぐ
- generator regressionを防ぐ
- content追加時の安全網にする

`isBattleSolvable()`は「すべてのPlayerが必ず勝てる」保証ではない。

Stage基準値で勝ち筋が存在することを確認する。

---

## 17. RPG reward

新Skill / Stage追加時は、

- Stage CLEAR
- EXP
- next Stage
- Skill unlock
- Area CLEAR

の整合性を確認する。

RPG rewardがコード読解を上書きしないようにする。

---

## 18. Test

最低限:

- Skill ID重複なし
- code variant存在
- code variantでTargetRule / POWER不変
- multi variantが要求行数を満たす
- `codeHelpLines`と物理行数が一致
- 複合codeに必要な構文が含まれる
- TargetRule単体test
- display codeと内部ruleの対応test
- generated battleのvalid target
- solvability
- seed再現性
- LearningHint参照整合性
- route / Area整合性

PR前は必ず次を成功させる。

```bash
npm ci
npm run lint
npm test
npm run build
```

PR CIはこの確認の代替ではなく二重確認。

---

## 19. 追加チェックリスト

実装前:

- [ ] learning themeが1文で説明できる
- [ ] 未習syntaxを詰め込みすぎていない
- [ ] game resultへ意味が出る
- [ ] TargetRule / effectで安全に表せる
- [ ] Field看板が必要か判断した

実装後:

- [ ] display codeと内部効果一致
- [ ] code variant複数
- [ ] multi codeの各行に役割がある
- [ ] 行別CODE HELPの件数と内容が対応
- [ ] valid target
- [ ] seed再現性
- [ ] solvability
- [ ] Field学習ヒント整合
- [ ] unit test
- [ ] docs更新
- [ ] PR前lint / test / build
- [ ] Cloudflare Preview

---

## 20. 現在の優先順位

```text
JavaScript単体構文
↓
複数構文・3行code・行別CODE HELP
↓
TypeScript Frontier
↓
追加Area / RPG深化
```

新しい構文を増やすこと自体ではなく、**実際のコードを段階的に追って中間結果から最終結果を判断できるPlayerを増やすこと**を最終目的とする。
