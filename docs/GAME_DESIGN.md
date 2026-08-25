# CODE//READ RPG ゲーム設計

## 1. この文書の役割

この文書は`CODE//READ RPG`のゲームとしての核を定義する。

ロードマップが「次に何を作るか」、この文書は**何を守って作るか**を扱う。

機能を追加するときは、RPGとして面白くなるかだけでなく、コードリーディング体験を壊していないかを先に確認する。

---

## 2. ゲームの目的

このゲームはコードを書く練習ではなく、**コードを読んで、そのコードが現在の状態に対して何をするか判断する練習**をゲームとして成立させる。

プレイヤーは、

- EnemyのHP
- 並び順
- NEXT行動
- Skillの表示コード
- POWER

を見て行動を決める。

伸ばしたい力:

- 配列 / objectの現在状態を読む
- 条件式を読む
- callbackが何を判定するか読む
- `find` / `filter`等の返り値を読む
- 複数行では実行順序を追う
- JavaScript上の意味とゲーム上の戦略を分けて考える

未習構文を大量に推測させるゲームにはしない。

---

## 3. Battleのコア体験

```text
Enemy状態を見る
↓
NEXTを見る
↓
コードカードを読む
↓
使うSkillを判断
↓
SELECT
↓
同じSkillを再度押してEXECUTE
↓
実際の対象 / damageを見る
↓
Enemy turn
↓
盤面が変わる
↓
次のコードを読む
```

Battleは「クイズに正解して次へ進む」のではない。

**コードを読むことがBattle中の意思決定そのもの**になることを重視する。

---

## 4. 現在の基本ルール

### Player

現在のMVP:

- Battle開始HP 100
- Enemy turnで生存Enemyから攻撃を受ける
- HP 0でdefeat

将来Level導入後はmaxHPが成長するが、Enemy側をcurrent Levelに合わせて自動弱体化しない。

### Enemy

最低限表示する情報:

- name
- current HP
- max HP
- NEXT action
- attack damage

### Skill

最低限持つ情報:

- name
- displayed code
- POWER
- internal TargetRule
- concept
- explanation

### POWER

POWERは対象1体あたりのdamage。

複数対象Skillでも人数で分割しない。

Level導入後は小幅な倍率を予定するが、targetingの意味自体は変えない。

---

## 5. 対象Previewを出さない

SELECT時に「このEnemyが対象」と答えを事前表示しない。

理由: **対象予測そのものが学習**だから。

表示してよい:

- Skill name
- code
- POWER
- SELECT状態

通常状態で表示しない:

- target highlight
- target人数
- 条件一致Enemy一覧
- 実行結果の先読み

Hintを追加しても通常状態ではこの原則を守る。

---

## 6. 2回押しで実行する

1回目:

```text
SELECT
```

2回目:

```text
EXECUTE
```

目的:

- 誤tap防止
- コードを読んで選ぶ時間を作る
- 別Skillへ選択変更できるようにする

---

## 7. 読み間違いを「不正解」と表示しない

意図したEnemyと違うEnemyへ攻撃しても、クイズのように即「不正解」と表示しない。

JavaScriptの意味に対応する効果をそのまま実行する。

```text
自分の予測
vs
実際の結果
vs
その後のBattle状態
```

この差から学ぶ。

実行後や任意操作でTrace / explanationを見るのはよい。

---

## 8. NEXTを見せる

EnemyのNEXT actionとdamageは事前に表示する。

コードを正しく読めても、

- dangerous Enemyを先に倒す
- low HP enemiesをまとめて倒す
- high HP enemyを先に削る

など、戦略は盤面で変わる。

**コードの意味に明確な答えはあっても、戦略的な最適解が常に1つとは限らない。**

---

## 9. JavaScript上の正しさと戦略を分ける

例:

```js
enemies.filter(e => e.hp < 55)
```

どのEnemyが返るかはJavaScript上で一意。

しかし今このSkillを使うべきかは、

- POWER
- NEXT
- Player HP
- 他Skill
- 今後のtarget変化

で変わる。

将来学習記録を作る場合も、

- code meaningを読めたか
- strategyが最適だったか

を同じ正誤として扱わない。

---

## 10. 暗記ゲー化を防ぐ

固定Battleの手順暗記だけで攻略できないよう、現在はseed付き制約生成を導入している。

現在変化するもの:

- Enemy HP
- Enemy order
- Skill order

現在の保証:

- seed再現性
- 有効target
- 基準Battleの学習target維持
- solvability

今後変化させるもの:

- same conceptのcode variant
- threshold等の条件値
- match count
- multi-line code

完全randomにはしない。

---

## 11. SkillDefinitionをsourceにする

表示コードと内部効果をずらさない。

現在は`SkillDefinition`に、

- TargetRule
- concept
- explanation
- base POWER
- codeVariants

をまとめる。

`ProblemTemplate`という別抽象は現在採用しない。

必要な責務が増えるまでは、Skillの意味をSkillDefinition、Battleの世界側構成をBattle definition、variationをseeded generatorへ分ける。

---

## 12. RPG要素の役割

RPG要素は学習を邪魔せず、コードを読む理由を増やすために使う。

良いRPG要素:

- LevelでHPに少し余裕ができる
- 過去Stageへ戻ってEXPと復習を同時に行う
- Bossの状態によって同じコードのtargetが変わる
- NPCが次の学習概念を示す
- 装備が特定Skillの使い方に小さな選択肢を増やす

避けるRPG要素:

- Levelを上げればコードを読まず勝てる
- current Levelが低いとEnemyが自動で弱くなる
- 装備の数値だけでBattleが決まる
- Rare Skillが常に完全上位互換
- Grind量が読解を上書きする

---

## 13. 世界の強さを固定する

RPGとして重要な原則。

Stage / Bossには固有の基準難易度を持たせる。

```text
Enemy base HP
Enemy attack
Enemy composition
Recommended Level
Learning theme
```

Playerが弱い場合は、

```text
戻る
→ Battleする
→ EXPを得る
→ Level Up
→ 再挑戦
```

を行う。

EnemyをPlayerへ自動追従させない。

seedによるHP variationは学習意図を保った「同じStage内の盤面差」であり、Player Levelに応じたdifficulty scalingではない。

---

## 14. Level成長は「余裕」を作る

初期案では、

- maxHP増加
- Skill POWERの小幅増加

を予定する。

目標:

> 適正Levelまで育つことで戦える土台ができる。勝ち方を決めるのはコード読解と戦略。

Level差だけで勝敗が決まるbalanceにはしない。

---

## 15. RPGの外側のloop

現在はBattle中心だが、目標は次。

```text
Field / Hub / Stage Select
↓
Battle
↓
Reward / Growth
↓
Worldへ戻る
↓
次の目的 / 復習 / 再挑戦
```

Stage Selectは暫定。

RPG最小loop完成後はtop-down Fieldへ発展させ、

- movement
- NPC
- dialogue
- Battle entrance
- Area exit

を持たせる。

---

## 16. 良いBattleの条件

- 学習themeが明確
- codeを読まないとtargetを判断しづらい
- code差がgame resultに現れる
- Enemy stateを見る意味がある
- NEXTを見る意味がある
- 実行後に「なぜ」を説明できる
- 基準 / 推奨statsで勝ち筋がある
- 同じ固定手順だけにならない
- Levelを上げてもtargetingの読み間違いに意味が残る

---

## 17. 避けたいBattle

- 正解Skillが色や名前だけで分かる
- 毎回同じ順で押すだけ
- codeが長いだけで結果が同じ
- 未習syntaxを知らないと推測不能
- POWER差だけで選択が決まる
- NEXTを無視してもよい
- codeと無関係な暗記問題
- design上の勝ち筋がない
- current Playerに合わせて勝手にEnemy HPが下がる

---

## 18. 難易度の上げ方

難易度は文章の意地悪さではなく、読む対象とstateで上げる。

### 初級

- Enemy 2体程度
- 1条件
- 1行code
- targetが分かりやすい

### 中級

- Enemy 3〜4体
- `find` / `filter`比較
- 複数条件
- orderが意味を持つ
- turn後にtargetが変わる

### 上級

- multi-line
- nested data
- intermediate variables
- `map` / `reduce` / `sort`
- turn-based state changes
- 複数strategy

未習syntaxを混ぜることで難しくしない。

---

## 19. Explanation / Hint

Explanationは、

1. JavaScriptとして何をするか
2. 今回のEnemy dataでは何が起きたか
3. 類似syntaxとの違い

を分けて説明する。

Hintは段階式にし、最初からtargetそのものを見せない。

将来NPCをHint導線に使う場合も同じ原則。

---

## 20. Skill unlock / Equipment

Skill unlockは「新しい読み方が増えた」ことを表す。

- 新Skillは新しい読解概念を追加
- 後続Battleで使う意味がある
- 既存Skillを完全に置き換えない

Equipment / Itemを追加する場合も、code readingを補強する用途に限定する。

---

## 21. 音と動きは「答えを教える」のではなく「結果を感じさせる」

Battleには、クラシックJRPGのような短いSE・被弾・間・勝利反応を入れる。

ただし目的は演出そのものではなく、**プレイヤーの入力とゲーム状態の変化を気持ちよく、分かりやすく返すこと**。

基本の流れ:

```text
SELECT
↓
EXECUTE
↓
短い予備動作 / SE
↓
攻撃
↓
対象Enemyがflash / shake + hit SE
↓
Damage / HP更新
↓
撃破なら消滅演出
↓
短い間
↓
Enemy Turn
```

### 実行前と実行後を分ける

対象Preview OFFの原則は維持する。

実行前:

- target highlightを出さない
- target人数を出さない
- 演出で正解を先読みさせない

実行後:

- 実際にtargetになったEnemyをflash / shakeさせる
- damageとHP変化を同期させる
- 複数targetなら全targetへ結果を返す

つまり、音と動きは**予測の答えを教えるUIではなく、予測した結果を確認するfeedback**として使う。

### 派手さよりテンポ

長い必殺技演出でコードを読む時間を奪わない。

目指すのは、

- cursor / decideの小さな反応
- attack前の一瞬の間
- hitの明確な反応
- defeat / victoryの区切り
- Level Up / Skill Unlockの達成感

の積み重ね。

Boss等では強い演出を使ってよいが、通常Battleまで毎回長く止めない。

### サウンド

初期の音:

- cursor / select / decide / cancel
- Skill SELECT / EXECUTE
- attack / hit / enemy attack / player hit
- Victory / Defeat jingle
- Level Up / Skill Unlock / Area CLEAR

BGMとSEは別に扱い、Mute / volumeを用意する。

ブラウザのautoplay制約を考慮し、ユーザー操作を起点にAudioを有効化する。

### Accessibility

- `prefers-reduced-motion`ではshake・大きな移動・flash頻度を抑える
- motionを減らしてもdamage / HP / stateが理解できる
- 音をMuteしてもゲーム情報が欠落しない
- 音だけ、色だけ、animationだけに重要情報を依存させない

### オリジナル表現

8-bit / classic JRPGのテンポ感は参考にしてよいが、既存作品の音源・メロディ・sprite・具体的な演出をそのまま再現しない。

CODE//READ RPGとして独自の音と動きを作る。

---

## 22. 新機能を追加する前の質問

1. この機能でcodeを読む理由が増えるか
2. codeを読まずに済むshortcutになっていないか
3. RPGとして前後のloopが良くなるか
4. seed / generation / progressionの責務を混ぜていないか
5. Player成長とWorld難易度を分離できているか
6. test可能な純粋logicへ分けられるか
7. 音や動きが答えを先に見せていないか
8. 演出が操作テンポを悪くしていないか
9. 本当に今必要か

これを満たさない機能は、RPGらしく見えても後回しにする。
