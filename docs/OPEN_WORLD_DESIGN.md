# CODE//READ RPG Open World Design

この文書は、**現在採用するWorld構造と拡張ルール**を扱う。project全体の現状は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、世界観は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、learning contentは[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、優先順位は[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. 目的

Stage Select / Area Selectを繰り返すのではなく、**Worldを歩き、村や地域へ入り、Battleを重ねること自体をRPGの進行にする**。

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
Encounter / Fixed Learning Battle / Boss
↓
Code Reading Battle
↓
Reward / Story / Progress
↓
元いたmapへ戻る
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
- fixed object / fixed learning trigger

現在のJavaScript側:

```text
Overworld
├─ GREENFIELD VILLAGE (`js-village`)
│   └─ TRAIN: 7 → 8 → 9
└─ JAVASCRIPT FOREST (`js-forest`)
    ├─ Fixed Lesson: 10 → 11 → 12
    ├─ MID BOSS: 13
    ├─ Fixed filter Lesson: 14
    ├─ Random Encounter: clear済みLessonだけを反復
    └─ west EXIT
        ↓
        JAVASCRIPT DEEP FOREST (`js-deep-forest`)
        ├─ Fixed filter repetition: 15
        ├─ Fixed Lesson: 16 map → 17 some → 18 every
        ├─ second MID BOSS: 19
        ├─ Fixed Lesson: 20 sort → 21 ?. / ?? → 22 reduce
        └─ Random Encounter: clear済みLessonだけを反復
            ↓
Overworld final incident
Battle 1 → Battle 2
↓
Code Core Final Boss 3
```

Village / Forest / Deep Forestは同じ`/world` route上でmapを切り替える。

## 4. JavaScript地方のmap identity

JavaScriptは自然系で統一する。

```text
Hub寄り: 開けた草原
↓
Tall Grass / 林 / 川辺
↓
Village
↓
Forest
↓
中Boss
↓
Deep Forest
↓
第二MID BOSS
↓
最深部
↓
Overworld final incident
↓
Code Core Final Boss
```

洞窟・遺跡・地下・城塞をJavaScriptだけで使い切らない。

### GREENFIELD VILLAGE

- 21 × 15
- stable ID: `js-village`
- Random Encounterなし
- 中央のTRAINでBattle 7 → 8 → 9
- 南のEXITからOverworldへ戻る
- onboarding中にRandom Encounterを挟まないよう主要導線はroad

### JAVASCRIPT FOREST

- 31 × 21
- stable ID: `js-forest`
- road / woods / deep-woods / grass / river / mountain
- Overworld西側の入口から入る
- Training 9 clear前は入口を通れない
- 東のEXITからOverworldへ戻る
- 西端のEXITからDeep Forestへ進む
- Deep Forest入口はBattle 14 clearで解放
- current map / positionはRpgState v4のまま保存・reload可能

Forestは空白を広げるmapではなく、**西へ進むほど新conceptを固定Lessonで導入し、その途中で既習conceptだけをRandom Encounter反復するmap**。

### JAVASCRIPT DEEP FOREST

- 31 × 21
- stable ID: `js-deep-forest`
- woods / deep-woods主体でForestより密度の高い自然field
- east-west main trailと枝道を持つ
- 川はmain trail上だけ橋として通過できる
- 東のEXITからForestへ戻る
- Battle 14 clear前はForest側portalを通れない
- Battle 15〜22を東→西の進行に合わせてfixed-firstで導入
- second MID BOSS 19はRandom poolへ入れない
- current map / positionはRpgState v4のまま保存・reload可能

Deep Forestは、`filter()`反復から始まり、`map()` / `some()` / `every()` / `sort()` / `?.` / `??` / `reduce()`までを一つずつ増やすJavaScript地方後半のlearning map。

## 5. Forest / Deep Forest progression

### Battle 10〜12

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

### Battle 14 — filter() fixed Lesson

MID BOSSを突破した後、西側main trailからWoodsへ入ると固定導入する。

```text
find()   = 最初の1体で止まる
filter() = 条件に合うものを最後まで見て全部集める
```

- Battle 13 clear前はFixed 14を発火しない
- Battle 14 clear前のRandom poolは10 / 11 / 12だけ
- Battle 14 clear後だけForest Random poolへ14を追加
- fixed LessonはRandom chance / minimum-step cooldownより優先
- Battle後はsame Forest map / positionへ戻る

### Battle 15〜18 — Deep Forest前半

Battle 14 clear後、Forest西端からDeep Forestへ入る。

```text
15: filter()を hp > 65 で反復
16: map() — 各要素を別のobjectへ変換
17: some() — 一体でも条件に合うかをbooleanで確認
18: every() — 全員が条件に合うかをbooleanで確認
```

- new conceptは東→西のfixed Lessonで初登場
- fixed LessonはRandom chance / minimum-step cooldownより優先
- Random poolにはclear済みBattleだけを加える

### Battle 19 — second MID BOSS

- Battle 18後、Deep Forest奥で固定Battleとして導入
- `filter()` / `map()` / `some()` / `every()`だけを使用
- new syntaxを追加しない
- Random Encounter poolへ入れない
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
- 22 clear前にOverworld final incident / Final Bossを先出ししない

### Final incident / Final Boss

Battle 22 clear後だけ、Overworld JavaScript Randomを終盤Storyへ再接続する。

```text
22 clear
→ existing Battle 1
→ existing Battle 2
→ Code Core Boss Battle 3
→ JavaScript Area CLEAR
→ REAL WORLD RETURN
```

Boss 3は、Battle 22・1・2がすべてclearされるまで開始不可。JavaScript Area CLEARはBoss 3 clear時だけ維持する。

### Random Encounter pool

Forest:

```text
9 clear / 10未clear   → Randomなし → Fixed 10
10 clear / 11未clear → Random 10 → Fixed 11
11 clear / 12未clear → Random 10 / 11 → Fixed 12
12 clear / 13未clear → Random 10 / 11 / 12 → MID BOSS 13
13 clear / 14未clear → Random 10 / 11 / 12 → Fixed 14
14 clear             → Random 10 / 11 / 12 / 14
```

Deep Forest:

```text
14 clear / 15未clear → Review 14 → Fixed 15
15 clear / 16未clear → Review 14 / 15 → Fixed 16
16 clear / 17未clear → +16 → Fixed 17
17 clear / 18未clear → +17 → Fixed 18
18 clear / 19未clear → +18 → Fixed MID BOSS 19
19 clear / 20未clear → review済みLesson → Fixed 20
20 clear / 21未clear → +20 → Fixed 21
21 clear / 22未clear → +21 → Fixed 22
22 clear             → +22をreview可能、Overworld final incident解放
```

Battle 19はreview poolへ入れない。新conceptをRandom抽選で初登場させない。

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

現在のportal gate:

```text
Overworld → JAVASCRIPT FOREST
requires: Training 9 clear

JAVASCRIPT FOREST → JAVASCRIPT DEEP FOREST
requires: Battle 14 clear
```

Final BossはportalではなくBoss interaction gateで、`22 + 1 + 2 clear`を要求する。

## 8. Encounter rules

Random Encounter共通rule:

- minimum 5 steps cooldown
- terrainごとのEncounter chance
- `encounterCount`をseedへ含める
- local map IDもlocal-map seedへ含める
- same seedは再現可能
- fixed learning BattleはRandom抽選より優先
- fixed Boss / MID BOSSはRandom Encounterと別intentまたはfixed progression Battleとして扱う
- 未学習conceptをRandomへ入れない

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

PlayerProgressもv4を維持し、schema bumpせず進行からderived unlockを補う。

```text
9 clear  → Stage 10
10 clear → Stage 11 + LINK
11 clear → Stage 12 + FORK
12 clear → Stage 13
13 clear → Stage 14
14 clear → Stage 15 + GATHER
15 clear → Stage 16 + ECHO
16 clear → Stage 17 + PROJECT
17 clear → Stage 18 + SIGNAL
18 clear → Stage 19 + SYNC
19 clear → Stage 20
20 clear → Stage 21 + ORDER
21 clear → Stage 22 + SAFE PATH
22 clear → REDUCE FOCUS
```

#203 / #205 / #207 / #209 / #212 / #214時点のv4 saveから後続routeへ進める。未知map ID / bounds外positionはOverworld開始地点へfallbackする。

## 11. World Objective

current guidanceはWorld Objective。

現在のJavaScript route:

```text
BYTEと合流
→ GREENFIELD VILLAGE 7〜9
→ JAVASCRIPT FOREST 10〜12
→ MID BOSS 13
→ filter 14
→ JAVASCRIPT DEEP FOREST 15〜18
→ second MID BOSS 19
→ deepest 20〜22
→ Overworld Battle 1 → 2
→ Code Core Final Boss 3
→ REAL WORLD RETURN
```

Objectiveは「次にどこへ行き、何を読むか」までは示してよいが、correct targetは示さない。

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
- fixed learning trigger 10 → 11 → 12 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22
- MID BOSS 13 / 19 progression
- Forest / Deep Forest Random poolがclear済みLessonだけを返す
- Battle 19をRandomへ混ぜない
- 22前にOverworld Battle 1 / 2を先出ししない
- Final Boss 3 gate = 22 + 1 + 2
- old save progression normalization
- fixed objectが所属map外で誤発火しない

E2E:

- Overworld → Village / Forest transition
- Village TRAIN 7 → 8 → 9
- Forest / Deep Forest map reload persistence
- Fixed 10〜12 / 14〜18 introduction
- MID BOSS 13 / 19 Story
- Battle 20 multiline intermediate value
- Battle 21 nested `stats?.hp ?? Infinity`
- Battle 22 reduce Story
- 22前Final Boss lock
- 22 + 1 + 2後Final Boss 3 start
- existing battle / HP / recovery / economy regression

PR前は`npm ci` / lint / unit / build / E2Eを通す。
