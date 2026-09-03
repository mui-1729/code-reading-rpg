# Progression Landmarks

固定Story Battleの進行条件を、Playerから見えない座標だけにしないためのWorld設計ルール。

## 原則

Forest / Deep Forestの固定Battleは内部では座標thresholdで判定してよい。ただし、Player-facingにはその最初の発火地点を**認識できる場所**として見せる。

```text
Story / Objectiveが西へ続く異変を示す
→ viewport内に痕跡・障壁・記録などのlandmarkが見える
→ Playerが自分でその場所へ進む
→ landmarkへ踏み込んだ結果として固定Battleが始まる
```

`x <= N`という条件そのものはPlayerへ表示しない。

## Authority

Player-facing landmarkの座標・名称は `src/world/progressionLandmarks.ts` をauthorityとする。

`src/world/worldActions.ts` の固定Battle thresholdを変更する場合は、対応するlandmarkも同じ変更で更新する。landmarkのない新しいhidden thresholdだけを追加しない。

## 現行対応

### JavaScript Forest

| Battle | trigger x | landmark |
| --- | ---: | --- |
| JS-06 / Battle 11 | 17 | 分岐痕 |
| JS-07 / Battle 12 | 8 | 合流痕 |
| JS-09 / Battle 14 | 4 | 拡散痕 |

Battle 10はForestへ入った直後の導入、Battle 13は実体のある中ボスなので、このlandmark tableの対象外。

### JavaScript Deep Forest

| Battle | trigger x | landmark |
| --- | ---: | --- |
| Battle 16 | 24 | 変換痕 |
| Battle 17 | 19 | 警報痕 |
| Battle 18 | 14 | 群れの障壁 |
| Battle 19 | 10 | 根の合流門 |
| Battle 20 | 9 | 順序石 |
| Battle 21 | 7 | 欠損記録 |
| Battle 22 | 5 | 集約根 |

Battle 15はDeep Forestへ入った直後に二つ目の症状を追う導入なので対象外。

## 表示ルール

- 常設の画面端矢印は使わない
- main trailのtileそのものにworld内の痕跡として置く
- 短いvisible labelと、より具体的な`aria-label` / `title`を持つ
- optional route / treasureとmain progressionの意味を混同しない
- Mobileの11×9 viewportでも次のlandmarkを発火前に確認できること

## Test

- unit testでBattle / map / threshold座標の対応を固定する
- E2Eでlandmarkが先に見え、そのtileへ踏み込むと対応Battleへ遷移することを確認する
