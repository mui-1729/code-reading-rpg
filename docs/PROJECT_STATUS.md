# CODE//READ RPG — Project Status

最終更新: 2026-08-31

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

## 3. JavaScript地方 — incident-driven learning route

JavaScriptは、**教材番号の順ではなく、Openingで起きたincidentを追う順番**で進む。

数値`battleId`は既存URL / save互換用のruntime identifierであり、chapter番号ではない。Story progressionは`js-training-hp` / `js-incident-first` / `js-final-code-core`等のsemantic keyで定義する。

```text
GREENFIELD VILLAGE
7: enemy.hp + < / >
8: enemy.name + ===
9: enemies + find()
↓
LIVE INCIDENT
1: Openingのtarget異常を実地で再現
↓
JAVASCRIPT FOREST
10: find() + &&
11: find() + ||
12: comparison / find() / && / || combined
13: MID BOSS — incident traceを塞ぐGuardian
14: find() と filter() を比較し影響範囲を追う
↓
SECOND SYMPTOM
2: 複数target側にも同じ異常が波及していることを確認
↓
JAVASCRIPT DEEP FOREST
15: filter()を hp > 65 でも反復
16: map() — 各要素を別の形へ変換
17: some() — 一体でも条件に合うかをbooleanで確認
18: every() — 全員が条件に合うかをbooleanで確認
19: 2nd MID BOSS — root traceを塞ぐGuardian
20: sort() + [0] + intermediate value
21: nested data + optional chaining ?. + nullish coalescing ??
22: reduce() — 途中結果を一つへ集約
↓
Deep Forest西口
↓
CODE CORE APPROACH
Final Boss 3
↓
JavaScript Area CLEAR / REAL WORLD RETURN
```

### Village 7〜9

- Opening incidentのlogを自分で読むための最低限の準備として、comparison / property / collection / `find()`を小さい単位から導入
- Trainingを受ける理由を「次のsyntaxだから」ではなく「実incidentを読む材料が足りないから」にする
- VillageではRandom Encounterなし
- 各8 EXP / 0 Gold

### First incident / Forest 10〜14

- 9 clear後、Overworld JavaScript側へ進むとBattle 1を固定Story Battleとして再現する
- Battle 1で「codeはruleどおりだが、現実の期待とtargetがずれている」と確認し、traceをForestへ追う
- Forest入口はBattle 1 clear後に開く
- `&&` / `||`を「incident traceがどのstateを通すか」を読むために固定Lesson 10〜12で導入
- Battle 13はnew syntaxなしのMID BOSS。単なる試験ではなくtraceを塞ぐ存在として扱う
- Battle 14で同じ`hp < 45`を使い、`find()`と`filter()`の「一体で止まる / 全部集める」を比較しながら影響範囲を広げる
- 未学習BattleはRandom Encounterへ入れない

### Second incident / Deep Forest 15〜22

- Battle 14後、Deep Forestへ入る最初の移動でBattle 2を固定Story Battleとして発生させる
- Battle 2では「一体だけでなく複数targetの処理にも同じ症状が出る」ことを確認し、REAL WORLD側のcall pathとも合流させる
- 15: `filter()`を`hp > 65`でも反復
- 16: `map()`を「一つずつ別の形へ変換する」と普通の言葉から導入
- 17 / 18: `some()` / `every()`を「一体でも / 全員」のboolean resultとして分ける
- 19: new syntaxなしの2nd MID BOSS
- 20: `living → byHp → byHp[0]`の途中値で`sort()`と複数行codeを読む
- 21: `map()`でnestedな`stats.hp`へ包み、`stats?.hp ?? Infinity`を読む
- 22: `reduce()`で`best`を更新しながら一つの結果へ集約する
- CODE DATAはBattle 20の`living / byHp`とBattle 21の`living / wrapped / stats.hp`を表示できる
- Random Encounterはclear済みLessonだけを段階的に反復し、Story Battle 2 / MID BOSS 19は混ぜない

### Final Boss

- Battle 22 clear後、Deep Forest西口から`CODE CORE APPROACH`へ直接抜ける
- 最後に草原へ戻ってBattle 1 / 2をやり直す導線は廃止
- OverworldではJavaScript main story中のRandom Encounterを抑え、Finalへ向かうStory momentumを維持する
- Final Boss 3はsemantic prerequisite chain全体を満たした後だけ開始可能
- Battle 3だけがJavaScript Area CLEARを発生させ、REAL WORLD RETURN / incident closeへつなぐ

## 4. Multi-map World

stable map:

- `overworld` — 40 × 28
- `js-village` — GREENFIELD VILLAGE 21 × 15
- `js-forest` — JAVASCRIPT FOREST 31 × 27
- `js-deep-forest` — JAVASCRIPT DEEP FOREST 31 × 27
- `ts-frontier` — TYPESCRIPT FRONTIER 31 × 21

共通:

- viewport 11 × 9
- `worldMapId + local worldPosition`をRpgState v4で保存
- `/world` route上でmap transition
- local mapからBattleへ入り、`returnTo=/world`でsame map / positionへ戻る
- Defeat時だけOverworld Hubへ戻す

Deep Forest fixed-first progression:

```text
14 clear → Deep Forestへ
↓
2 fixed second incident
↓
15 fixed first learning Battle
↓
x <= 24 → 16 map
x <= 19 → 17 some
x <= 14 → 18 every
x <= 10 → 19 MID BOSS
x <= 9  → 20 sort
x <= 7  → 21 ?. / ??
x <= 5  → 22 reduce
↓
西口 → CODE CORE APPROACH
```

fixed Story / learning BattleはRandom chance / cooldownより優先する。

## 5. Battle runtime

現在:

- JavaScript Battle 1〜3 / 7〜22
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- safe internal `TargetRule`; display codeを`eval()`しない
- seeded Enemy / Skill / code variation
- semantic code variation
- battle-aware learned-syntax policy
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
- Village 7〜9をincident preparationとして再文脈化
- Battle 1を序盤のlive incidentへ移動
- Forest 10〜14をincident traceとして再文脈化
- Battle 2をForest後 / Deep Forest入口のsecond symptomへ移動
- Deep Forest 15〜22 beginner-first pre / post Story
- MID BOSS 13 / 19をincident trace上の障害としてStoryへ接続
- Battle 22後は西口からCode Coreへ前進
- JavaScript中盤にREAL WORLD / ADA remote feedbackを再導入
- Final Boss 3 → JavaScript ending / REAL WORLD RETURN
- TypeScript既存Story
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- World Objective / BYTE guidance

JavaScriptのStory上の説明順:

```text
Opening incident
→ value / property
→ comparison
→ collection
→ find()
→ 実incident 1を再現
→ && / ||
→ filter()
→ 実incident 2で影響拡大を確認
→ map()
→ some() / every()
→ sort() / [0] / intermediate value
→ nested data / ?. / ??
→ reduce()
→ root causeへ到達
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
- 数値`battleId`はpersisted/runtime互換IDとして維持し、Story orderはsemantic progression graphへ分離
- prerequisiteはsemantic keyを再帰的に検証し、途中のclear bitだけでは後続を迂回できない

Canonical JavaScript progression:

```text
7 → 8 → 9
→ 1
→ 10 → 11 → 12 → 13 → 14
→ 2
→ 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22
→ 3
```

TypeScriptはJavaScript Final後に独立semantic keyで`4 → 5 → 6`へ進む。

旧route save互換:

- Forest以降へ進んでいる旧saveはBattle 1を論理的に通過済みとして補完
- Deep Forest以降へ進んでいる旧saveはBattle 2も補完
- 旧saveでJavaScript Boss 3撃破済みなら、現行JavaScript arc全体を完了済みとして正規化
- Skill unlockもclearedStageIdsからderived補完

## 9. Quality gate

回帰対象:

- Village 7 → 8 → 9
- 9後にBattle 1がfixed live incidentとして発生
- Battle 1前はForestへ進めない
- Forest 10 → 11 → 12 → 13 → 14
- 14後にBattle 2がDeep Forest入口でfixed second symptomとして発生
- Battle 2後にDeep Forest 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22
- clear済みconceptだけのRandom pool
- MID BOSS 13 / 19がRandomへ入らない
- Battle 20 / 21 CODE DATA intermediate values
- Battle 22後はDeep Forest西口からCode Core手前へ直接transition
- JavaScript Final前のOverworldで不要なRandom Encounterを挟まない
- Boss 3はfull semantic prerequisite chain完了までlocked
- Boss 3だけがJavaScript Area CLEAR
- old v1〜v4 save normalization
- forged / partial clear bitでprogressionを迂回できない
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

JavaScript地方のincident-driven routeが1地方として完結したため、gameplay変更を増やす前にIssue #196のBattle runtime responsibility splitを優先する。

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
