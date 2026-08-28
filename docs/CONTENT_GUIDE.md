# CODE//READ RPG コンテンツ作成ガイド

## 1. この文書の役割

新しいBattle、Skill、code variant、Story上のコード説明、Field / World learning contentを追加するときの基準を定義する。

コンテンツが増えても次を崩さない。

- コード未経験者でも意味を追える
- code readingがgame decisionになる
- JavaScript / TypeScript上の意味が正しい
- display codeと内部効果が一致する
- seed再現性 / solvability
- RPG進行と反復学習
- Storyが答えを直接教えない

---

## 2. 基本原則

新しい要素は「構文を増やしたい」だけで追加しない。

実装前に最低限決める。

1. 何を読めるようにしたいか
2. その前に何を既習として扱うか
3. Playerが盤面のどの情報を見るか
4. 初心者へ普通の言葉ならどう説明するか
5. 読み間違えると何が起こるか
6. 正しく読んだ結果がどのgame decisionへつながるか
7. 何戦くらい反復してから次へ進むか
8. TargetRule / effectで安全に表現できるか

構文の意味がgame resultへ出ないならBattleへ入れる優先度は低い。

---

## 3. 初心者向け説明の順番

新概念は、technical termを先に暗記させない。

基本順:

```text
普通の言葉
→ 小さい式 / 記号
→ syntaxの意味
→ 現在dataへ適用
→ 反復
→ 必要なら正式名称
```

例:

```js
enemy.hp < 50
```

Story / NPC:

> `<` は、左の数字が右より小さいかを見る記号だ。ここではHPが50より少ないかを見てる。

次に:

```js
enemies.find((enemy) => enemy.hp < 50)
```

> `enemies`は敵たちの集まり。`find()`は前から見て、条件に合うものを1つ探す。

ここで「正解はSlime」とは言わない。targetを現在値から決める部分はPlayerに残す。

### technical term

`callback`、`target selection`、`API contract`、`narrowing`等を使う場合、初登場時は普通の言葉を先に置く。

例:

> 送られてくるdataの形の約束――API contract

のように意味から名前へ進む。

---

## 4. 学習の役割分担

```text
Story / NPC = 新概念を会話として最初に噛み砕く
CODE HELP = 読み方を任意で再確認
CODE DATA = 現在値 / 中間値を確認
通常Battle = 1〜2概念を盤面へ適用
反復Encounter = 同じ概念を値 / 順番 / variant差で練習
中Boss = 直前の複数概念を組み合わせる
Final Boss = 編全体の既習概念を複数行で追う
```

Field看板は補助として残してよいが、最初の説明を看板だけへ押し込まない。

---

## 5. JavaScript編の長さ

JavaScript編は3戦で完結させる前提にしない。

最終的な目安:

- 通常戦闘 / Encounter: 20〜30回程度
- fixed learning Battle: 8〜12程度まで候補
- 中Boss: 2〜3体候補
- Final Boss: 1体

数値は固定quotaではない。

重要なのは、**新概念の数ではなく反復回数を増やすこと**。

例:

```text
comparison
→ comparisonを数戦
→ find
→ findをHP / attack / nameで数戦
→ && / ||
→ find + &&
→ 中Boss
→ filter
→ filterを数戦
→ map
→ some / every
→ sort
→ multi-line
→ Final
```

同じcode文字列を暗記させない。

---

## 6. Difficulty ladder

JavaScriptの入口は、`find()`から始める必要もない。

より小さい単位から進めてよい。

```text
値を見る
↓
comparison (`<`, `>`, `===`)
↓
object property (`enemy.hp`)
↓
array / enemiesという集合
↓
find()
↓
&& / ||
↓
filter()
↓
map()
↓
some() / every()
↓
sort()
↓
optional chaining / nullish coalescing等の既習範囲
↓
複数行 / 中間値
↓
reduce()等の集約
```

Bossで未習conceptを突然出さない。

---

## 7. Content structure

```text
Battle
  = areaId / Enemy / Skill / reward

SkillDefinition
  = Skillの意味 / TargetRule / codeVariants / explanation

CodeVariant
  = display code / line mode / code help

Story learning beat
  = 初登場conceptを普通の言葉で説明するevent

Seeded Generator
  = 同じlearning intentを保った盤面variation

Solvability
  = 生成 / 設計品質の検証
```

Battle engineはArea固有syntaxを知らない。

---

## 8. SkillDefinition

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

### `rule`

display codeの結果に対応する内部TargetRule。

### `concept`

CODE HELPやStory learning beatが参照する短い概念名。

### `explanation`

原則として、

1. syntaxが一般に何をするか
2. このSkillでは何を見るか
3. 中間値があるならどこを追うか

を短く説明する。

final targetそのものは書かない。

---

## 9. CodeVariant

```ts
{
  id: string
  code: string
  lineMode: 'single' | 'multi'
  codeHelpLines?: readonly string[]
}
```

変えてよいもの:

- callback variable名
- intermediate variable名
- 既習範囲の同義表現
- line break
- TypeScriptの同じ意味を保つ型表現

変えてはいけないもの:

- TargetRuleの意味
- base POWER
- conceptの本質
- target集合

文字列暗記で攻略できないようにする。

`codeHelpLines`は物理行数と一致させ、各行の意味だけを説明する。

---

## 10. Display codeと内部効果

最重要ルール。

表示codeとTargetRule / effectは同じ結果を指す。

確認するずれ:

- `<` / `<=`
- `>` / `>=`
- `&&` / `||`
- `find()` / `filter()`
- current HP / max HP
- array order / sorted order
- dead Enemy
- `some()` / `every()`のboolean
- `map()`後のproperty
- `reduce()`のaccumulator / tie
- `.enemy` / `[0]`等の最終取り出し

表示codeを`eval()`しない。

---

## 11. JavaScriptの複合読解

複数行は長さを増やすためでなく、中間結果を追わせるために使う。

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const ordered = [...alive].sort((a, b) => a.hp - b.hp)
ordered[0]
```

良い構造:

```text
1行目: 対象集合を準備
2行目: 絞る / 変換 / 並べる
3行目以降: 集約
最終行: targetを取り出す
```

新概念はStory / 前段Battleで単体経験してから組み合わせる。

---

## 12. TypeScript固有ルール

TypeScriptは型用語クイズにしない。

読む順番:

```text
型が許す候補
→ 現在値 / objectの形
→ narrowingで何が確定したか
→ JavaScriptとして実行される式
→ target / value
```

例:

```ts
type Limit = 45 | 60
const limit: Limit = 60
const targets = enemies.filter((enemy: Enemy) => enemy.hp < limit)
targets
```

`45 | 60`を見ただけで答えにしない。現在値`60`まで読む。

TypeScript Storyでも、

> 型の契約が壊れた

から始めず、

> 受け取るdataの形の約束が変わった

と説明してから正式名称へ接続する。

---

## 13. Seeded Generator / Solvability

現在のvariation:

- Enemy HP variation
- Enemy順shuffle
- Skill順shuffle
- code variant選択

候補盤面は、

1. initial valid targetがある
2. base BattleでtargetがあったSkillが生成後も意味を持つ
3. `isBattleSolvable()`を満たす

場合のみ採用する。

Generatorは反復学習に使う。

同じconceptを、

- HPが違う
- enemy orderが違う
- callback名が違う
- thresholdが同じでも盤面が違う

状態で読み直させる。

---

## 14. Battle balance

確認する。

- threshold上下にEnemyがいる
- すべてのSkillが同じtargetにならない
- NEXTを見る意味がある
- HP変化で条件が変わる余地がある
- highest POWERだけで解けない
- multi-targetが完全上位互換にならない
- 中間値に盤面差が反映される
- 初心者が「何を見ればよいか」まではStory / HELPから理解できる
- targetそのものは自分で判断する

---

## 15. Worldとlearning progression

新conceptはWorld進行と結びつける。

JavaScriptの例:

```text
草原: 値 / comparison
↓
林: object / array / find
↓
Village: 既習内容の会話・休憩・小イベント
↓
森: && / || / filter
↓
中Boss: find / filter + condition
↓
深い森: map / some / every / sort
↓
Final: multi-line / aggregate
```

地名を`FILTER FOREST`のような教材名にする必要はない。

普通のfantasy locationとして成立させ、そこで出るBattleがlearning progressionを担う。

---

## 16. Test / PR checklist

最低限:

- Skill ID / Battle ID重複なし
- code variant複数
- variantでTargetRule / POWER不変
- multi code行数とCODE HELP一致
- display code / internal rule一致
- generated battle valid target
- solvability
- seed再現性
- Storyがfinal targetを明示していない
- 新conceptが未説明のままBossへ出ていない
- 同conceptの反復が単なる同一問題copyになっていない
- map / Battle / progress整合
- old save migration

PR前:

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

GitHub Actionsは最初の実行環境にしない。local実行できない場合だけrepository workflowで定義された代替手順を使い、その制約をPRへ明記する。

最終目的はsyntax名の暗記ではなく、**コードを上から追い、現在値と中間結果から何が起きるか自分で判断できること**。
