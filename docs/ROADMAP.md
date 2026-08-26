# CODE//READ RPG ロードマップ

## 1. 目的

`CODE//READ RPG`を、コードを読む行為がそのままゲーム上の判断になるRPGとして拡張する。

現在はJavaScript Kingdom / TypeScript Frontierの2 Area、Field探索、NPC、学習看板、Code Codex、Main Quest、Side Quest、RPG進行、複数行・複合codeまで実装済み。

守ること:

1. コードを読まないと正しい行動を選びにくい
2. 同じ手順の暗記だけで攻略できない
3. 読んだ結果がゲーム内の意思決定へつながる
4. LevelやPOWERだけで読解を不要にしない
5. コンテンツを増やしても自動テストできる
6. 学習オブジェクトを増やしてもFieldの進行経路を塞がない
7. UIから分かることを説明文で重ねない

---

## 2. 実装済み

### Battle / 読解基盤

- JavaScript Kingdom: Battle 1〜3
- TypeScript Frontier: Battle 4〜6
- Skill SELECT → EXECUTE
- seeded generation / solvability
- SkillDefinition / TargetRule
- 同一効果の複数code variant
- 3行以上の複合code
- 行別CODE HELP
- Battle motion / damage feedback
- Battle Log

### JavaScript学習

- property access / 比較
- `find()` / `filter()` / `map()` / `sort()`
- `&&` / `||`
- `some()` / `every()` / `reduce()`
- 三項演算子
- destructuring
- optional chaining `?.`
- nullish coalescing `??`
- nested object
- object / 中間変数
- `filter() → sort() → [0]`
- `filter() → some() / every() → ? :`
- `filter() → map() → reduce()`
- Bossで複数の上記概念を組み合わせるvariant

### TypeScript学習

- primitive / type annotation
- function parameter / return type
- literal / union type
- object type
- optional property
- narrowing / type predicate
- intersectionの初歩
- `keyof` / indexed access
- genericの初歩
- `Pick<T, K>`
- JavaScriptの配列処理 / destructuringと型情報を組み合わせるBoss読解

### RPG進行

- PlayerProgress
- EXP / Level
- Levelによる最大HP / POWER倍率
- Stage CLEAR / next Stage unlock
- Skill unlock
- 再挑戦
- LocalStorage / migration / reset
- Boss / Area CLEAR
- Main Quest
- Quest Tracker
- Fieldの`NEXT` / `!` marker
- Battle勝利後のQuest更新feedback
- JavaScript / TypeScriptの再攻略Side Quest
- Side Quest一回限りbonus EXP
- save schema v3 / v1・v2 migration

Enemyはcurrent Player Levelへ自動追従させない。

### Field / World

- World Map
- JavaScript Kingdom / TypeScript Frontier
- 両AreaのStage Select / Field / Battle / Complete route
- 4方向移動 / collision
- Keyboard / Mobile操作
- Battle Gate / Battle後のField復帰
- JavaScript / TypeScript NPC / Dialogue
- 任意学習看板
- Code Codex
- Field到達可能性test
- Area metadataによるdata-driven表示
- Area ↔ Battle / Boss lookup helper

### Audio / UI / 品質

- menu / field / battle BGM
- SE / mute / BGM・SE別volume
- Sound Settings modal
- Web Audio API / autoplay制約対応
- 不要な常設説明文を減らすUI方針
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
Area
↓
Field
↓
Main Quest / markerで目的を確認
↓
必要ならNPC / 看板 / Codex
↓
Battle Gate
↓
コードを読む
↓
Skillを選ぶ
↓
Battle結果
↓
EXP / Level / Stage CLEAR / Skill unlock / Quest更新
↓
Fieldへ復帰 or 次Stage
↓
Boss
↓
Area CLEAR
↓
Side Quest / 過去Stage再攻略
↓
World Map
```

Field看板は補助であり必須ではない。構文追加のたびに看板を増やさず、発展概念はCodexへ寄せられる。

---

## 4. JavaScript Kingdom

Battle 1〜2では単体〜少数概念、Battle 3 Bossでは中間結果を追う複合読解へ進む。

発展例:

```js
const alive = enemies.filter(({ hp }) => hp > 0)
const wrapped = alive.map(enemy => ({ enemy, stats: { hp: enemy.hp } }))
wrapped.sort((a, b) => (a.stats?.hp ?? Infinity) - (b.stats?.hp ?? Infinity))[0].enemy
```

```js
const alive = enemies.filter(({ hp }) => hp > 0)
const allStable = alive.every(({ hp }) => hp >= 50)
allStable ? [] : alive
```

Side Quest:

```text
SECOND PASS
→ FIRST READ replay
→ +40 EXP
```

今後候補:

- callback内のさらに複雑な条件
- status / shield property
- 4〜5行以上の実行順序
- object / arrayの変換をまたぐ追跡

構文網羅のためだけには追加せず、game decisionが変わるものを優先する。

---

## 5. TypeScript Frontier

```text
Battle 4: Typed Entry
型注釈 / primitive / parameter / return type / literal

Battle 5: Maybe Value
union / optional property / narrowing

Battle 6: Frontier Compiler (Boss)
JavaScript配列処理 + narrowing / type predicate / keyof / indexed access
+ generic / Pick<T, K>
```

TypeScriptは型用語だけを問わず、runtimeで最終的にどのEnemyが対象になるかまで読む。

Side Quest:

```text
TYPE RECHECK
→ TYPED ENTRY replay
→ +50 EXP
```

今後候補:

- discriminated unionの発展
- generic function
- `Record` / `Partial`など別utility type
- nested object type

---

## 6. 次のRPG拡張

Main Quest / Side Questまで成立したため、次は報酬を使う場所を作る。

優先候補:

1. Gold / Shop / Itemの最小loop
2. 3つ目のArea（SQL / React候補）
3. Boss固有mechanic
4. Field複数screen / camera追従

Gold / Itemを入れる場合も、読解を飛ばせる単純な攻撃力inflationにはしない。

追加条件:

- 現在のBattleと違う読み方またはRPG上の理由がある
- game decisionへ影響する
- 読解をLevel / Itemで不要にしない
- unit test / solvability / reachabilityで品質を固定できる

---

## 7. Gold / Shop / Item候補

最小loop候補:

```text
Battle / Quest
↓
Gold
↓
Shop
↓
少数Item
↓
Battleで限定的に使用
```

候補Item:

- 1 Battle 1回だけHPを少量回復
- 次のEnemy attackを少量軽減
- CODE HELPを開くこと自体へのcostは付けない

避けること:

- Itemだけでtarget判断を無視できる
- 常設Shop panelを増やす
- 複雑なinventoryを最初から作る

---

## 8. Field拡張

現在は各Areaとも1画面grid Field。

守ること:

- Main routeを学習看板で塞がない
- すべてのGate / 看板 / NPC / Exitへ到達可能にする
- layout変更時にreachability testを通す
- 新概念を追加するだけならCodexを優先し、Field objectを無制限に増やさない

看板・NPC・施設が増えて1画面が窮屈になったら、RPGのような複数screen / camera追従型Fieldへ移行する。

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
→ 複数構文・3行code / 行別CODE HELP
→ TypeScript Frontier / Battle 4〜6
→ Main Quest / Quest Tracker / marker / victory feedback
→ Code Codex
→ UI常設情報の整理
→ JavaScript / TypeScript発展構文・Boss複合variant
→ 再攻略Side Quest / bonus EXP / save v3

[次]
Gold / Shop / Itemの最小loop
or
3つ目のArea

[その後]
Boss固有mechanic
→ 複数screen Field

[必要になってから]
Backend / Login / Cloud Save / Ranking
```

**Battleだけを増やして問題集へ戻さず、Field・RPG進行・読解判断が1つのループとしてつながる状態を維持する。**
