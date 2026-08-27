# CODE//READ RPG Open World Design

この文書は、**現在のOpen World設計**だけを扱う。project全体の現状は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)、今後の優先順位は[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. 目的

Stage Select / Area Selectを繰り返すのではなく、**1つのWorldを歩くこと自体をRPGの進行にする**。

```text
Title / Opening
↓
Open World
├─ JavaScript Grassland
├─ Central Hub
└─ TypeScript Forest
↓
Explore / Shop / Recovery / Treasure / Party
または
Random Encounter / Fixed Boss
↓
Code Reading Battle
↓
Reward / Story / Progress
↓
同じWorldへ戻る
```

通常導線へStage Select / Area Select /専用Complete画面を戻さない。

## 2. World layout

現在:

- 40 × 28 tile
- camera viewport 11 × 9
- 4方向移動
- JavaScript = grass / tall grass
- TypeScript = forest
- Hub / road = safe zone
- mountain / water等のnon-walkable terrain
- 8-bit terrain。内部grid境界をvisualとして強調しない
- Playerはviewport overlayとして常駐し、移動時は座標を更新
- joined BYTEはPlayerのprevious tileへ追従

mapを広げること自体を目的にしない。新しい空間にはlearning / story / RPG上の意味を持たせる。

## 3. World domain boundary

### `worldMap.ts`

- World size
- region / terrain
- walkable
- viewport
- Encounter terrain / chance
- fixed object positions
- adjacency

### `worldActions.ts`

UI / Routerへ依存しないpure resolver。

- movement / blocked
- steps / Encounter cooldown
- deterministic Encounter intent
- BYTE interaction
- Shop interaction
- Recovery interaction
- Treasure interaction
- JS / TS Boss interaction

### `treasures.ts`

- one-shot reward
- opened判定
- current stateへreward適用

### `WorldPage.tsx`

resolver結果を

- RpgState update
- navigation
- audio
- short feedback
- visual rendering

へ接続するadapter。

新しいobjectを追加する時も`WorldPage.tsx`へ座標`if`を積まない。

## 4. Random Encounter

- JS tall grass → JavaScript normal Battle
- TS forest → TypeScript normal Battle
- road / HubはEncounterなし
- minimum 5 steps cooldown
- `encounterCount`をseedへ含める
- Battle後は元のWorld位置へ戻る
- fixed Bossとは別intentとして扱う

同じEncounter seedは再現可能にし、次Encounterではdisplay codeのsemantic variationを変える。

## 5. Persistent HP / Recovery

Battle開始HPは毎回full resetしない。

```text
RpgState.currentHp
↓
Battle start
↓
damage / PATCH KIT
↓
RpgState.currentHpへ反映
↓
Victory
↓
残HPでWorld return
```

- Defeat → Hub start + full HP
- Hub `REST`へ隣接INTERACT → full HP
- Equipment等でmax HPが変わったらcurrent HPを上限へclamp
- current / max HPはPause STATUSで確認
- World常設HUDへHP panelを増やさない

## 6. Treasure

現在:

- JS `DEBUG CACHE`: Gold + Debug Charm
- TS `TYPE CACHE`: Gold + PATCH KIT

原則:

- adjacent INTERACT
- one-shot
- `openedTreasureIds`をsave
- reloadしても復活しない
- learning answerは報酬にしない
- mapを埋めるために大量配置しない

## 7. Shop

Central HubのSHOPはcurrent economy entry point。

- PATCH KIT
- role差のある少数Equipment
- current Gold / price / ownedを表示
- Gold不足 / ownedをresolverで判定
- 購入したEquipmentはPause EQUIPMENTから変更
- Areaごとのlegacy Shop UIはcurrent runtimeで使わない

## 8. Party

現在のcompanionはBYTE。

World:

- Hub NPCとしてjoin
- join後はprevious tile follower

Battle:

- codeが決めた同じtargetへfollow-up
- Partyがcorrect targetを自動選択しない

Party追加は人数より「読解を壊さない役割差」を優先する。

## 9. Fixed Boss

Battle 3 / 6はWorld上の固定地点。

unlock判定はPlayerProgressからderiveする。

Boss GUARD:

- minion生存中はBoss damageを抑える
-解除条件codeをBattle UIへ表示
- minion全滅でOPEN
- current target ruleを変更しない

将来TypeScript固有mechanicを追加する場合も、World側へBattle ruleを持ち込まない。

## 10. Progress guidance

current guideは**World Objective**。

PlayerProgressからpureにderiveし、次へ使う。

- World上のNEXT OBJECTIVE
- Pause STATUS
- Battle後のshort progress feedback

JavaScriptは現在のstoryに合わせて、BYTE join → JavaScript Grassland → Chapter progression → Code Coreへ案内する。

TypeScriptも同じ仕組みを使うが、story copyの統一は今後のcontent task。

常設Quest Trackerを復活させない。

## 11. State ownership

### PlayerProgress v4

- EXP / Gold
- inventory
- clear / unlock
- legacy `completedSideQuestIds`

### RpgState v3

- current HP
- Equipment / owned Equipment
- Party / Party Equipment
- World position
- Encounter pacing
- opened Treasure

restore時にbounds / known IDs / slot consistency / HPをnormalizeする。

### TutorialState v1

World / RPG saveと分離。

`RESET PROGRESS`はgeneric reset eventでProgress / RPG / Tutorialをそれぞれresetし、Sound settingsは保持する。

## 12. Pause / fixed UI

Worldで常設するのは現在地理解と操作に必要な最小情報だけ。

詳細はPauseへ集約する。

```text
STATUS
ITEMS
EQUIPMENT
PARTY
CODEX
SYSTEM
```

独立SOUND / CODEX常設buttonへ戻さない。

## 13. Legacy Area / Field

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

旧Field content definitionは一部test fixtureとして残るが、current runtimeのsource of truthではない。

新featureは`world/`へ実装する。

## 14. Testing

Unit:

- terrain / bounds / viewport
- movement / blocked
- Encounter cooldown / selection
- Shop / Party / Recovery / Treasure / Boss intent
- Treasure reward
- World Objective
- RpgState migration / normalization

E2E:

- Opening / World entry
- move / interaction
- Random Encounter → Battle → same position return
- HP persistence / PATCH KIT / Recovery / Defeat
- Treasure persistence
- Shop / Equipment
- BYTE join / follow-up
- Tutorial controls
- Boss flow

## 15. Expansion rule

新region / landmark / companion等を増やす前に確認する。

1. 歩いて到達する意味があるか
2. code reading contentと結びつくか
3. WorldPageへad-hoc条件を増やしていないか
4. Pause / HUDを詰め込みすぎていないか
5. Unit / E2Eで主要接続を固定できるか

World sizeではなく、**意味のある地点と学習contentの密度**を増やす。
