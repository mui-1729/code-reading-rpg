# Character Bible

この文書は `CODE//READ RPG` の主要キャラクターを「教材の説明役」ではなく、関係性と弱さを持つRPGキャラクターとして維持するための基準です。

## 共通ルール

- キャラクター会話は、現在のBattleの正解target・正解Skill・正解件数を先に言わない。
- syntaxの定義そのものはCODE HELPへ寄せる。会話は「何を見ているか」「なぜ一緒に進むか」「誰がどう変化したか」を優先する。
- 技術語を使う場合も、キャラクターの目的や感情から自然に出る量に留める。
- CODE WORLDの普通の住人までエンジニア口調にしない。
- 関係性の変化は長い説明ではなく、言葉の任せ方・距離感・再訪会話で見せる。
- visual identityはpaletteだけに依存しない。小サイズ・grayscaleでも silhouette / accessory / posture のどれかで主要人物を見分けられる状態を保つ。

## PLAYER / Code Knight

- **役割**: REAL WORLDからincident調査へ入る新人エンジニア。プレイヤーの投影先。
- **出自**: REAL WORLD。
- **一人称**: 固定しない。台詞を持たせ過ぎず、プレイヤーの解釈余地を残す。
- **話し方**: 原則として選択・行動で表現する。
- **大事にするもの**: 分からないことを分かったふりせず、現在のstateとcodeを確かめること。
- **強み**: 他人の仮説に急かされず、読む順番を自分で決められる。
- **弱み**: 経験が浅く、最初は何から見ればよいか分からない。
- **恐れ / conflict**: 「知識が足りない自分がチームの足を引っ張るのでは」という不安。
- **関係性**:
  - ADAからは「止まれる新人」として選ばれる。
  - BYTEとは、案内される側から判断を任される相棒へ変化する。
  - MIOからは、教え込む対象ではなく現場へ戻すべき旅人として扱われる。
  - WARDENからは外から来た観察者として信頼される。
- **JavaScript arc**: 現場を見る → 必要な読み方だけ補う → 自分の順番でtraceを追う → Code Core判断を任される。
- **Visual identity**: Code Knightのhelmet、縦長のfield silhouette、武器を持つadventurer shape。同行NPCより「PLAYERの鎧」を先に認識できること。
- **Never**: 「全部理解してから進める完璧な天才」にしない。正解を知っている前提の台詞を持たせない。

## BYTE

- **役割**: DEBUGGER。ログやtraceを見つけ、Code Knightと一緒に現地を走る相棒。
- **出自**: CODE WORLDを主な居場所にしつつ、Connectorを通してREAL WORLDのincident monitorにも姿を出せるdebug companion。
- **一人称**: **僕**。
- **話し方**: 好奇心が先に出る、少し早口。親しみやすい。断定より「見よう」「確かめよう」を使う。
- **大事にするもの**: traceを見失わないこと、一緒に現場を見ること。
- **強み**: 異常やログのつながりを見つけるのが速い。
- **弱み**: 怪しいものを見つけると、相手より先に仮説や答えを決めたくなる。
- **恐れ / conflict**: 自分が先走ることで、仲間の判断を奪ったり、別の可能性を見落とすこと。
- **関係性**:
  - PLAYER: 「案内する新人」から「判断を任せられる相棒」へ。
  - MIO: 昔から先走る癖を知る相手。注意されると少し照れる。
  - ADA: debug能力を評価されているが、答えを急ぐ癖も見抜かれている。
  - WARDEN: 性格は対照的。BYTEの騒がしさが、WARDENの慣れによる見落としを崩す。
- **JavaScript arc**:
  1. **Early** — 「一緒に見よう」。PLAYERを導きながら、自分も仮説へ走らないよう同行を求める。
  2. **Middle** — 「どこから読む？」。説明する前にPLAYERの読み順を聞く。
  3. **Late** — 「……任せた」。trace監視は続けるが、最後の判断をPLAYERへ渡す。
- **Visual identity**: 小柄なdebug companion。conversation portraitでは右上へ伸びるantennaと片側のdebug lensを持つ。field sprite流用だけで顔を済ませない。
- **Never**: **「俺」「〜ぜ」口調にしない**。歩くCODE HELPにしない。Battleの正解targetを先に指示しない。

## TRAINER MIO

- **役割**: GREENFIELD VILLAGEのguide。現場で引っかかった旅人が、一度足を止められる場所を守る。
- **出自**: CODE WORLD / Greenfield Village。
- **一人称**: 私。
- **話し方**: 穏やかで短い。相手が一つ読めたら、次へ進ませる。BYTEには少し姉のような遠慮のない言い方もする。
- **大事にするもの**: 一度に一つ確かめること、学んだ人をいつまでもTrainingへ閉じ込めないこと。
- **強み**: 相手が本当に詰まった一点を見つけて小さくできる。
- **弱み**: 心配すると安全な場所へ留めたくなる。
- **恐れ / conflict**: 旅人が分からないまま先へ走り、昔のBYTEのように一人で抱え込むこと。
- **関係性**:
  - BYTE: 先走る癖を昔から知る。からかえる程度に長い付き合い。
  - PLAYER: 生徒ではなく、必要な準備が済めば森へ送り返す旅人。
- **JavaScript arc**: 初回incident後に不足だけ補う → Training完了後は「もう戻らなくていい」と送り出す → Area clear後に二人の変化を迎える。
- **Visual identity**: 頭頂の高いbunと首元の明るいscarf。field / portraitの両方で同じ縦方向のsilhouetteを残す。
- **Never**: ずっとsyntax授業を続ける教師にしない。PLAYERをForestへ進ませない理由を作らない。

## LEAD ADA

- **役割**: REAL WORLD開発チームのSenior Engineer / incident lead。
- **出自**: REAL WORLD。
- **一人称**: 私。
- **話し方**: 簡潔で責任を引き受ける。必要以上に熱血ではない。
- **大事にするもの**: 観測した事実、root causeまで追う責任、分からない状態を隠さないこと。
- **強み**: 複数の情報を集めて調査を進める判断力。
- **弱み**: 責任者として失敗を自分の中に抱え、機能的な指示だけで済ませがち。
- **過去の失敗**: 目の前の症状だけを急いで塞ぎ、別の場所へ問題を押し出した経験がある。
- **恐れ / conflict**: 急ぐことで同じ失敗を繰り返すこと。
- **関係性**:
  - PLAYER: 知識量より「分からないところで止まれる」点を見て選んだ新人。
  - BYTE: 発見の速さを信頼しつつ、仮説を急ぐ癖も把握している。
  - MIO: BYTEを現場へ戻せる相手として信頼している。
- **JavaScript arc**: 仕事を渡す上司 → 遠隔で事実を照合するlead → 自分の失敗を開示し、二人の判断を信頼するlead。
- **Visual identity**: 左へ重い非対称hair、右耳のheadset / mic、角張ったshoulder line。MIOのbunやWARDENのhoodと頭部外形を共有しない。
- **Never**: PLAYERを交換可能な作業員として扱わない。毎回Objectiveだけ話す人に戻さない。

## TYPE WARDEN

- **役割**: TypeScript Frontierの境界を守るWarden。地域そのものの継続性を守る人物。
- **出自**: CODE WORLD / TypeScript Frontier。
- **一人称**: 私。
- **話し方**: 落ち着いた硬めの口調。BYTEより言葉数が少ないが、敵対的ではない。
- **大事にするもの**: 境界・contract・帰り道を保つこと。
- **強み**: 長く同じ場所を守り、異変中も道を維持できる。
- **弱み**: 見慣れた景色を「いつものもの」として疑いにくくなる。
- **恐れ / conflict**: 守ることと、外から来たものを閉め出すことを混同すること。
- **関係性**:
  - PLAYER: 外から来た視点を持つ調査者として信頼する。
  - BYTE: 騒がしいが、慣れを壊して異変を言語化できる点を認める。
- **TypeScript arc**: 調査を案内する守人 → 自分の慣れによるblind spotを認める → Frontier Compiler戦では帰路を守り、判断を二人へ渡す。
- **Battle 6との関係**: **TYPE WARDEN本人はBossではない。Battle 6の敵対objectは `FRONTIER COMPILER`。**
- **Visual identity**: 尖ったhoodと左右へ張る大型pauldron / cloak。人型portraitの通常hair＋shirt silhouetteへ戻さない。
- **Never**: WARDEN自身をBattle 6のmonster/bossとして表示しない。突然PLAYERへ敵対させない。

## Visual identity review rule

主要characterの造形は、色を外しても最低1つのstrong cueを残す。

| Character | grayscale / small-size cue |
| --- | --- |
| PLAYER | helmet + armed knight silhouette |
| BYTE | antenna + asymmetric debug lens + small companion shape |
| MIO | high bun + scarf |
| ADA | asymmetric swept hair + headset / mic + square shoulders |
| WARDEN | pointed hood + oversized pauldrons / cloak |

- ADA / MIO / WARDENを同一rect配置のpalette swapにしない。
- conversation portraitを24px前後へ縮小しても、頭部外形かaccessoryのどちらかが残ること。
- 新しい主要character追加時はrole / voiceだけでなくsilhouette差をreviewする。
- `src/rpg/characterVisualIdentity.test.ts`は色値を無視したportrait rect signatureの重複を検出する。asset変更時はこのtestを弱めず、意図したmotifへ更新する。

## Ordinary residents / optional threads

Greenfield VillageやFrontierには、main questを進めない普通の住人を置く。

- 会話は食事、天気、森の音、旅、休息などを含んでよい。
- Area clear後などに短く反応が変わり、「世界が戻った」ことを住人視点で見せる。
- `storyThread` は将来の小さなside conversation / side questへ伸ばせる識別子として使う。
- optional NPCとの会話をmain progressionの必須条件にしない。
