# #377 Phase 2 implementation note

この文書はPR中の実装判断を確認するための短期メモ。merge前にcurrent docsへ反映し、不要なら削除する。

- Overworldを70×50へ拡張
- 到着Hub周辺のtutorial / shop / BYTE / recoveryは既存位置を維持
- GREENFIELD入口を(10,22)へ移し、Hubから西→南へ曲がる旅区間を作る
- Forest入口を(34,34)へ移し、Village方面から東→南→東→南と複数回曲がる街道にする
- x=25の川を主要地形にし、本道で橋を渡る
- Village南に川辺loopとTreasureを置く
- TypeScript境界を東側x=52以降へ移し、gateを(62,14)へ離す
- Forest / Deep Forest local mapはPhase 4 / 5まで現行runtimeを維持する
- Forest Settlement / checkpointはPhase 3で追加する
