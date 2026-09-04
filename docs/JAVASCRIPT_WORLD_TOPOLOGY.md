# JavaScript World Topology

この文書は、JavaScript地方の**地理構造・map scale・旅の区切り**のsource of truth。

- 世界観 / visual category: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- runtime / progression rule: [`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)
- 実装優先順位: [`ROADMAP.md`](./ROADMAP.md)

個別mapの座標や寸法を先に決め、その後で接続するための文書ではない。JavaScript地方全体を先に設計し、各map実装はこのtopologyへ従わせる。

## 1. North Star

JavaScript地方では、Playerが次の旅を感じられることを優先する。

```text
安全な拠点を出る
↓
広いFieldを旅する
↓
川 / 林 / 橋 / 街道など景色の変化を通る
↓
危険地域へ入り、上下左右に探索する
↓
Battle / Story / 寄り道 / Treasureを経る
↓
新しい有人集落へ到着する
↓
そこを次の安全拠点として、さらに奥へ進む
```

「mapのwidth / heightが大きい」こと自体は完成条件にしない。

## 2. FieldとLocal Mapのscaleを分ける

### Overworld / Field

役割は**地域間を旅する大きな地理**。

主に扱うもの:

- 草原 / 林 / 川 / 橋
- 街道 / 小径
- 山・水域等の大きな通行制約
- Village / Settlementという地域単位
- Forest等の危険地域入口
- 次地方へ続く境界

建物内部や小さな生活空間を同じscaleへ詰め込まない。VillageやForestはField上では「ここに1つの地域がある」と読めるまとまりとして表現する。

### Local Map

役割は**その場所自体を歩いて探索する詳細空間**。

- GREENFIELD VILLAGE
- Forest Settlement
- JavaScript Forest
- JavaScript Deep Forest
- Final Approach

では、建物 / NPC / 店 / 小道 / 川辺 / 分岐 / Battle地点を詳細に配置する。

Overworldの1tileとLocal Mapの1tileを同じ距離感として扱わない。

## 3. JavaScript地方の採用topology

初期実装では第三集落を増やさず、GREENFIELDとForest Settlementの2拠点で旅の区切りを作る。

```text
                         Riverside / optional loop
                                 │
Arrival ── Central Field ── GREENFIELD VILLAGE [SAFE HUB 1]
              │                  │
              └── meadow / woods / bridge / road
                                  │
                              Forest Gate
                                  │
                         JAVASCRIPT FOREST
                          ╱       │       ╲
                     riverside   main     grove
                          ╲       │       ╱
                           rejoin / clearing
                                  │
                           fallen-log zone
                                  │
                       FOREST SETTLEMENT [SAFE HUB 2]
                                  │
                           Deep Forest Gate
                                  │
                       JAVASCRIPT DEEP FOREST
                         ╱        │        ╲
                      spring    main      wetland
                         ╲        │        ╱
                       root loop / giant tree
                                  │
                           FINAL APPROACH
                                  │
                             JS FINAL BOSS
```

第三集落は、実際の移動距離を測った結果「Forest SettlementからFinalまで独立した旅区間が長すぎる」と確認した場合のみ追加を比較する。

## 4. Learning / Storyと地理の対応

Learning順そのものは維持するが、Battle番号を地図の目次として並べない。

| 地理 | 主なprogression | Player-facingな意味 |
| --- | --- | --- |
| Central Field | JS-01 | 最初の異常を体験し、GREENFIELDへ向かう |
| GREENFIELD | JS-02〜04 | 読めなかった基礎を小さく確認し、森へ備える |
| Forest前半 | JS-05〜07 | traceを追いながら複数方向へ探索する |
| Forest中盤 | JS-08 MID BOSS | 地形上の意味ある場所で既習内容を確認する |
| Forest後半 | JS-09 | impact rangeを追って第二集落へ到達する |
| Forest Settlement | JS-09後 | 休息・補給・Story・checkpoint更新 |
| Deep Forest入口 | JS-10 | 二つ目の症状を固定体験する |
| Deep Forest | JS-11〜18 | shared traceを湿地 / 泉 / 巨大根などの場所へ結びつけて追う |
| Final Approach | JS-19 | 巨大樹の最深部でroot causeへ到達する |

fixed Battleはhidden x thresholdではなく、Playerが認識できる地形 / object / Story eventへ結びつける。Battle数だけ文字札を並べない。

## 5. Route design rule

### Main route自体を曲げる

寄り道だけ上下へ足すのでは不十分。main progressionにも複数回のdirection changeを持たせる。

Forestの基準例:

```text
東側の入口
→ 北西の川 / 橋
→ 南の開けた草地
→ 西の倒木地帯
→ 北のForest Settlement
→ 南西側のDeep Forest入口
```

Deep Forestも同様に、1方向の長押しだけで主要eventを順番に踏める構造にはしない。

### Branchには理由を置く

meaningful branchには少なくとも1つ置く。

- Treasure
- NPC / worldbuilding
- 回復
- 景観landmark
- shortcut
- 別routeへの再合流

空のbranchを面積稼ぎのために増やさない。

### Loop / rejoinを使う

少なくとも主要Local Mapごとに、分岐した道が別方向から再合流する構造を持たせる。迷路化は目的ではなく、「行く場所は分かるが道順は1本ではない」状態を目指す。

## 6. Landmarkで場所を覚える

Player-facingな進路は座標ではなく景観で説明できること。

JavaScript地方では主に:

- 川 / 橋 / 川辺
- 池 / 泉 / 湿地
- 花や草の広場
- 倒木地帯
- 木々のアーチ
- 巨大樹 / 巨大根
- 人の住む集落

を使う。

目標は:

```text
x=17まで行く
```

ではなく:

```text
川を渡り、倒木の先の広場へ行く
```

とWorld内の言葉で理解できること。

## 7. Safe hub / checkpoint

### SAFE HUB 1 — GREENFIELD VILLAGE

JavaScript地方序盤の準備拠点。

- 宿
- 道具屋
- 装備店
- NPC / TRAIN
- Forestへ出る前の準備

### SAFE HUB 2 — Forest Settlement

Forest後半〜Deep Forest前の**第二の有人集落**。GREENFIELDのコピーにはしない。

visual方向:

- 森の中の小規模な木造集落
- 木橋 / 川辺 / 苔 /薪 / 小屋
- 自然Regionの範囲内でGREENFIELDより奥地の生活感

役割:

- 宿 / 回復
- 道具補給
- 必要最小限の装備
- NPC / Story
- Deep Forestへ進む前の準備
- safe checkpoint更新

### checkpoint semantics

- 初回入村時に自動登録
- 宿利用時にも同拠点を再登録可能
- autosaveはどこでも現在game stateを保存する
- safe checkpointは敗北時に戻るWorld上の安全拠点

この2つを混同しない。

Forest camp / Deep Forest springは部分回復地点として残せるが、有人safe hubの代わりにはしない。

## 8. Map sizeの評価方法

viewportは11×9。

実装時の最初の比較対象として:

- Forest: おおむね4 viewport幅 × 4 viewport高以上
- Deep Forest: Forestよりさらに縦横の探索距離を持つ

を使うが、寸法だけでは完了判定しない。

各Local Mapで確認する指標:

1. 実際に何viewport分歩くか
2. 横・縦の両方に十分な移動距離があるか
3. main routeが何回方向転換するか
4. meaningful branchが何本あるか
5. loop / rejoinがあるか
6. 景観landmarkを複数覚えられるか
7. optional routeに歩く理由があるか
8. 入口から出口 / Final地点まで一目で見通せないか

空tileを足して数字だけ満たすのは禁止。

## 9. Encounter density

World拡張をRandom Encounter回数の水増しに使わない。

- 街道 / safe route: 低め
- 危険な枝道: 必要なら高め
- safe hub内: Random Encounterなし
- fixed learning Battle: 実際の場所 / Story eventと対応

checkpoint間で必要なBattle量を基準に調整する。

## 10. Fog of War / Atlas

cell-level Fog of Warは、このbranch探索が成立してから導入する。

- 歩いた周辺だけreveal
- 未探索方向へ歩く理由を作る
- 地域地図を買えば通常地形は先に確認可能
- Treasure / secretの正確な位置は購入地図でも自動公開しない

横一本道のままFogを導入して「一本道を順に塗る」状態にはしない。

## 11. 実装順

```text
Phase 1  このtopologyをdocsで固定
Phase 2  Overworldを地域間を旅するField scaleへ整理
Phase 3  GREENFIELD + checkpoint authority + Forest Settlement
Phase 4  JavaScript Forestをtopologyに従って実装
Phase 5  Deep Forest / Final Approachを実装
Phase 6  Atlas / Fog of Warを統合
```

#352のForest / Deep Forest拡張はPhase 4 / 5の下位作業として扱い、寸法拡張だけでcloseしない。

## 12. 関連Issueとの責務

- #330: GREENFIELD / settlementの宿・補給・economy
- #352: Forest / Deep Forestの実layout
- #370: 向く → ActionのWorld interaction authority
- #373: cell-level Fog of War / 地域地図
- #374: encounter cue。map transitionとは別責務
- #375: persistent safe checkpoint authority
- #377: 本topology全体の親方針

#361のmap transitionはmap境界演出として維持し、地理構造変更で壊さない。

## 13. Visual identity guardrail

JavaScriptは自然Regionとして:

```text
草原
→ 林 / 川辺
→ 自然の村
→ 森
→ 湿地 / 池 / 泉 / 滝 / 倒木
→ 深い森
→ 巨大樹の最深部
```

を中心にする。

地下 / 鉱山はDatabase、石造遺跡 / crystal / runeはTypeScript等、後続Regionのvisual categoryをJavaScript拡張で消費しない。
