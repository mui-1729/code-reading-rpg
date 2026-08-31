# CODE//READ RPG ロードマップ

この文書は**次に何を作るか**を管理する。

- current snapshot: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- game design: [`GAME_DESIGN.md`](./GAME_DESIGN.md)
- world / theme: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- world structure: [`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)
- learning content rule: [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)
- long-term chapters: [`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md)

## North Star

`CODE//READ RPG`を、

> **コードを知らない人でもfantasy RPGとして入り、世界のruleとしてコードを少しずつ読み、遊んでいるうちに自分でJavaScriptを追えるようになるRPG**

として育てる。

REAL WORLDでは新人エンジニアとしてproblemを受けるが、technical jargonの理解を開始条件にしない。

優先順位:

1. code readingが実際のgame decisionになっているか
2. コード未経験者がStory / dialogueを理解できるか
3. fantasy RPGとして探索・戦闘・成長が楽しいか
4. REAL WORLD problemとCODE WORLD symptomが同じ原因へつながるか
5. RPG成長がcode readingを代替していないか
6. current runtime / save / testsを壊さず拡張できるか
7. 同じconceptを十分反復してから次へ進めているか

---

## Current foundation

### World / progression

- Overworld 40 × 28 + camera 11 × 9
- `worldMapId + local worldPosition`のmulti-map model
- `GREENFIELD VILLAGE` 21 × 15
- `JAVASCRIPT FOREST` 31 × 21
- `JAVASCRIPT DEEP FOREST` 31 × 21
- Overworld ↔ Village / Forest、Forest ↔ Deep Forest transition
- VillageはRandom Encounterなし
- Forest / Deep Forestはfixed-firstで新conceptを導入し、clear済みLessonだけをRandomで反復
- MID BOSS 13 / second MID BOSS 19
- JavaScript Final Boss = existing Battle 3
- World Objective / BYTE guidance
- persistent HP / Treasure / Shop / paid Inn
- BYTE party / follower
- `PlayerProgress v4` / `RpgState v5` / unified revision snapshot
- old save migration / derived progression normalization

### JavaScript learning route — completed P0

```text
GREENFIELD VILLAGE
7: enemy.hp + < / >
8: enemy.name + ===
9: enemies + find()
↓
JAVASCRIPT FOREST
10: find() + &&
11: find() + ||
12: comparison / find() / && / || combined
13: MID BOSS — new syntaxなし
14: find() vs filter()
↓
JAVASCRIPT DEEP FOREST
15: filter() condition repetition
16: map()
17: some()
18: every()
19: second MID BOSS — new syntaxなし
20: sort() + [0] + intermediate value
21: nested data + ?. + ??
22: reduce() / aggregate
↓
OVERWORLD FINAL INCIDENT
1 → 2
↓
CODE CORE FINAL BOSS
3
↓
JavaScript Area CLEAR / REAL WORLD RETURN
```

実装原則:

- 新conceptはRandomより先にfixed Lessonで導入
- Story / CODE HELPは読み方を教えるがcorrect targetは公開しない
- `map()` / `some()` / `every()`を一度にまとめず別Battleで導入
- second MID BOSS 19は既習内容だけで理解確認
- `sort()`以降はmultilineとintermediate valueを段階導入
- Battle 21は`map()`でnestedな`stats.hp`へ変換し、`stats?.hp ?? Infinity`を読む
- Battle 22前はexisting Battle 1 / 2とFinal Boss 3を先出ししない
- Boss 3は22 + 1 + 2 clear後だけ開始可能
- Boss 3 clear時だけJavaScript Area CLEAR
- display codeを`eval()`せずsafe `TargetRule`へ写す
- PlayerProgress v4を維持し、RpgState v5で未使用Party Equipmentを整理

### Battle / learning infrastructure

- SELECT → EXECUTE
- seeded generation / solvability
- semantic-equivalent code variation
- single / multiline code variants
- line-by-line CODE HELP
- CODE DATA inspector
  - runtime `enemies`
  - intermediate collections
  - boolean results
  - nested `stats.hp`
- Boss GUARD
- staged result sequence
- first-clear / replay rewards

---

## P1 — Battle runtime responsibility split (#196)

JavaScript地方を一通り完成できたため、**次の大規模region追加より先にruntime境界を整理する**。

`src/App.tsx`へ集まっている責務をgameplay-neutralに分離する。

候補:

- battle session identity / transition
- player action execution
- enemy turn
- persistent HP result handoff
- story / result presentation bridge

完了条件:

- gameplay / TargetRule semanticsを変えない
- generator / solvabilityを変えない
- save schemaを不要に変えない
- current JS / TS BattleのUnit / E2Eを境界として維持
- refactor後もCloudflare Preview / Productionがgreen

#196には新しいlearning contentを混ぜない。

---

## P1 — TypeScript visual / beginner Story pass

runtime整理後、既存TypeScript Battle 4〜6を活かしながら地域体験を改善する。

### Visual identity

JavaScript自然地域の色違いにしない。

- stone road
- crystal
- rune
- ruins
- temple / structured architecture

### Beginner-first Story

最初から、

> API契約が壊れた

とは言わず、

> 送られてくるdataの形の約束が変わった

のように普通の言葉で意味を作ってからtechnical termへ接続する。

候補学習順:

```text
value / shape
→ type annotation
→ union
→ optional property
→ narrowing
→ generic
→ keyof / indexed access
→ Final Boss
```

TypeScript-specific Boss mechanicは、学習上必要な場合だけ追加する。

候補:

- union / narrowingで解除対象を判断
- optional property有無でBoss stateが変わる
- `keyof` / indexed accessで読む値を切り替える

単に難易度を上げるためには追加しない。

---

## P2 — Database編 prototype

次の**新規技術region**候補。

visual identity:

- underground
- mine
- archive
- library

learning candidate:

```text
table / row / column
→ SELECT
→ WHERE
→ AND / OR
→ ORDER BY
→ LIMIT
→ aggregate
→ JOIN
```

JavaScript / TypeScriptと同じく、

```text
普通の言葉
→ 意味
→ 小さいquery
→ 正式名称
→ current dataへ適用
```

の順で導入する。

Database Battleでも「queryを書く」より先に「既存queryを読んで何が返るか」をgame decisionにする。

---

## P2 — RPG depth

learning routeを壊さず、RPGとしての探索・成長を厚くする。

候補:

- optional side path / treasure
- equipment choiceの幅
- Party member拡張
- region固有NPC
- Inn / Shopの地域差
- Boss前のrecovery / preparation

禁止:

- statだけでcorrect targetを無視できるauto battle
- mandatory grind
- Random Encounter回数だけの水増し
- 空白だけ増える巨大map

---

## Quality gate

すべてのgameplay PRでPR前に必ず:

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

PR後:

```text
GitHub Actions
Cloudflare Preview
Self Review
Squash Merge
main CI
Cloudflare Production
```

チェックを実行していない状態で「通った」とは扱わない。

---

## 当面やらない

- Stage Select / Area Select復活
- Login / Cloud Save / Ranking
- auto target / auto battle
- JavaScript地方への追加concept詰め込み
- gameplay変更と#196 refactorの同時実施
- JavaScriptだけで遺跡 / 地下 / 城塞を使い切ること
