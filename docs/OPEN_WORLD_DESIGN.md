# CODE//READ RPG Open World Design

この文書は、**現在採用するWorld構造と拡張ルール**を扱う。project全体の現状は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、世界観は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、優先順位は[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. 目的

Stage Select / Area Selectを繰り返すのではなく、**Worldを歩き、村や地域へ入り、Battleを重ねること自体をRPGの進行にする**。

Open Worldを「1枚の巨大grid」とは定義しない。

```text
Title / Opening
↓
CODE WORLD
├─ Overworld
│  ├─ JavaScript側の自然地域
│  ├─ Central Hub
│  └─ TypeScript側
├─ Village map
├─ Forest / local field map
└─ future Interior / Dungeon map
↓
Explore / NPC / Shop / Inn / Treasure
または
Encounter / Fixed Battle / Boss
↓
Code Reading Battle
↓
Reward / Story / Progress
↓
元いたmapへ戻る
```

通常導線へStage Select / Area Selectを戻さない。

## 2. Current implementation baseline

既存baseline:

- Overworld 40 × 28 tile
- camera viewport 11 × 9
- 4方向移動
- JavaScript = grass / tall grass / woods / deep woods
- TypeScript = forest
- Hub / road = safe
- mountain / water等のnon-walkable terrain
- Playerはviewport overlay
- joined BYTEはprevious tileへ追従
- `GREENFIELD VILLAGE` 21 × 15
- `JAVASCRIPT FOREST` 31 × 21

このbaselineを壊さず、**current map ID + local position**を持つmulti-map構造で拡張する。

## 3. Multi-map model

RpgStateは、

```text
worldMapId
worldPosition
```

を現在地として保存する。

`worldPosition`は現在map内のlocal coordinate。

各mapは最低限次を定義する。

- stable map ID
- width / height
- region identity
- terrain resolver
- portal / exit
- encounter可否
- progress gateが必要ならその条件
- fixed objectがある場合はその定義

現在のJavaScript側実装:

```text
Overworld
├─ GREENFIELD VILLAGE (`js-village`)
│   └─ TRAIN: Battle 7 → 8 → 9
└─ JAVASCRIPT FOREST (`js-forest`)
    └─ Encounter: Battle 10 → 11 → 12
```

VillageとForestは同じ`/world` route上で`worldMapId`を切り替える。

将来は同じ仕組みで、

```text
Overworld → Village → Forest → Deep Forest → Boss area
```

のようにJavaScript地方を伸ばせる。

## 4. JavaScript地方のmap構成

JavaScriptは自然系で統一する。

```text
Hub寄り: 開けた草原
↓
Tall Grass
↓
林
↓
Village
↓
Forest
↓
Deep Forest
↓
中Boss
↓
最深部 / Final Boss
```

洞窟・遺跡・地下・城塞をJavaScriptだけで使い切らない。

### GREENFIELD VILLAGE

Villageは別mapへ遷移する。

- 21 × 15
- stable ID: `js-village`
- 家 / 壁はnon-walkable
- 道 / 広場はwalkable
- Random Encounterなし
- 中央のTRAINでBattle 7 → 8 → 9
- 南のEXITからOverworldへ戻る

Villageへのonboarding中にRandom Encounterを挟まないよう、入口までの主要導線はroadとして確保する。

### JAVASCRIPT FOREST

Issue #205でVillageの次の学習fieldとして追加する。

- 31 × 21
- stable ID: `js-forest`
- JavaScriptの自然系visual identityを維持
- road / woods / deep-woods / grass / river / mountainで構成
- Overworld西側の入口から入る
- Village Training 9 clear前は入口を通れない
- 東のEXITからOverworldへ戻る
- Forest内のwoods / deep-woodsでRandom Encounter
- current map / positionはRpgState v4のまま保存・reload可能

Forestは大きさだけを増やすmapではなく、`&&` / `||`の反復fieldとして学習progressと結びつける。

## 5. TypeScript以降の景観を温存する

JavaScriptの自然地域を越えてTypeScriptへ入ったら、石造・crystal・rune・ruins等を増やし、同じ森の色違いにしない。

Database用の地下 / mine / archive / libraryもJavaScriptでは大量消費しない。

World全体として、技術編が変わると景色も変わる設計を優先する。

## 6. World domain boundary

### `worldMap.ts`

担当:

- map ID / dimensions
- region / terrain
- walkable
- viewport
- Encounter terrain / chance
- portal / map transition / progress gate metadata
- fixed object positions
- adjacency

WorldPageへmap固有座標`if`を積まない。

### `worldActions.ts`

UI / Routerへ依存しないpure resolver。

- movement / blocked
- map transition / progress gate
- steps / Encounter cooldown
- deterministic Encounter intent
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

## 7. Map transition

PortalはWorld domainで解決する。

Move先がportalの場合、resolverはBattleやRouter navigationではなく、

```text
fromMap / fromPosition
→ progress gate確認
→ toMap / toPosition
```

を含むtransition resultを返す。

WorldPageはそのnext RpgStateを保存して同じ`/world`上で別mapを描画する。

mapごとにrouteを大量追加しない。

Battleの`returnTo=/world`も、RpgStateに保存されたmap / positionへ戻るためそのまま利用できる。

現在のprogress gate例:

```text
Overworld → JAVASCRIPT FOREST
requires: Training Battle 9 clear
```

## 8. Random Encounter

Encounterはmap + terrain + learning progressで決まる。

### Overworld

- JavaScript tall grass / woods / deep woods → existing JavaScript normal Battle 1 / 2
- TypeScript encounter terrain → TypeScript normal Battle 4 / 5
- road / Hub / Village → Encounterなし

### JAVASCRIPT FOREST

Forestでは、未学習conceptをRandom Encounterで先に出さない。

```text
Training 9未clear
→ Forestへ入れない

9 clear / 10未clear
→ Battle 10のみ

10 clear / 11未clear
→ Battle 10 / 11

11 clear / 12未clear
→ Battle 10 / 11 / 12

12 clear後
→ Battle 10 / 11 / 12を反復
```

これにより、`&&`を理解する前に`||`が突然出ることを避ける。

共通rule:

- minimum 5 steps cooldown
- `encounterCount`をseedへ含める
- local map IDもForest seedへ含める
- Battle後は同じmap / positionへ戻る
- fixed Bossとは別intent

同じEncounter seedは再現可能にし、次Encounterではsemantic-equivalent code variationを変える。

JavaScript編は最終的に20〜30戦程度を想定するが、Encounter回数の水増しはしない。同じconceptでも値 / enemy順 / code variant / 組み合わせが変わることに意味を持たせる。

## 9. Persistent HP / Defeat / Recovery

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
同じmapへ戻る
```

Defeat時だけ、

- `worldMapId = overworld`
- `worldPosition = WORLD_START`
- full HP
- Encounter cooldown reset

としてHubへ戻す。

Inn / Equipmentによる既存HPルールは維持する。

## 10. Save migration

multi-map導入でRpgState schemaはv4。

旧save v1〜v3は、

```text
worldMapId = overworld
worldPosition = 旧worldPosition
```

としてmigrationする。

既存座標は互換性のため維持する。未知map ID / map bounds外座標はOverworld開始地点へfallbackする。

新saveはVillage / Forestを含むstable map IDとlocal positionをreload後も保持する。

Forest追加だけではschema versionを上げない。`isWorldMapId` / bounds定義を拡張して既存v4形式へ追加する。

## 11. Treasure / Shop / Party / Boss

既存の、

- JS / TS Treasure
- Central Hub Shop
- Inn
- BYTE
- Fixed Boss

はmulti-map化で壊さない。

fixed objectは所属mapを明確にする。別mapで同じcoordinateになってもinteractionが誤発火しないようにする。

ForestにはIssue #205時点でShop / Inn / Treasure / Bossを置かない。学習fieldとしての役割を優先する。

今後BossをDeep Forest等へ移す場合も、Battle rule自体をWorldへ持ち込まない。

## 12. Progress guidance

current guideはWorld Objective。

現在のJavaScript beginner route:

```text
BYTEと合流
→ GREENFIELD VILLAGE
→ Training 7: comparison
→ Training 8: property / equality
→ Training 9: collection / find
→ JAVASCRIPT FOREST
→ 10: &&
→ 11: ||
→ 12: && / || combined
→ Overworld main Battle
```

将来は、

```text
Forestを抜ける
→ 中Bossを倒す
→ Deep Forestへ
```

のようにmap / landmark単位の短い目的をderiveする。

常設Quest Trackerを復活させない。

## 13. Pause / fixed UI

World常設UIは最小限。

map名 / region理解に必要な情報だけをWorld headerへ出し、詳細はPauseへ集約する。

```text
STATUS
ITEMS
EQUIPMENT
PARTY
CODEX
SYSTEM
```

## 14. Legacy Area / Field

互換redirect:

```text
/javascript
/javascript/field
/javascript/complete
/typescript
/typescript/field
/typescript/complete
→ /world
```

旧Field definitionはtest fixture / migration都合で残る場合があるが、current runtimeのsource of truthではない。

## 15. Testing

Unit:

- map dimensions / bounds
- terrain / viewport
- movement / blocked
- portal transition / progress gate
- mapごとのEncounter可否
- Forest learning-progress encounter pool
- cooldown / selection
- fixed objectが所属map以外で誤発火しない
- Treasure / Shop / Party / Recovery / Boss intent
- RpgState v1〜v4 migration / normalization

E2E:

- Opening / World entry
- Overworld movement
- Overworld → Village transition
- Village movement → exit → Overworld return
- Training 9未clearでForest入口blocked
- Training完了後のOverworld → Forest transition
- Forest current map / position reload persistence
- Forest beginner Storyで`&&` / `||`を説明し`filter()`を先取りしない
- Random Encounter → Battle → same map return
- HP persistence / Recovery / Defeat
- Treasure / Shop / Equipment / BYTE / Boss regression

## 16. Expansion rule

新mapを増やす前に確認する。

1. その場所へ歩いて到達する意味があるか
2. 学習progressと結びつくか
3. 既存mapとの差がvisualで分かるか
4. 空白を増やすだけになっていないか
5. WorldPageへad-hoc条件を増やしていないか
6. Battle resolverを複製していないか
7. save migration / boundsをtestできるか
8. その技術編で後の景観categoryまで使い切っていないか

目標は「巨大なmap」ではなく、**RPGとして意味のある複数mapをつないだ広い地方**。
