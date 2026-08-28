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

優先順位:

1. code readingが実際のgame decisionになっているか
2. コード未経験者がStory / dialogueを理解できるか
3. fantasy RPGとして探索・戦闘・成長が楽しいか
4. 同じconceptを十分反復してから次へ進めているか
5. RPG成長がcode readingを代替していないか
6. current runtime / save / testsを壊さず拡張できるか

---

## Current foundation

### World / progression

- Overworld 40 × 28 + camera 11 × 9
- multi-map: `worldMapId + local worldPosition`
- `GREENFIELD VILLAGE` 21 × 15
- `JAVASCRIPT FOREST` 31 × 21
- `JAVASCRIPT DEEP FOREST` 27 × 19
- VillageはRandom Encounterなし
- Forest / Deep Forestは学習済みconceptだけをRandom Encounterで反復
- Forestに固定MID BOSS
- Forest西端→Deep ForestはBattle 14 clearで解放
- Shop / Inn / Treasure / BYTE follower
- `PlayerProgress v4` / `RpgState v4`

### JavaScript beginner route

```text
Village 7: hp + < / >
→ 8: name + ===
→ 9: collection + find()
→ Forest 10: find() + &&
→ 11: find() + ||
→ 12: && / || combined
→ MID BOSS 13: 既習内容だけ
→ 14: find() と filter() を同じ hp < 45 で比較
→ Deep Forest 15: filter() を hp > 65 でも反復
```

Battle 15までの原則:

- 新conceptは固定Lessonで初登場
- clear前はRandom poolへ入れない
- Storyは読み方を教えるがcorrect target名 / 対象数は教えない
- Battle engine / TargetRuleを不要に増やさない
- old v4 saveはschema bumpせずderived unlockで継続可能にする

既存JS Battle 1〜3はmain story baselineであり、JavaScript編の最終Battle数ではない。

---

## P0 — JavaScript地方 / learning route expansion

Databaseへ急がず、まずJavaScriptをRPGの1地方として十分に深掘る。

### Beginner-first rule

```text
普通の言葉
→ 小さい式 / 記号
→ syntaxの意味
→ current dataへ適用
→ 値 / enemy順 / code variantを変えて反復
→ 既習conceptと組み合わせる
→ 中Boss
```

Story / NPCは「どう読むか」を教えてよいが、correct targetは教えない。

### Learning ladder candidate

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

### Battle rhythm

最終目安:

- normal Battle / Encounter: 20〜30回程度
- fixed learning Battle: 8〜12程度を候補
- mid-boss: 2〜3体候補
- final boss: 1体

数値はquotaではない。

### Completed slices

1. #201 — multi-map基盤 + GREENFIELD VILLAGE
2. #203 — Village Training 7〜9
3. #205 — JAVASCRIPT FOREST + && / || Battle 10〜12
4. #207 — 最初のForest MID BOSS Battle 13
5. #209 — `find()`との比較から`filter()`をBattle 14で導入
6. #212 — `JAVASCRIPT DEEP FOREST` + Battle 15で`filter()`を条件違いでも反復
   - `GATHER`: `filter(hp < 45)`
   - existing `ECHO`: `filter(hp > 65)`
   - filter()の意味は同じ、条件の向きだけ変わると確認
   - Deep Forest Randomは15 clear前=14のみ、clear後=14/15
   - new syntax / new TargetRuleなし

### Next slices

7. **Deep Forestで`map()`を初心者向けに初導入する**
   - 「集めたものを別の値 / 形へ変える」と普通の言葉から始める
   - `filter()`との役割差を盤面で確認する
   - 未学習`some()` / `every()`を同じPRへ混ぜない
8. `map()`を値 / enemy順 / code variant違いで反復する
9. `some()`を「1つでもあるか → true / false」として固定Lessonで導入
10. `every()`を「全部当てはまるか → true / false」として導入
11. 2体目の中Boss / Deep Forest checkpointで`filter()`以降を組み合わせる
12. existing Battle 1〜3を長いprogression内へ再配置 / 再役割化する

Battle engine / generatorを作り直さない。TargetRule追加が必要な場合も、表示codeの意味をsafe domainへ写す最小追加にする。

---

## P1 — Battle runtime responsibility split (#196)

`src/App.tsx`へ集まっているBattle session / action / enemy turn / story / result handoff責務をgameplay-neutralに分離する。

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

Storyはtechnical termより意味を先に説明する。

既存Battle 4〜6のlearning内容は活かす。

---

## P2 — Database編 prototype

JavaScript / TypeScriptを十分に整え、Battle runtime boundaryを整理したあとprototypeする。

### Learning candidate

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

## Maintenance backlog

- Issue #196: App.tsx Battle runtime責務分割
- WorldPage / PauseMenu presentation分割は専用Issueで行う
- legacy Field / Quest definitionの残存参照を段階的に減らす
- historical docsとcurrent source of truthを混ぜない
- save compatibility fieldをunusedだけで削除しない

---

## 当面増やさないもの

- Stage Select / Area Select
- 複雑なQuest Log
- 大量の常設HUD
- auto target / auto battle
- Random Encounter回数だけの水増し
- 空白だけ増える巨大map
- JavaScriptだけで後続region用の景観を使い切ること
- Storyによるcorrect target公開
- gameplay変更と大規模refactorを同じPRへ混ぜること
