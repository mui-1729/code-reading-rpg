# CODE//READ RPG ゲーム設計

この文書は、`CODE//READ RPG`で**何を守って作るか**を定義する。current feature一覧は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、次に作るものは[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. Game goal

このゲームはコードを書く練習ではなく、**既存コードを読んで、そのコードが現在のstateへどう作用するか判断する練習**をRPGとして成立させる。

プレイヤーが読むもの:

- Enemy data
- current HP / order
- NEXT action
- displayed code
- POWER
- intermediate runtime values（必要ならCODE DATA）

伸ばしたい力:

- object / arrayの現在値を読む
- 条件式 / callbackを読む
- `find` / `filter` / `map` / `sort` / `reduce`等の結果を追う
- TypeScriptの型情報とruntime valueを分けて読む
- multiline codeを上から追う
- code meaningとgame strategyを分ける

未習syntaxを大量に推測させる難しさにはしない。

## 2. Core Battle loop

```text
Enemy state / NEXTを見る
↓
Skill codeを読む
↓
target / effectを予測
↓
SELECT
↓
同じSkillを再度押してEXECUTE
↓
実際のtarget / damageを見る
↓
Enemy turn
↓
盤面が変化
↓
再び読む
```

Battleは「問題文に正解するクイズ」ではない。

**コードを読むことをturn-based RPGの意思決定そのものにする。**

## 3. Displayed code and internal rule

表示JavaScript / TypeScriptを`eval()`してgame logicを動かさない。

```text
displayed code
↕ same semantic meaning
SkillDefinition / TargetRule
↓
current Enemy[]
↓
targets
```

表示と内部ruleは同じ意味に保つ。

code variationを増やしても、意味・solvability・CODE HELPとの対応を壊さない。

## 4. Target preview is OFF

EXECUTE前にcorrect targetを表示しない。

表示してよい:

- Skill name
- displayed code
- POWER
- selected state
- codeを読むために必要なruntime data

表示しない:

- target highlight
- correct Enemy list
- correct Skill
- target countの答え
- damage preview

理由: target予測そのものがlearningだから。

## 5. 読み間違いを「不正解」と表示しない

コードの意味を読み違えても、クイズのような`WRONG`表示は基本的にしない。

実際のruleどおりにBattleが進み、

```text
予測
vs
実際のtarget
vs
その後のstate
```

の差から学ぶ。

CODE HELP / CODE DATAは読む支援をするが答えを直接出さない。

## 6. Code meaning and strategy are different

例:

```js
enemies.filter(enemy => enemy.hp < 55)
```

どのEnemyが返るかはcode上で決まる。

しかし、そのSkillを今使うべきかは、

- POWER
- NEXT
- Player HP
- Boss mechanic
- 他Skill
- turn後のstate

で変わる。

**code meaningには明確な結果があっても、戦略的最適解は常に1つとは限らない。**

## 7. 暗記攻略を防ぐ

同じSkill名と答えの対応を暗記するだけでは攻略しにくくする。

現在:

- seeded Enemy HP
- Enemy order variation
- Skill order variation
- Battleごとのbase code variant
- Encounterごとのsemantic code variation
- deterministic reload / retry
- solvability test

variationは学習範囲内の同値表現にする。

意味のないcommentや見た目だけの差で「別問題」と扱わない。

## 8. Difficulty

難易度は文章の意地悪さより、**読むdata / code / stateの組み合わせ**で上げる。

### Early

- 少数Enemy
- 1行code
- 1つの条件
- `find`等の基本

### Middle

- 複数Enemy
- `filter`
- `&&` / `||`
- order / NEXTが重要
- previous syntaxも再登場

### Advanced / Boss

- multiline
- intermediate values
- `sort` / `some` / `reduce`
- nested data / TypeScript type information
- Boss-specific state

新Chapterで以前の知識を消さず、**累積学習**にする。

## 9. RPG progression

現在のRPG要素:

- EXP / Level
- persistent current HP
- Attack / Defense / Max HP
- Equipment
- Gold / PATCH KIT / Shop
- Party companion
- Treasure
- Recovery Point

役割は「読解を飛ばす力」ではなく、**失敗できる余裕と攻略上の選択**を作ること。

良い例:

- HPが増えてもう1turn考えられる
- defense型 / attack型Equipmentを選ぶ
- PATCH KITを使うタイミングを決める
- BYTEが読んで選んだ同targetへ追撃する

避ける:

- auto target
- Levelだけでtargeting mistakeが無意味になる
- current LevelにEnemyを自動追従させる
- 完全上位互換Equipment大量追加
- grindで読解を無視する

## 10. World is part of the RPG

current outer loop:

```text
Opening / World
↓
move / NPC / Shop / Recovery / Treasure
↓
Random Encounter / Fixed Boss
↓
Battle
↓
reward / story / progress
↓
同じWorldへ戻る
```

Stage Select / Area Selectを通常導線へ戻さない。

Worldを広げるだけでなく、歩く理由のある地点を増やす。

## 11. Story direction

各技術編を単なるsyntax listにしない。

```text
エンジニアとして仕事を受ける
↓
問題が起きる
↓
code / dataを読む
↓
Battleで判断する
↓
原因の理解が深まる
↓
Bossで総合して解決する
```

JavaScript編は現在この形へ統一済み。

新しい技術編では、

- 何の仕事か
- 何が壊れたか
- なぜそのcodeを読む必要があるか
- Chapter間で何が累積するか

を先に設計する。

## 12. Boss design

BossはHPが多いだけにしない。

現在のGUARDのように、**codeを読んで解除条件 / stateを理解するmechanic**を使える。

条件:

- codeから理解できる
- new permanent panelを必要としない
- normal Battle ruleを壊さない
- pure resolver / testで固定できる
- Player statsだけで無視できない

## 13. UI principle

固定UIは現在の判断に必要な情報だけ。

World詳細 / progression / Equipment / Codex / Sound等はPauseへ集約する。

説明文を常に置くより、初回Tutorial / contextual feedbackを使う。

Mobileでcontrolを遮らない。

## 14. Audio / motion / visual

音・motion・pixel artは答えを教えるものではなく、**入力とstate changeを感じやすくするfeedback**。

EXECUTE前にtargetを演出で先読みさせない。

EXECUTE後は実際に起きた結果を、

- hit feedback
- damage
- HP change
- defeat
- story transition

として明確に返す。

## 15. Good Battle checklist

- codeを読まないとtarget / effectを判断しづらい
- Enemy dataを見る意味がある
- NEXTを見る意味がある
- code variationがsemanticに有効
- previous learningが再利用される
- code meaningとstrategyの両方に選択がある
- recommended statsで勝ち筋がある
- Level / Equipmentだけで読解を無視できない
- execution後に「なぜそうなったか」を説明できる
- Unit Testでmeaning / solvabilityを固定できる

## 16. Avoid

- Skill名や色だけで答えが分かる
- 固定順で押すだけ
- codeが長いだけで結果は同じ
- 未習syntaxを大量投入する
- target preview
- auto battle
- Level scalingで世界がPlayerに合わせて弱くなる
- RPG数値だけで勝敗が決まる
- World / storyとlearning contentが無関係

## 17. 新contentを作る前の質問

1. プレイヤーは何の仕事をしているか
2. 何が壊れた /困っているか
3. 何のcode / dataを読む必要があるか
4. Chapter 1で何を学ぶか
5. Chapter 2で何を追加し、何を再利用するか
6. Bossは何を総合するか
7. code readingが実際のgame decisionになっているか
8. RPG要素が読解を代替していないか
