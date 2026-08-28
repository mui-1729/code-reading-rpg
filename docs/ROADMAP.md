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
- `JAVASCRIPT FOREST` 31 × 21の別map
- `JAVASCRIPT DEEP FOREST` 27 × 19の別map
- Overworld ↔ Village / Forest transition
- Forest ↔ Deep Forest transition
- Forest入口はVillage Training 9 clearで解放
- Deep Forest入口はBattle 14 clearで解放
- VillageはRandom Encounterなし
- Forest / Deep Forestは学習済みconceptだけをRandom Encounterで反復
- Forest西側main trailに固定MID BOSS
- MID BOSSの先のWoodsで`filter()`固定Lessonを導入
- Deep Forestで`filter()`を条件違いでも反復
- Village中央に`TRAIN` learning checkpoint
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

- JavaScript main Battle 1〜3
- JavaScript Village Training Battle 7〜9
  - 7: `enemy.hp` + `<` / `>`
  - 8: `enemy.name` + `===`
  - 9: `enemies` + `find()`
- JavaScript Forest Learning Battle 10〜12
  - 10: `find()` + `&&`
  - 11: `find()` + `||`
  - 12: comparison / `find()` / `&&` / `||`の組み合わせ
- JavaScript Forest MID BOSS Battle 13
  - 新syntaxなし
  - TRACE / PULSE / NOVA / LINK / FORKのみ
  - comparison / property / `find()` / `&&` / `||`の理解確認
  - Random Encounterには入れない
  - JavaScript Area CLEARにはしない
- JavaScript Forest Learning Battle 14
  - `find()`と`filter()`を同じ`hp < 45`で比較
  - `GATHER`はexisting `allBelow` TargetRuleを再利用
  - Battle 13 clear後の固定Lessonで初導入
  - first clear後だけForest Random Encounter poolへ追加
- JavaScript Deep Forest Learning Battle 15
  - `GATHER: filter(hp < 45)`とexisting `ECHO: filter(hp > 65)`を比較
  - `filter()`の意味は変えず、比較条件の向きだけを変えて反復
  - first clear前のDeep Forest RandomはBattle 14だけ
  - first clear後はDeep Forest Randomへ14 / 15を追加
- TypeScript Battle 4〜6
- Training 7 → 8 → 9 → Forest 10 → 11 → 12 → MID BOSS 13 → filter 14 → Deep Forest filter repeat 15をfirst clearで順にunlock
- Trainingは各8 EXP / 0 Goldで既存economyを崩さない
- Forest / Deep Forestは少量のEXP / Goldを持ち、同じBattleを値 / enemy順 / code variant違いで再Encounterできる
- Storyで「普通の言葉 → 小さい記号 / property → syntax」の順に説明し、correct targetはPlayerへ残す
- `filter()`はBattle 14で初めて正式名称を導入し、Battle 15で条件違いでも意味を保つことを確認する
- SELECT → EXECUTE
- safe `TargetRule`; display codeを`eval()`しない
- seeded generation / solvability
- Encounterごとのsemantic code variation
- multiline + line-by-line CODE HELP
- CODE DATA inspector
- Boss GUARD
- staged result sequence

既存JS Battle 1〜3は**現在動くmain story baselineであって、JavaScript編の最終Battle数ではない**。Village Training 7〜9、Forest Learning 10〜12、MID BOSS 13、filter Lesson 14、Deep Forest filter repeat 15を、その前段のbeginner learning routeとして追加した。

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

### Implementation slices

完了:

1. multi-map基盤と`GREENFIELD VILLAGE`を追加（#201）
2. Villageにbeginner Training 7〜9を追加（#203）
   - comparison / property / collection / `find()`
   - Training進捗に応じたWorld objective
   - 旧saveにもTraining 7をbaseline unlockとして補う
   - TrainingのGold rewardは0
3. Village以西に`JAVASCRIPT FOREST`を追加し、`&&` / `||`を導入（#205）
   - Training 9 clearでForest入口を解放
   - Battle 10: `find()` + `&&`
   - Battle 11: `find()` + `||`
   - Battle 12: `&&` / `||`の組み合わせ
   - Forest Random Encounterは導入済み10〜12だけを段階的に反復
   - `filter()`はまだ先取りしない
   - Forest map / positionはRpgState v4のまま保存
4. JavaScript Forestに最初のMID BOSSを追加（#207）
   - Battle 12 clear後に西側main trailの固定objectからBattle 13へ進む
   - Battle 13はcomparison / property / `find()` / `&&` / `||`だけを使用
   - new syntax / new TargetRule / Boss GUARDを追加しない
   - Random Encounter pool / JavaScript Area CLEARへ混ぜない
   - #205時点のBattle 12 clear済みv4 saveへBattle 13 unlockを補う
   - clear後は次の「条件に合うものをまとめて集める」課題だけを普通の言葉で示す
5. 中Boss後のForestで`filter()`を導入（#209）
   - Battle 14で同じ`hp < 45`条件の`find()`と`filter()`を比較
   - `filter()` = 条件に合うものを最後まで見て全部集める、と普通の言葉から説明
   - existing `allBelow` TargetRuleをGATHERへ再利用し、Battle engineは変更しない
   - Battle 13 clear後、西側Woodsの固定Lessonとして初登場
   - Battle 14 clear前はRandom Encounterへ混ぜず、clear後だけ復習poolへ追加
   - #207時点のBattle 13 clear済みv4 saveへBattle 14 unlockを補う
6. Deep Forest入口で`filter()`を条件違いでも反復（#212）
   - `JAVASCRIPT DEEP FOREST` 27 × 19を追加
   - Battle 14 clearでForest西端のportalを解放
   - Battle 15で`GATHER: hp < 45`と`ECHO: hp > 65`を比較
   - new syntax / new TargetRuleを増やさず`filter()`の意味を反復
   - Battle 15 clear前のDeep Forest Randomは14だけ、clear後は14 / 15
   - #209時点のBattle 14 clear済みv4 saveへBattle 15 unlockを補う

次:

7. Deep Forestで`map()`を「集めたものを別の値 / 形へ変える」と普通の言葉から固定Lessonで導入する
8. `map()`を値 / enemy順 / code variant違いで反復する
9. `some()` / `every()`をboolean resultとして段階的に導入する
10. 2体目の中BossまたはDeep Forestの区切りで既習conceptを組み合わせる
11. existing Battle 1〜3を長いprogression内へ再配置 / 再役割化する

Battle engine / generatorを作り直さない。TargetRule追加が必要な場合も、表示codeの意味をsafe domainへ写す最小追加にする。

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