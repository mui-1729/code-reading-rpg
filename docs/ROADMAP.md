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
- multi-map対応: `worldMapId + local worldPosition`
- JavaScript側にGrassland / Woods / Deep Woods
- `GREENFIELD VILLAGE` 21 × 15の別map
- Overworld ↔ Village transition
- VillageはRandom Encounterなし
- Central Hub / TypeScript側の既存導線
- Random Encounter / cooldown / fixed Boss
- World action pure resolver
- World Objective / progress feedback
- persistent HP
- Treasure / Shop / paid Inn
- BYTE join / follower
- `PlayerProgress v4` / `RpgState v4`
- RpgState v1〜v3 migration / validation

### Battle / learning

- existing JavaScript Battle 1〜3
- existing TypeScript Battle 4〜6
- SELECT → EXECUTE
- safe `TargetRule`; display codeを`eval()`しない
- seeded generation / solvability
- Encounterごとのsemantic code variation
- multiline + line-by-line CODE HELP
- CODE DATA inspector
- Boss GUARD
- staged result sequence

既存JS Battle 1〜3は**現在動くbaselineであって、JavaScript編の最終Battle数ではない**。

### RPG / Economy

- Weapon / Armor / Accessory
- common pixel visual registry
- purchase / explicit equip
- PATCH KIT
- first-clear / replay Gold
- Shop quote
- Inn 20 G full recovery
- Battle → Shop → Equip → Inn → reload → next Battle E2E

---

## P0 — JavaScript地方 / learning route expansion

multi-map foundationの次は、Databaseへ急がず**JavaScriptをRPGの1地方として十分に深掘る**。

### World

JavaScriptのvisual identityは自然系で統一する。

```text
Central Hub
↓
草原
↓
林 / 川辺
↓
Village
↓
森
↓
深い森
↓
中Boss
↓
最深部
↓
Final Boss
```

遺跡 / 地下 / 城塞等をJavaScriptで使い切らない。

Village / Forest / Deep Forest等を必要に応じて別mapとして追加し、classic JRPG型に行き来できるようにする。

### Beginner-first Story

新conceptは、

```text
普通の言葉
→ 小さい式 / 記号
→ syntaxの意味
→ current dataへ適用
→ 反復
→ 必要ならtechnical term
```

の順で導入する。

Story / NPCは「どう読むか」を教えてよいが、correct targetは教えない。

`incident` / `target selection` / `API contract`等を初説明として置かない。

### JavaScript learning ladder candidate

```text
value
→ comparison (< / > / ===)
→ object property
→ array / collection
→ find
→ && / ||
→ filter
→ map
→ some / every
→ sort
→ optional chaining / nullish coalescing
→ multiline / intermediate value
→ reduce / aggregate
```

この順番はprototypeで調整してよい。

### Battle rhythm

最終目安:

- normal Battle / Encounter: 20〜30回程度
- fixed learning Battle: 8〜12程度を候補
- mid-boss: 2〜3体候補
- final boss: 1体

数値はquotaではない。

```text
新conceptを知る
→ 2〜4戦で値 / enemy順 / code variantを変えて反復
→ 既習conceptと組み合わせる
→ 中Boss
→ 次のconcept
```

同じ問題をそのまま20回出すことはしない。

### First implementation slices

1. 草原入口のStoryをcomparison / propertyから理解できる形へ変更
2. beginner learning Battleを追加
3. VillageをStory / learning上のcheckpointとして使う
4. Village以西にForest mapを追加
5. 最初の中Bossを配置
6. Deep Forest /後半conceptへ拡張
7. existing Battle 1〜3を長いprogression内へ再配置 / 再役割化

Battle engine / TargetRule / generatorを作り直さない。

---

## P1 — Battle runtime responsibility split (#196)

`src/App.tsx`へ集まっているBattle session / action / enemy turn / story / result handoff責務を、gameplay-neutralに分離する。

候補:

- battle session identity / transition
- player action execution
- enemy turn
- HP result handoff
- story / result presentation bridge

条件:

- gameplay変更と混ぜない
- TargetRule / generator / solvability semanticsを変えない
- save schemaを不要に変えない
- Unit / E2Eを境界として使う

大きな新規技術regionを追加する前にはこの整理を完了させる。

---

## P1 — TypeScript visual / beginner Story pass

JavaScript自然地域の色違いにしない。

visual direction:

- stone road
- crystal
- rune
- ruins
- temple / structured architecture

Storyでは、

> API契約が壊れた

から始めず、

> 送られてくるdataの形の約束が変わった

のように意味を理解してからtechnical termへ接続する。

既存Battle 4〜6のlearning内容は活かす。

### TypeScript-specific Boss mechanic

現在のGUARDはJS / TS共通。

候補:

- union / narrowingで解除対象を判断
- optional property有無でBoss stateが変わる
- `keyof` / indexed accessで読む値を切り替える

単に難易度を上げるためには追加しない。

---

## P2 — Database編 prototype

次の**新規技術region**候補はDatabase。

JavaScript / TypeScriptを十分に整え、Battle runtime boundaryを整理したあとprototypeする。

### learning candidate

Chapter 1:

- table / row / column
- SELECT
- WHERE
- AND / OR
- ORDER BY
- LIMIT

Chapter 2:

- JOIN
- NULL
- GROUP BY
- aggregate

Final candidate:

- index入口
- transaction
- 複数query依存

### CODE WORLD candidate

地下 / mine / archive / libraryをDatabase用に温存する。

prototypeで確認:

- queryを読まないとresult rowを判断できないか
- safe domainへ落とせるか
- WHERE → ORDER BY → LIMITをgame resultへ反映できるか
- CODE HELP / CODE DATAを一般化できるか
- rowを何として見せると自然か
- REAL WORLD data problemと同じroot causeへつながるか

成功後にfull Regionへ広げる。

---

## Long-term learning order

```text
JavaScript
→ TypeScript
→ Database
→ Backend / API
→ React
→ Next.js
→ TanStack
→ Team Development / Delivery
→ Security
→ Production / Performance
→ Architecture / Refactoring
```

World / RPG improvementsはlearning順序とは別軸で進めてよい。

---

## Party / Equipment depth

追加は必要性が出た場合だけ行う。

候補:

- 2人目companion
- heal / support role
- party equipmentの意味強化
- trade-offのある少数Equipment

追加しない:

- auto target
- auto battle
- 完全上位互換Equipment大量追加
- grindでcode readingを無視できる成長

---

## Maintenance backlog

- legacy Field / Quest definitionの残存参照を段階的に減らす
- WorldPage / PauseMenu presentation分割は専用Issueで行う
- App.tsx責務分割をgameplay変更と混ぜない
- historical docsとcurrent source of truthを混ぜない
- save compatibility fieldをunusedだけで削除しない
- World objective presentationの重複を解消する

---

## 当面増やさないもの

- Stage Select / Area Select
- 複雑なQuest Log
- 大量の常設HUD
- 空白だけ増える巨大map
- Random Encounter回数だけの水増し
- Login / Cloud Save / Ranking
- office map / meeting / Slack simulator
- fantasy entityの全面engineering metaphor化
- JavaScriptだけで全biomeを消費すること
- Storyによるcorrect target公開

---

## Quality gate

PR前:

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

GitHub Actionsを最初のtest runとして使わない。local executionが利用できない場合のみ、development workflowで定義した一時branch CIを使い、PR前にtrigger変更を戻す。
