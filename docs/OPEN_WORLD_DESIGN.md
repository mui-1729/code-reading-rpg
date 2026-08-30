# CODE//READ RPG Open World Design

この文書は、**現在採用するWorld構造と拡張ルール**を扱う。project全体の現状は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、世界観は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、learning contentは[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、優先順位は[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. 目的

Stage Select / Area Selectを繰り返すのではなく、**Worldを歩き、村や地域へ入り、incidentを追いながらBattleを重ねること自体をRPGの進行にする**。

Open Worldを「1枚の巨大grid」とは定義しない。

```text
Title / Opening
↓
CODE WORLD
├─ Overworld
├─ Village map
├─ Forest map
└─ Deep Forest map
↓
Explore / NPC / Shop / Inn / Treasure
または
Story Incident / Encounter / Fixed Learning Battle / Boss
↓
Code Reading Battle
↓
Reward / Story / Progress
↓
元いたmapへ戻る、またはtraceの先のmapへ進む
```

通常導線へStage Select / Area Selectを戻さない。

## 2. Current implementation baseline

- Overworld 40 × 28
- camera viewport 11 × 9
- 4方向移動
- JavaScript = grass / tall grass / woods / deep woods
- TypeScript = forest
- Hub / road = safe
- mountain / water等はnon-walkable
- Playerはviewport overlay
- joined BYTEはprevious tileへ追従
- `GREENFIELD VILLAGE` 21 × 15
- `JAVASCRIPT FOREST` 31 × 21
- `JAVASCRIPT DEEP FOREST` 31 × 21
- `worldMapId + local worldPosition`でmulti-map化
- JavaScript Storyはnumeric Battle ID順ではなくsemantic progression keyで管理

## 3. Multi-map model

RpgStateは、

```text
worldMapId
worldPosition
```

を現在地として保存する。`worldPosition`はcurrent map内のlocal coordinate。

各mapは最低限次を定義する。

- stable map ID
- width / height
- region identity
- terrain resolver
- portal / exit
- encounter可否
- progress gate
- fixed object / fixed story trigger / fixed learning trigger

現在のJavaScript側:

```text
Opening incident
↓
Overworld
└─ GREENFIELD VILLAGE (`js-village`)
    └─ incident preparation: 7 → 8 → 9
↓
Overworld first live incident
Battle 1
↓
JAVASCRIPT FOREST (`js-forest`)
├─ Fixed trace: 10 → 11 → 12
├─ MID BOSS: 13
├─ Fixed impact-range trace: 14
├─ Random Encounter: clear済みLessonだけを反復
└─ west EXIT
    ↓
    JAVASCRIPT DEEP FOREST (`js-deep-forest`)
    ├─ entrance live incident: Battle 2
    ├─ Fixed trace repetition: 15
    ├─ Fixed trace: 16 map → 17 some → 18 every
    ├─ second MID BOSS: 19
    ├─ Fixed trace: 20 sort → 21 ?. / ?? → 22 reduce
    ├─ Random Encounter: clear済みLessonだけを反復
    └─ west EXIT after 22
        ↓
        Code Core approach
        ↓
        Final Boss 3
```

Village / Forest / Deep Forestは同じ`/world` route上でmapを切り替える。

`battleId`はsave / URL / runtime互換のstable identifierであり、chapter番号としてStory順を決めない。

## 4. JavaScript地方のmap identity

JavaScriptは自然系で統一する。

```text
Hub寄り: 開けた草原
↓
Village / incident preparation
↓
草原で最初の症状
↓
Forest / trace investigation
↓
中Boss
↓
Deep Forest入口で二つ目の症状
↓
第二MID BOSS
↓
最深部 / root trace
↓
Code Core Final Boss
```

洞窟・遺跡・地下・城塞をJavaScriptだけで使い切らない。

### GREENFIELD VILLAGE

- 21 × 15
- stable ID: `js-village`
- Random Encounterなし
- 中央のTRAINでBattle 7 → 8 → 9
- Trainingは独立したsyllabusではなく、Opening incidentのcodeを読むためのminimum preparation
- 南のEXITからOverworldへ戻る
- onboarding中にRandom Encounterを挟まないよう主要導線はroad

### JAVASCRIPT FOREST

- 31 × 21
- stable ID: `js-forest`
- road / woods / deep-woods / grass / river / mountain
- Overworld西側の入口から入る
- first live incident Battle 1 clear前は入口を通れない
- 東のEXITからOverworldへ戻る
- 西端のEXITからDeep Forestへ進む
- Deep Forest入口はBattle 14 clearで解放
- current map / positionはRpgState v4のまま保存・reload可能

Forestは空白を広げるmapではなく、**最初のincidentから伸びたtraceを西へ追い、新conceptが必要になった地点でfixed Battleを導入し、その途中で既習conceptだけをRandom Encounter反復するmap**。

### JAVASCRIPT DEEP FOREST

- 31 × 21
- stable ID: `js-deep-forest`
- woods / deep-woods主体でForestより密度の高い自然field
- east-west main trailと枝道を持つ
- 川はmain trail上だけ橋として通過できる
- 東のEXITからForestへ戻る
- Battle 14 clear前はForest側portalを通れない
- 初回進入後の最初のmovementでBattle 2をfixed live incidentとして開始
- Battle 2 clear後、Battle 15〜22を東→西のtraceに合わせてfixed-firstで導入
- second MID BOSS 19はRandom poolへ入れない
- Battle 22 clear後、西端のEXITからCode Core approachへ直接抜ける
- current map / positionはRpgState v4のまま保存・reload可能

Deep Forestは、二つのincidentが同じcall pathへ合流した場所として、`filter()`反復から`map()` / `some()` / `every()` / `sort()` / `?.` / `??` / `reduce()`までをroot cause調査の流れで読むJavaScript地方後半map。

## 5. Forest / Deep Forest progression

### Battle 1 — first live incident

Village 7〜9を完了した後、Overworld JavaScript側へ戻ってmovementすると固定で発生する。

- Random chance / minimum-step cooldownに依存しない
- 未clear中は逃走不可のfixed Story Battle
- clear後にForest入口を解放する
- Trainingで読んだ`hp` / `name` / `find()`を実際のtarget異常へ適用する
- Storyはcorrect targetを先に明かさない

### Battle 10〜12

Battle 1から続くtraceをForest東側から追う。

```text
東側 / 最初のWoods
→ Fixed 10: find() + &&
→ Random 10

中盤
→ Fixed 11: find() + ||
→ Random 10 / 11

西寄り
→ Fixed 12: && / || combined
→ Random 10 / 11 / 12
```

### Battle 13 — MID BOSS

- Forest西側main trailのfixed object
- Battle 12 clear前は開始不可
- tileへ直接moveせず、隣からINTERACT
- new syntaxなし
- Random Encounter poolへ入れない
- JavaScript Area CLEARへ接続しない
- clear後はMID BOSS tileをroad扱いにし、西側へ通過可能

### Battle 14 — impact range / filter() trace

MID BOSSを突破した後、西側main trailからWoodsへ入ると固定導入する。

```text
find()   = 最初の1体で止まる
filter() = 条件に合うものを最後まで見て全部集める
```

- Battle 13 clear前はFixed 14を発火しない
- Battle 14 clear前のRandom poolは10 / 11 / 12だけ
- Battle 14 clear後だけForest Random poolへ14を追加
- fixed BattleはRandom chance / minimum-step cooldownより優先
- Battle後はsame Forest map / positionへ戻る

### Battle 2 — second live incident

Battle 14 clear後、Forest西端からDeep Forestへ入る。最初のmovementで固定発生する。

- first incidentとForest traceを通過したことがcanonical prerequisite
- 複数targetへ広がった二つ目の症状を実際のstateで確認する
- 未clear中はDeep Forest learning route 15以降を始めない
- Random chanceでは初登場させない
- clear後、二つのincidentが同じDeep Forest traceへ入るStory roleを持つ

### Battle 15〜18 — Deep Forest前半

Battle 2 clear後に進行する。

```text
15: filter()を hp > 65 で反復
16: map() — 各要素を別のobjectへ変換
17: some() — 一体でも条件に合うかをbooleanで確認
18: every() — 全員が条件に合うかをbooleanで確認
```

- new conceptは東→西のfixed Battleで初登場
- fixed BattleはRandom chance / minimum-step cooldownより優先
- Random poolにはclear済みBattleだけを加える

### Battle 19 — second MID BOSS

- Battle 18後、Deep Forest奥で固定Battleとして導入
- `filter()` / `map()` / `some()` / `every()`だけを使用
- new syntaxを追加しない
- Random Encounter poolへ入れない
- 二つのincident traceが合流するjunctionを塞ぐStory roleを持つ
- clear後に最深部側の20〜22へ進める

### Battle 20〜22 — Deep Forest最深部

```text
20: sort() + [0] + intermediate value
21: map()でnested dataへ変換 → stats?.hp ?? Infinity
22: reduce() / aggregate
```

- Battle 20は`living → byHp → byHp[0]`の途中値へ分けて読む
- Battle 21は既習`map()` / `sort()`へ`?.` / `??`だけを足し、nested dataを安全に読む
- Battle 22は途中結果`best`を一つだけ持ちながら配列を集約する
- CODE DATAでBattle 20 / 21のintermediate collectionを確認できる
- 22 clear前にFinal Bossを開始できない
- 22 clear後は来た道を戻らずwest EXITからCode Coreへ直進する

### Final Boss

```text
22 clear
→ Deep Forest west EXIT
→ Code Core approach
→ Boss Battle 3
→ JavaScript Area CLEAR
→ REAL WORLD RETURN
```

Boss 3は`js-incident-first` / `js-incident-second` / `js-deep-reduce`を含むcanonical prerequisite chainがすべて成立するまで開始不可。単に`1 / 2 / 22`のclear bitだけを偽装しても後続をauthorizeしない。

JavaScript Area CLEARはBoss 3 clear時だけ維持する。

### Random Encounter pool

Forest:

```text
9 clear / 1未clear    → Forest未解放、OverworldでFixed Incident 1
1 clear / 10未clear  → Randomなし → Fixed 10
10 clear / 11未clear → Random 10 → Fixed 11
11 clear / 12未clear → Random 10 / 11 → Fixed 12
12 clear / 13未clear → Random 10 / 11 / 12 → MID BOSS 13
13 clear / 14未clear → Random 10 / 11 / 12 → Fixed 14
14 clear             → Random 10 / 11 / 12 / 14
```

Deep Forest:

```text
14 clear / 2未clear  → 最初のmovementでFixed Incident 2
2 clear / 15未clear  → Review 14 → Fixed 15
15 clear / 16未clear → Review 14 / 15 → Fixed 16
16 clear / 17未clear → +16 → Fixed 17
17 clear / 18未clear → +17 → Fixed 18
18 clear / 19未clear → +18 → Fixed MID BOSS 19
19 clear / 20未clear → review済みLesson → Fixed 20
20 clear / 21未clear → +20 → Fixed 21
21 clear / 22未clear → +21 → Fixed 22
22 clear             → +22をreview可能、west EXITからCode Core解放
```

Battle 1 / 2 / 13 / 19 / 3を未clearのRandom初登場には使わない。新conceptをRandom抽選で初登場させない。

## 6. World domain boundary

### `worldMap.ts`

担当:

- map ID / dimensions
- region / terrain
- walkable
- viewport
- Encounter terrain / chance
- portal / progress gate metadata
- fixed object positions
- Random Encounter pool
- adjacency

### `worldActions.ts`

UI / Routerへ依存しないpure resolver。

- movement / blocked
- map transition / progress gate
- fixed story Battle trigger
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

resolver結果を、

- RpgState update
- navigation
- audio
- short feedback
- visual rendering

へ接続するadapter。

map固有game ruleをWorldPageへ直接増やしすぎない。

## 7. Map transition / Battle return

PortalはWorld domainで解決する。

```text
fromMap / fromPosition
→ progress gate確認
→ toMap / toPosition
```

Battleの`returnTo=/world`は、RpgStateに保存されたcurrent map / positionへ戻るためそのまま利用する。

現在の主要portal gate:

```text
Overworld → JAVASCRIPT FOREST
requires: first live incident Battle 1 clear

JAVASCRIPT FOREST → JAVASCRIPT DEEP FOREST
requires: Battle 14 clear

JAVASCRIPT DEEP FOREST west EXIT → CODE CORE APPROACH
requires: Battle 22 clear
```

Final Bossはportalだけでauthorizeせず、semantic canonical progression graphのtransitive prerequisiteもBoss interaction / route guardで確認する。

## 8. Encounter rules

Random Encounter共通rule:

- minimum 5 steps cooldown
- terrainごとのEncounter chance
- `encounterCount`をseedへ含める
- local map IDもlocal-map seedへ含める
- same seedは再現可能
- fixed Story / learning BattleはRandom抽選より優先
- fixed Boss / MID BOSSはRandom Encounterと別intentまたはfixed progression Battleとして扱う
- 未学習conceptをRandomへ入れない
- JavaScript main story中のOverworldはRandom replayよりStory movementを優先する

Encounter回数だけを水増しせず、値 / enemy順 / code variant / concept組み合わせの差に意味を持たせる。

## 9. Persistent HP / Defeat

Battle開始HPはfull resetしない。

```text
RpgState.currentHp
↓
Battle
↓
RpgState.currentHpへ反映
↓
Victory
↓
same mapへ戻る
```

Defeat時だけ、

- `worldMapId = overworld`
- `worldPosition = WORLD_START`
- full HP
- Encounter cooldown reset

としてHubへ戻す。

## 10. Save migration / normalization

RpgState schemaはv4。

旧RpgState v1〜v3は、

```text
worldMapId = overworld
worldPosition = 旧worldPosition
```

としてmigrationする。

PlayerProgressもv4を維持する。restore時はcanonical graphからpresentation/cache用unlockを再導出する。

#261以前のsaveは旧Story順でForest / Deep Forestへ到達済みの可能性があるため、次をnormalizeする。

```text
Forest以降のstage clearあり
→ first incident Battle 1を論理的に通過済みとして補完

Deep Forest以降のstage clearあり
→ second incident Battle 2を論理的に通過済みとして補完

JavaScript Boss 3 clearあり
→ modern JavaScript canonical arc全体をcompletedとして補完
```

これにより、既存saveへ新しいStory beatを挿入しても、すでに通過した地域まで歩いて戻ることを強制しない。

未知map ID / bounds外positionはOverworld開始地点へfallbackする。

## 11. World Objective

current guidanceはWorld Objective。

現在のJavaScript route:

```text
BYTEと合流
→ GREENFIELD VILLAGE 7〜9: incident preparation
→ Overworld Fixed Incident 1
→ JAVASCRIPT FOREST 10〜12
→ MID BOSS 13
→ impact range / filter 14
→ DEEP FOREST入口 Fixed Incident 2
→ JAVASCRIPT DEEP FOREST 15〜18
→ second MID BOSS 19
→ root trace 20〜22
→ west EXIT / Code Core approach
→ Final Boss 3
→ REAL WORLD RETURN
```

Objectiveは「次にどこへ行き、なぜそのcodeを読む必要があるか」までは示してよいが、correct targetは示さない。

常設Quest Trackerを復活させない。

## 12. Visual identity reservation

- JavaScript: grassland / woods / forest / deep forest / river / nature village
- TypeScript: stone / crystal / rune / ruins / temple
- Database: underground / mine / archive / library

JavaScriptだけで後続region用の景観を使い切らない。

## 13. Testing

Unit:

- map dimensions / bounds
- terrain / viewport
- movement / blocked
- portal transition / progress gate
- Fixed Incident 1 after Training 9 and before Forest
- fixed learning trigger 10 → 11 → 12 → 14
- MID BOSS 13
- Fixed Incident 2 after Battle 14 and before Deep Forest 15
- fixed Deep Forest trigger 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22
- Forest / Deep Forest Random poolがclear済みLessonだけを返す
- Battle 13 / 19をRandomへ混ぜない
- Battle 1 / 2を未clear中のRandom replayへ混ぜない
- Battle 22後のwest EXIT → Code Core approach
- Final Boss 3 = full semantic/transitive prerequisite chain
- forged partial clear bitsでは後続をbypass不可
- old save incident normalization
- fixed objectが所属map外で誤発火しない

E2E:

- Overworld → Village / first live incident / Forest transition
- Village TRAIN 7 → 8 → 9
- Forest / Deep Forest map reload persistence
- Fixed 10〜12 / 14〜18 introduction
- second live incident 2 before Deep Forest learning
- MID BOSS 13 / 19 Story
- Battle 20 multiline intermediate value
- Battle 21 nested `stats?.hp ?? Infinity`
- Battle 22 reduce Story
- 22前Final Boss lock
- canonical route完了後Final Boss 3 start
- deep-link transitive route guard
- existing battle / HP / recovery / economy regression

PR前は`npm ci` / lint / unit / build / E2Eを通す。
