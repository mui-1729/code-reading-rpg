# Pixel Art Integration Plan

## Goal

`CODE//READ RPG`の主人公・仲間・武器を、初期のDragon Quest / Final Fantasyを連想する**粗めの16-bit JRPGドット**へ寄せる。

高解像度イラストを縮小して使うのではなく、Field / Battle / Equipmentそれぞれで読みやすい小さなspriteを使う。

参考方向:

- 低解像度の輪郭
- 少ない色数
- 1px単位で読めるsilhouette
- 黒背景 / 白枠 / 青系accentの既存UIと共存
- キャラクターを大きく描き込みすぎない

## Scope

今回入れるもの:

1. 主人公 `CODE KNIGHT` のpixel sprite
2. 仲間 `BYTE` のpixel sprite
3. Fieldで主人公spriteを表示
4. BYTE加入後、Fieldで主人公の後ろにfollow表示
5. Battleで主人公 / BYTEをsprite表示
6. BYTE follow-up時の簡単なvisual feedback
7. Weapon iconをEquipment / Shopへ表示
8. Playerが装備中のWeaponをBattle sprite付近へ表示
9. Asset mappingをTypeScriptで一元管理
10. Unit / E2Eでasset mappingと表示を固定

今回やらないもの:

- 4方向walk animationの完全sprite sheet
- 仲間自身のHP / 被damage / command選択
- 仲間Equipment bonusのcombat反映
- Armor / Accessoryによるキャラ見た目差分
- 全Enemyの画像差し替え
- FieldでWeaponを常時手に持たせる

## Art direction

### Resolution

Field:

- 1 character: 約16×24〜24×32px相当
- CSSで`image-rendering: pixelated`
- tileからはみ出しすぎない

Battle:

- Fieldより一段大きい
- 約32×48〜48×64px相当
- 既存status panel内でHP表示を邪魔しない

Weapon:

- 約16×16〜24×24px相当
- silhouette優先
- 装備一覧で判別できればよい

### Character identity

主人公 / CODE KNIGHT:

- 暗い髪
- 青系の軽装
- 剣士
- 小さなspriteでも主人公だと分かる青accent

BYTE / SCOUT:

- 緑系
- 軽装の偵察役
- 主人公より細身
- `B` glyphはfallbackとして残すが通常表示はspriteへ置換

### Weapon identity

既存Weaponを最低限描き分ける:

- Training Blade: 素朴な短剣
- Guard Edge: 青銀、安定型
- Branch Saber: 枝分かれ / 金系accent、高火力型

Shop / Boss reward / Equipmentから得たWeaponが見た目で分かることを優先する。

## Asset structure

```text
public/
└── pixel-art/
    ├── characters/
    │   ├── code-knight-field.png
    │   ├── code-knight-battle.png
    │   ├── byte-field.png
    │   └── byte-battle.png
    └── weapons/
        ├── training-blade.png
        ├── guard-edge.png
        └── branch-saber.png

src/rpg/
└── visualAssets.ts
```

`visualAssets.ts`をsource of truthにして、UI側でpathを直接書き散らさない。

## Field behavior

### Player

現在の`◆`をpixel spriteへ置換する。

DOM上の`.world-player-sprite` classはE2E互換のため維持する。

### BYTE follower

加入前:

- HubのNPC地点にBYTE spriteを表示

加入後:

- NPC地点から固定`B`表示を消す
- 主人公と同じtile内で少し下 / 後ろにずらしたfollower spriteを表示

現状のWorld stateは直前座標履歴を持たないため、今回は厳密な「1マス後ろ」ではなく**同tile内の後方offset**をMVPとする。

将来walk historyをstateへ追加したら、1〜2歩遅れて追従する方式へ拡張する。

## Battle behavior

Player panel:

- CSS生成の仮spriteをCODE KNIGHT battle spriteへ置換
- 装備中Weapon iconをspriteの近くへoverlay

BYTE:

- Party加入時だけPlayer sideへ表示
- follow-up発生時に短い`attack` classを付ける
- Battle commandは持たず、現在のauto follow-up仕様を維持

学習gameplayは変更しない。

## Equipment / Shop behavior

Weapon rowにiconを表示する。

- icon
- name
- bonus
- description

購入時に自動装備しない既存仕様は維持する。

装備変更後、Battleへ入るとWeapon iconが変わる。

## Party current specification

現在のBYTE:

- 唯一のParty member
- role: `SCOUT`
- maxHp: 72
- attack: 7
- defense: 3
- HubでINTERACTして加入
- BattleではPlayerが攻撃した後にauto follow-up
- damage = BYTE attack + (Player Level - 1)
- Party Equipment slotはstate上あるがcombat未反映
- BYTE自身のHP / 被damage / commandは未実装

今回のvisual integrationではこのcombat仕様を変えず、**存在が画面上で見えるようにする**。

## Implementation order

1. このplanをcommit
2. Character / Weapon pixel assetsを生成
3. binary assetsを`public/pixel-art`へ追加
4. `visualAssets.ts`を追加
5. Field player / BYTE表示を差し替え
6. Battle player / BYTE表示を差し替え
7. Weapon iconをEquipment / Shopへ追加
8. follow-up animationを追加
9. Unit / E2E追加
10. `npm ci`, `lint`, `test`, `build`, `test:e2e`
11. Self review
12. PR / merge

## Acceptance criteria

- Fieldの主人公が`◆`ではなくpixel characterとして見える
- BYTE加入前はHub NPC、加入後はPlayer followerとして見える
- Battleで主人公とBYTEがpixel spriteとして見える
- Weapon変更がBattle visualとEquipment iconに反映される
- 既存Battle target / code / damage logicを壊さない
- 既存save schemaを変更しない
- mobileでspriteがUIを押し潰さない
- reduced motionでfollow-up animationを抑制できる
- CI / E2Eが通る
