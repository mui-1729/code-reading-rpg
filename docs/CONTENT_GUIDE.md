# CODE//READ RPG コンテンツ作成ガイド

## 1. この文書の役割

新しいBattle、Skill、code variant、Field学習ヒントを追加するときの基準を定義する。

コンテンツが増えても、次を崩さない。

- 学習意図
- JavaScript / TypeScript上の意味
- Battleとしての戦略
- seed再現性
- RPG進行
- display codeと内部効果の一致
- Fieldの到達可能性

---

## 2. 基本原則

新しい要素は「構文を増やしたい」だけで追加しない。実装前に最低限決める。

1. 何を読めるようにしたいか
2. 既習として扱うsyntax / type concept
3. Playerが盤面のどの情報を見るか
4. 読み間違えると何が起こるか
5. 正しく読んだ結果がどのgame decisionへつながるか
6. Stage内での難易度と役割
7. TargetRule / effectで安全に表現できるか

構文や型の意味がゲーム結果に現れないなら、Battleへ入れる優先度は低い。

---

## 3. 学習の役割分担

```text
Field看板 = 単体概念を任意確認
通常Battle = 1〜2概念を盤面へ適用
後半Battle = 複数概念 + 中間値
Boss = 複数行・複合読解
```

看板は必須ではない。知っているPlayerはそのままGateへ進める。

現在のField看板:

### JavaScript Kingdom

- `find()` / `filter()` / `map()` / `sort()`
- comparison
- `&&` / `||`
- `some()` / `reduce()`

### TypeScript Frontier

- type annotation
- union type
- optional property
- narrowing
- `keyof` / indexed access

看板を増やすときは**通路へ置かない**。すべてのGate / 看板 / Exitへ到達できることをreachability testで確認する。

---

## 4. コンテンツ構造

```text
AreaDefinition
  = Area名 / availability / routes / bossBattleId

Battle
  = areaId / Enemy / Skill構成 / reward

SkillDefinition
  = Skillの意味 / TargetRule / codeVariants / explanation

CodeVariant
  = display code / single or multi / optional codeHelpLines

LearningHint
  = Fieldで読む任意の構文・型解説

Seeded Generator
  = 同じ学習意図を保った盤面variation

Solvability
  = 生成 / 設計品質の検証
```

JavaScript Skillは`skillDefinitions.ts`、TypeScript Skillは`typescriptSkillDefinitions.ts`へ分け、`skills.ts`で統合する。Battle engineはArea固有の構文を知らない。

---

## 5. SkillDefinition

```ts
{
  id,
  name,
  power,
  rule,
  concept,
  explanation,
  codeVariants: [
    {
      id,
      code,
      lineMode,
      codeHelpLines,
    },
  ],
}
```

### `id`

stable identifier。表示名変更では変えない。Areaを跨いでも重複させない。

### `power`

base damage。Player Level倍率とは分ける。

### `rule`

display codeの結果に対応する内部TargetRule。

### `concept`

CODE HELPや学習内容を示す短い名前。

### `explanation`

1. 構文 / 型が一般に何を示すか
2. このSkillでは何を見るか
3. どの中間値を追うか

を短く説明する。

---

## 6. CodeVariant

```ts
{
  id: string
  code: string
  lineMode: 'single' | 'multi'
  codeHelpLines?: readonly string[]
}
```

同じSkillには複数variantを持たせる。

変えてよいもの:

- callback variable名
- intermediate variable名
- 既習範囲の同義表現
- line break
- TypeScriptの同じ意味を保つ型表現

変えてはいけないもの:

- TargetRuleの意味
- base POWER
- conceptの本質
- target集合

表面の文字列だけを暗記して攻略できないようにする。

### `codeHelpLines`

- `code.split('\n').length`と同じ件数
- 1項目は対応する1行だけを説明
- 最終targetを最初から答えとして書かない
- callback名が変わっても意味を維持
- TypeScriptでは「型として何が確定したか」と「runtimeで何を実行するか」を混同しない

---

## 7. Display codeと内部効果

最重要ルール。表示コードとTargetRuleは同じ結果を指さなければならない。

JavaScript例:

```js
enemies.filter((enemy) => enemy.hp > 0 && enemy.hp < 100)
```

なら内部ruleも「生存中かつHP100未満のEnemy全員」。

確認するずれ:

- `<` / `<=`
- `>` / `>=`
- `&&` / `||`
- `find()` / `filter()`
- current HP / max HP
- array order / sorted order
- dead Enemy
- `some()`が返すboolean
- `map()`後のobject property
- `reduce()`のaccumulator / tie
- `.enemy` / `[0]`など最終取り出し

Display code自体を`eval()`しない。

---

## 8. TypeScript固有ルール

TypeScriptは「型用語クイズ」にしない。型情報を手がかりに**最終的なruntimeの対象や値を読む**問題にする。

読む順番の基本:

```text
型が許す候補を確認
→ 現在値 / objectの形を確認
→ narrowingで何が確定したか確認
→ JavaScriptとして実行される式を追う
→ targetを判断
```

例:

```ts
type Limit = 45 | 60
const limit: Limit = 60
const targets = enemies.filter((enemy: Enemy) => enemy.hp < limit)
targets
```

ここでは`45 | 60`を見ただけでは答えにならない。`limit`へ実際に`60`が入っていることまで読む。

### optional property

```ts
type Scan = { limit?: number }
const scan: Scan = { limit: 55 }
const limit = scan.limit ?? 0
```

`?`は「必ずundefined」ではなく「存在しない可能性がある」。現在のobjectとfallbackまで追わせる。

### narrowing / type predicate

```ts
const ready = candidates.filter(
  (candidate): candidate is Candidate & { score: number } =>
    candidate.score !== undefined,
)
```

CODE HELPでは、条件がtrueの要素だけが残るruntimeの意味と、その後`score`を`number`として扱える型の意味を分けて説明する。

### `keyof` / indexed access

```ts
const key = 'hp' as const satisfies keyof Enemy
enemy[key]
```

`keyof Enemy`だけを問わず、現在`key`が`'hp'`なので`enemy[key]`が`enemy.hp`を読むことへ接続する。

---

## 9. JavaScriptの複合読解

複数行は長さを増やすためではなく、**中間結果を追わせるため**に使う。

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

良い構造:

```text
1行目: 対象集合 / 型を準備
2行目: 絞る・変換する・型を確定する
3行目以降: 並べる / 集約する
最終行: targetを取り出す
```

未習概念を一度に大量投入しない。新概念はField看板で単体確認できるようにする。

---

## 10. LearningHint

```ts
{
  id,
  concept,
  title,
  summary,
  codeLines,
  notes,
}
```

ルール:

- 1看板1概念を基本
- summaryは短く
- code例はBattleに近づける
- notesで誤読しやすい点を補足
- 読まなくても進行可能
- `learningHintId`はunit testで存在確認
- 看板はMain routeの脇へ置く

---

## 11. Seeded Generator / Solvability

現在のvariation:

- Enemy HP: base maxHPの85〜115%
- Enemy順shuffle
- Skill順shuffle
- code variant選択

候補盤面は、

1. initial valid targetがある
2. base Battleで初期targetがあったSkillが生成後もtargetを持つ
3. `isBattleSolvable()`を満たす

場合のみ採用する。最大32回で成立しなければbase Battle cloneへfallbackする。

新Areaでもgenerator / solvabilityを共有する。Area固有の別generatorを安易に作らない。

---

## 12. GeneratorとRPG Levelを混ぜない

seed generationは同じStage内のvariation。

```text
Player Levelが低い
→ 過去Stageへ戻る
→ EXP
→ Level Up
→ 再挑戦
```

Enemy HPをPlayer Levelへ自動追従させない。

---

## 13. Battle balance

確認する。

- threshold上下にEnemyがいる
- すべてのSkillが同じtargetにならない
- NEXTを見る意味がある
- HP変化で条件が変わる余地がある
- highest POWERだけで解けない
- multi-targetが完全上位互換にならない
- 中間値に盤面差が反映される
- recommended Levelで合理的な勝ち筋がある

---

## 14. RPG reward / Area

新Battle追加時:

- `areaId`
- Stage IDの全体一意性
- EXP
- next Stage
- Skill unlock
- Boss / Area CLEAR
- Stage Select / Field Gate
- save復元時のcompatibility

を確認する。

各Areaの入口Stageを初期解放する場合、既存saveにも不足分だけ補完し、過去CLEARを失わせない。

---

## 15. Test

最低限:

- Skill ID重複なし
- Battle ID重複なし
- code variant複数
- variantでTargetRule / POWER不変
- multi variantの行数
- `codeHelpLines`と物理行数一致
- display code / internal rule対応
- generated battleのvalid target
- solvability
- seed再現性
- LearningHint参照整合性
- Area / Battle / Boss整合性
- Field全interactionの到達可能性
- old save migration / baseline補完

PR前は必ず次を成功させる。

```bash
npm ci
npm run lint
npm test
npm run build
```

PR CIはこの確認の代替ではなく二重確認。

---

## 16. 追加チェックリスト

実装前:

- [ ] learning themeを1文で説明できる
- [ ] 未習syntax / type conceptを詰め込みすぎていない
- [ ] game resultへ意味が出る
- [ ] TargetRule / effectで安全に表せる
- [ ] Field看板が必要か判断した

実装後:

- [ ] display codeと内部効果一致
- [ ] code variant複数
- [ ] multi codeの各行に役割がある
- [ ] 行別CODE HELPが対応
- [ ] valid target / solvability / seed再現性
- [ ] Field学習ヒント整合
- [ ] Fieldの通路を塞いでいない
- [ ] old saveを壊していない
- [ ] unit test
- [ ] docs更新
- [ ] PR前lint / test / build
- [ ] Cloudflare Preview

---

## 17. 現在の難易度順

```text
JavaScript単体構文
↓
JavaScript複数構文・中間変数
↓
TypeScript型注釈 / primitive
↓
union / optional / narrowing
↓
JavaScript実行読解 + 複数の型情報
↓
TypeScript Boss
```

最終目的は構文名を覚えることではなく、**実際のコードを上から追い、中間結果と型情報を使って最終結果を判断できること**。
