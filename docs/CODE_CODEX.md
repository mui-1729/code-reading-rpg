# CODE//READ RPG Code Codex

## 目的

`Code Codex`は、Fieldへ学習看板を増やし続けなくても、既習・未習のコード概念を任意に確認できる学習アーカイブです。

FieldはRPGとして歩く場所、Codexは概念をまとめて調べる場所として役割を分けます。

```text
Field
├─ その場所で重要な少数の看板
└─ Gate / NPC / 探索

Code Codex
└─ JavaScript / TypeScriptの学習メモを一覧で確認
```

これにより、学習コンテンツを増やしてもMain Routeを看板で埋めないことを優先します。

## 開き方

World Map / Area Select / Fieldで利用できます。

- Keyboard: `C` = OPEN / CLOSE
- `Esc` = CLOSE
- Mobile: 画面左下の`CODE CODEX`ボタン
- Battle中: 非表示

Battle中はコードカードと戦況を読むことへ集中させるため、Codexを表示しません。必要な解説はBattle側の`CODE HELP`を使います。

## Source of truth

Codex専用の説明データは作りません。

JavaScript:

```text
src/learning/learningHints.ts
```

TypeScript:

```text
src/learning/typescriptLearningHints.ts
```

Fieldの学習看板とCodexは同じhint dataを使用します。

各hintは次を持ちます。

- `id`
- `concept`
- `title`
- `summary`
- `codeLines`
- `notes`

新しい概念を追加するとCodexへ自動的に反映されます。

## Field看板との使い分け

すべての構文をFieldへ物理配置しません。

Fieldへ看板を置く条件:

1. 近くのBattleで特に重要な概念である
2. 初見Playerがその場で確認できる価値が高い
3. Main RouteやGateへの通路を塞がない
4. reachability testを維持できる

それ以外はCodexだけに登録しても構いません。

## 今後増やす候補

JavaScript:

- `every()`
- optional chaining `?.`
- nullish coalescing `??`
- destructuring
- nested object
- callback内の複数条件
- 4〜5行の実行順序

TypeScript:

- discriminated unionの発展
- genericの初歩
- utility typeの初歩
- nested object type
- genericと配列methodを組み合わせた読解

構文網羅そのものを目的にせず、Battleでgame decisionが変わる概念を優先します。

## テスト方針

Codexの表示品質をdata側で最低限固定します。

- JavaScript / TypeScriptを横断してhint IDが重複しない
- concept / title / summaryが空でない
- code lineが1行以上あり、空行だけではない
- noteが1件以上あり、空文字ではない

Fieldの看板配置については従来どおりreachability testを使用します。
