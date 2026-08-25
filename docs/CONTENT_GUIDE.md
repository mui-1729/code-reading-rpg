# CODE//READ RPG コンテンツ作成ガイド

## 1. この文書の役割

この文書は、新しいBattle、Skill、code variant、解説を追加するときの作成ルールを定義する。

目的は、コンテンツが増えても、

- 学習意図
- JavaScript上の意味
- Battleとしての戦略
- seed再現性
- RPG進行

を揃えたまま追加できること。

---

## 2. Battleを作る前に決める

最低限:

1. 今回学ばせる概念
2. 既習として扱うsyntax
3. Playerに比較させたい選択肢
4. 盤面のどの情報を見る必要があるか
5. 起こり得る読み間違い
6. 読み間違いがgame resultへどう現れるか
7. 基準 / 推奨Player stats
8. 合理的な勝ち筋
9. EXP / unlock等のStage報酬が必要か

「新しいEnemyを出したい」からではなく、学習themeとRPG上の役割から逆算する。

---

## 3. 1 Battleの学習theme

新規概念は原則1つ、多くても強く関連する2つ程度。

良い例:

- `find()`が最初の1要素を返す
- `find()`と`filter()`の違い
- `sort()`後の先頭要素

避ける例:

- `map()`、分割代入、optional chaining、`reduce()`を同時に初出

難易度は未習syntax数ではなく、既習知識を使うstateの複雑さで上げる。

---

## 4. 現在のコンテンツ構造

現在は独立した`ProblemTemplate`を使わない。

役割を次のように分ける。

```text
Battle definition
  = 世界側の基準Enemy / Skill構成

SkillDefinition
  = Skillの意味 / TargetRule / codeVariants / explanation

Seeded Generator
  = 同じ学習意図を保った盤面variation

Solvability
  = 生成 / 設計品質の検証
```

必要な責務が実際に増えるまでは、別のProblemTemplate階層を追加しない。

---

## 5. SkillDefinition

Skillのsource definitionは概念上次。

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
    },
  ],
}
```

### `id`

- stable identifier
- lower-case
- kebab-case可
- display name変更で変えない

### `name`

game内で短く識別できる名前。

### `power`

base damage。

Player Levelによる小幅倍率が将来入っても、SkillDefinitionのbase POWERは別に保つ。

### `rule`

display codeの意味に対応する内部TargetRule。

### `concept`

explanation / learning recordで使う学習概念。

### `explanation`

一般的なsyntaxの意味と、このSkillが何をtargetにするかを書く。

### `codeVariants`

同じSkillの意味を保ったdisplay code候補。

現在はdefault variantが1つずつ。#31でseed付き選択、#32でmulti-lineを追加予定。

---

## 6. CodeVariant

現在の形:

```ts
{
  id: string,
  code: string,
  lineMode: 'single' | 'multi',
}
```

variantを増やすときに変えてよい:

- callback variable name
- 既習範囲の同義的な書き方
- line break / intermediate variable

変えてはいけない:

- TargetRuleの意味
- base POWER
- concept
- explanationの本質

例:

```js
enemies.find(e => e.hp < 45)
enemies.find(enemy => enemy.hp < 45)
```

未習の分割代入等をvariantだけで突然出さない。

---

## 7. Display codeと内部効果を一致させる

最重要ルール。

例えば、

```js
enemies.find(e => e.hp < 45)
```

なら、内部ruleも、

> 生存Enemyを配列順に見て、current HPが45未満の最初の1体

でなければならない。

避けるずれ:

- `<` vs `<=`
- `find` vs `filter`
- current HP vs max HP
- array order vs HP order
- dead Enemyの扱い
- `sort()`のascending / descending

Display code自体を`eval()`してgame logicとして使わない。

---

## 8. Battle base definition

`battles.ts`のBattleは世界側の基準値。

現在のBattle 1〜3は、

- base Enemy HP
- attack
- composition
- available Skills
- unlock Skill

を持つ。

将来はさらに、

- recommendedLevel
- expReward
- isBoss

を持たせる予定。

これらはcurrent Player Levelに合わせてruntimeで下げる値ではない。

---

## 9. 現在のseed付きGenerator

現在は基準Battleへ制約付きvariationを加える。

### HP

Enemy base maxHPへ85〜115%の倍率をかける。

```text
hp = round(baseMaxHp * multiplier)
```

### Order

- Enemy順をshuffle
- Skill順をshuffle

### Validation

候補盤面は、

1. initial valid targetがある
2. base Battleで初期targetがあったSkillが、生成後も初期targetを持つ
3. `isBattleSolvable()`を満たす

場合のみ採用。

最大32回生成し、成立しない場合はbase Battleのcloneへfallbackする。

---

## 10. GeneratorとRPG Levelを混ぜない

seed generationは「同じStage内の盤面variation」。

Player Levelに合わせたauto difficulty scalerではない。

避ける実装:

```text
Player Levelが低い
→ generatorがHP倍率を下げる
→ 自動で勝てる盤面にする
```

正しいRPG loop:

```text
Player Levelが低い
→ 過去Stageへ戻る
→ EXPを得る
→ Level Up
→ 同じStageへ再挑戦
```

Stageの基準難易度とseed variationを分ける。

---

## 11. HP設計

HPはcode conditionとstrategyの両方に影響する。

確認:

- threshold上下にEnemyがいる
- 全Enemyが同じ結果になっていない
- attack後にtarget条件が変わる余地がある
- POWERとの組み合わせで即死 / 詰みがない
- seed variation後もlearning targetが残る

将来Level導入後は、Stageのrecommended statsでbalanceを確認する。

---

## 12. POWER設計

POWERはtargetを読んだあとにどのSkillを使うか考える材料。

方針:

- single targetは比較的高POWERでもよい
- multi targetは低めでもよい
- narrow conditionへ価値を持たせてもよい
- 常に1枚が完全上位互換にならない

避ける:

- max POWERだけ選べば勝てる
- Level倍率でtargetingを無視できる
- 1枚で全Stageを解決できる

---

## 13. NEXT / Enemy attack

NEXTはstrategyを生む情報。

一部のBattleでは、倒す順番で被damageが変わるようにする。

確認:

- dangerous Enemyをcodeで狙えるか
- NEXTを見る意味があるか
- Playerのrecommended maxHPとturn数が整合するか

Enemy attackはcurrent Player Levelを参照して自動調整しない。

---

## 14. Solvability

現在はgenerated candidateの検証にも使う。

目的:

- 理不尽な詰みを防ぐ
- 学習用Battleとして成立させる
- CI regressionを防ぐ

Level導入後は**current Playerが必ず勝てること**を保証するために使わない。

Stageの基準 / recommended Player statsで勝ち筋があるかを検証する。

推奨Level未満で敗北すること自体は許容する。

---

## 15. 最適解を1つに固定しない

JavaScriptの実行結果は一意でも、戦略は複数あってよい。

例:

- Enemy数を減らす
- dangerous Enemyへhigh POWER
- 次turnのcondition変化を狙う

ただし学習themeを一度も使わず簡単に突破できる場合は見直す。

---

## 16. Skill unlock / RPG reward

新Skillをunlockするとき:

- 新しい読み方を増やす
- 後続Stageで実際に使う
- 既存Skillを完全に置き換えない

RPG最小loopではBattle rewardとして、

- EXP
- Skill unlock
- Stage CLEAR
- next Stage unlock

を使う予定。

Rewardの数値がlearning decisionを上書きしないようにする。

---

## 17. Explanation

良いexplanationは3層。

1. JavaScriptとして何をしているか
2. このSkillではどのconditionを見るか
3. 似たsyntaxとの違い

固定盤面だけに依存した説明を避ける。

悪い例:

> このカードはSlimeを攻撃する

良い例:

> `find()`は条件に一致した最初の要素を返す。このSkillはcurrent HPが45未満のEnemyを先頭から探す。

seed variationでも成立する説明を書く。

---

## 18. Battle title / subtitle

Battle nameはgameとして覚えやすく、subtitleはlearning themeが分かるものにする。

例:

```text
First Read
コードが選ぶ「対象」を読む
```

```text
One or Many
find と filter の違いを戦況で使い分ける
```

Stage Select導入後はrecommended Level / EXP / Boss等のRPG情報と学習themeを分けて表示する。

---

## 19. 同概念variantの追加順

#31ではまず1行の安全な差から始める。

例:

```js
enemies.find(e => e.hp < 45)
enemies.find(enemy => enemy.hp < 45)
```

その後、既習syntaxが増えたら、

```js
enemies.find(({ hp }) => hp < 45)
```

等を追加できる。

Chapterの学習順を無視してvariantを増やさない。

---

## 20. Multi-line code

#32ではBattle 3から2行程度を導入する予定。

例:

```js
const ordered = [...enemies].sort((a, b) => a.hp - b.hp)
ordered[0]
```

目的は新syntaxを大量追加することではなく、**実行順序と中間値を追う**体験へ広げること。

---

## 21. 新しいJavaScript概念

追加条件:

- game内判断へ自然に変換できる
- current dataを見る意味がある
- 既存Skillとの差がgame resultに出る

候補:

- `some()`
- `every()`
- `map()`
- `reduce()`
- object access
- nested data
- status / shield

構文網羅のためだけには追加しない。

---

## 22. Battle追加チェック

実装前:

- [ ] learning theme明確
- [ ] 未習syntaxを突然混ぜない
- [ ] codeを読む意味がある
- [ ] NEXTを見る意味がある
- [ ] recommended Player statsを決めた
- [ ] 想定勝ち筋がある

実装後:

- [ ] SkillDefinitionとTargetRule一致
- [ ] seed再現性
- [ ] generation constraint維持
- [ ] solvability
- [ ] POWER / HP balance
- [ ] unlock / reward整合
- [ ] Unit Test
- [ ] Cloudflare Preview

---

## 23. コンテンツ追加の優先

現在は新Battleを大量に追加するより、先にRPG最小loopを完成させる。

```text
PlayerProgress
→ Stage Select
→ EXP / Level / Reward
→ Persistence
→ Boss / Area
→ Field / NPC
```

その後、codeVariants / multi-line / 新JavaScript概念を増やし、RPG progressionとlearning progressionを一体化していく。
