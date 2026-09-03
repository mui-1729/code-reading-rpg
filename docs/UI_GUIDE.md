# CODE//READ RPG UI Guide

## 目的

UIは、**Open World探索とコード読解に必要な情報を優先し、常設panelや説明文で画面を埋めない**。

全体設計は`docs/OPEN_WORLD_DESIGN.md`に従う。Player-facing copyの言語判断は`docs/COPY_GUIDE.md`を正とし、ゲームUI・操作・状態・案内は日本語をdefaultにする。

## 基本原則

- その瞬間の判断に必要な情報だけを常時表示する
- EXP / 所持金 / 装備 / 仲間 / コード図鑑 / サウンド設定などの詳細はPauseへ寄せる
- Tutorialと同じ操作説明を常設しない
- UIから明らかな内容を文章で重ねない
- 正解target / 正解Skill / damage previewを表示しない
- Mobileでは固定UIを最小化する
- 状態変化は短い一時feedbackを優先する
- **Battleではcode panelより先に「誰と・どこで戦っているか」が視覚的に読めること**

## Game-wide semantic palette

画面ごとに別themeを作らず、Title / World / Battle / Pauseで色の意味を共有する。

| Role | 基本色 | 用途 |
| --- | --- | --- |
| Base chrome | dark + blue / purple | frame、button、selected、focus |
| Gold | gold | Gold通貨、price、reward、rareなど意味のある強調 |
| Success | green | heal、safe、clear、equipped |
| Danger | red | damage、danger、locked warning |
| Region accent | sceneごとの補助色 | terrain、map frame、背景decorなど地域identity |

- Worldだけを全面的な金・茶paletteにしない
- `gold`を通常frame / 通常buttonへ広げすぎない
- Region色はmap / scene内部へ限定し、常設UI chromeのsemantic colorと混ぜない
- focus / selected / warning / successは画面をまたいで同じ意味で使う
- fantasy textureやframe shapeは維持してよいが、色の意味はgame-wide tokenを優先する
- contrast / focus-visibleを壊さない

## Visual layerの分離

全画面へ同じ黒/neon/monospace skinを掛けない。世界観上の役割に応じてvisual grammarを分ける。ただし**visual grammarの違いとUI paletteの意味は分離する**。

| Layer | 主役 | Visual grammar |
| --- | --- | --- |
| REAL WORLD / system | CONNECT / system framing | terminal / dark / technical / monospaceを使ってよい |
| CODE WORLD exploration | fantasy field / character / terrain | terrain / scene texture / fantasy frame shapeを主役にし、chrome色はgame-wide semantic paletteを共有 |
| CODE WORLD Battle | arena / monster / Player / Party | Region scenery + RPG hierarchy。code cardは下段のrule UI |
| code / runtime data | code / object / intermediate state | monospace / technical contrastを維持 |

CODE WORLDでもtechnical labelを全廃しない。重要なのは、**fantasy worldの全部をterminalへ見せず、codeだけがworld内で異質なruleとして読めるcontrastを作ること**。

### CODE WORLDでfantasyへ寄せる箇所

- World panel / map frameの形・texture
- Region / location title
- Objectiveの外枠形状
- D-Pad / contextual action等のRPG操作chrome形状
- Battle arena
- Enemy / Player / Party
- Boss identity

### technical visualを残す箇所

- Skill code
- コード解説のcode block
- コードデータ / runtime data
- code上のEnemy name
- system/debug用途の小label

fantasy表示名とcode上のnameが異なる場合は、fantasy名を主表示しつつcode上のnameを必要な場所で併記する。

## Open World

常時表示してよいもの:

- 現在region
- 11×9 viewport
- terrainから分かる探索context
- short field log
- D-Pad / contextual action
- 小さいメニュー導線

常時表示しないもの:

- LV / EXP / 所持金
- 装備一覧
- 仲間詳細
- コード図鑑
- サウンド設定
- 長いQuest Tracker
- encounter確率
- 「草むらを歩くと敵が出ます」のような繰り返し説明

terrain自体で学習regionを理解できることを優先する。World外枠やObjective cardはmapより強い黒/neon dashboardにせず、fieldを囲むRPG chromeとして扱う。

```text
JavaScript = grass / tall-grass / woods
TypeScript = stone / crystal / geometric terrain
Hub / road = safe zone
```

Boss / Shop / NPCはtile上のobjectとして短く識別できればよい。Playerが押すactionは`ショップを見る`、`BYTEと話す`、`宝箱を開ける`のようなcontextualな日本語にし、`INTERACT ·`のprefixは付けない。

## World Progress

Open WorldではStage Selectがないため、進行方向は必要。ただし常設Quest HUDへ戻さない。

方針:

- PauseのステータスにWorld Objectiveを表示
- World上は現在の目的だけをcompactに示す
- Battle勝利時のみ短いprogress feedback
- Boss解放時は分かりやすく伝える
- 具体的な正解code / targetは教えない

## Pause

PauseはRPG情報・学習参照・設定の主な確認場所。

Player-facing tabsは以下を正とする。

```text
ステータス
マップ
アイテム
装備
仲間
コード図鑑
設定
```

内部tab id (`status`, `map`, `items`, `equipment`, `party`, `codex`, `system`) は変更しない。headerとsection navigationは固定し、内容だけをscrollする。選択中のsectionをaccessibility stateでも伝え、keyboardで各sectionへ移動できる。

Worldではメニュー中の移動・interactionを止める。Battleでは「行動の合間に確認するメニュー」とし、進行中のanimation / damage timerを途中停止する機能にはしない。resolving中、およびStory / コード解説 / コードデータ / 勝利 / 敗北中には開けない。開ける時点には未完了のturn処理がない。

### ステータス

- LV
- EXP / 次のLVまで
- 所持金
- 最大HP
- 攻撃
- 防御
- 次の目的

### アイテム

所持数と用途を短く表示する。

### 装備

- 現在装備
- 所持装備
- bonus
- 装備変更

装備の変更はWorldで行う。Battleメニューではloadoutとbonusを参照できるが、装備変更はdisabledにする。Battle中の無償な装備変更で威力 / 防御 / 最大HPを変えない。

装備比較のためだけにWorld HUDへ攻撃/防御を出さない。

### 仲間

- 主人公
- 加入済みmember
- member role / Party Rank / 追撃の対象と回数

Partyが正解targetを自動で示すような説明はしない。

### コード図鑑

既存のJavaScript / TypeScript学習参照をPause内で表示する。

- JavaScript / TypeScript tabs
- concept / summary / code / notes
- 独立した常設コード図鑑button / overlay / shortcutは持たない
- TypeScript辺境上のWorldとTypeScript Battleでは、開いたときTypeScriptを初期選択する

コード図鑑自体が説明UIなので外側の説明を増やさない。

### 設定

- サウンド ON / OFF
- SE volume
- BGM volume
- 進行リセット

Sound設定は独立した常設button / modalを持たせず、設定へ一本化する。音量変更は即時反映し、reload後も保持する。

AudioContextの初回unlockだけはTitleを含む最初のuser gestureで行うが、これは表示UIを持たない。

## Battle

常時必要なもの:

- Battle情報
- Player HP / LV
- Enemy HP / 次の攻撃
- Skill名 / 威力 / code
- 選択 / 実行状態
- 実際に起きた戦闘ログ

Equipment / Partyの効果:

- 威力表示にはPlayer側damage補正を反映してよい
- Enemyの次の攻撃には防御反映後の被damageを表示してよい
- Party追撃は小さい補助行で表示する

ただしTargetRuleの答えを先に見せない。

### RPG-first Battle visual grammar

Battleを「暗いpanel上にcode cardを並べた画面」にしない。Playerがcodeを読む前に、最低限次を判別できることを基準にする。

```text
WHERE   どのRegion / 場所で戦っているか
WHO     Enemyのsilhouette / role / Boss identity
DANGER  normal / incident / training / Bossのどれか
STATE   HP / 次の攻撃 / Guardなど、現在の盤面
RULE    その後でSkill codeを読む
```

scene identityはBattleごとにpresentation layerで解決し、学習logicや`TargetRule`へvisual条件を混ぜない。

現在のBattle scene系統:

| Scene | Visual cue | Audio cue |
| --- | --- | --- |
| Overworld incident | open grassland / distant ridge | base Battle |
| グリーンフィールド村 training | training yard / fence / house silhouette | base Battle |
| JavaScriptの森 | dense green canopy / trunks | Forest Battle |
| JavaScript深層の森 | dark roots / corrupted natural tones | Deep Forest Battle |
| TypeScript辺境 | stone/crystal / geometric grid | TypeScript Battle |
| JavaScript Final | organic corrupted Code Core | JS Final Boss |
| TypeScript Final | geometric crystal contract vault | TS Final Boss |

最低でも、**JavaScriptの森とTypeScript辺境、通常戦とBossはscreenshotだけで区別できる**こと。

### Enemy identity

- Enemy visualは表示名の1文字glyphだけへ依存しない
- Sprout / Boar / Guardian等はsilhouetteとpaletteでroleを判別できるようにする
- standard / elite / bossはcard hierarchyでも差を持たせる
- Final Bossはgeneric `Boss` spriteを使い回さない
- JS FinalとTS Finalを単なるpalette swapにしない
- Player / joined PartyはBattle stage内に存在して見えること

code上のdata nameとfantasy表示名が異なる場合は、fantasy identityを主表示しつつcode上のnameを併記する。これによりRPGとしての固有名を持たせても、コードデータ / 表示codeとの対応を失わない。

### Boss readability

BossはHP量だけで区別しない。

- arena border / scenery / BGMを通常戦から変える
- Boss silhouetteを通常Enemyより強くする
- Boss Guardは`ガード中 / ガード解除`が敵card上で視覚的に分かる
- Guardの解除条件を答えとして強調しすぎず、現在状態とruleを比較できる形にする

### Mobile

scene decorationはcode readabilityより下位。狭いviewportでは背景decorを弱めてもよいが、以下は残す。

- scene identity
- Boss / normal差
- Enemy HP / 次の攻撃
- Skill code
- 選択 / 実行

背景のためにEnemy cardやcodeを横方向へ押し出さない。

MobileでもEnemyはsprite・HPバー・次の攻撃を持つRPGのcard表示を維持し、小さなdata行だけにはしない。3体の現在値と選択中codeは近接配置して比較する。Skill一覧はcompactな選択 / 実行操作として残し、全Skillの長いcodeを縦に積まない。Enemyの横scrollに依存せず、name / hp / attackDamageと防御適用後の次の攻撃を区別する。Battle名は維持し、brand名より現在の判断を優先する。

コード解説は選択中Skillを最初に開く（未選択時だけ先頭Skill）。番号はsourceの改行に対応し、狭い画面で折り返したvisual lineとは区別する。コード解説 / コードデータはdialogとしてfocusを閉じ込め、Escapeで閉じた後に起点へfocusを戻す。短い画面ではdialog内をscrollする。

## PATCH KIT

Battle中、Skill選択の後にcompactなsecondary actionとして表示する。

```text
アイテム
PATCH KIT ×N
```

- HP満タン / resolving / 使用済みならdisabled
- 未所持なら`所持なし`とdisabled状態を示す
- target判断へ影響する情報は付けない

## Result Sequence

勝利結果は一気に並べない。

基本順序:

```text
獲得EXP
獲得ゴールド
レベルアップ
スキル解放
ステージ / エリア進行
World進行更新
```

click / tap / auto advance / skipを維持する。

`prefers-reduced-motion: reduce`ではauto advanceを止め、次へ / スキップで読む速度をPlayerが決める。設定の変更にも追従する。

関連の強い情報だけgroup化する。

## コードデータ

コード読解に必要なruntime dataだけを確認できる。

- source data
- intermediate value
- selected Enemy object

最終target / correctは表示しない。

詳細は`docs/CODE_DATA.md`。

## Shop

現在の通常ShopはHub上のSHOP objectとのcontextual actionで開く。

購入時に必要な情報:

- 所持金
- item name
- price
- 所持数
- purchase success / failure

旧Area header Shop modalはlegacy UIとして新機能の基準にしない。

## Tutorial

初回だけ:

```text
移動
アクション
選択
実行
```

- World実座標の移動で「移動」完了
- World object隣接時は実際のcontextual actionを案内
- Battleでは共有runtime snapshotからselected Skill / 実行を判断し、DOMはhighlight配置だけに使う
- 正解Skill / Enemyはhighlightしない
- スキップ可能
- 進行リセットで初期化

詳細は`docs/TUTORIAL.md`。

## 文言追加の基準

新しい文言は次のどれかに当てはまる場合だけ追加する。

1. 次の操作・目的を判断できない
2. 学習上の誤解を防ぐ
3. RPG上の状態変化を伝える
4. Accessibility上必要

単に機能を説明するだけなら追加しない。