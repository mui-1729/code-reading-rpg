# Pixel Art Visual Reference

Worldは**8-bit調の粗いドット絵**を基準にする。1セル16×16の整数pixel、限定色、階段状の輪郭で草・水・木・石・建物・家具を揃える。連続gradient、曲線、斜めのvector線で描いた景観は使わない。

参考は[任天堂の公式ファミコン資料](https://www.nintendo.co.jp/clv/index.html)に掲載された当時の画面。色面の分離、反復する地形模様、輪郭のpixel密度を観察する。既存作品の名前・キャラクター・map・画像は実装へ取り込まず、`public/pixel-art/world/`へ独自のSVGを作る。

建物・本棚・倒木は1物体として描き、16pixel単位で既存footprintへ合わせる。木の壁は密な冠、歩ける森は幹と隙間、歩けるcrystal / ruinsは低い欠片にする。出入口の絵はportal graphの行き先で決め、UIへ座標条件を増やさない。回復拠点と読解の手掛かりも同じpixel密度の専用assetを使う。

Battleの構成・Enemyの個性と下記のPlayer / Party identityは維持する。粗い表現をCODEの可読性へ適用しない。

## Player / Party

- 主人公: 黒髪 + 濃紺/青の服 + 剣
- BYTE: 緑系の軽装 + scout silhouette
- Field spriteは頭をやや大きくした2〜3頭身
- Battle spriteはFieldより1段大きく、武器が見える
- Weaponは小さなiconでも柄 / 刃 / accent色で区別
- Player / joined PartyはBattle stage内に実体として見えること

## Enemy silhouette

Enemyはglyphを大きくした記号ではなく、**遠目でもroleを判別できるmonster silhouette**を優先する。

初期JavaScript地方の基準:

```text
Sprout
- 小柄
- 葉の冠 / 芽
- 丸い植物body

Boar
- 横長
- 低い重心
- 鼻面 / 牙

Guardian
- 縦長で重い
- 根 / 石の装甲
- 顔またはcoreがbody中央にある

Slime
- 低く丸い
- 柔らかい輪郭

Goblin
- 人型
- 耳 / 頭部と胴体が分かる

Golem
- 四角く重量感のある塊
```

standard / elite / bossは色だけでなく、card hierarchyとsilhouetteでも差を持たせる。Eliteは通常Enemyより重い輪郭、Bossは専用sceneと強いvisual hierarchyを持つ。

## Final Boss

Final Bossへgeneric `Boss` silhouetteを使い回さない。

### JavaScript Final — CORE WYRM

- 横方向へ広いorganic silhouette
- horn / root / corrupted growth
- 暗い赤紫 + organic Code Core scene
- generic humanoid Bossにしない

### TypeScript Final — CONTRACT TITAN

- 縦方向へ高いarmored / crystal silhouette
- 中央に明るいcontract core
- crystal / geometric structure
- CORE WYRMのpalette swapにしない

fantasy表示名とcode上のEnemy nameが異なる場合、画面上ではfantasy名を主表示しつつ`CODE NAME`を併記する。visual identityのためにdisplay codeや`TargetRule`のname semanticsを書き換えない。

## Region Battle scene

Battle背景は装飾だけでなくWorld continuityを作る。

- Overworld: open grassland / ridge
- Village: training yard / fence / house silhouette
- JavaScript Forest: green canopy / trunks
- Deep Forest: dark roots / corrupted nature
- TypeScript Frontier: stone / crystal / geometric grid
- JS Final: organic Code Core chamber
- TS Final: geometric contract vault

ForestとTypeScript、通常戦とBossはscreenshotだけでも判別できる差を最低基準とする。

## Rendering rules

- anti-aliasを使わず、矩形pixel中心
- high-res anime portraitは使わない
- 小画面でdecorを減らしてもEnemy / HP / NEXT / codeを優先する
- background decorがEnemy cardやcode readabilityと競合しない

この方式にする理由:

1. fantasyの世界観を少ない色と輪郭で伝えられる
2. UIから切り抜いたPNGに背景が混ざらない
3. SVG / CSSをsourceとしてGit管理しやすい
4. 少ない色数 / 粗いpixel密度をコードレビューできる
5. 装備差分やEnemy silhouetteを段階的に追加しやすい
6. learning semanticsとpresentationを分離したままRPG identityを強化できる

参考画面は観察だけに使い、runtimeでは軽量な独自pixel assetを使う。
