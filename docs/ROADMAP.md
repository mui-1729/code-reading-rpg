# CODE//READ RPG ロードマップ

## 1. この文書の目的

`CODE//READ RPG`を、コードを読む行為がそのままゲーム上の判断になるRPGとして拡張していく順序を定義する。

2026-08-26時点では、JavaScript KingdomのRPGループ、World Map、複数Area向け基盤、単体構文学習、複数構文・複数行の読解まで実装済み。次の重点は **TypeScript Frontierを2つ目の実Areaとして成立させること**。

常に次を守る。

1. コードを読まないと正しい行動を選びにくいこと
2. 同じ手順の暗記だけで攻略できないこと
3. 読んだ結果がゲーム内の意思決定へつながること
4. LevelやPOWERだけで読解を不要にしないこと
5. コンテンツを増やしても自動テストできる構造を維持すること

---

## 2. 実装済み

### Battle / 読解基盤

- JavaScript Kingdom 3 Battles
- Skill SELECT → EXECUTE
- `find()` / `filter()` / `map()` / `sort()` / 比較
- `&&` / `||` / `some()` / `reduce()` / 三項演算子
- 中間変数を使う3行の複合code
- `filter() → sort() → [0]`
- `filter() → some() → ? :`
- `filter() → map() → reduce()`
- 複合codeの行別CODE HELP
- HP / NEXT行動による戦略判断
- Target Previewなし
- seeded generation / solvability
- SkillDefinition / TargetRule
- 同一効果の複数code variant
- Field上の任意学習看板

### RPG進行

- PlayerProgress
- EXP / Level
- Levelによる最大HP / POWER倍率
- Stage Select
- Stage CLEAR / next Stage unlock
- Skill unlock
- 再挑戦
- LocalStorage / migration / reset
- Boss / Area CLEAR

Enemyはcurrent Player Levelへ自動追従させない。

### Field / NPC

- JavaScript Kingdom Field
- 4方向移動 / collision
- Keyboard / Mobile操作
- Battle Gate
- Battle後のField復帰
- NPC / Dialogue
- 構文を知らないPlayer向けの任意学習看板
- `find()` / `filter()` / `map()` / `sort()` / 比較 / `&&` / `||` / `some()` / `reduce()`の看板

### World / Area

- `/world`
- JavaScript Kingdom AVAILABLE / AREA CLEAR
- TypeScript Frontier COMING SOON
- Area metadataによるdata-driven表示
- Area ↔ Battle / Boss lookup helper
- 複数Areaを追加できるroute metadata基盤（#85）

### Presentation / Audio / 品質

- Battle motion / Victory / Defeat motion
- `prefers-reduced-motion`
- SE / BGM / mute / volume
- Node.js 24
- Vitest
- ESLint / Prettier
- GitHub Actions
- Cloudflare Workers Preview / Production
- PR前 `npm ci` / `npm run lint` / `npm test` / `npm run build`

---

## 3. 現在のゲームループ

```text
World Map
↓
Area
↓
Field / NPC / 学習看板
↓
Battle Gate
↓
コードを読む
↓
Skillを選ぶ
↓
Battle結果
↓
EXP / Level / Stage CLEAR
↓
Fieldへ復帰
↓
Boss
↓
Area CLEAR
↓
World Map
```

学習看板は補助であり必須ではない。知っているPlayerはそのままBattleへ進み、知らないPlayerはFieldで確認できる構造を維持する。

---

## 4. JavaScript Kingdomの現在の学習範囲

単体概念:

- property access (`enemy.hp`, `enemy.attackDamage`)
- 比較演算子
- `find()`
- `filter()`
- `map()`
- `sort()`
- `&&`
- `||`
- `some()`
- `reduce()`
- 三項演算子 `? :`

複合読解:

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const ordered = [...alive].sort((a, b) => a.hp - b.hp)
ordered[0]
```

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const hasWounded = alive.some((enemy) => enemy.hp < 50)
hasWounded ? alive : []
```

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const scored = alive.map((enemy) => ({ enemy, score: enemy.attackDamage }))
scored.reduce((best, candidate) => candidate.score > best.score ? candidate : best).enemy
```

Battle 3ではCODE HELPが各物理行を順番に説明する。Playerは最終行だけでなく、中間配列・boolean・objectがどう変化したかを追える。

---

## 5. 次: #90 TypeScript Frontier

World Map上でCOMING SOONのTypeScript Frontierを、2つ目の実Areaとして実装する。

初期テーマ:

- primitive type
- union type
- object type
- optional property
- narrowing
- function parameter / return type
- `keyof` / indexed accessの初歩

構成案:

```text
Stage 1
型注釈 / primitive

Stage 2
union / optional property / narrowing

Stage 3
JavaScriptの実行読解 + 複数の型情報を組み合わせたBoss
```

JavaScript Kingdomで身につけた、

```text
配列を絞る
→ 変換する
→ 条件を読む
→ 中間値を追う
→ 最終結果を判断する
```

という読み方を、そのままTypeScriptの型情報へ接続する。

必須条件:

- JavaScript既存URL / save dataを壊さない
- Stage IDを既存1〜3と重複させない
- `/typescript` / `/typescript/field` / `/typescript/battle/$battleId` / `/typescript/complete`
- TypeScript専用Field / 学習看板
- World MapでAVAILABLE化
- 巨大なArea別条件分岐を作らない
- generator / solvabilityを再利用できる構造にする
- Bossは複数の型概念と複数行codeを組み合わせる

---

## 6. JavaScriptでさらに増やす候補

TypeScript Frontierと並行して必要性が出たものから追加する。

- `every()`
- optional chaining `?.`
- nullish coalescing `??`
- destructuring
- nested object
- callback内の複数条件
- status / shieldに対応するproperty
- 実行順序がより深い4〜5行code

構文網羅のためだけには追加しない。ゲーム内判断が変わるものを優先する。

---

## 7. RPGの深さ

複数Areaと学習進行が安定してから追加する。

候補:

- Quest
- Shop
- Inn / 回復
- Gold
- 装備
- Item
- Treasure
- Status effect
- Deck編成
- Boss固有mechanic

RPG要素はコード読解の代替ではなく、コードを読む理由を増やすために使う。

---

## 8. Backend / サービス化

次の必要性が発生してから導入する。

- Login
- Cloud Save
- 複数端末同期
- Ranking
- Shared Challenge
- 教員 / 管理者機能

候補はCloudflare Workers / D1 / KV / R2、Supabase等。Frontendのdeploy先だけを理由に固定しない。

---

## 9. 優先順位

```text
[実装済み]
Battle MVP
→ seeded generation / solvability
→ RPG Progression / LocalStorage / Area CLEAR
→ Field / NPC / Dialogue
→ Battle Motion / Audio
→ code variants / multi-line
→ World Map
→ 複数Area routing基盤
→ Field学習看板
→ JavaScript構文拡張（&& / || / some / reduce）
→ 複数構文・3行code / map / 行別CODE HELP（#89）

[次]
#90 TypeScript Frontier

[以降]
TypeScript拡張 / JavaScript追加構文
→ Quest / Shop / 装備等のRPG深化

[必要になってから]
Backend / Login / Cloud Save / Ranking
```

**Battleだけを増やして問題集へ戻さず、Field・RPG進行・読解判断が1つのループとしてつながる状態を維持する。**
