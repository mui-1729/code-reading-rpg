# CODE//READ RPG Copy Guide

## 基本方針

プレイヤー向けUIは**日本語を基本**にする。英語は雰囲気作りのために広げず、学習・RPG・固有名詞として残す意味がある語だけを使う。

## 原則として残す語

- JavaScript / TypeScript
- `find()` / `filter()` / `map()` / `reduce()` など、実際に読むコード上の識別子
- HP / EXP / BGM / SE など、短く一般的な表記
- BYTE / MIO / Code Core などの固有名詞
- `INTERACT` / `MOVE` など、チュートリアルと操作UIで共通語として意図的に使う操作語

## 日本語にする語

操作・状態・案内として英語である必要がないものは、短く自然なRPG日本語にする。

```text
OPEN SHOP        → ショップを見る
REST AT INN      → 宿で休む
OPEN CHEST       → 宝箱を開ける
CHALLENGE BOSS   → ボスに挑む
CURRENT          → 現在地 / 現在装備
FOLLOW-UP        → 追撃
READY IN BATTLE  → 戦闘で使用可能
NO STOCK         → 所持なし
OWNED            → 所持済み
EQUIPPED         → 装備中
NEXT OBJECTIVE   → 次の目的
```

## 文の作り方

- 日本語の文中へ `target / trace / incident / current / next` のようなpresentation用英単語を理由なく混ぜない。
- コードを説明するときは、識別子そのものだけ英語で残す。例: `filter()`で条件に合う敵をすべて集める。
- 固有名詞は無理に翻訳しない。
- 直訳調より、ゲーム内で一目で意味が分かる短さを優先する。
- visible copyと`aria-label`は同じ意味にそろえる。
- Mobileで長くなる場合、意味を削らず短い日本語へ言い換える。

## 適用範囲

この基準はWorld Objective / interaction / Pause / Atlas / Shop / Battle Result / Tutorialなど、プレイヤーが直接読むUIへ適用する。内部ID、CSS class、domain enum、test fixtureの識別子は日本語化の対象にしない。
