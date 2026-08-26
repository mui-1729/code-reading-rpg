# CODE//READ RPG UI Guide

## 目的

UIは、RPGの探索とコード読解に必要な情報を優先し、説明のための説明や常設パネルで画面を埋めない。

## 基本原則

- その画面で行動判断に必要な情報だけを常時表示する
- 操作しなくても分かる内容を文章で重ねて説明しない
- 見出し・sub heading・説明文が同じ意味を繰り返す場合は削る
- 設定は常設panelにせず、必要な時だけ開く
- Quest / Codexなど補助UIは小さいtoggleから開く
- Battleではコード・Enemy・Player状態を最優先し、補助UIを重ねない
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

- `Choose the next region.`のような操作を言い換えただけの文
- 「Areaを選べる」「攻略済みに戻れる」などUIから明らかな説明
- saveや内部システムの説明

## Code Codex

Codexは内容自体が説明なので、外側の説明文を増やさない。

表示するもの:

- title
- JavaScript / TypeScript tabs
- concept数
- concept / summary / code / note

常設toggleは小さくし、詳細は開いた時だけ表示する。

## Main Quest

Quest内容・step・progressは維持する。

常設部分では、

- `QUEST`
- clear数
- shortcut

程度に抑える。Panelを開いた時にQuest本文とstepを表示する。

## Sound Settings

BGM / SE slidersを常時表示しない。

通常時は小さい`SOUND` settings buttonだけを表示し、押した時だけ次を開く。

- Mute
- SE volume
- BGM volume

`Esc`またはbackdropで閉じられるようにする。

## 文言を追加する基準

新しい文言は、次のどれかに当てはまる場合だけ追加する。

1. Playerが次の操作を判断できない
2. 学習上の誤解を防ぐ
3. RPG上の状態変化を伝える
4. Accessibility上必要

単に機能を説明するだけの文は、UIから理解できるなら追加しない。
