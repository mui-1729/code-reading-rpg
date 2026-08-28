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
└─ future Deep Forest / Interior / Dungeon map
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
    └─ Random Encounter: clear済みLessonだけを反復
```

Village / Forestは同じ`/world` route上でmapを切り替える。

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
最深部 / Final Boss
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
- current map / positionはRpgState v4のまま保存・reload可能

Forestは空白を広げるmapではなく、**西へ進むほど新conceptを固定Lessonで導入し、その途中で既習conceptだけをRandom Encounter反復するmap**。

## 5. Forest progression

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
- Battle 14 clear後だけRandom poolへ14を追加
- fixed LessonはRandom chance / minimum-step cooldownより優先
- Battle後はsame Forest map / positionへ戻る

### Random Encounter pool

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
→ Random 10 / 11 / 12
→ 西側WoodsでFixed 14

14 clear後
→ Random 10 / 11 / 12 / 14
```

新conceptをRandom抽選で初登場させない。

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
```

## 8. Encounter rules

Random Encounter共通rule:

- minimum 5 steps cooldown
- terrainごとのEncounter chance
- `encounterCount`をseedへ含める
- local map IDもlocal-map seedへ含める
- same seedは再現可能
- fixed learning BattleはRandom抽選より優先
- fixed Boss / MID BOSSはRandom Encounterと別intent

JavaScript編は最終的に20〜30戦程度を想定するが、Encounter回数だけを水増ししない。値 / enemy順 / code variant / concept組み合わせの差に意味を持たせる。

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

PlayerProgressもv4を維持し、Forest追加ごとにschema bumpせず進行からderived unlockを補う。

```text
9 clear  → Stage 10
10 clear → Stage 11 + LINK
11 clear → Stage 12 + FORK
12 clear → Stage 13
13 clear → Stage 14
14 clear → GATHER
```

未知map ID / bounds外positionはOverworld開始地点へfallbackする。

## 11. World Objective

current guidanceはWorld Objective。

現在のJavaScript beginner route:

```text
BYTEと合流
→ GREENFIELD VILLAGE 7〜9
→ JAVASCRIPT FOREST 10〜12
→ MID BOSS 13
→ 西側Woodsでfilter Lesson 14
→ 次のDeep Forest progression
```

Objectiveは「次にどこへ行き、何を読むか」までは示してよいが、correct targetは示さない。

常設Quest Trackerを復活させない。

## 12. Visual identity reservation

- JavaScript: grassland / woods / forest / river / nature village
- TypeScript: stone / crystal / rune / ruins / temple
- Database: underground / mine / archive / library

JavaScriptだけで後続region用の景観を使い切らない。

## 13. Testing

Unit:

- map dimensions / bounds
- terrain / viewport
- movement / blocked
- portal transition / progress gate
- fixed learning trigger 10 → 11 → 12 → 14
- MID BOSS 13 gate / clear後path
- Random poolがclear済みLessonだけを返す
- old save progression normalization
- fixed objectが所属map外で誤発火しない

E2E:

- Overworld → Village / Forest transition
- Village TRAIN 7 → 8 → 9
- Forest map / position reload persistence
- Fixed 10〜12 introduction
- MID BOSS 13 gate / Story
- 13 clear後の西側path
- Battle 14 fixed introduction
- `find()` / `filter()` beginner Story
- existing battle / HP / recovery / economy regression

PR前は`npm ci` / lint / unit / build / E2Eを通す。
