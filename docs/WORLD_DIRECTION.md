# CODE//READ RPG — World Direction

この文書は、`CODE//READ RPG`の**現在採用する世界観・テーマ・表現方針**を定義する。

細かなChapter台本、台詞、固有名詞を固定する文書ではない。

今後Story / World / Region / NPC / Boss / visual / RPG systemを追加・変更するときに、**何を目指しているゲームなのか**を判断するためのsource of truthとする。

---

## 1. North Star

`CODE//READ RPG`は、

> **新人エンジニアとして現実側でシステム上の問題を受け、コードから構成されたファンタジー世界「CODE WORLD」へ潜り、コードを読んで世界の異変とシステム障害の原因を解決するRPG。**

として育てる。

重要なのは、

- エンジニアの実務Story
- 草原・森・敵・宝箱・装備・宿などのRPGらしさ
- 実際のコードを読むgameplay

のどれか1つへ寄せ切らず、**3つを同じ理由で存在させること**。

純粋なoffice simulatorにはしない。

同時に、Storyと無関係なfantasy worldへ無理やりコード問題を置くだけにも戻さない。

---

## 2. 世界は二層構造

ゲーム世界を大きく2つのlayerとして扱う。

```text
REAL WORLD
新人エンジニアとして仕事 / incident / 調査依頼を受ける
        ↓ CONNECT
CODE WORLD
softwareが人間に理解できるfantasy worldとして可視化される
        ↓
探索 / NPC / Treasure / Battle / Boss
        ↓
原因を理解・修復する
        ↓ RETURN
REAL WORLD
incidentの解決 / 次の仕事へ
```

### REAL WORLD

役割は**プレイヤーがなぜそのコードを読むのかを与えるframing layer**。

ここで扱うもの:

- 新人エンジニアとしての立場
- team / senior engineer /依頼元
- bug report / incident / task
- 何が起きているか
- どのsystem / regionを調査するか
- 調査後に何が分かったか

REAL WORLDを歩き回るoffice simulationを主gameplayにはしない。

長いmeetingやSlack操作を再現すること自体を目的にしない。

主なplay timeはCODE WORLDに置く。

### CODE WORLD

CODE WORLDは**software / data / runtimeを人間が理解可能な形へ変換したfantasy world**。

そのため、

- 草原
- 森
- 遺跡
- 地下空間
- 城塞
- モンスター
- 宝箱
- Gold
- Equipment
- Shop
- Inn

が存在してよい。

これらを「現実に本当にあるもの」と説明する必要はない。

**softwareをRPGとして認識したときに見える世界**として扱う。

---

## 3. CODE WORLDで最も重要なルール

### codeは世界のrule

コードを単に「魔法っぽい演出」に置き換えるのではない。

表示されているcodeは、その世界で、

- 何がtargetになるか
- どのdataが残るか
- どの順番になるか
- どのstateが変わるか
- どのeffectが発生するか

を決めるruleとして扱う。

例:

```js
enemies.find((enemy) => enemy.hp < 50)
```

CODE WORLDでは、複数のmonsterが実際にfield / battle上へ存在する。

プレイヤーはコードを読み、**現在のstateではどのmonsterへruleが作用するか**を判断する。

内部game logicは従来通りsafeな`TargetRule`等で解決し、表示コードを`eval()`しない。

### fantasy representationと学習対象を一致させる

CODE WORLDの見た目と、プレイヤーが読むdataを完全に別物にしない。

例:

```text
Enemy[]
→ field / battle上のmonster group

row
→ Database regionに存在するrecord / object

request
→ region間を移動するmessage / cargo / entity

component tree
→ UI regionを構成する階層的なmachine / structure
```

ただし、すべての技術用語を強引にmonsterへ変換する必要はない。

**ゲームとして分かりやすい表現と、コードとして正しく読めるdataの両方を優先する。**

---

## 4. 現実の問題とCODE WORLDの異変は同じ原因

各Storyで、REAL WORLDとCODE WORLDへ別々の問題を作らない。

同じsystem problemを違う視点から見せる。

例:

| REAL WORLD | CODE WORLD |
| --- | --- |
| target selectionがおかしい | 攻撃が意図しないmonsterへ飛ぶ |
| optional configが欠ける | 一部の装置だけ値を失って動かない |
| queryが遅い | 地下書庫からrecordを探すのに異常な時間がかかる |
| API responseが壊れる | region間を通るmessageが途中で変形する |
| stale UI | machine cityの表示だけ古いstateを残す |

Storyを書くときは、

> REAL WORLDで報告された問題が、CODE WORLDではどんな異変として見えるか

を最初に決める。

これにより、fantasy partとengineering storyを分離させない。

---

## 5. 草原・森は消さない

現在のJavaScript Grassland / TypeScript Forestを、方向転換のために削除する前提にはしない。

むしろ、

- JavaScript Grassland
- TypeScript Forest

を**CODE WORLD内の技術region**として再解釈する。

「なぜJavaScriptなのに草原なのか」を現実地理として説明する必要はない。

CODE WORLDがsoftwareをfantasy worldとして可視化しているから成立する。

今後visualを改善するときは、ただのgeneric fantasy mapから、**その技術のmental modelを薄く感じられるregion identity**へ徐々に寄せる。

例:

- JavaScript: 開けた草原 / 森。最初にworld ruleを読む場所
- TypeScript: Forest + crystal / rune / typed structure等、型情報を感じるvisual

ただし、現在のterrainを一度全部作り直すbig-bang redesignにはしない。

---

## 6. 技術編とRegion

各「〜編」は学習contentであると同時に、CODE WORLDの異なるregionとして扱う。

Region designでは技術名を背景へ貼るだけではなく、**その技術で何を読むのか**をvisual / object / interactionへ反映する。

以下は方向性のcandidateであり、固有名詞・biomeを固定するものではない。

| 編 | CODE WORLD表現の方向 | 主に感じさせたいもの |
| --- | --- | --- |
| JavaScript | Grassland / Forest | object / array / runtime ruleの基本 |
| TypeScript | Forest / crystal ruins | type / optional / union / contract |
| Database | underground archive / mine / library | table / row / relation / query |
| Backend / API | gate city / road / port / network | request → processing → response |
| React | machine city / living UI district | component / state / render |
| Next.js | server citadel / layered city | server / client boundary / routing / cache |
| TanStack | route network / terminal district | route / loader / cache / invalidation |
| Team Development | workshop / release facility | diff / test / CI / delivery |
| Security | fortress / guarded boundary | trust boundary / permission / validation |
| Production / Performance | observatory / control tower | logs / metrics / latency / incident |
| Architecture / Refactoring | old capital / legacy ruins | dependency / boundary / migration |

Regionを増やすこと自体を目的にはしない。

学習contentが成立したあと、そのmental modelを助けるfield表現を設計する。

---

## 7. Battleの位置づけ

Battleは引き続きこのゲームの中心。

ただしStory上は、単に「monsterを倒すためのcode quiz」ではなく、

> **CODE WORLDで発生している異常へ、現在のcode ruleがどう作用するかを読み解く行為**

として扱う。

現在の、

```text
Enemy state / NEXT
↓
Skill codeを読む
↓
target / effectを予測
↓
SELECT → EXECUTE
↓
実際のstate changeを見る
```

というloopは維持する。

### monsterを残してよい

JavaScript / TypeScript等ではmonsterをそのまま使ってよい。

「技術っぽくするため」だけに、すべてのEnemyを`Request A`や`Object B`へ置換しない。

一方、Database等ではrowそのものを対象として見せた方が理解しやすい可能性がある。

**各編で、fantasy entityとtechnical dataのどちらをfrontに出すと読解が最も自然かをprototypeで判断する。**

---

## 8. Bossの位置づけ

Bossは単に強いmonsterではなく、**そのChapter / 編で追っていた問題のroot causeをCODE WORLD上で象徴する存在**にする。

例の方向:

- Code Core
- Shared Contract / Compiler
- Query Engine
- Gateway
- Render Core
- Build Pipeline

固有名詞はStoryごとに決める。

Boss mechanicは従来通り、HPが多いだけでなくcode / stateを読んで理解できるものを優先する。

Bossを倒すことと、REAL WORLD上のincident原因を理解・解決することが同じprogressになるようにする。

---

## 9. NPC

NPCは2種類いてよい。

### REAL WORLD NPC

- senior engineer
- team member
-依頼元
- reviewer / operator等

役割:

-仕事を渡す
- 現実側のproblem contextを説明する
- CODE WORLDで得た情報を現実のsystemへつなげる

### CODE WORLD NPC

- village resident
- traveler
- shopkeeper
- region固有character
- companion

必ずしもエンジニアではない。

CODE WORLD側から異変を語る。

例:

REAL WORLD:

> target selectionがおかしい

CODE WORLD resident:

> 最近、攻撃が違うmonsterへ飛ぶ

のように、同じ異常を別の言葉で見せられる。

これを使って、教材説明だけのNPCを減らす。

---

## 10. Storyの粒度

この文書では詳細Storyを固定しない。

各編で最低限先に決めるものは次だけ。

1. REAL WORLDで何の仕事 / incidentを受けるか
2. CODE WORLDでは何が異変として見えるか
3. どのRegionを調査するか
4. 何のcode / dataを読む必要があるか
5. Chapterを進むにつれて、局所的な症状からどのroot causeへ近づくか
6. Bossは何を象徴するか
7. Final後、REAL WORLDで何が解決したと分かるか

台詞、細かなscene順、NPC名、個別演出は実装Issueで決める。

---

## 11. Opening / 接続表現

この方向をプレイヤーへ理解させるには、最初の導入が重要。

将来的にJavaScript Openingは、単なるStory introではなく、

```text
新人エンジニアとして最初のtaskを受ける
↓
CODE WORLDへCONNECTする
↓
fantasy fieldへ初めて入る
↓
codeがこのworldのruleであることを体験する
```

という**世界観onboarding**の役割も持たせる。

必要になり得る機能:

- REAL WORLD → CODE WORLDの接続transition
- incident / taskを短く示すbriefing presentation
- first connect専用のvisual / sound feedback
- Final後に現実側へ戻ったことが分かるclosure

ただし長いcutsceneを追加すること自体を目的にしない。

TutorialとStoryを邪魔しない短いpresentationを優先する。

---

## 12. Story event systemへの影響

現在のpre / post battle story eventは再利用する。

今後必要なら、Story eventへconceptとして、

- REAL WORLD framing
- CODE WORLD event
- remote communication

の違いを表現できるようにする。

実装方法は固定しない。

例えば将来的にpresentation metadataを持つ可能性はあるが、世界観のためだけに大きなStory engineを先に作らない。

まず既存modal / result sequenceで十分表現できるか確認する。

---

## 13. Treasure / Item / Equipment / Gold / Inn

これらはCODE WORLDがfantasy RPG worldであるため、そのまま存在してよい。

### Gold

Goldを現実の給与 / cloud credit等へ無理に置き換えない。

CODE WORLD内のRPG resourceとして扱う。

### Equipment

見た目は剣 / armor / charm等のfantasy gearでよい。

名前・説明へ技術要素を薄く混ぜることはできる。

例:

- Debug Charm
- Typed Mail
- Guard Edge

ただし全装備をprogramming用語のpunにする必要はない。

### Item

PATCH KIT等、RPG上の役割が明確な少数itemを使う。

### Shop / Inn

CODE WORLD内のShop / Innとして普通に存在してよい。

現在進めているRPG Economy / Equipment loopは、この世界観と矛盾しない。

むしろ、**現実パートを短く保ちながらCODE WORLDを普通に遊べるRPGにするために重要**。

### Treasure

Gold / Item / Equipmentに加え、必要ならStory上の、

- artifact
- log fragment
- system clue

のような意味を持たせてもよい。

ただし全Treasureを説明文収集gameへ変えない。

---

## 14. Companion / Party

Party memberはCODE WORLDの住人でも、特殊な接続者でもよい。

詳細設定は固定しない。

重要なのは、Party systemをengineering metaphorへ無理に翻訳しないこと。

PartyはRPGとして、

- 戦闘上の選択
- World上の同行感
- Story上の関係

を作る。

code readingのcorrect targetを自動判定する役割にはしない。

---

## 15. この方向で変更・追加する機能

世界観をdocsだけで終わらせず、段階的にcurrent gameへ反映する。

### A. World framing

追加 / 改修候補:

- first task / incident briefing
- REAL WORLD → CODE WORLD CONNECT transition
- Final clear後のREAL WORLD closure
- World Objectiveの文言を「何を調査しているか」と接続

### B. Region identity

追加 / 改修候補:

- JavaScript / TypeScript regionのvisual identity整理
- 技術ごとにterrain / object / landmarkへ意味を持たせる
- Database以降のregion prototypeでmental modelとfield表現を同時検証

既存Mapを全削除して作り直さない。

### C. NPC / Story presentation

追加 / 改修候補:

- REAL WORLD NPCとCODE WORLD NPCの役割分離
- 同じincidentを2つの視点で語るcopy
- 必要ならremote communication表現
- tutorial説明とstory dialogueを分離

### D. Boss / Encounter presentation

追加 / 改修候補:

- Bossをroot causeの象徴として命名 / visual化
- Encounterがincident調査の一部に見えるcontext
- 編によってmonster / record / request等の対象表現を選択できるbattle presentation

Battle resolverをworld themeごとに複製しない。

### E. Visual / Audio

追加 / 改修候補:

- CONNECT / RETURN専用transition
- Regionごとのvisual motif
- real / CODE WORLDの違いが分かる最小限のpresentation
- Equipment / Item visual systemをCODE WORLD側のRPG artとして統一

### F. Content authoring

新しい編を作るIssue template / docsでは、

- REAL WORLD problem
- CODE WORLD symptom
- Region identity
- code / data
- root cause / Boss

を最初に定義する。

---

## 16. 既存実装で残すもの

この方向転換はrebuildではない。

原則そのまま活かす:

- 1つのOpen World
- camera / movement
- JavaScript Grassland
- TypeScript Forest
- Random Encounter
- Fixed Boss
- Treasure
- Shop
- Recovery → Innへの改修方針
- Gold
- Equipment
- Item
- Party
- Battle engine
- `TargetRule`
- seeded variation
- CODE HELP / CODE DATA
- Chapter 1 → Chapter 2 → Final
- story event system
- World Objective
- save migration

**「現実のエンジニアStoryへ寄せるからfantasy systemを消す」ことはしない。**

---

## 17. 既存contentへの適用

### JavaScript編

現在のGrasslandを維持する。

今後Storyを調整するときは、

- REAL WORLDで新人エンジニアが最初のbug調査を任される
- GrasslandはJavaScript systemをCODE WORLDとして見たregion
- monsterの異変と現実側bugを同じproblemへつなぐ
- FinalのCode Coreをroot causeとして見せる

というframingを強化する。

詳細Storyを今この文書で書き直さない。

### TypeScript編

現在実装済みの、

- API contract incident
- optional / unionへの波及
- Shared Contract / Frontier Compiler

というEngineer Storyの骨格は利用できる。

今後は、それをCODE WORLD側の、

- Forestの異変
- type / contractを感じるregion表現
- root cause entity

へ自然につなぐ。

### Database編

Database prototypeではBattle mechanicだけでなく、

- rowをmonsterのように見せるか
- record / cardとして見せるか
- underground archive等のfield representationが読解を助けるか

も検証する。

Database以降の編を作る前例になるため、**technical modelとfantasy representationを同時にprototypeする最初の編**として扱う。

---

## 18. 実装順への影響

現在進めるRPG Economy / Equipment loopを止めない。

```text
RPG Economy / Equipment
#180〜#184
↓
World framing pass
Opening / CONNECT / Story context / Region identityの最小実装
↓
Database prototype
Battle + CODE WORLD representationを同時検証
```

理由:

- Equipment / Gold / InnはCODE WORLD側でそのまま必要
- world directionを理由に既存RPG基盤を作り直す必要がない
- Database region追加前に二層構造を最低限プレイヤーへ伝えられる方が、新region設計の基準が明確になる

World framing passの具体Issueは、RPG Economy実装との競合を見て分割する。

---

## 19. Non-goals

### Office simulatorにしない

- office map探索
- Slack再現
- meeting simulation
- ticket管理そのもの

をmain gameplayへしない。

必要ならshort framingとして使う。

### fantasyを捨てない

- 草原を全部server roomへ変える
- monsterを全部process cardへ変える
- Goldをcloud creditへ変える
- InnをCI pipelineへ変える

など、全RPG要素をengineering metaphorへ変換しない。

### programming jargonだけの世界にしない

名前の面白さよりgame readabilityを優先する。

### 詳細Storyを早く固定しない

世界観とテーマは固定しても、

- 人物
- 台詞
- incident詳細
- region固有名

は各編を実装するときに調整できる余地を残す。

### code readingを薄めない

世界観を強くしても、最終的なgameplayは、

> **表示されたコードと現在stateを読んで何が起きるか判断する**

ことが中心。

---

## 20. Content checklist

新しいStory / Region / Battleを作る前に確認する。

1. REAL WORLDで何が起きているか
2. なぜ新人エンジニアが調査するのか
3. CODE WORLDでは同じ問題がどう見えるか
4. Regionのfantasy表現は学習対象のmental modelと邪魔し合っていないか
5. プレイヤーは何のcode / dataを読むか
6. codeがworld ruleとして実際のtarget / effectを決めているか
7. NPCは教材説明だけでなくworld側の異変を伝えているか
8. Bossはroot causeを象徴しているか
9. RPG systemがcode readingを代替していないか
10. REAL WORLDとCODE WORLDのどちらか一方だけでStoryが完結していないか
11. 現在のOpen World / Battle基盤を不要に複製していないか
12. 「エンジニアだから」を理由にRPGの面白さを消していないか

---

## 21. 一文で迷ったとき

今後方向性に迷った場合は、次へ戻る。

> **現実では新人エンジニアとして問題を追い、CODE WORLDではfantasy RPGを遊び、その2つを実際のコードが同じsystemとしてつないでいる。**

この3要素が同時に成立する案を優先する。
