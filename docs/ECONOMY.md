# CODE//READ RPG Economy

## 目的

Battle報酬を次のBattleの余裕やbuild選択へ変換する最小economy loopを定義する。

```text
Battle Victory / Treasure
↓
Gold
↓
Open World Hub SHOP
↓
PATCH KIT / Equipment
↓
回復の余裕 / Combat Statsの役割選択
```

このloopはコード読解を代替しない。正解target、TargetRule、表示codeはShopやEquipmentから変更しない。

## Gold

各Battleの`goldReward`がsource of truth。

- Battle 1: 20 G
- Battle 2: 30 G
- JavaScript Boss: 50 G
- Battle 4: 25 G
- Battle 5: 35 G
- TypeScript Boss: 60 G

replayでもGoldは獲得できる。CLEAR / unlockは初回だけ。

Treasureから得るGoldも同じPlayerProgressへ加算する。

## Hub Shop

Central Hubの`SHOP` objectへ隣接して`INTERACT`するとcompactなShop UIを開く。

Shopでは以下を表示する。

- current Gold
- 商品名
- price
- short effect
- PATCH KIT stock
- Equipmentの`OWNED`

商品:

| 商品 | 種類 | 価格 | 役割 |
| --- | --- | ---: | --- |
| PATCH KIT | Item | 30 G | Battle中に最大24 HP回復 |
| Guard Blade | Weapon | 55 G | Attackを抑え、Defenseも補う |
| Vital Jacket | Armor | 65 G | Defenseより最大HPを優先 |
| Survival Loop | Accessory | 50 G | 最大HPだけを大きく増やす |

購入時:

- PATCH KITは何度でも購入可能
- Gold不足なら購入不可
- Equipmentは所有済みなら再購入不可
- Equipment購入成功時は`RpgState.ownedEquipmentIds`へ追加
- Equipmentは購入しただけでは自動装備しない
- 購入後は`MENU > EQUIPMENT`で比較・装備する
- Shop open中はWorld movementを止める
- Escape / Close / overlay clickで閉じられる

旧Area header modalの`AreaShop.tsx`はlegacy UI。新しいShop featureの基準にしない。

## Equipment Roles

同slotの装備を単純な完全上位互換だけにしない。

### Weapon

- Training Blade: starter / 安定Attack
- Branch Saber: 高Attack特化
- Guard Blade: Attackを抑えてDefenseも補う

### Armor

- Traveler Coat: HP / Defenseのbalance
- Typed Mail: Defense特化
- Vital Jacket: 最大HP特化

### Accessory

- Debug Charm: Attack / Defenseの汎用補助
- Survival Loop: 最大HP特化

`MENU > EQUIPMENT`では各装備の`ATK / DEF / HP`差を短く表示する。

Equipmentのbonusは`getCombatStats()`へpureに反映する。装備だけでtarget判定やcode読解を自動化しない。

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

## State Ownership

Gold / consumableはPlayerProgress v4へ保存する。

```ts
inventory: {
  patchKit: number
}
```

Equipment ownership / loadout、Party、World positionはRpgState v3の責務。

Shop購入では1つのstorage schemaへ混ぜず、結果をそれぞれのstateへ反映する。

- Item → `PlayerProgress`
- Equipment ownership → `RpgState.ownedEquipmentIds`

新しいEquipment IDは既存RpgState schemaの配列へ入るためschema version追加は不要。

## Architecture

```text
src/economy/
├── economy.ts
├── economy.test.ts
├── AreaShop.tsx   # legacy Area modal
└── index.ts

src/world/
├── shop.ts        # Shop catalog / pure purchase domain
├── shop.test.ts
└── WorldPage.tsx  # Shop UI / stateへの反映
```

pure functions:

- `purchasePatchKit(progress)`
- `consumePatchKit(progress, hp, maxHp, usedThisBattle)`
- `purchaseShopItem(progress, rpgState, itemId)`

World UIはpurchase結果をPlayerProgress / RpgStateへ反映するだけ。

Battle UIはconsume結果とBattle内used stateを管理する。

## Boundaries

Economy / Equipmentが変更してはいけないもの:

- TargetRule
- code variant
- generator
- solvability
- correct target
- Party target

PATCH KITやEquipmentは「間違えても少し耐えられる」「火力か耐久を選ぶ」余裕だけを作る。

## Save

PlayerProgress schema v4 / RpgState schema v3を維持する。

PlayerProgress v1 / v2 / v3 migrationでは既存進行を維持し、Economy fieldが存在しないsaveは:

```text
gold = 0
patchKit = 0
```

から開始する。

RpgState restoreでは既知Equipment IDだけを保持する。

## Tests

Unit:

- PATCH KIT purchase success / insufficient Gold
- Inventory増加
- Equipment purchase / Gold消費 / owned追加
- EquipmentのGold不足
- Equipmentの二重購入防止
- Weapon / Armor / Accessoryの役割差がCombat Statsへ反映
- PATCH KIT consume / heal cap / full HP / no stock / one-use per Battle

E2E:

- Hub Shop open
- PATCH KIT購入
- Equipment購入
- Gold / stock / owned反映
- Shop close
- Pause EQUIPMENTへ購入品が表示
- 購入品を装備してRpgStateへ保存
