# CODE//READ RPG Copy Guide

## 基本方針

プレイヤー向けUIは**日本語をdefault**にする。英語は雰囲気作りの装飾として広げず、残す理由を説明できる語だけを使う。

このゲームではコード自体の英語を読むことが学習対象になる。UIまで理由なく英語にすると「読む必要があるコード」と「単に英語なだけの操作」が混ざるため、ゲームUI・操作・状態・案内は日本語へ寄せる。

## 英語を残す判定

新しいplayer-facing copyは次の順で判断する。

1. **実コードのsyntax / identifierか**
   - `find()` / `filter()` / `map()` / `reduce()`
   - `name` / `hp` / `attackDamage`
   - JavaScript / TypeScript / SQLの実際の記述
   - → 翻訳しない。
2. **物語・世界・人物・Boss・Skill・Item等の意図された固有名詞か**
   - BYTE / MIO / Code Core / FRONTIER COMPILER
   - TRACE / PULSE / PATCH KIT など、正式名称として採用したもの
   - → 固有名として維持してよい。周囲のcategory / state / explanationは日本語にする。
3. **短く一般化した略語か**
   - HP / EXP / LV / BGM / SE / ON / OFF
   - → 視認性を優先して維持してよい。
4. **それ以外の操作・状態・説明・category・navigationか**
   - → 日本語にする。

`INTERACT` / `MOVE` / `NEXT` / `RUN` のような操作語は例外にしない。

## 日本語にする代表例

```text
NEXT ▶                 → 次へ ▶
SKIP                   → スキップ
INTERACT               → 対象に応じた「ショップを見る」「BYTEと話す」等
MOVE                   → 移動
RUN / ESCAPE           → 逃げる
RETRY BATTLE           → 再挑戦
RETURN TO WORLD        → ワールドへ戻る
RETURN TO CHECKPOINT   → チェックポイントへ戻る
CODE HELP              → コード解説
CODE DATA              → コードデータ / データを見る
SELECT                 → 選択
EXECUTE                → 実行
POWER                   → 威力
NEXT                    → 次の攻撃
ENEMY TURN              → 敵のターン
TURN 03                 → ターン 3
DEFEATED                → 撃破
GUARD ACTIVE            → ガード中
GUARD OPEN              → ガード解除
BATTLE LOG              → 戦闘ログ
VICTORY                 → 勝利
DEFEAT                  → 敗北
LEVEL UP                → レベルアップ
CURRENT                 → 現在 / 現在装備
FOLLOW-UP               → 追撃
READY IN BATTLE         → 戦闘で使用可能
NO STOCK                → 所持なし
OWNED                   → 所持済み
EQUIPPED                → 装備中
NEXT OBJECTIVE          → 次の目的
```

コードblock内のproperty名はそのまま残す。たとえば画面上の状態labelは`威力`でも、実コードに`power`が出るなら`power`は翻訳しない。

## World interaction

interaction buttonへ`INTERACT ·`のprefixを付けない。`getInteractionPresentation()`等が返すcontextual actionをそのまま表示する。

```text
ショップを見る
BYTEと話す
宝箱を開ける
MIOと訓練する
ボスに挑む
グリーンフィールド村へ入る
```

interaction対象がないdisabled controlを残す場合は`アクション`等の自然な日本語にする。`aria-label`もvisible copyと同じ意味へそろえる。

## 場所名

場所名は世界内の固有名だが、generic suffixまで英語にしすぎない。同じ場所の呼称を画面ごとに揺らさない。

推奨:

```text
GREENFIELD VILLAGE       → グリーンフィールド村
JAVASCRIPT FOREST        → JavaScriptの森
JAVASCRIPT DEEP FOREST   → JavaScript深層の森
TYPESCRIPT FRONTIER      → TypeScript辺境
```

正式名称として英語一式を残すと決めた固有名だけ例外とする。

## メニュー

Pauseのplayer-facing tabは現行日本語を正とする。

```text
ステータス
マップ
アイテム
装備
仲間
コード図鑑
設定
```

内部tab id (`status`, `map`, `items`, `equipment`, `party`, `codex`, `system`) は変更しない。仕様documentに旧player-facing英語表記が残る場合は現行UIへ合わせる。

## 文の作り方

- 日本語の文中へ `target / trace / incident / current / next` のようなpresentation用英単語を理由なく混ぜない。
- コードを説明するときは、識別子そのものだけ英語で残す。例: `filter()`で条件に合う敵をすべて集める。
- 固有名詞は無理に翻訳しないが、固有名の周囲の一般語まで英語にしない。
- 直訳調より、ゲーム内で一目で意味が分かる短さを優先する。
- visible copyと`aria-label`は同じ意味にそろえる。
- Mobileで長くなる場合、意味を削らず短い日本語へ言い換える。

## 適用範囲

この基準はOpening / World Objective / interaction / Pause / Atlas / Shop / Battle / Battle Result / Tutorialなど、プレイヤーが直接読むUIへ適用する。内部ID、CSS class、domain enum、storage schema、test fixtureの識別子は日本語化の対象にしない。
