# CODE//READ RPG — Project Status

最終更新: 2026-08-29

この文書は、**このゲームが何を目指していて、今どこまで実装され、次に何を作るべきか**を短く把握するためのcurrent snapshotです。

詳細は、世界観[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、World構造[`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)、learning content基準[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、優先順位[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. North Star

`CODE//READ RPG`は、コードを書く練習ではなく、**既存コードを読んで「現在のstateに対して何が起きるか」を判断する力を、fantasy RPGを遊びながら身につけるゲーム**。

> **コードを知らない人でもRPGとして入り、世界のruleとしてコードを少しずつ読み、気づいたら自分でJavaScriptを追えるようになっている。**

コア原則:

- Battleのtarget / effect判断は表示コードを読んで行う
- Story / NPCは読み方を教えるがcorrect targetは教えない
- technical termは「普通の言葉 → 意味 → 正式名称」の順で導入する
- 同じconceptを値 / enemy順 / code variantを変えて反復する
- RPG成長はcode readingを代替しない
- Worldは1枚gridへ固定せず、意味のある複数mapを行き来できる
- JavaScript地方は自然系、TypeScriptはstone / crystal / ruins、Databaseは地下 / archive方向を基本にする

## 2. 現在のプレイ構造

```text
Title
↓
REAL WORLD briefing
↓ CONNECT
CODE WORLD
Overworld / Village / Forest / Deep Forestを探索
↓
Fixed Learning Battle / Random Encounter / Boss
↓
Code Reading Battle
↓
EXP / Gold / Item / Equipment / Story
↓
次のmap / learning conceptへ進む
```

通常導線へStage Select / Area Selectは戻さない。旧URLは互換redirectのみ残す。

## 3. JavaScript beginner route

既存JavaScript Battle 1〜3はmain story baselineだが、**JavaScript編を3戦だけで完結させる前提は撤回済み**。

現在のbeginner route:

```text
GREENFIELD VILLAGE
Battle 7: enemy.hp + < / >
↓
Battle 8: enemy.name + ===
↓
Battle 9: enemies + find()
↓
JAVASCRIPT FOREST
Battle 10: find() + &&
↓
Battle 11: find() + ||
↓
Battle 12: comparison / find() / && / || combined
↓
MID BOSS Battle 13: 既習内容だけの理解確認
↓
Battle 14: find() と filter() を比較
↓
JAVASCRIPT DEEP FOREST
Battle 15: filter()を hp > 65 でも反復
```

### Battle 7〜9 — Village Training

- comparison / property / collection / `find()`を小さい単位から導入
- 各8 EXP / 0 Gold
- `TRACE` / `PULSE` / `NOVA`を使用
- VillageではRandom Encounterなし

### Battle 10〜12 — Forest logic lessons

- 10: `find()` + `&&`
- 11: `find()` + `||`
- 12: `&&` / `||` combined
- 新conceptは固定Lessonで導入し、clear済みBattleだけをRandom Encounterで反復
- `LINK` / `FORK`を追加

### Battle 13 — 最初のForest MID BOSS

- comparison / property / `find()` / `&&` / `||`だけを使用
- new syntax / new TargetRule / Boss GUARDなし
- Forest Random poolへ入れない
- JavaScript Area CLEARにしない
- clear後はMID BOSS tileを通過可能にし、西側へ進める

### Battle 14 — filter() introduction

- `find()`と`filter()`を同じ`hp < 45`条件で比較
- `find()` = 前から見て最初の1体で止まる
- `filter()` = 最後まで見て条件に合うものを全部集める
- `GATHER`を追加し、existing `allBelow` TargetRuleを再利用
- Battle 13 clear後、西側Woodsの固定Lessonとして初登場
- Battle 14 clear前はRandom Encounterへ混ぜない
- clear後だけBattle 14をForest復習poolへ加える
- Story / CODE HELPは読み方まで説明し、現在盤面の対象数・Enemy名はPlayerに残す

### Battle 15 — Deep Forest filter() repetition

- `filter(e => e.hp > 65)`を既存`ECHO`で読む
- `<`から`>`へ条件方向が変わっても、filter()は最後まで見て全部集めることを確認
- existing `allAbove` TargetRuleを再利用しnew TargetRuleなし
- Battle 14 clear後にDeep Forestへ入り、最初のEncounter terrainでRandomより先に固定導入
- Battle 15 clear前のDeep Forest RandomはBattle 14だけ
- clear後はBattle 14 / 15を値・並び・code variant違いで反復

## 4. Multi-map World

現在のstable map:

- `overworld` — 40 × 28
- `js-village` — GREENFIELD VILLAGE 21 × 15
- `js-forest` — JAVASCRIPT FOREST 31 × 21
- `js-deep-forest` — JAVASCRIPT DEEP FOREST 31 × 21

共通:

- viewport 11 × 9
- `worldMapId + local worldPosition`をRpgState v4で保存
- `/world` route上でmap transition
- Village / Forest / Deep ForestからBattleへ入り、`returnTo=/world`で同じmap / positionへ戻る
- Defeat時だけOverworld Hubへ戻す

Forest / Deep Forest progression:

```text
9 clear / 10未clear
→ Randomなし
→ Fixed 10

10 clear / 11未clear
→ Random 10
→ Fixed 11

11 clear / 12未clear
→ Random 10 / 11
→ Fixed 12

12 clear / 13未clear
→ Random 10 / 11 / 12
→ MID BOSS 13

13 clear / 14未clear
→ MID BOSSの先へ進める
→ Randomは10 / 11 / 12のまま
→ 西側WoodsでFixed 14

14 clear
→ Forest Random 10 / 11 / 12 / 14
→ Forest西端からDeep Forestへtransition

Deep Forest / 15未clear
→ RandomはBattle 14だけ
→ 最初のEncounter terrainでFixed 15

15 clear後
→ Deep Forest Random 14 / 15
```

未学習conceptをRandom抽選で先に見せない。

## 5. Battle runtime

現在:

- JavaScript main Battle 1〜3
- JavaScript beginner Battle 7〜15
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- safe internal `TargetRule`; display codeを`eval()`しない
- seeded Enemy / Skill / code variation
- semantic-equivalent code variants
- solvability / uniqueness regression tests
- CODE HELP / CODE DATA
- Boss GUARD
- staged result sequence
- persistent HP

Forest / Deep Forestで追加・再利用しているsafe rule:

```text
firstAboveAndNamed
firstBelowOrAbove
allBelow
allAbove
```

Battle 14 / 15はnew TargetRuleを増やさず、existing `allBelow` / `allAbove`を利用する。

## 6. Story / onboarding

実装済み:

- REAL WORLD → CONNECT → CODE WORLD Opening
- JavaScript main Battle Story
- Village Training 7〜9 beginner-first Story
- Forest 10〜12 beginner-first pre / post Story
- MID BOSS 13 pre / post Story
- filter Lesson 14 pre / post Story
- Deep Forest filter Lesson 15 pre / post Story
- TypeScript既存Story
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- World Objective / BYTE guidance

現在のJavaScript説明順:

```text
value / property
→ comparison
→ collection
→ find()
→ && / ||
→ MID BOSSで既習内容を確認
→ 「全部集める」という意味
→ filter()
→ filter()を< / >の条件違いで反復
```

## 7. RPG / Economy

実装済み:

- Weapon / Armor / Accessory
- Shop / explicit equip
- PATCH KIT: Battle only / 1 use per Battle
- paid Inn
- first-clear / replay Gold
- Treasure
- BYTE party / follower

Economy / Equipmentはcorrect targetを変えず、survivabilityとRPG progressionだけへ作用する。

## 8. Persistence / compatibility

- `PlayerProgress` schema v4
- `RpgState` schema v4
- RpgState v1〜v3 → v4 migration
- current `worldMapId + local worldPosition`を保存
- unknown map / bounds外locationはHubへfallback
- save schema bumpなしでForest / Deep Forest progressionをderived補完

Derived progression:

```text
9 clear  → Stage 10
10 clear → Stage 11 + LINK
11 clear → Stage 12 + FORK
12 clear → Stage 13
13 clear → Stage 14
14 clear → Stage 15 + GATHER
15 clear → ECHO
```

#203 / #205 / #207 / #209時点の既存v4 saveから、その時点以降のJavaScript learning routeへ進める。

## 9. Quality gate

回帰対象:

- Village TRAIN 7 → 8 → 9
- Forest gate / transition / reload persistence
- Fixed Lesson 10 → 11 → 12
- clear済みconceptだけのRandom pool
- MID BOSS 13 gate / Story / clear後の道開通
- Battle 14 fixed introduction / `find()` vs `filter()` Story
- Battle 14 clear前後のForest Random pool
- Battle 14 clear gate → Deep Forest transition / reload persistence
- Deep Forest Fixed 15 / filter()条件違いStory
- Battle 15 clear前後のDeep Forest Random pool
- old v4 save normalization
- existing JS 1〜3 / TS / economy / save semantics

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

## 10. 次のP0

Battle 15までで`filter()`を条件違いでも読めるところまで固めた。ここからJavaScript地方を最後まで作り切る。

順序:

1. Deep Forestで`map()`を「集めたものを別の値へ変える」と普通の言葉から導入
2. `some()` / `every()`を「一体でもあるか / 全員そうか」のboolean resultとして段階的に導入
3. 2体目の中Bossで`filter()` / `map()` / `some()` / `every()`を組み合わせて理解確認
4. 最深部への道で`sort()`、multiline / intermediate valueを導入
5. optional chaining / nullish coalescingをnested dataの安全な読み取りとして導入
6. `reduce()` / aggregateを終盤の集約処理として導入
7. existing Battle 1〜3を長いprogressionへ再配置 / 再役割化
8. 最深部Final Bossを倒した時だけJavaScript Area CLEARにし、REAL WORLD RETURNまで完結

大規模な新規regionへ入る前にはIssue #196のBattle runtime responsibility splitも行う。

## 11. 現在残っている整理対象

- `src/App.tsx` — Battle runtime orchestrationが大きい（Issue #196）
- `src/world/WorldPage.tsx` — resolver分離済みだがUI adapter責務が多い
- `src/ui/PauseMenu.tsx` — tabs presentationが1file
- legacy Field / Quest dataはmigration / regression用途を確認しながら段階的に整理

## 12. 当面やらない

- Stage Select / Area Select復活
- Login / Cloud Save / Ranking
- auto target / auto battle
- Random Encounter回数だけの水増し
- 空白だけ増える巨大map
- JavaScriptだけで遺跡 / 地下 / 城塞を使い切ること
- Storyによるcorrect target公開
- gameplay変更と大規模refactorを同じPRへ混ぜること