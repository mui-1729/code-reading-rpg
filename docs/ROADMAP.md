# CODE//READ RPG ロードマップ

## 1. この文書の目的

`CODE//READ RPG`を、コードを読む行為がそのままゲーム上の判断になるRPGとして拡張していく順序を定義する。

2026-08-26時点では、JavaScript KingdomのRPGループ・World Map・複数Area向け基盤まで完成している。次の重点は、**JavaScriptの読解幅を広げたうえで複数構文を組み合わせる問題へ進み、その後TypeScript Frontierを実装すること**。

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
- `find()` / `filter()` / 比較 / `sort()`
- `&&` / `||` / `some()` / `reduce()` / 三項演算子
- HP / NEXT行動による戦略判断
- Target Previewなし
- CODE HELP
- seeded generation / solvability
- SkillDefinition / TargetRule
- 同一効果の複数code variant
- Battle 3の複数行code
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
- `find()`等を知らないPlayer向けの学習看板

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

基礎:

- property access (`enemy.hp`, `enemy.attackDamage`)
- 比較演算子
- `find()`
- `filter()`
- `sort()`

追加済み:

- `&&`
- `||`
- `some()`
- `reduce()`
- 三項演算子 `? :`
- 生存敵を絞ってから処理する複数行code

Fieldでは単体概念を短く確認し、Battleでは実際の盤面と照らして読む。

---

## 5. 次: #89 複数構文を組み合わせたBattle

単一の構文を見分けるだけでなく、**複数行を上から追って中間結果と最終結果を予測する**体験へ進める。

難易度は次の順で上げる。

```text
Level 1
2構文の組み合わせ

Level 2
3構文 + 複数行

Level 3
中間変数 + nested property + 条件分岐

Boss
複数候補から最終target / effectを読む
```

候補:

```ts
const wounded = enemies.filter((enemy) => enemy.hp < 40)
const target = wounded.sort((a, b) => a.hp - b.hp)[0]
```

```ts
const alive = enemies.filter((enemy) => enemy.hp > 0)
const danger = alive.reduce((best, enemy) =>
  enemy.attackDamage > best.attackDamage ? enemy : best,
)
```

方針:

- ただ長いだけのcodeにしない
- 各行の中間値を追えること
- CODE HELPで行ごとの意味を説明できること
- 表示codeとTargetRule / effectを必ずtestすること
- `eval()`しないこと

---

## 6. JavaScriptでさらに増やす候補

#89の複合問題へ自然に必要になったものから追加する。

- `every()`
- `map()`
- optional chaining `?.`
- nullish coalescing `??`
- destructuring
- object / nested data
- callback内の複数条件
- 実行順序
- status / shieldに対応するproperty

構文網羅のためだけには追加しない。ゲーム内判断が変わるものを優先する。

---

## 7. その次: #90 TypeScript Frontier

2つ目の実AreaとしてTypeScript Frontierを実装する。

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
複数の型情報を組み合わせたBoss
```

JavaScriptで身につけた「配列・条件・実行順序を読む」能力を、そのままTypeScriptの型情報へ接続する。

必須条件:

- JavaScript既存URL / save dataを壊さない
- Stage IDを重複させない
- TypeScript専用Field / 学習看板を持つ
- 巨大なArea別条件分岐を作らない
- generator / solvabilityを再利用できる構造にする

---

## 8. RPGの深さ

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

## 9. Backend / サービス化

次の必要性が発生してから導入する。

- Login
- Cloud Save
- 複数端末同期
- Ranking
- Shared Challenge
- 教員 / 管理者機能

候補はCloudflare Workers / D1 / KV / R2、Supabase等。Frontendのdeploy先だけを理由に固定しない。

---

## 10. 優先順位

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

[次]
#89 複数構文・複数行Battle

[その次]
#90 TypeScript Frontier

[以降]
JavaScript追加構文 / TypeScript拡張
→ Quest / Shop / 装備等のRPG深化

[必要になってから]
Backend / Login / Cloud Save / Ranking
```

**Battleだけを増やして問題集へ戻さず、Field・RPG進行・読解判断が1つのループとしてつながる状態を維持する。**
