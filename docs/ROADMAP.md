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
- Opening直後にfirst live incidentを体験
- first incident clear後にVillageへ入り、読めなかった`hp` / `name` / `find()`を確認
- Village preparation完了後にForestを解放
- Forest / Deep Forestはfixed-firstで新conceptを導入し、clear済みLessonだけをRandomで反復
- second live incidentをForestのimpact-range調査後、Deep Forest入口で固定体験
- MID BOSS 13 / second MID BOSS 19
- Battle 22後はDeep Forest西口からCode Core手前へ直接進行
- JavaScript Final Boss = existing Battle 3
- World Objective / BYTE guidance
- persistent HP / Treasure / Shop / paid Inn
- BYTE party / follower
- `PlayerProgress v4` / `RpgState v4`
- semantic progression key + transitive prerequisite validation
- old save migration / derived progression normalization
- player-facing Story番号はJavaScript `JS-01〜JS-19`、TypeScript `TS-01〜TS-03`

### JavaScript incident-driven route — completed P0

```text
OPENING INCIDENT
↓
JS-01 LIVE INCIDENT
最初のtarget異常を実際のstateで体験
↓
GREENFIELD VILLAGE — 「さっき読めなかった部分」を確認
JS-02: enemy.hp + < / >
JS-03: enemy.name + ===
JS-04: enemies + find()
↓
JAVASCRIPT FOREST — 同じtraceを追う
JS-05: find() + &&
JS-06: find() + ||
JS-07: comparison / find() / && / || combined
JS-08: MID BOSS — new syntaxなし
JS-09: find() vs filter() / impact range
↓
JS-10 SECOND SYMPTOM
複数targetへ広がった二つ目の症状を確認
↓
JAVASCRIPT DEEP FOREST — shared traceをroot causeへ追う
JS-11: filter() condition repetition
JS-12: map()
JS-13: some()
JS-14: every()
JS-15: second MID BOSS — new syntaxなし
JS-16: sort() + [0] + intermediate value
JS-17: nested data + ?. + ??
JS-18: reduce() / aggregate
↓
DEEP FOREST WEST EXIT
↓
JS-19 CODE CORE FINAL BOSS
↓
JavaScript Area CLEAR / REAL WORLD RETURN
```

内部互換用numeric IDのStory対応は次のとおり。

```text
JS-01  -> 1
JS-02  -> 7
JS-03  -> 8
JS-04  -> 9
JS-05  -> 10
JS-06  -> 11
JS-07  -> 12
JS-08  -> 13
JS-09  -> 14
JS-10  -> 2
JS-11  -> 15
JS-12  -> 16
JS-13  -> 17
JS-14  -> 18
JS-15  -> 19
JS-16  -> 20
JS-17  -> 21
JS-18  -> 22
JS-19  -> 3
```

実装原則:

- numeric `battleId`はsave / URL互換のstable identifierでありStory chapter番号にしない
- Story順はsemantic progression keyで表現する
- player-facing番号はarea内Story順から導出し、legacy IDをそのまま見せない
- **incidentを先に体験し、必要性を知ってから学ぶ**
- syntaxを学ぶために冒険するのではなく、incidentのtraceを追うために必要なcodeを読む
- 新conceptはRandomより先にfixed Lessonで導入
- Story / CODE HELPは読み方を教えるがcorrect targetは公開しない
- `map()` / `some()` / `every()`を一度にまとめず別Battleで導入
- second MID BOSS 19は既習内容だけで理解確認
- `sort()`以降はmultilineとintermediate valueを段階導入
- Battle 21は`map()`でnestedな`stats.hp`へ変換し、`stats?.hp ?? Infinity`を読む
- first incidentはTraining後に再発させない。最初に一度体験し、その結果をVillageへ持ち込む
- ForestはTraining 9 clear後に解放する
- Battle 2は14後・Deep Forest lesson前に置く
- Boss 3は正規incident routeとBattle 22までのtransitive prerequisiteを満たした後だけ開始可能
- Boss 3 clear時だけJavaScript Area CLEAR
- display codeを`eval()`せずsafe `TargetRule`へ写す
- PlayerProgress / RpgStateはv4のまま維持し、旧saveへ必要なincident beatをbackfillする
- Story reorderだけを理由にEconomy budgetを変えない

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

JavaScriptと同じく、**現象や困りごとを先に体験してから必要な型情報へ入る**。

最初から、

> API契約が壊れた

とは言わず、

> 送られてくるdataの形の約束が変わった

のように普通の言葉で意味を作ってからtechnical termへ接続する。

候補学習順:

```text
現象を体験
→ value / shape
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
異常な検索結果を先に見る
→ table / row / column
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
現象
→ 普通の言葉
→ 意味
→ 小さいquery
→ 正式名称
→ current dataへ適用
```

の順で導入する。

Database Battleでも「queryを書く」より先に「既存queryを読んで何が返るか」をgame decisionにする。

Database編の追加時も、JS / TSのlegacy numeric IDを振り直さず、独立したsemantic progressionとplayer-facing番号系列を追加する。

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
- numeric legacy Battle IDをchapter番号として再利用すること
