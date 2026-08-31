# CODE//READ RPG UI Guide

## 目的

UIは、**Open World探索とコード読解に必要な情報を優先し、常設panelや説明文で画面を埋めない**。

全体設計は`docs/OPEN_WORLD_DESIGN.md`に従う。

## 基本原則

- その瞬間の判断に必要な情報だけを常時表示する
- EXP / Gold / Equipment / Party / Codex / Sound設定などの詳細はPauseへ寄せる
- Tutorialと同じ操作説明を常設しない
- UIから明らかな内容を文章で重ねない
- 正解target / 正解Skill / damage previewを表示しない
- Mobileでは固定UIを最小化する
- 状態変化は短い一時feedbackを優先する
- **Battleではcode panelより先に「誰と・どこで戦っているか」が視覚的に読めること**

## Open World

常時表示してよいもの:

- 現在region
- 11×9 viewport
- terrainから分かる探索context
- short FIELD LOG
- D-Pad / INTERACT
- 小さいMENU導線

常時表示しないもの:

- Level / EXP / Gold
- Equipment一覧
- Party詳細
- Codex
- Sound設定
- 長いQuest Tracker
- encounter確率
- 「草むらを歩くと敵が出ます」のような繰り返し説明

terrain自体で学習regionを理解できることを優先する。

```text
JavaScript = grass / tall-grass
TypeScript = forest
Hub / road = safe zone
```

Boss / Shop / NPCはtile上のobjectとして短く識別できればよい。

## World Progress

Open WorldではStage Selectがないため、進行方向は必要。ただし常設Quest HUDへ戻さない。

方針:

- Pause STATUSにWorld Objectiveを表示
- Battle victory時のみ短いprogress feedback
- Boss解放時は分かりやすく伝える
- 具体的な正解code / targetは教えない

例:

```text
JAVASCRIPT GRASSLAND 2 / 3
NEXT: 西のBOSSへ
```

## Pause

PauseはRPG情報・学習参照・設定の主な確認場所。

Tabs:

```text
STATUS
ITEMS
EQUIPMENT
PARTY
CODEX
SYSTEM
```

### STATUS

- Level
- EXP / next level
- Gold
- Max HP
- Attack
- Defense
- World Objective

### ITEMS

所持数と用途を短く表示する。

### EQUIPMENT

- current loadout
- owned equipment
- bonus
- equip / unequip

装備比較のためだけにWorld HUDへAttack/Defenseを出さない。

### PARTY

- Leader
- joined member
- member role / base stats

Partyが正解targetを自動で示すような説明はしない。

### CODEX

既存のJavaScript / TypeScript学習参照をPause内で表示する。

- JavaScript / TypeScript tabs
- concept / summary / code / notes
- 独立した常設CODEX button / overlay / shortcutは持たない

Codex自体が説明UIなので外側の説明を増やさない。

### SYSTEM

- Sound ON / OFF
- SE volume
- BGM volume
- Reset Progress

Sound設定は独立した常設button / modalを持たせず、SYSTEMへ一本化する。音量変更は即時反映し、reload後も保持する。

AudioContextの初回unlockだけはTitleを含む最初のuser gestureで行うが、これは表示UIを持たない。

## Battle

常時必要なもの:

- Battle情報
- Player HP / Level
- Enemy HP / NEXT
- Skill名 / POWER / code
- SELECT / EXECUTE状態
- 実際に起きたBattle Log

Equipment / Partyの効果:

- POWER表示にはPlayer側damage補正を反映してよい
- Enemy NEXTにはDefense反映後の被damageを表示してよい
- Party follow-upは小さい補助行で表示する

ただしTargetRuleの答えを先に見せない。

### RPG-first Battle visual grammar

Battleを「暗いpanel上にcode cardを並べた画面」にしない。Playerがcodeを読む前に、最低限次を判別できることを基準にする。

```text
WHERE   どのRegion / 場所で戦っているか
WHO     Enemyのsilhouette / role / Boss identity
DANGER  normal / incident / training / Bossのどれか
STATE   HP / NEXT / Guardなど、現在の盤面
RULE    その後でSkill codeを読む
```

scene identityはBattleごとにpresentation layerで解決し、学習logicや`TargetRule`へvisual条件を混ぜない。

現在のBattle scene系統:

| Scene | Visual cue | Audio cue |
| --- | --- | --- |
| Overworld incident | open grassland / distant ridge | base Battle |
| Village training | training yard / fence / house silhouette | base Battle |
| JavaScript Forest | dense green canopy / trunks | Forest Battle |
| JavaScript Deep Forest | dark roots / corrupted natural tones | Deep Forest Battle |
| TypeScript Frontier | stone/crystal / geometric grid | TypeScript Battle |
| JavaScript Final | organic corrupted Code Core | JS Final Boss |
| TypeScript Final | geometric crystal contract vault | TS Final Boss |

最低でも、**ForestとTypeScript、通常戦とBossはscreenshotだけで区別できる**こと。

### Enemy identity

- Enemy visualは表示名の1文字glyphだけへ依存しない
- Sprout / Boar / Guardian等はsilhouetteとpaletteでroleを判別できるようにする
- Final Bossはgeneric `Boss` spriteを使い回さない
- JS FinalとTS Finalを単なるpalette swapにしない
- Player / joined PartyはBattle stage内に存在して見えること

code上のdata nameとfantasy表示名が異なる場合は、fantasy identityを主表示しつつ`CODE NAME`を併記する。これによりRPGとしての固有名を持たせても、CODE DATA / 表示codeとの対応を失わない。

### Boss readability

BossはHP量だけで区別しない。

- arena border / scenery / BGMを通常戦から変える
- Boss silhouetteを通常Enemyより強くする
- Boss Guardは`ACTIVE / OPEN`が敵card上で視覚的に分かる
- Guardの解除条件を答えとして強調しすぎず、現在状態とruleを比較できる形にする

### Mobile

scene decorationはcode readabilityより下位。狭いviewportでは背景decorを弱めてもよいが、以下は残す。

- scene identity
- Boss / normal差
- Enemy HP / NEXT
- Skill code
- SELECT / EXECUTE

背景のためにEnemy cardやcodeを横方向へ押し出さない。

## PATCH KIT

Battle中、所持時だけcompact actionとして表示する。

```text
PATCH KIT ×N · +24 HP
```

- full HP / resolving / usedならdisabled
- 未所持なら空欄を出さない
- target判断へ影響する情報は付けない

## Result Sequence

Victory結果は一気に並べない。

基本順序:

```text
EXP
Gold
Level Up
Skill Unlock
Stage / Area Progress
World Objective Update
```

click / tap / auto advance / skipを維持する。

関連の強い情報だけgroup化する。

## CODE DATA

コード読解に必要なruntime dataだけを確認できる。

- source data
- intermediate value
- selected Enemy object

最終target / correctは表示しない。

詳細は`docs/CODE_DATA.md`。

## Shop

現在の通常ShopはHub上のSHOP objectとのinteraction。

購入時に必要な情報:

- current Gold
- item name
- price
- owned count
- purchase success / failure

旧Area header Shop modalはlegacy UIとして新機能の基準にしない。

## Tutorial

初回だけ:

```text
MOVE
INTERACT
SELECT
EXECUTE
```

- World実座標の移動でMOVE完了
- World object隣接時のINTERACTを案内
- Battleでは共有runtime snapshotからselected Skill / EXECUTEを判断し、DOMはhighlight配置だけに使う
- 正解Skill / Enemyはhighlightしない
- SKIP可能
- RESET PROGRESSで初期化

詳細は`docs/TUTORIAL.md`。

## 文言追加の基準

新しい文言は次のどれかに当てはまる場合だけ追加する。

1. 次の操作・目的を判断できない
2. 学習上の誤解を防ぐ
3. RPG上の状態変化を伝える
4. Accessibility上必要

単に機能を説明するだけなら追加しない。
