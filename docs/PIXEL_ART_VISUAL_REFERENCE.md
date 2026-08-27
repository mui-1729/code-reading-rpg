# Pixel Art Visual Reference

画像生成で作成した16-bit JRPG mockupを今回のvisual directionの参考にする。

実ゲームassetはmockupそのものを切り抜かず、そこから得た以下の特徴を小さいpixel SVGへ落とす。

- 主人公: 黒髪 + 濃紺/青の服 + 剣
- BYTE: 緑系の軽装 + scout silhouette
- Field spriteは頭をやや大きくした2〜3頭身
- Battle spriteはFieldより1段大きく、武器が見える
- Weaponは小さなiconでも柄 / 刃 / accent色で区別
- anti-aliasを使わず、矩形pixel中心
- high-res anime portraitは使わない

この方式にする理由:

1. 生成mockupの世界観は利用できる
2. UIから切り抜いたPNGに背景が混ざらない
3. SVGをsourceとしてGit管理しやすい
4. 少ない色数 / 粗いpixel密度をコードレビューできる
5. 装備差分を追加しやすい

生成画像はデザイン参考であり、runtimeでは軽量な専用pixel assetを使う。
