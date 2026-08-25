# CODE//READ RPG

コードを「書く」のではなく、**読んで意味を判断して戦う**コードリーディングRPGのMVPです。

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
- CSS

## Design note

表示されているコードを `eval()` してゲームロジックとして実行していません。カードごとに安全な内部ルールを持ち、表示コードとゲーム効果を対応させています。
