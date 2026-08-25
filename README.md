# CODE//READ RPG

コードを「書く」のではなく、**読んで意味を判断して戦う**コードリーディングRPGです。

MVPは完成済みです。以後の開発はMVP後の拡張として進めます。

## MVP

- JavaScript編 3 battles
- コードカードを2回押して発動
- コードが攻撃対象を決定、POWERが固定ダメージを決定
- 対象プレビューなし
- 敵の次行動を表示
- `find` / `filter` / 比較 / `sort` を使用
- 任意のコード解説
- Battleクリアで新カード解放
- 評価・レベル・装備・セーブ・バックエンドなし

## Docs

- [ロードマップ](./docs/ROADMAP.md) — MVP後に追加する機能、優先順位、バージョン計画、技術導入基準
- [ゲーム設計](./docs/GAME_DESIGN.md) — コードリーディングRPGとして守る仕様と学習・ゲーム設計の原則
- [アーキテクチャ](./docs/ARCHITECTURE.md) — 現在の構成、責務、データフロー、今後の拡張展望
- [コンテンツ作成ガイド](./docs/CONTENT_GUIDE.md) — Battle / Skill / 解説を追加するときの設計基準
- [テスト方針](./docs/TESTING.md) — 現在の確認方法とunit / component / E2Eの段階的な導入方針
- [開発フロー](./docs/DEVELOPMENT_WORKFLOW.md) — Issue / Branch / Commit / PR / Review / Merge / Vercel Productionの運用規約

## Production

- Vercel: https://code-reading-rpg-live.vercel.app
- `main` へのmergeをProduction Deployのトリガーとして運用します。

## Routes

TanStack Routerで画面遷移とBattle URLを管理しています。

- `/` - スタート画面
- `/javascript/battle/$battleId` - JavaScript編の各Battle
- `/javascript/complete` - Chapterクリア画面

現在は小規模なためcode-based routingを採用しています。ルート数が増えた段階で、TanStack Routerが推奨するfile-based routingへの移行を検討します。

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech

- Vite
- React
- TypeScript
- TanStack Router
- CSS

## Design note

表示されているコードを `eval()` してゲームロジックとして実行していません。カードごとに安全な内部ルールを持ち、表示コードとゲーム効果を対応させています。
