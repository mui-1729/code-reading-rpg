# Pixel Art Visual Reference

画像生成で作成した16-bit JRPG mockupを今回のvisual directionの参考にする。

実ゲームassetはmockupそのものを切り抜かず、そこから得た以下の特徴を小さいpixel SVG / CSS pixel artへ落とす。

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

1. 生成mockupの世界観は利用できる
2. UIから切り抜いたPNGに背景が混ざらない
3. SVG / CSSをsourceとしてGit管理しやすい
4. 少ない色数 / 粗いpixel密度をコードレビューできる
5. 装備差分やEnemy silhouetteを段階的に追加しやすい
6. learning semanticsとpresentationを分離したままRPG identityを強化できる

生成画像はデザイン参考であり、runtimeでは軽量な専用pixel asset / CSS pixel artを使う。
