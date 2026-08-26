# CODE//READ RPG UI Guide

## 目的

UIは、**Open World探索とコード読解に必要な情報を優先し、常設panelや説明文で画面を埋めない**。

全体設計は`docs/OPEN_WORLD_DESIGN.md`に従う。

## 基本原則

- その瞬間の判断に必要な情報だけを常時表示する
- EXP / Gold / Equipment / Partyなどの詳細はPauseへ寄せる
- Tutorialと同じ操作説明を常設しない
- UIから明らかな内容を文章で重ねない
- 正解target / 正解Skill / damage previewを表示しない
- Mobileでは固定UIを最小化する
- 状態変化は短い一時feedbackを優先する

## Open World

常時表示してよいもの:

- 現在region
- 11×9 viewport
- terrainから分かる探索context
- short FIELD LOG
- D-Pad / INTERACT
- 小さいMENU / CODEX / SOUND導線

常時表示しないもの:

- Level / EXP / Gold
- Equipment一覧
- Party詳細
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

PauseはRPG情報の主な確認場所。

Tabs:

```text
STATUS
ITEMS
EQUIPMENT
PARTY
SYSTEM
```

### STATUS

- Level
- EXP / next level
- Gold
- Max HP
- Attack
- Defense
- World Objective（導入後）

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

### SYSTEM

- Reset Progress
- 設定への最小案内

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

## Code Codex

Codex自体が説明UIなので外側の説明を増やさない。

- JavaScript / TypeScript tabs
- concept / summary / code / notes

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
- Battleではselected Skill DOMを観測
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
