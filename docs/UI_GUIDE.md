# CODE//READ RPG UI Guide

## 目的

UIは、RPGの探索とコード読解に必要な情報を優先し、説明のための説明や常設パネルで画面を埋めない。

## 基本原則

- その画面で行動判断に必要な情報だけを常時表示する
- 操作しなくても分かる内容を文章で重ねて説明しない
- 見出し・sub heading・説明文が同じ意味を繰り返す場合は削る
- 設定 / Shop / Codex / CODE DATAは常設panelにせず必要時だけ開く
- Battleではコード・Enemy・Player状態を最優先する
- Mobileでは固定UIを最小化し、Field操作やBattle操作を塞がない

## World Map

常時必要なもの:

- Area名
- availability / clear状態
- Areaの学習themeが分かる短い説明
- ENTER / REVISIT
- Player Level / EXP
- TITLEへ戻る操作

不要なもの:

- 操作を言い換えただけの文
- UIから明らかな説明
- saveや内部システムの説明

## Area / Shop

Area画面ではPlayer summaryにGoldを含める。

Shop導線:

- Area header actionに短い`SHOP` button
- JavaScript / TypeScriptで同じUIを使う
- Gold額をbutton文言へ重複表示しない
- Shopはmodalとして必要時だけ開く
- `Esc` / close / backdropで閉じられる

Shop modalでは現在Gold、商品名、価格、所持数、購入可否だけを優先する。

現在の商品:

```text
PATCH KIT
30 G
最大24 HP回復
1 Battle 1回
```

長いRPG説明やItem loreは初回実装では追加しない。

## Battle

常時必要なもの:

- Battle / Stage情報
- Player HP / Level
- Enemy HP / NEXT行動
- Skill名 / POWER / code
- 選択中Skillの`EXECUTE`状態
- 実際に発生したBattle Log

PATCH KITは所持時だけcompact actionとして表示する。

- `PATCH KIT ×N · +24 HP`
- HP満タン / resolving中 / 使用済みならdisabled
- 使用後は短い`USED THIS BATTLE`
- Item未所持なら空のItem欄自体を出さない

表示しないもの:

- 操作見出しや常設手順説明
- target / correct / damage preview
- 空Logへのtutorial文
- Itemによる正解Enemyの示唆

操作説明が必要な場合も、現在状態に直接ひもづく短いfeedbackを優先する。

## CODE DATA

コードを読むために必要なruntime dataを確認する補助UI。

- `enemies`などsource data
- code内で作られる中間値
- Enemy objectの現在値

を確認できるが、最終target / correctは表示しない。

詳細は`docs/CODE_DATA.md`をsource of truthとする。

## Code Codex

Codexは内容自体が説明なので、外側の説明文を増やさない。

- JavaScript / TypeScript tabs
- concept / summary / code / note
- 常設toggleは小さくする

## Quest

常設部分は`QUEST` toggleだけにする。

Quest Logを開いた時:

- Main Quest
- 解放済みSide Quest
- status / objective / reward

を表示する。

Side QuestはLOCKED中はpanelにも出さない。Battle中はQuest Trackerを表示せず、完了時だけ短いfeedbackを一時表示する。

## Sound Settings

BGM / SE slidersを常時表示しない。

通常時は小さい`SOUND` buttonだけを表示し、押した時だけMute / SE volume / BGM volumeを開く。

## Tutorial

Tutorialは初回Playerが操作を始めるための一時UIであり、常設説明の代替として使う。

- 初回だけ
- MOVE / INTERACT / SELECT / EXECUTEの必要な瞬間だけ
- 既存UIの実操作で進む
- 全画面backdropで操作を塞がない
- SKIP可能
- 正解Skill / Enemyをhighlightしない
- Mobile操作を覆わない
- 完了後は説明を残さない

詳細仕様は`docs/TUTORIAL.md`をsource of truthとする。

## 文言を追加する基準

新しい文言は、次のどれかに当てはまる場合だけ追加する。

1. Playerが次の操作を判断できない
2. 学習上の誤解を防ぐ
3. RPG上の状態変化を伝える
4. Accessibility上必要

単に機能を説明するだけの文は、UIから理解できるなら追加しない。
