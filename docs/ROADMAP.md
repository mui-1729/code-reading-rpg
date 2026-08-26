# CODE//READ RPG ロードマップ

## 1. この文書の目的

`CODE//READ RPG`を、コードを読む行為がそのままゲーム上の判断になるRPGとして拡張していく順序を定義する。

2026-08-26時点で、**JavaScript KingdomとTypeScript Frontierの2つのPlayable Area**、World Map、Field探索、学習看板、RPG進行、複数構文・複数行codeまで実装済み。

常に次を守る。

1. コードを読まないと正しい行動を選びにくいこと
2. 同じ手順の暗記だけで攻略できないこと
3. 読んだ結果がゲーム内の意思決定へつながること
4. LevelやPOWERだけで読解を不要にしないこと
5. コンテンツを増やしても自動テストできる構造を維持すること
6. 学習オブジェクトを増やしてもFieldの進行経路を塞がないこと

---

## 2. 実装済み

### Battle / 読解基盤

- JavaScript Kingdom: Battle 1〜3
- TypeScript Frontier: Battle 4〜6
- Skill SELECT → EXECUTE
- Target Previewなし
- seeded generation / solvability
- SkillDefinition / TargetRule
- 同一効果の複数code variant
- 3行以上の複合code
- 行別CODE HELP
- Battle motion / damage feedback

### JavaScript学習

- property access / 比較
- `find()` / `filter()` / `map()` / `sort()`
- `&&` / `||`
- `some()` / `reduce()`
- 三項演算子
- object / 中間変数
- `filter() → sort() → [0]`
- `filter() → some() → ? :`
- `filter() → map() → reduce()`

### TypeScript学習

- primitive / type annotation
- function parameter / return type
- literal / union type
- object type
- optional property
- narrowing / type predicate
- intersectionの初歩
- `keyof` / indexed access
- JavaScriptの配列処理と型情報を組み合わせるBoss読解

### RPG進行

- PlayerProgress
- EXP / Level
- Levelによる最大HP / POWER倍率
- Stage CLEAR / next Stage unlock
- Skill unlock
- 再挑戦
- LocalStorage / migration / reset
- Boss / Area CLEAR
- 旧saveを維持しつつ新Area入口Stage / baseline Skillを不足分だけ補完

Enemyはcurrent Player Levelへ自動追従させない。

### Field / World

- World Map
- JavaScript Kingdom AVAILABLE / AREA CLEAR
- TypeScript Frontier AVAILABLE / AREA CLEAR
- 両AreaのStage Select / Field / Battle / Complete route
- 4方向移動 / collision
- Keyboard / Mobile操作
- Battle Gate / Battle後のField復帰
- JavaScript NPC / Dialogue
- JavaScript / TypeScriptの任意学習看板
- Field到達可能性test
- Area metadataによるdata-driven表示
- Area ↔ Battle / Boss lookup helper

### Audio / 品質

- menu / field / battle BGM
- SE / mute / BGM・SE別volume
- Web Audio API / autoplay制約対応
- `prefers-reduced-motion`
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
JavaScript / TypeScript Area
↓
Field
↓
必要ならNPC / 学習看板
↓
Battle Gate
↓
コードを読む
↓
Skillを選ぶ
↓
Battle結果
↓
EXP / Level / Stage CLEAR / Skill unlock
↓
Fieldへ復帰 or 次Stage
↓
Boss
↓
Area CLEAR
↓
World Map
```

学習看板は補助であり必須ではない。知っているPlayerはそのままBattleへ進み、知らないPlayerはFieldで確認できる構造を維持する。

---

## 4. JavaScript Kingdom

Battle 1〜2では単体〜少数概念、Battle 3 Bossでは中間結果を追う複合読解へ進む。

例:

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const ordered = [...alive].sort((a, b) => a.hp - b.hp)
ordered[0]
```

```js
const alive = enemies.filter((enemy) => enemy.hp > 0)
const scored = alive.map((enemy) => ({ enemy, score: enemy.attackDamage }))
scored.reduce((best, candidate) => candidate.score > best.score ? candidate : best).enemy
```

今後候補:

- `every()`
- optional chaining `?.`
- nullish coalescing `??`
- destructuring
- nested object
- callback内の複数条件
- status / shield property
- 4〜5行の実行順序

構文網羅のためだけには追加せず、game decisionが変わるものを優先する。

---

## 5. TypeScript Frontier

#90で2つ目の実Areaとして追加。

```text
Battle 4: Typed Entry
型注釈 / primitive / parameter / return type / literal

Battle 5: Maybe Value
union / optional property / narrowing

Battle 6: Frontier Compiler (Boss)
JavaScript配列処理 + narrowing / type predicate / keyof / indexed access
```

Fieldには次の任意学習看板を置く。

- type annotation
- union type
- optional property
- narrowing
- `keyof` / indexed access

JavaScript Kingdomで身につけた、

```text
対象を絞る
→ 中間値を作る
→ 条件を読む
→ 最終結果を判断する
```

という読み方へ型情報を追加する。

TypeScript構文自体をruntimeで`eval()`しない。display codeと内部TargetRuleを対応させ、Battle engine / generator / solvabilityはArea間で共有する。

---

## 6. 次のコンテンツ拡張

2 Areaが成立した後は、量を増やす前に「読解の種類」と「RPGとしての理由」を増やす。

候補:

- JavaScript追加構文
- TypeScriptのgeneric / utility typeの初歩
- nested object / discriminated union
- 3つ目のArea（SQL / Reactなど）
- Boss固有mechanic
- Fieldの複数screen / camera追従
- AreaごとのNPC / Quest

優先条件:

1. 現在のBattleと違う読み方が必要
2. Fieldで事前確認できる
3. game decisionへ影響する
4. unit test / solvabilityで品質を固定できる

---

## 7. RPGの深さ

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

## 8. Field拡張

現在は各Areaとも1画面grid Field。

守ること:

- Main routeを学習看板で塞がない
- すべてのGate / 看板 / Exitへ到達可能にする
- layout変更時にreachability testを通す

将来、看板・NPC・施設が増えて1画面が窮屈になったら、RPGのような**複数screen / camera追従型Field**へ移行する。単純に1画面へobjectを詰め込む方向にはしない。

---

## 9. Backend / サービス化

必要性が発生してから導入する。

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
→ World Map / 複数Area routing
→ Field学習看板
→ JavaScript構文拡張
→ 複数構文・3行code / 行別CODE HELP (#89)
→ TypeScript Frontier / Battle 4〜6 (#90)

[次]
追加JavaScript / TypeScript読解
or
Field・QuestなどRPG深化

[その後]
3つ目のArea
→ 複数screen Field / Boss mechanic

[必要になってから]
Backend / Login / Cloud Save / Ranking
```

**Battleだけを増やして問題集へ戻さず、Field・RPG進行・読解判断が1つのループとしてつながる状態を維持する。**
