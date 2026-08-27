# World Visual Rework Plan

## 目的

ファミコン期のDragon Quest / Final FantasyのOverworldを参考に、現行Worldを「グリッドで動くが、グリッドに見えない」8-bit fieldへ寄せる。

## 現状の課題

1. BYTEが主人公と同じtile内へ重なって表示され、追従に見えない。
2. 背景・terrain表現がCSS主体で、キャラクターだけがpixel artになっている。
3. 各world tileの境界が視覚的に見え、盤面/カードのように見える。
4. 草原が均一なtileの反復に見え、DQ/FF系overworldの連続した地形に見えない。
5. Tutorial overlayがmobile controlsへ重なり、操作を阻害する。

## 方針

- movement/collisionは現在のgrid logicを維持する。
- 見た目ではcell border / gap / tile card感を出さない。
- terrainは隣接tileと連続して見えるpatternとして描画する。
- grassは少数pixelのdot/noiseを散らした8-bit groundにする。
- forest / mountain / waterはpixel motifを繰り返し、地形の塊として見せる。
- roadは隣接方向へ繋がるpathとして描画する。
- 既存作品のsprite/mapはコピーせず、構成原則だけ参考にする。

## BYTE follower

- Party加入後は主人公と同一tileへ重ねない。
- 直前のplayer positionを画面local stateで保持し、BYTEは1歩前の位置へ追従する。
- save schemaは変更しない。

## World renderer

- worldMap / encounter / collision / interaction座標は変更しない。
- viewportのtile gap / border / inset shadowを除去する。
- terrainごとにpixel patternを導入する。
- player/follower/objectはtile上のlayerとして描画する。
- gridの存在はDOM/data属性だけに残す。

## Tutorial / controls

- mobileではtutorial panelをcontrolsと重ならない位置へ移す。
- Tutorial中も方向キー / INTERACTをpointer操作可能にする。
- E2Eでcontrolsの操作可能性を固定する。

## 実装順

1. BYTE follower座標を分離
2. tile境界を不可視化
3. grass / tall grass / forest / water / mountain / road / hubを8-bit terrain化
4. object類をpixel visualへ寄せる
5. tutorial mobile layout修正
6. lint / unit / build / Playwright E2E
7. Cloudflare branch Previewで実画面確認
8. 確認後にのみmerge
