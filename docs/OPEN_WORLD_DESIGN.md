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
- JavaScript = grass / tall grass
- TypeScript = forest
- Hub / road = safe
- mountain / water等のnon-walkable terrain
- Playerはviewport overlay
- joined BYTEはprevious tileへ追従

このbaselineを壊さず、**current map ID + local position**を持つmulti-map構造へ拡張する。

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
- fixed objectがある場合はその定義

最初の実証mapはJavaScript側のVillage。

```text
Overworld
  ↓ village entrance
JavaScript Village
  ↓ exit
Overworld
```

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
森
↓
深い森
↓
中Boss
↓
最深部 / Final Boss
```

洞窟・遺跡・地下・城塞をJavaScriptだけで使い切らない。

現在のOverworldでは、まず草原の西奥へ`woods` / `deep-woods`等の自然terrainを増やして奥行きを出す。

Villageは別mapへ遷移する。

Village内へは、

- 家 / 壁はnon-walkable
- 道 / 広場はwalkable
- 出口tileから元mapへtransition
- Random Encounterなし

を基本とする。

Shop / Inn / NPCは今後Villageへ配置できるが、mapを作るためだけに空のbuildingを大量配置しない。

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
- portal / map transition
- fixed object positions
- adjacency

WorldPageへmap固有座標`if`を積まない。

### `worldActions.ts`

UI / Routerへ依存しないpure resolver。

- movement / blocked
- map transition
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
→ toMap / toPosition
```

を含むtransition resultを返す。

WorldPageはそのnext RpgStateを保存して同じ`/world`上で別mapを描画する。

mapごとにrouteを大量追加しない。

Battleの`returnTo=/world`も、RpgStateに保存されたmap / positionへ戻るためそのまま利用できる。

## 8. Random Encounter

Encounterはmap + terrainで決まる。

- JavaScript tall grass / woods / deep woods → JavaScript normal Battle
- TypeScript encounter terrain → TypeScript normal Battle
- road / Hub / Village → Encounterなし
- minimum 5 steps cooldown
- `encounterCount`をseedへ含める
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

multi-map導入でRpgState schemaを更新する。

旧save v1〜v3は、

```text
worldMapId = overworld
worldPosition = 旧worldPosition
```

としてmigrationする。

既存座標は互換性のため維持する。未知map ID / map bounds外座標はOverworld開始地点へfallbackする。

新saveはmap IDとlocal positionをreload後も保持する。

## 11. Treasure / Shop / Party / Boss

既存の、

- JS / TS Treasure
- Central Hub Shop
- Inn
- BYTE
- Fixed Boss

はmulti-map化で壊さない。

fixed objectは所属mapを明確にする。別mapで同じcoordinateになってもinteractionが誤発火しないようにする。

今後BossをDeep Forest等へ移す場合も、Battle rule自体をWorldへ持ち込まない。

## 12. Progress guidance

current guideはWorld Objective。

将来JavaScript進行を長くするときは、

```text
草原へ向かう
→ Villageへ入る
→ 森を抜ける
→ 中Bossを倒す
→ 深い森へ
```

のようにmap / landmark単位の短い目的をderiveできるようにする。

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
- portal transition
- mapごとのEncounter可否
- cooldown / selection
- fixed objectが所属map以外で誤発火しない
- Treasure / Shop / Party / Recovery / Boss intent
- RpgState v1〜v4 migration / normalization

E2E:

- Opening / World entry
- Overworld movement
- Overworld → Village transition
- Village movement → exit → Overworld return
- current map / position reload persistence
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
