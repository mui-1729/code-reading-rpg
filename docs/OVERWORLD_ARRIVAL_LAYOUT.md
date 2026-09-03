# Overworld Arrival Layout

Issue #325で採用する初期Overworldの空間ルール。

## 目的

初期Overworldを単なる座標の交差点ではなく、**Code Worldへ降り立った到着地点と小さな準備拠点**として読めるようにする。

Playerは初期11×9 viewportだけで、次を把握できることを目標にする。

- 自分が到着した場所
- 近くにBYTE / Shop / Innがあること
- main storyは西側へ続くこと
- 東側は今すぐ探索する方向ではなく、明確な門で区切られていること

## Authority

地形・walkability・portal条件のauthorityは引き続き `src/world/worldMap.ts` とする。

このlayout変更でBattle prerequisite、portal座標、固定Story Battle条件は変更しない。

## 到着地点

`WORLD_START = { x: 20, y: 14 }` を到着地点として維持する。

terrain typeは既存の `town` のままにし、`src/overworld-arrival.css` がこの1tileだけに到着痕のvisualを与える。新しいterrain enumやinteractionは増やさない。

周辺の既存施設も維持する。

- BYTE: `(19, 13)`
- Shop: `(20, 12)`
- Inn: `(21, 16)`

## 西側のmain trail

以前は `y = 14` 全体をroadにしていたが、座標都合の横断線になっていたため廃止する。

Overworldのroadは用途のある区間だけにする。

1. 到着地点からForest入口手前までの西向きtrail
   - `x = 8..19, y = 14`
2. GREENFIELD VILLAGEへの短い分岐
   - `x = 14, y = 13..14`
3. Deep Forest西口からCode Coreへ戻った後に使う北側approach
   - `x = 8, y = 4..6`

`x = 8, y = 7..13`はroadにしない。序盤からCode Core方向へ意味のない直線を見せないため。

## 東側の門

TypeScript入口のportal座標は従来どおり `(23, 14)`。

到着地点から門までだけ短いstone approachを置く。

- `(21, 14)` stone
- `(22, 14)` stone
- `(23, 14)` gate

`(24, 14)`以東へroadを伸ばさない。

未解放時は既存portal prerequisiteにより門でmovementがblockedになる。CSSでは門柱とbarrierを描き、単なる道の続きに見えないようにする。

## Roadの役割

Overworldでroadを置く理由は次のどれかに限定する。

- 主要目的地へのnavigation
- Story上実際に使う安全な移動区間
- 明確な拠点・入口同士の接続

「RPGだから」「座標を一直線に結ぶため」だけではroadを追加しない。

## World Atlas

World Atlasは独自の地形表を持たず `getTerrain()` を使うため、このlayoutをそのまま反映する。

Atlasでも到着地点周辺は次の順で見える。

```text
西側 road → arrival town → stone → stone → gate → roadなし
```

## Regression constraints

- BYTE加入導線を変えない
- Shop / Innの座標・interactionを変えない
- JS-01 fixed incidentの発火条件を変えない
- Village / Forest / TypeScript portalの座標とprerequisiteを変えない
- Deep ForestからCode Coreへ戻るtarget `(8, 6)` を変えない
- Desktop / Mobileとも11×9 viewportを維持する
