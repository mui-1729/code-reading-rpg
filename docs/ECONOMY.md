# CODE//READ RPG Economy

## 目的

Battle報酬を次のBattleの余裕や装備選択へ変換するeconomy loopを定義する。

```text
Battle Victory / Treasure
↓
Gold
↓
Open World Hub SHOP
↓
PATCH KIT / Equipment
↓
Battle中の余裕・Player buildの選択
```

このloopはコード読解を代替しない。

## Gold

各Battleの`goldReward`がsource of truth。

- Battle 1: 20 G
- Battle 2: 30 G
- JavaScript Boss: 50 G
- Battle 4: 25 G
- Battle 5: 35 G
- TypeScript Boss: 60 G

replayでもGoldは獲得できる。CLEAR / unlockは初回だけ。

## Shop

Central Hubの`SHOP` objectへ隣接してINTERACTするとcompactなShop UIを開く。

現在の商品:

| 商品 | Price | 役割 |
| --- | ---: | --- |
| PATCH KIT | 30 G | 最大24 HP回復、1Battle 1回 |
| Guard Edge | 55 G | ATK +4 / DEF +2 の安定型Weapon |
| Vital Coat | 60 G | HP +22 / DEF +1 のHP重視Armor |
| Life Charm | 50 G | HP +16 の耐久特化Accessory |

購入時:

- current Gold / price / ownedをShop内に表示
- Gold不足なら購入不可
- Equipment所有済みなら再購入不可
- PATCH KIT成功時はGoldを減らしInventory +1
- Equipment成功時はGoldを減らし`ownedEquipmentIds`へ追加
- Equipmentは購入時に自動装備しない。Pause > EQUIPMENTで比較して選ぶ
- 結果はshort FIELD LOGへ出す
- World常設HUDへShop情報を追加しない

Open World移行前のArea header Shop UIは削除済み。新しいShop featureは`WorldShop.tsx`を基準にする。

## Equipment role

Equipmentは同slot内で単純な完全上位互換だけを並べない。

Weapon:

- Guard Edge: Attackを抑え、Defenseも補う安定型
- Branch Saber: Defense補助なしでAttackを優先

Armor:

- Vital Coat: 最大HPを大きく伸ばす
- Typed Mail: 最大HPよりDefenseを重視

Accessory:

- Debug Charm: Attack + Defenseの小さな複合補助
- Life Charm: 最大HPだけを伸ばす耐久特化

効果値と短い役割説明はPause > EQUIPMENTで比較できる。

## Battle Item

PATCH KITを所持している時だけBattle consoleへcompact actionを出す。

条件:

- Battle中
- resolving中ではない
- 同Battleで未使用
- HP < maxHP
- stock > 0

使用:

- 最大24 HP回復
- maxHPを超えない
- stock -1
- 同Battle2回目不可

## PlayerProgress

Gold / consumableはPlayerProgress v4へ保存する。

```ts
inventory: {
  patchKit: number
}
```

Equipment / Party / World positionはEconomyではなくRpgStateの責務。

## Architecture

```text
src/economy/
├── economy.ts        # PATCH KIT purchase / consume
├── shop.ts           # Shop inventory / pure purchase resolver
├── WorldShop.tsx     # Open World Shop UI
├── economy.test.ts
├── shop.test.ts
└── index.ts
```

`shop.ts`はPlayerProgress / RpgStateを受け取り、購入後stateをpureに返す。UIはその結果を各Providerへ反映するだけにする。

## Boundaries

Economy / Equipmentが変更してはいけないもの:

- TargetRule
- code variant
- generator
- solvability
- correct target
- Party target

PATCH KITとEquipmentは「間違えても少し耐えられる」「火力か耐久かを選ぶ」余裕だけを作る。

## Save

PlayerProgress schema v4 / RpgState v3。

Shop自体の追加でschema versionは上げない。購入Equipmentは既存`ownedEquipmentIds`へ保存する。

## Tests

- PATCH KIT purchase success / insufficient Gold
- Equipment purchase / Gold deduction / ownedEquipmentIds
- owned Equipment再購入不可
- Equipment Gold不足
- slot内のrole差
- consume / heal cap / full HP / no stock / one-use per Battle
- World Shop open / purchase / reload persistence / Pause比較
