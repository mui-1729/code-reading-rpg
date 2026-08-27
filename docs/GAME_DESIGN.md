# CODE//READ RPG ゲーム設計

この文書は、`CODE//READ RPG`で**何を守って作るか**を定義する。

- current feature一覧: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- 世界観 / theme: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- 次に作るもの: [`ROADMAP.md`](./ROADMAP.md)

## 1. Game goal

このゲームはコードを書く練習ではなく、**既存コードを読んで、そのコードが現在のstateへどう作用するか判断する練習**をRPGとして成立させる。

現在採用する世界観では、プレイヤーは新人エンジニアとしてREAL WORLDでsystem problemを受け、fantasyなCODE WORLDへ潜って原因を追う。

CODE WORLDでは、codeは単なる魔法演出ではなく、**worldのtarget / effect / stateを決めるrule**として扱う。

プレイヤーが読むもの:

- Enemy / object / row等のcurrent data
- current HP / order
- NEXT action
- displayed code
- POWER
- intermediate runtime values（必要ならCODE DATA）
- TypeScript type information

伸ばしたい力:

- object / arrayの現在値を読む
- 条件式 / callbackを読む
- `find` / `filter` / `map` / `sort` / `reduce`等の結果を追う
- TypeScriptの型情報とruntime valueを分けて読む
- multiline codeを上から追う
- code meaningとgame strategyを分ける
- technical dataがworld上でどう見えていても、元のcode semanticsを追う

未習syntaxを大量に推測させる難しさにはしない。

## 2. Core Battle loop

```text
current state / NEXTを見る
↓
Skill codeを読む
↓
target / effectを予測
↓
SELECT
↓
同じSkillを再度押してEXECUTE
↓
実際のtarget / damage / state changeを見る
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
current data
↓
targets / effect
```

表示と内部ruleは同じ意味に保つ。

CODE WORLDという表現を追加しても、この安全な境界は変えない。

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
- correct target list
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
enemies.filter((enemy) => enemy.hp < 55)
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

意味のないcommentや見た目だけの差で別問題扱いしない。

## 8. Difficulty

難易度は文章の意地悪さより、**読むdata / code / stateの組み合わせ**で上げる。

### Early

- 少数target
- 1行code
- 1つの条件
- `find`等の基本

### Middle

- 複数target
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
- Recovery Point → Inn / Restへ改修予定

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

CODE WORLDがfantasy worldであるため、Gold / Equipment / Shop / InnはそのままRPG systemとして存在してよい。

すべてをengineering metaphorへ置換しない。

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

### 二層構造

Worldの意味は今後次へ統一する。

```text
REAL WORLD
新人エンジニアとしてtask / incidentを受ける
↓ CONNECT
CODE WORLD
softwareがfantasy worldとして可視化される
↓
探索 / Battle / Boss
↓ RETURN
REAL WORLD
incident解決
```

REAL WORLDは「なぜ読むか」を与えるframing layer。

CODE WORLDはmain gameplayを行うRPG layer。

JavaScript Grassland / TypeScript Forestは削除せず、CODE WORLD内の技術regionとして扱う。

詳細は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)。

## 11. Story direction

各技術編を単なるsyntax listにしない。

各編では、

```text
REAL WORLDで仕事 / incidentを受ける
↓
CODE WORLDで同じ問題が異変として見える
↓
code / dataを読む
↓
Battleでworld ruleの作用を判断する
↓
局所症状からroot causeへ近づく
↓
Bossで総合して解決する
↓
REAL WORLDでincident close
```

という因果を持たせる。

新しい技術編では先に、

- REAL WORLDで何の仕事か
- 何が壊れたか
- CODE WORLDではどう見えるか
- なぜそのcodeを読む必要があるか
- Chapter間で何が累積するか
- Bossは何のroot causeを象徴するか

を決める。

細かな台詞や固有名詞はこのdesign docで固定しない。

## 12. Fantasy representationの原則

「エンジニアのStoryだから」という理由だけで、RPG表現を全部technical UIへ置き換えない。

残してよい:

- Grassland / Forest
- monster
- Treasure chest
- weapon / armor / accessory
- Gold
- Shop
- Inn
- companion

一方、技術ごとのmental modelが理解を助ける場合はRegion / object表現へ薄く反映する。

例:

- Database → archive / record / relationを感じるfield
- Backend / API → gate / road / network
- React → component / state変化を感じるmachine city

ただし表現candidateを先に固定せず、learning prototypeと同時に検証する。

## 13. Boss design

BossはHPが多いだけにしない。

**その編で追っていたroot causeをCODE WORLD上で象徴し、codeを読んで解除条件 / stateを理解するmechanic**を優先する。

候補の方向:

- Code Core
- Shared Contract / Compiler
- Query Engine
- Gateway
- Render Core
- Build Pipeline

条件:

- codeから理解できる
- new permanent panelを必要としない
- normal Battle ruleを壊さない
- pure resolver / testで固定できる
- Player statsだけで無視できない

## 14. NPC principle

NPCは教材説明役だけにしない。

REAL WORLD NPC:

- task / incidentのcontext
- system上の問題
-調査後のmeaning

CODE WORLD NPC:

- fantasy world側から見た異変
- regionの生活 /雰囲気
- gameplay上の情報

同じproblemを別視点で見せることで、REAL WORLDとCODE WORLDをつなぐ。

## 15. UI principle

固定UIは現在の判断に必要な情報だけ。

World詳細 / progression / Equipment / Codex / Sound等はPauseへ集約する。

説明文を常に置くより、初回Tutorial / contextual feedbackを使う。

Mobileでcontrolを遮らない。

REAL WORLD / CONNECT presentationを追加する場合も、長いcutsceneや常設panelを増やしすぎない。

## 16. Audio / motion / visual

音・motion・pixel artは答えを教えるものではなく、**入力とstate changeを感じやすくするfeedback**。

EXECUTE前にtargetを演出で先読みさせない。

EXECUTE後は実際に起きた結果を、

- hit feedback
- damage
- HP change
- defeat
- story transition

として明確に返す。

World direction上、将来的に、

- CONNECT
- RETURN
- Regionごとのvisual motif

を追加してよいが、game readabilityを優先する。

## 17. Good Battle checklist

- codeを読まないとtarget / effectを判断しづらい
- current dataを見る意味がある
- NEXTを見る意味がある
- code variationがsemanticに有効
- previous learningが再利用される
- code meaningとstrategyの両方に選択がある
- recommended statsで勝ち筋がある
- Level / Equipmentだけで読解を無視できない
- execution後に「なぜそうなったか」を説明できる
- Unit Testでmeaning / solvabilityを固定できる
- fantasy representationがcode semanticsを誤解させない

## 18. Avoid

- Skill名や色だけで答えが分かる
- 固定順で押すだけ
- codeが長いだけで結果は同じ
- 未習syntaxを大量投入する
- target preview
- auto battle
- Level scalingで世界がPlayerに合わせて弱くなる
- RPG数値だけで勝敗が決まる
- World / Storyとlearning contentが無関係
- REAL WORLDとCODE WORLDで別々のproblemを進める
- office simulator化
- fantasy要素の全面technical化
- 世界観変更を理由にcurrent Open World / Battleを全部作り直す

## 19. 新contentを作る前の質問

1. REAL WORLDでプレイヤーは何の仕事をしているか
2. 何が壊れた /困っているか
3. CODE WORLDでは同じproblemがどう見えるか
4. 何のcode / dataを読む必要があるか
5. Region表現はmental modelを助けるか、邪魔していないか
6. Chapter 1で何を学ぶか
7. Chapter 2で何を追加し、何を再利用するか
8. Bossは何のroot causeを総合するか
9. code readingが実際のgame decisionになっているか
10. RPG要素が読解を代替していないか
11. 「エンジニアだから」を理由にRPGの面白さを消していないか
