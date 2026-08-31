# CODE//READ RPG Open World Design

この文書は、**現在採用するWorld構造と拡張ルール**を扱う。project全体の現状は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、世界観は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、learning contentは[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、優先順位は[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. 目的

Stage Select / Area Selectを繰り返すのではなく、**Worldを歩き、incidentを追いながら必要なcodeを読むこと自体をRPGの進行にする**。

JavaScript編では次を守る。

```text
現象を先に体験
→ 何が読めなかったか分かる
→ 必要な読み方だけを小さく学ぶ
→ 同じincidentのtraceを先へ追う
→ root causeへ到達
```

「教材を先に全部終えてからincidentへ戻る」構造にはしない。

Open Worldを「1枚の巨大grid」とは定義しない。意味のある地域ごとに独立mapを持たせる。

## 2. Current map model

stable map:

- `overworld` — 40 × 28
- `js-village` — GREENFIELD VILLAGE 21 × 15
- `js-forest` — JAVASCRIPT FOREST 31 × 27
- `js-deep-forest` — JAVASCRIPT DEEP FOREST 31 × 27
- `ts-frontier` — TYPESCRIPT FRONTIER 31 × 21

共通:

- viewport 11 × 9
- `worldMapId + local worldPosition`をRpgStateへ保存
- `/world` route上でmap transition
- Battle後は原則same map / positionへ戻る
- Defeat時だけOverworld Hubへ戻す
- VillageはRandom Encounterなし
- fixed Story / learning BattleはRandom chance / cooldownより優先

## 3. JavaScript incident-first route

player-facing Story番号:

```text
Opening
↓
JS-01 LIVE INCIDENT
↓
GREENFIELD VILLAGE
JS-02 → JS-03 → JS-04
↓
JAVASCRIPT FOREST
JS-05 → JS-06 → JS-07 → JS-08 MID BOSS → JS-09
↓
JS-10 SECOND SYMPTOM
↓
JAVASCRIPT DEEP FOREST
JS-11 → JS-12 → JS-13 → JS-14
→ JS-15 MID BOSS
→ JS-16 → JS-17 → JS-18
↓
west EXIT
↓
CODE CORE APPROACH
↓
JS-19 ROOT CAUSE / Final Boss
↓
REAL WORLD RETURN
```

internal numeric `battleId`はsave / URL互換用であり、chapter番号ではない。

```text
JS-01 -> 1
JS-02 -> 7
JS-03 -> 8
JS-04 -> 9
JS-05 -> 10
JS-06 -> 11
JS-07 -> 12
JS-08 -> 13
JS-09 -> 14
JS-10 -> 2
JS-11 -> 15
JS-12 -> 16
JS-13 -> 17
JS-14 -> 18
JS-15 -> 19
JS-16 -> 20
JS-17 -> 21
JS-18 -> 22
JS-19 -> 3
```

Story順のauthorityはsemantic progression key。numeric IDの大小を進行順に使わない。

## 4. Portal / gate authority

portal gateは`src/world/worldMap.ts`の`WORLD_PORTALS`をauthorityにする。`WorldPage`や`worldActions`へmap固有の同条件を重複実装しない。

現在:

```text
Overworld → GREENFIELD VILLAGE
requires: internal Battle 1 clear = JS-01 clear

Overworld → JAVASCRIPT FOREST
requires: internal Battle 9 clear = JS-04 clear

JAVASCRIPT FOREST → DEEP FOREST
requires: internal Battle 14 clear = JS-09 clear

DEEP FOREST west EXIT → CODE CORE APPROACH
requires: internal Battle 22 clear = JS-18 clear

Overworld → TYPESCRIPT FRONTIER
requires: JavaScript Final internal Battle 3 clear = JS-19 clear
```

重要:

- JS-01前にVillageへ入れてはいけない
- JS-01だけ終えてTrainingを飛ばしてForestへ行けてはいけない
- JS-04後はfirst incidentを再戦させずForestへ進む
- JS-18後は来た道を戻らずCode Coreへ直接進む

## 5. GREENFIELD VILLAGE

役割はtutorial syllabusではなく、**JS-01でPlayerが読めなかった部分を切り出して確認する場所**。

- Random Encounterなし
- TRAINでJS-02 / 03 / 04
- `hp` / comparison
- `name` / `===`
- `find()`
- 南EXITからOverworldへ戻る

JS-01のStoryで「全部理解してから来い」と要求しない。まず症状を見せ、MIOが必要な部分だけを小さく分解する。

## 6. JAVASCRIPT FOREST

役割は**JS-01から伸びたtraceを追う地域**。

- 東から西へmain trail
- safe side branch / treasureあり
- JS-05: `find() + &&`
- JS-06: `find() + ||`
- JS-07: combined conditions
- JS-08: MID BOSS、new syntaxなし
- JS-09: `find()` vs `filter()`でimpact range確認
- clear済みLessonだけRandom reviewへ追加
- MID BOSSをRandom poolへ入れない

新conceptはRandom抽選で初登場させない。

## 7. JAVASCRIPT DEEP FOREST

役割は**二つの症状が合流したshared traceをroot causeまで追う地域**。

入口付近:

- JS-09後に進入可能
- 最初のStory movementでJS-10 second symptomを固定発生
- JS-10未clear中はJS-11以降を始めない

東→西:

```text
JS-11 filter() repetition
JS-12 map()
JS-13 some()
JS-14 every()
JS-15 Root Guardian
JS-16 sort() + [0]
JS-17 nested data + ?. + ??
JS-18 reduce()
```

- Root Guardianはnew syntaxなし
- Random reviewはclear済みLessonだけ
- Story Battle / MID BOSSをRandom初登場に使わない
- JS-18 clearでwest EXITを解放
- west EXITのtargetはCode Core南側。草原へ戻して旧Battleを消化させない

## 8. Fixed Story Battle policy

### JS-01 first live incident

- Opening後、BYTE合流後のJavaScript側Overworld movementで固定発生
- Random chanceへ依存しない
- Playerはまだ全部のcodeを説明できなくてよい
- current stateと「実際に何が起きたか」を観察させる
- post StoryでVillageへ行く理由を作る

### JS-10 second symptom

- JS-09後、Deep Forest入口で固定発生
- Forestで追ったimpact rangeが別機能にも広がっていることを確認
- REAL WORLD側feedbackとCODE WORLD traceを再接続する

固定Story Battleは「テスト」ではなく、Story上の現象そのもの。

## 9. Random Encounter policy

目的は既習conceptの反復。新知識の導入ではない。

Forest:

```text
JS-04 clear / JS-05未clear → Fixed JS-05
JS-05 clear              → JS-05をreview可能
JS-06 clear              → JS-05 / 06
JS-07 clear              → JS-05 / 06 / 07
JS-08はRandomへ入れない
JS-09 clear              → JS-09もreview可能
```

Deep Forest:

```text
JS-09 clear / JS-10未clear → Fixed JS-10
JS-10 clear                → Fixed JS-11開始
以後                       → clear済みLessonだけreview
JS-15はRandomへ入れない
```

OverworldのJavaScript main story中はreplay Random Encounterを抑え、Story momentumを優先する。

## 10. World domain boundary

### `worldMap.ts`

- map ID / dimensions
- region / terrain
- walkable
- viewport
- portal / progress gate metadata
- fixed object positions
- Random Encounter pool helper
- adjacency

### `worldActions.ts`

UI / Routerへ依存しないpure resolver。

- movement / blocked
- portal metadataに基づくtransition
- fixed Story Battle trigger
- fixed learning Battle trigger
- steps / Encounter cooldown
- deterministic Random Encounter intent
- BYTE / Shop / Recovery / Treasure / Boss interaction

### `RpgState`

- current map ID
- local position
- Encounter pacing
- current HP
- RPG persistent state

### `WorldPage.tsx`

resolver結果をnavigation / audio / short feedback / visual renderingへ接続するadapter。

map固有game ruleを`WorldPage.tsx`へ増やしすぎない。

## 11. Save compatibility

旧saveを新しいStory順へ無理に巻き戻さない。

- 旧Training以降へ進行済み → JS-01を論理的に通過済みとして補完
- 旧Deep Forest以降へ進行済み → JS-10相当のsecond symptomも補完
- JavaScript Boss clear済み → modern JS arc全体をcompletedとしてnormalize

numeric `battleId`を維持する理由はこの互換性。今後chapter追加時にnumeric IDを振り直す理由には使わない。

## 12. Future region rule

TypeScript / Database等も同じ設計原則を使う。

```text
現象を先に体験
→ region内で必要な概念を読む
→ 同じproblemのtraceを追う
→ root cause
```

ただしvisual identityや学習内容はregionごとに変える。

- JavaScript: natural / grass / forest
- TypeScript: stone / crystal / ruins
- Database: underground / archive候補

各regionは独立したplayer-facing番号系列を持つ。JSのlegacy numeric IDへ続き番号を要求しない。
