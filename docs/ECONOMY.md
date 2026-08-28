# CODE//READ RPG Economy

## 目的

Battle報酬を次のBattleの余裕や装備選択へ変換するeconomy loopを定義する。

この文書は**現在実装されているGold / PATCH KIT / Shop仕様**を中心に扱う。Equipment visual / Inventory / Gold balance / paid Innまで含む#178のtarget designは[`RPG_ECONOMY_EQUIPMENT_DESIGN.md`](./RPG_ECONOMY_EQUIPMENT_DESIGN.md)をsource of truthとする。

```text
Battle Victory / Treasure
↓
Gold / Item / Equipment
↓
Open World Hub SHOP
↓
PATCH KIT / Equipment
↓
PauseでInventory / Equipment確認
↓
Battle中の余裕・Player buildの選択
```

このloopはコード読解を代替しない。

## Gold source

各Battleの`goldReward`がBattle Goldのsource of truth。

| Source | Gold | Role |
| --- | ---: | --- |
| JavaScript Chapter 1 | 20 G | early reward |
| JavaScript Chapter 2 | 30 G | first purchase budgetへ到達 |
| JavaScript Final | 50 G | area-clear budget |
| DEBUG CACHE | 20 G | optional exploration reward |
| TypeScript Chapter 1 | 25 G | next-area reward |
| TypeScript Chapter 2 | 35 G | preparation budget |
| TypeScript Final | 60 G | area-clear budget |
| TYPE CACHE | 35 G + PATCH KIT ×1 | optional exploration reward |

JavaScriptのBattle初回進行だけで:

```text
20 + 30 + 50 = 100 G
```

DEBUG CACHEも取ると:

```text
120 G + Debug Charm
```

100 Gあれば「PATCH KIT 30 G + 最安Equipment 50 G」のように回復と恒久強化を組み合わせられる。一方、DEBUG CACHE込み120 Gでも現在のShop全商品195 Gを一度に買えないため、選択が残る。

### Replay

現状はreplayでも同じBattle Goldを獲得できる。CLEAR / unlock / Area clearは初回だけ。

replay farmingを通常進行の前提にはしない。replay Gold減衰は#184でinflationを検証し、必要な場合だけ別途調整する。

## Gold sink

| Sink | Price | Persistence | Role |
| --- | ---: | --- | --- |
| PATCH KIT | 30 G | consumable | Battle中のportable recovery |
| Guard Edge | 55 G | permanent | ATK + DEF型Weapon |
| Vital Coat | 60 G | permanent | Max HP型Armor |
| Life Charm | 50 G | permanent | Max HP特化Accessory |
| Inn / Rest | 20 G target | per use | Hubでのfull recovery。#183で実装 |

ShopとInnを合わせてもmandatory purchaseにはしない。正しくコードを読めば初期装備のままclear可能であることを維持する。

## Shop

Central Hubの`SHOP` objectへ隣接してINTERACTするとShop UIを開く。

ItemとEquipmentはvisual hierarchyを分ける。

```text
CONSUMABLE
└─ PATCH KIT

EQUIPMENT
├─ Guard Edge
├─ Vital Coat
└─ Life Charm
```

### Purchase quote

各商品は購入前に同時に次を表示する。

```text
WALLET 70 G
PRICE  55 G
AFTER  15 G
```

不足時:

```text
WALLET 42 G
PRICE  60 G
AFTER  —
SHORT 18 G
```

`price / wallet / afterPurchaseGold / shortage / owned / equipped / affordable`の判定は`getShopItemQuote()`で一括算出する。React componentへGold計算を重複させない。

### Purchase state

- `AVAILABLE`: 購入可能
- `UNAVAILABLE`: Gold不足。`SHORT X G`を表示
- `OWNED`: 所有済み。再購入不可
- `EQUIPPED`: 現在装備中

Equipment購入成功時は:

1. Goldを減らす
2. `ownedEquipmentIds`へ追加
3. loadoutは変更しない
4. Shop内に`EQUIP NOW`を出す
5. Playerが明示的に押した時だけ装備する

購入しただけでloadoutが勝手に変わる挙動は作らない。Pause > EQUIPMENTから後で装備することもできる。

PATCH KIT購入成功時はGoldを減らし、既存`inventory.patchKit`を+1する。

結果はshort FIELD LOGへ出す。World常設HUDへShop情報を追加しない。

Open World移行前のArea header Shop UIは削除済み。Shop featureは`WorldShop.tsx`を基準にする。

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

全既存Equipmentは`getEquipmentVisual()`の共通visual registryを持ち、Shop / Pause / Area-clear Rewardで同じpixel SVGを使う。現在装備との差分も共通presentation helperから表示する。

## Item catalog / Inventory

Itemの名前・価格・visual・effect・usage ruleは`src/economy/items.ts`をsingle source of truthとする。

現在のItem:

```text
PATCH KIT
├─ Price: 30 G
├─ Effect: HP +24
├─ Usage: BATTLE ONLY
├─ Limit: 1 USE / BATTLE
└─ Visual: /pixel-art/items/patch-kit.svg
```

`PlayerProgress.inventory.patchKit`は保存形式として維持し、UI整理だけのためにgeneric inventoryへmigrationしない。

同じItem definitionを次で共有する。

- Hub Shop
- Pause > ITEMS
- Battle Item panel
- TYPE CACHEのItem reward表示

Pause > ITEMSではicon / owned count / effect / usage / descriptionをItem cardとして確認できる。stock 0でもItem自体は表示し、`NO STOCK`を明示する。

## Battle Item

PATCH KITはBattle consoleへ常にcompact Item panelとして表示し、現在使えるかどうかを理由付きで示す。

使用条件:

- Battle中
- action resolving中ではない
- 同Battleで未使用
- HP < maxHP
- stock > 0

UI state:

- `READY · BATTLE ONLY`
- `NO STOCK`
- `HP FULL`
- `USED THIS BATTLE`
- `ACTION LOCKED`

使用成功時:

- 最大24 HP回復
- maxHPを超えない
- stock -1
- 同Battle2回目不可
- `RECOVERED +N HP`を表示

Itemの状態判定は`getBattleItemUseState()`、実際のconsumeは`consumePatchKit()`へ分離する。BattleのTargetRule / Skill / target判定には触れない。

## Treasure Item reward

TYPE CACHEは現在:

- +35 G
- PATCH KIT ×1

を付与する。

Item取得時はShop / Pause / Battleと同じPATCH KIT visual / nameを使って`ITEM ACQUIRED` feedbackを表示する。Shop購入はTreasure rewardとして扱わない。

## Recovery / Inn

現在のHub Recovery Pointは、HPが減っていれば**無料で即full recovery**する。

これはcurrent implementationであり、target designではGold economyへ接続するため#183でpaid Innへ置き換える。

初期target:

- fixed 20 G
- Rest前にcurrent HP / max HP / price / Goldを表示
- full HPならchargeしない
- Gold不足ならstateを変更しない
- success時だけGold減少 + full recovery

詳細は[`RPG_ECONOMY_EQUIPMENT_DESIGN.md`](./RPG_ECONOMY_EQUIPMENT_DESIGN.md)を参照する。

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
├── items.ts              # Item catalog / visual / usage presentation / use-state
├── economy.ts            # PATCH KIT purchase / consume
├── shop.ts               # Shop listing / quote / pure purchase resolver
├── WorldShop.tsx         # Open World Shop UI / Provider commit / EQUIP NOW
├── BattleItemPanel.tsx   # Battle Item presentation / Provider adapter
├── items.test.ts
├── economy.test.ts
├── shop.test.ts
└── index.ts

public/pixel-art/items/
└── patch-kit.svg
```

`shop.ts`はPlayerProgress / RpgStateを受け取り、購入前quoteと購入後stateをpureに返す。UIはその結果を各Providerへ反映するだけにする。

paid Inn実装時も同様に、Gold / HPのtransactionはpure resolverへ置き、`WorldPage.tsx`へ価格判定を直書きしない。

## Boundaries

Economy / Equipment / Itemが変更してはいけないもの:

- TargetRule
- code variant
- generator
- solvability
- correct target
- Party target

PATCH KITとEquipmentは「間違えても少し耐えられる」「火力か耐久かを選ぶ」余裕だけを作る。

## Save

PlayerProgress schema v4 / RpgState v3。

Shop quote / visual metadata / Item catalog / paid Innの追加だけではschema versionを上げない。PATCH KITは既存`inventory.patchKit`、購入Equipmentは既存`ownedEquipmentIds`へ保存する。

generic inventory等、保存shape自体を変更する場合のみmigrationとversion bumpを同時に行う。

## Tests

- Shop price table / Battle Gold table / JavaScript 100 G + DEBUG CACHE 120 G budget
- `getShopItemQuote()` wallet / price / after / shortage / state
- PATCH KIT purchase success / insufficient Gold
- Equipment purchase / Gold deduction / ownedEquipmentIds
- owned / equipped / affordable presentation state
- Shop purchase → Gold減少 → owned → `EQUIP NOW` → reload persistence
- Gold不足 → stat comparison維持 + exact `SHORT X G`
- PATCH KIT catalog / visual / effect / usage rule
- Battle Item `READY / NO STOCK / HP FULL / USED / ACTION LOCKED`
- consume / heal cap / full HP / no stock / one-use per Battle
- existing v4 `inventory.patchKit` compatibility
- Shop purchase → Pause ITEMS count / shared visual
- Battle use → HP recovery / stock consume / reload storage
- TYPE CACHE → PATCH KIT reward / shared visual feedback
- paid Inn success / full HP no-charge / insufficient Gold (#183)
- Gold獲得 → purchase → equip → Rest → reloadの統合E2E (#184)
