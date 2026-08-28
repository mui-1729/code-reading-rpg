# CODE//READ RPG — World Direction

この文書は、`CODE//READ RPG`の**現在採用する世界観・テーマ・表現方針**を定義するsource of truth。

細かな台詞や固有名詞を固定する文書ではない。Story / World / Region / NPC / Boss / visual / RPG systemを追加・変更するときに、何を目指すゲームなのかを判断する基準とする。

---

## 1. North Star

`CODE//READ RPG`は、

> **コードを知らない人でもfantasy RPGとして入り、世界のルールとしてコードを少しずつ読み、遊んでいるうちに「自分でコードを追える」状態へ進むRPG。**

REAL WORLDでは新人エンジニアとして問題を受け、CODE WORLDではその問題がfantasy worldの異変として見える。

ただし、プレイヤーへ最初から「エンジニアとして知っていて当然」の言葉を要求しない。

優先順位は次。

1. code readingがgame decisionになっている
2. コード未経験者でもStoryと会話の意味が分かる
3. fantasy RPGとして探索・戦闘・成長が楽しい
4. REAL WORLDとCODE WORLDの問題が同じ原因につながる
5. RPG成長がcode readingを代替しない

Office simulatorにも、programming用語だけの世界にも、code quizを置いただけのfantasy mapにも寄せ切らない。

---

## 2. 世界は二層構造

```text
REAL WORLD
何かがおかしい / 困っている、という短い依頼を受ける
        ↓ CONNECT
CODE WORLD
software / data / runtimeがfantasy worldとして見える
        ↓
探索 / 村 / NPC / Treasure / Battle / Boss
        ↓
世界のruleであるcodeを読んで原因へ近づく
        ↓ RETURN
REAL WORLD
何が起きていたかを平易な言葉で確認する
```

### REAL WORLD

役割は**「なぜこのコードを見るのか」だけを短く与えるframing layer**。

専門語を知っていることを前提にしない。

悪い例:

> target selectionのshared processingにregressionがある。root causeを調査して。

良い例:

> 攻撃が、ときどき狙った相手と違う敵へ飛んでいる。どこで相手を決めているのか見てほしい。

必要なら後から、

> こういう「誰を対象にするか」をtarget selectionと呼ぶ。

のように正式名称を添える。

REAL WORLDを歩き回るoffice simulation、Slack操作、ticket管理、長いmeetingはmain gameplayにしない。

### CODE WORLD

CODE WORLDはsoftware / data / runtimeを、人間が理解できるfantasy worldとして見たもの。

そのため、

- 草原
- 森
- 村
- 遺跡
- 地下空間
- 城塞
- monster
- Treasure
- Gold
- Equipment
- Shop
- Inn

が普通に存在してよい。

すべてをengineering metaphorへ置き換えない。

---

## 3. codeは世界のrule

表示codeは単なる魔法演出ではなく、世界で実際に、

- 誰がtargetになるか
- 何が残るか
- どの順番になるか
- どのstateが変わるか
- どのeffectが起きるか

を決めるrule。

例:

```js
enemies.find((enemy) => enemy.hp < 50)
```

複数のmonsterが実際に存在し、プレイヤーは現在のHPを見てどのmonsterへruleが作用するか判断する。

内部logicはsafeな`TargetRule`等で解決し、表示codeを`eval()`しない。

### fantasy representationと学習対象を一致させる

```text
Enemy[]
→ field / battle上のmonster group

row
→ Database regionのrecord / object

request
→ region間を移動するmessage / cargo / entity

component tree
→ UI regionを構成する階層的なstructure
```

ただしtechnical dataを何でもmonsterへ変換する必要はない。ゲームとして分かりやすいことと、コードとして正しく読めることを両方優先する。

---

## 4. 初心者へコードを説明する順番

Story / NPC / CODE HELPは、**答えを教えずに読み方を教える**。

新概念は原則として次の順番で導入する。

```text
1. まず普通の言葉で何が起きるか説明
2. 記号や1つの式を見る
3. codeの部品名 / syntaxの意味を説明
4. 現在のdataへ自分で当てはめてもらう
5. 慣れてから正式なtechnical termを添える
```

例:

```js
enemy.hp < 50
```

> `<` は「左の数字が右より小さいか」を見る記号だ。
> ここでは「HPが50より少ないか」を見ている。

その後に、

```js
enemies.find((enemy) => enemy.hp < 50)
```

> `enemies` は敵たちの集まり。`find()`は前から見て、条件に合うものを1つ探す。

まで進める。

ここで「だからSlimeが正解」とは言わない。現在値からtargetを決める部分はPlayerに残す。

### 役割分担

- Story / NPC: 初登場概念を会話として噛み砕く
- CODE HELP: 後から読み方を確認する
- CODE DATA: 現在値 / 中間値を確認する
- Battle: 自分で適用して結果を予測する

Storyを教材テキストの読み上げにはしない。

---

## 5. REAL WORLDとCODE WORLDは同じ問題

同じsystem problemを違う言葉で見せる。

| REAL WORLD | CODE WORLD |
| --- | --- |
| 攻撃対象がずれる | 技が意図しないmonsterへ飛ぶ |
| 一部の設定値がない | 一部の装置だけ値を失って動かない |
| dataを探すのが遅い | 地下書庫からrecordを探すのに時間がかかる |
| 送られるdataの形が変わった | region間のmessageが途中で変形する |
| 表示だけ古い | 街の表示だけ昔のstateを残している |

まず普通の言葉で理解できる症状を出し、必要な場面でだけtechnical termへ接続する。

---

## 6. Region identityを使い切らない

各技術編は学習contentであると同時に、CODE WORLDの異なる地方。

最初のJavaScriptだけで草原・森・洞窟・遺跡・城塞・雪山などを使い切らない。

大きなvisual categoryを後の編へ残し、**新しい技術編へ進んだ瞬間に景色そのものが変わる**ことを大事にする。

現在の方向性:

| 編 | CODE WORLD表現 | 主に感じさせたいもの |
| --- | --- | --- |
| JavaScript | 草原 → 林 → 森 → 深い森 / 川辺 / 自然の村 | value / object / array / runtime ruleの基本 |
| TypeScript | 石造道 / crystal / rune / ruins / temple系 | type / optional / union / contract |
| Database | underground archive / mine / library | table / row / relation / query |
| Backend / API | gate city / road / port / network | request → processing → response |
| React | machine city / living UI district | component / state / render |
| Next.js | server citadel / layered city | server / client boundary / routing / cache |
| TanStack | route network / terminal district | route / loader / cache / invalidation |
| Team Development | workshop / release facility | diff / test / CI / delivery |
| Security | fortress / guarded boundary | trust boundary / permission / validation |
| Production / Performance | observatory / control tower | logs / metrics / latency / incident |
| Architecture / Refactoring | old capital / legacy ruins | dependency / boundary / migration |

### JavaScript地方

JavaScriptは**自然の中を奥へ進む地方**として統一する。

```text
Central Hub
↓
開けた草原
↓
林 / 川辺
↓
村
↓
森
↓
深い森
↓
最深部 / Final Boss
```

全部を1枚の巨大gridへ詰め込まない。overworld、村、森などを別mapとして持ってよい。

村へ入ったら村内部mapへ切り替わり、家 / NPC / Shop / Inn / 出口を歩いて利用する、classic JRPG型の遷移を採用できる。

### TypeScript地方

JavaScriptの深い森をそのまま色違いで続けない。

東側へ入ったときに石・柱・結晶・rune・遺構などが増え、**別の地方へ来たことが一目で分かる**方向へ寄せる。

TSを「遺跡そのもの」という比喩に固定はしない。visual identityとして型・構造・制約を薄く感じられればよい。

### Database地方

地下・鉱山・巨大書庫などはDatabase用に温存する。JSで地下dungeonを大量消費しない。

---

## 7. Worldはmulti-mapを前提にする

「Open World = 1枚のgrid」と固定しない。

CODE WORLDは、

```text
Overworld
├─ Village
├─ Forest area
├─ Interior
└─ future Dungeon
```

のように複数mapを行き来できる。

重要なのはmap数ではなく、そこへ行く意味。

新mapには最低1つ、

- Story上の意味
- learning上の意味
- RPG上の意味

を持たせる。

空白を増やすだけの巨大mapにはしない。

---

## 8. Battleの位置づけと回数

Battleはgameplayの中心。

JavaScript編は3戦で終わらせず、最終的に**通常戦闘20〜30回程度**を目安に、同じ概念を異なる盤面で何度も使う。

新しいsyntaxを20〜30個増やす意味ではない。

例:

```text
比較をStory Battleで知る
→ 数回のEncounterでHP / attack / nameなど対象を変えて反復
→ find()を知る
→ find()を数回反復
→ && を追加
→ 中Bossで既習概念を組み合わせる
→ 次の概念へ
```

理想のリズム:

```text
新概念を知る
→ 2〜4戦で慣れる
→ 既習概念と組み合わせる
→ 中Boss / fixed battleで確認
→ 次の地域へ進む
```

Random Encounterは作業量を水増しするために使わない。seed / code variant / enemy state差を使い、読む対象が少しずつ変わることに意味を持たせる。

Bossで初見syntaxを大量投入しない。

---

## 9. Boss

Bossは単にHPの多いmonsterではなく、その区間で追ってきた異変のroot causeを象徴する存在。

JavaScript地方を長くする場合、Final Bossだけでなく中Bossを置いてよい。

- 中Boss: 直前の複数概念を組み合わせて読めるか確認
- Final Boss: 編全体の既習概念を複数行で追う

新しい概念の説明は道中で済ませる。

---

## 10. NPC / Story dialogue

### CODE WORLD NPC

village resident / traveler / shopkeeper / companion等は普通のfantasy worldの住人として話す。

必ずしもエンジニアではない。

悪い例:

> shared target resolverのconditionが壊れている。

良い例:

> 最近、技が弱っている魔物を狙わず、別のやつへ飛んでいくんだ。

BYTE等、コードを説明する役割のcharacterも、まず普通の言葉から入る。

### REAL WORLD NPC

必要なtechnical termは使ってよいが、初登場時は言い換えを添える。

> 送られてくるdataの形の約束――API contractが変わったみたいだ。

のように、意味を理解してから名前を知れる順番を優先する。

---

## 11. Storyの粒度

各編で先に決めるもの:

1. 最初に何がおかしいと分かるか
2. 初心者の言葉ならどう説明するか
3. CODE WORLDでは同じ問題がどう見えるか
4. どのRegion / mapを通るか
5. 何のcode / dataを読むか
6. どの順番で概念を覚え、何回反復するか
7. 中Boss / Bossで何を組み合わせるか
8. Final後に何が直ったと分かるか
9. 必要なtechnical termをいつ正式名称として紹介するか

詳細台詞は実装Issueで調整する。

---

## 12. Opening / CONNECT

最初の導入は、エンジニア知識の説明ではなく世界の遊び方を理解させる。

```text
普通の言葉で問題を聞く
↓
CODE WORLDへCONNECT
↓
fantasy fieldへ入る
↓
簡単な比較式を見て「codeがworld rule」だと体験
↓
少しずつ正式なsyntax名へ進む
```

長いcutsceneを目的にしない。

---

## 13. Treasure / Item / Equipment / Gold / Inn

これらはCODE WORLDのfantasy RPG systemとしてそのまま存在してよい。

Goldを給与やcloud creditへ、InnをCI pipelineへ変換しない。

Equipmentは剣 / armor / charm等でよい。技術要素は名前や説明へ薄く混ぜる程度にする。

RPG systemは探索や準備を楽しくするために使い、codeの正解targetを変えない。

---

## 14. Companion / Party

PartyはRPGとして、

- 戦闘上の役割
- World上の同行感
- Story上の関係

を作る。

correct targetを自動判定しない。

BYTEは「初心者へコードを翻訳する相棒」になってよいが、答えを言うcharacterにはしない。

---

## 15. 既存contentへの適用

### JavaScript

現在のGrasslandを起点として残しつつ、地方を複数mapへ拡張する。

目標は、

```text
草原
→ 林
→ 村
→ 森
→ 深い森
→ 中Boss
→ 最深部
→ Final Boss
```

のように、自然の中を進みながらJavaScriptを段階的に深掘ること。

既存Battle 1〜3は削除前提ではなく、今後の長い進行の中へ再配置 / 再役割化できる。

### TypeScript

現在のlearning内容は活かすが、Story文言を初心者向けへ噛み砕く。

visualはJavaScriptのForest継続ではなく、石造・crystal・rune・ruins等へ明確に切り替える。

### Database

地下 / archive / mine / libraryを候補とし、row / relation / queryのmental modelとfield表現をprototypeで同時検証する。

---

## 16. 段階的な実装

big-bang redesignはしない。

1. docsでmulti-map / beginner-first / Region identityをsource of truth化
2. World stateへcurrent mapを持たせる
3. 最初のVillage mapでoverworld ↔ interior transitionを実証
4. JavaScriptの自然terrainを草原 → 林 → 森へ広げる
5. JSのBattle / Storyを段階的に増やす
6. 中Boss / Final Boss位置と進行を長い地方へ合わせる
7. TypeScript visual / Storyを別identityへ改修

Battle engine / TargetRule / seeded generatorをworldごとに複製しない。

---

## 17. Non-goals

- office map探索をmainにしない
- Slack / ticket / meeting simulatorにしない
- fantasy要素を全部engineering metaphorへ変えない
- 最初からtechnical jargonを理解させることを目的にしない
- mapを広げるだけで空白を増やさない
- Random Encounter回数だけ増やして作業化しない
- Storyが答えのtargetを教えない
- RPG成長でcode readingを飛ばせるようにしない

---

## 18. Content checklist

新しいStory / Region / Battle / mapを作る前に確認する。

1. コード未経験者が会話の意味を理解できるか
2. technical termを普通の言葉より先に出していないか
3. Storyは読み方を教え、答えまでは教えていないか
4. CODE WORLDの異変とREAL WORLDの問題が同じ原因か
5. Regionの景観を前の技術編で使い切っていないか
6. 新mapへ行くlearning / story / RPG上の意味があるか
7. 新概念を道中で反復してからBossへ出しているか
8. 同じ概念でも盤面 / 値 / code variantを変えて読ませているか
9. codeがworld ruleとして実際のtarget / effectを決めているか
10. RPG systemがcode readingを代替していないか
11. current World / Battle / save基盤を不要に複製していないか
12. fantasy RPGとして普通に冒険したくなる構造か

---

## 19. 一文で迷ったとき

> **普通のRPGとして冒険を始められ、世界のルールを読むためにコードを少しずつ覚え、気づいたら自分でJavaScriptを追えるようになっている。**

この状態へ近づく案を優先する。
