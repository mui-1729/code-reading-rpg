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
Fixed Learning Battle / Random Encounter / MID BOSS / Final Boss
↓
Code Reading Battle
↓
EXP / Gold / Item / Equipment / Story
↓
次のmap / learning conceptへ進む
```

通常導線へStage Select / Area Selectは戻さない。旧URLは互換redirectのみ残す。

## 3. JavaScript地方 — complete learning route

JavaScriptは、Village → Forest → Deep Forest → 最終異変 → Code Core Final Bossまで1地方としてつながる。

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
13: MID BOSS — 既習内容だけの理解確認
14: find() と filter() を比較
↓
JAVASCRIPT DEEP FOREST
15: filter()を hp > 65 でも反復
16: map() — 各要素を別の形へ変換
17: some() — 一体でも条件に合うかをbooleanで確認
18: every() — 全員が条件に合うかをbooleanで確認
19: 2nd MID BOSS — filter / map / some / every理解確認
20: sort() + [0] + intermediate value
21: nested data + optional chaining ?. + nullish coalescing ??
22: reduce() — 途中結果を一つへ集約
↓
OVERWORLD FINAL INCIDENT
1 → 2
↓
CODE CORE
Final Boss 3
↓
JavaScript Area CLEAR / REAL WORLD RETURN
```

### Village 7〜9

- comparison / property / collection / `find()`を小さい単位から導入
- VillageではRandom Encounterなし
- 各8 EXP / 0 Gold

### Forest 10〜14

- `&&` / `||`を固定Lesson 10〜12で順番に導入
- Battle 13はnew syntaxなしのMID BOSS
- Battle 14で同じ`hp < 45`を使い、`find()`と`filter()`の「一体で止まる / 全部集める」を比較
- 未学習BattleはRandom Encounterへ入れない

### Deep Forest 15〜22

- 15: `filter()`を`hp > 65`でも反復
- 16: `map()`を「一つずつ別の形へ変換する」と普通の言葉から導入
- 17 / 18: `some()` / `every()`を「一体でも / 全員」のboolean resultとして分ける
- 19: new syntaxなしの2nd MID BOSS
- 20: `living → byHp → byHp[0]`の途中値で`sort()`と複数行codeを読む
- 21: `map()`でnestedな`stats.hp`へ包み、`stats?.hp ?? Infinity`を読む
- 22: `reduce()`で`best`を更新しながら一つの結果へ集約する
- CODE DATAはBattle 20の`living / byHp`とBattle 21の`living / wrapped / stats.hp`を表示できる
- Random Encounterはclear済みLessonだけを段階的に反復し、MID BOSS 19は混ぜない

### Final incident / Final Boss

- Battle 22まで終える前はOverworld JavaScript Randomで既存Battle 1 / 2を先出ししない
- 22 clear後、Overworldへ戻るとBattle 1 → 2を最終異変の確認戦として再接続する
- Final Boss 3は**22 + 1 + 2 clear後だけ**開始可能
- Battle 3だけがJavaScript Area CLEARを発生させ、既存REAL WORLD RETURN Storyへつなぐ

## 4. Multi-map World

stable map:

- `overworld` — 40 × 28
- `js-village` — GREENFIELD VILLAGE 21 × 15
- `js-forest` — JAVASCRIPT FOREST 31 × 21
- `js-deep-forest` — JAVASCRIPT DEEP FOREST 31 × 21

共通:

- viewport 11 × 9
- `worldMapId + local worldPosition`をRpgState v4で保存
- `/world` route上でmap transition
- local mapからBattleへ入り、`returnTo=/world`でsame map / positionへ戻る
- Defeat時だけOverworld Hubへ戻す

Deep Forest fixed-first progression:

```text
14 clear → Deep Forest open
15 fixed first
↓
x <= 24 → 16 map
x <= 19 → 17 some
x <= 14 → 18 every
x <= 10 → 19 MID BOSS
x <= 9  → 20 sort
x <= 7  → 21 ?. / ??
x <= 5  → 22 reduce
```

fixed learning BattleはRandom chance / cooldownより優先する。

## 5. Battle runtime

現在:

- JavaScript Battle 1〜3 / 7〜22
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

JavaScript learning routeで使うsafe rule:

```text
firstBelow / firstAbove
allBelow / allAbove
named
firstAboveAndNamed
firstBelowOrAbove
allIfAnyBelow
allIfEveryBelow
lowestHp
highestAttack
```

`every()`導入のため追加した`allIfEveryBelow`以外はexisting ruleをできるだけ再利用する。

## 6. Story / onboarding

実装済み:

- REAL WORLD → CONNECT → CODE WORLD Opening
- Village 7〜9 beginner-first Story
- Forest 10〜14 beginner-first Story
- Deep Forest 15〜22 beginner-first pre / post Story
- MID BOSS 13 / 19 Story
- existing Battle 1 / 2 final incident Story
- Final Boss 3 → JavaScript ending / REAL WORLD RETURN
- TypeScript既存Story
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- World Objective / BYTE guidance

JavaScript説明順:

```text
value / property
→ comparison
→ collection
→ find()
→ && / ||
→ filter()
→ map()
→ some() / every()
→ sort() / [0] / intermediate value
→ nested data / ?. / ??
→ reduce()
→ 実際の異変1 / 2
→ Final Boss
```

Story / CODE HELPは読み方を説明するが、現在盤面のcorrect target名 / 対象数はPlayerへ残す。

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
- save schema bumpなしでJavaScript routeをderived補完

Derived progression:

```text
9 clear  → 10
10 clear → 11 + LINK
11 clear → 12 + FORK
12 clear → 13
13 clear → 14
14 clear → 15 + GATHER
15 clear → 16 + ECHO
16 clear → 17 + PROJECT
17 clear → 18 + SIGNAL
18 clear → 19 + SYNC
19 clear → 20
20 clear → 21 + ORDER
21 clear → 22 + SAFE PATH
22 clear → REDUCE FOCUS
```

既存v4 saveから、clearedStageIdsに応じて後続routeへ進める。

## 9. Quality gate

回帰対象:

- Village 7 → 8 → 9
- Forest 10 → 11 → 12 → 13 → 14
- Deep Forest gate / reload persistence
- Fixed 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22
- clear済みconceptだけのRandom pool
- MID BOSS 13 / 19がRandomへ入らない
- Battle 20 / 21 CODE DATA intermediate values
- Battle 22前は旧Battle 1 / 2を先出ししない
- 22後はBattle 1 → 2へ再接続
- Boss 3は22 + 1 + 2 clearまでlocked
- Boss 3だけがJavaScript Area CLEAR
- old v4 save normalization
- existing TypeScript / economy / save semantics

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

## 10. 次のP1

JavaScript地方のlearning routeが1地方として完結したため、gameplay変更を増やす前にIssue #196のBattle runtime responsibility splitを優先する。

その後:

1. TypeScript地方のvisual / beginner Story pass
2. TypeScript専用Boss mechanicの必要性検証
3. Database編prototype

JavaScriptへ新しいsyntaxを無制限に足し続けない。

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
