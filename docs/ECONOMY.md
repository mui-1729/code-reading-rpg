# CODE//READ RPG Economy

## 目的

Battle報酬を次のBattleの余裕や装備選択へ変換するeconomy loopを定義する。

この文書は**現在実装されているGold / Shop / Item / Equipment / Inn**を扱う。#178全体の設計判断は[`RPG_ECONOMY_EQUIPMENT_DESIGN.md`](./RPG_ECONOMY_EQUIPMENT_DESIGN.md)をsource of truthとする。

```text
Battle Victory / Treasure
↓
Gold / Item / Equipment
↓
Hub SHOP / INN
↓
購入・装備・回復
↓
次の探索 / Battle
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

JavaScriptのBattle初回進行だけで100 G、DEBUG CACHEも取ると120 G + Debug Charmになる。

100 Gあれば「PATCH KIT 30 G + 最安Equipment 50 G」や「Inn 20 G + Equipment」のような準備を選べる。一方、Shop全商品を一度に買えないため選択が残る。

### Replay

現状はreplayでも同じBattle Goldを獲得できる。CLEAR / unlock / Area clearは初回だけ。

replay farmingを通常進行の前提にはしない。replay Gold減衰は#184でinflationを検証し、必要な場合だけ調整する。

## Gold sink

| Sink | Price | Persistence | Role |
| --- | ---: | --- | --- |
| Inn / Rest | 20 G | per use | Hubでfull recovery |
| PATCH KIT | 30 G | consumable | Battle中のportable recovery |
| Life Charm | 50 G | permanent | Max HP特化Accessory |
| Guard Edge | 55 G | permanent | ATK + DEF型Weapon |
| Vital Coat | 60 G | permanent | Max HP型Armor |

InnはPATCH KITより10 G安い。Hubへ戻って安全に回復する代わりに安く、Battle中に使えるPATCH KITにはportable recovery分の価格差を持たせる。

ShopとInnを合わせてもmandatory purchaseにはしない。正しくコードを読めば初期装備のままclear可能であることを維持する。

## Shop

Central Hubの`SHOP` objectへ隣接してINTERACTするとShop UIを開く。

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

`price / wallet / afterPurchaseGold / shortage / owned / equipped / affordable`は`getShopItemQuote()`で一括算出する。React componentへGold計算を重複させない。

### Purchase state

- `AVAILABLE`: 購入可能
- `UNAVAILABLE`: Gold不足。`SHORT X G`を表示
- `OWNED`: 所有済み。再購入不可
- `EQUIPPED`: 現在装備中

Equipment購入成功時はGoldを減らして`ownedEquipmentIds`へ追加するが、loadoutは変更しない。Shop内の`EQUIP NOW`またはPause > EQUIPMENTから明示的に装備する。

PATCH KIT購入成功時はGoldを減らし、既存`inventory.patchKit`を+1する。

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

全既存Equipmentは共通visual registryを持ち、Shop / Pause / Area-clear Rewardで同じpixel SVGを使う。現在装備との差分も共通presentation helperから表示する。

## Item catalog / Inventory

Itemの名前・価格・visual・effect・usage ruleは`src/economy/items.ts`をsingle source of truthとする。

```text
PATCH KIT
├─ Price: 30 G
├─ Effect: HP +24
├─ Usage: BATTLE ONLY
├─ Limit: 1 USE / BATTLE
└─ Visual: /pixel-art/items/patch-kit.svg
```

`PlayerProgress.inventory.patchKit`は保存形式として維持し、UI整理だけのためにgeneric inventoryへmigrationしない。

同じItem definitionをHub Shop / Pause > ITEMS / Battle Item panel / TYPE CACHE rewardで共有する。

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

使用成功時は最大24 HP回復、stock -1。同Battle2回目は使用できない。

## Treasure Item reward

TYPE CACHEは+35 G + PATCH KIT ×1を付与する。Item取得時はShop / Pause / Battleと同じPATCH KIT visual / nameを使う。

## Inn / Rest

Central Hubの`INN` objectへ隣接してINTERACTすると確認dialogを開く。以前の無料即時Recovery Pointは廃止済み。

価格は**fixed 20 G**。

```text
INTERACT
↓
CURRENT HP / RECOVER / PRICE / GOLD → AFTER を確認
↓
REST
↓
成功時だけ Gold -20 + HP full recovery
```

### Quote

例: HP 40 / 108、Gold 50 Gの場合:

```text
CURRENT HP 40 / 108
RECOVER    +68 HP
PRICE      20 G
GOLD       50 G → 30 G
```

### State rule

- HPが減っていてGold >= 20 G: `REST`可能
- HP full: `HP FULL`、`NO CHARGE`、Goldを減らさない
- Gold不足: `SHORT X G`、HP / Goldを変更しない
- 成功時のみGold減少とHP回復を同時にcommitする

価格・可否・不足額は`getInnRestQuote()`で算出する。transactionは`resolveInnRest()`が`PlayerProgress`と`RpgState`の両方をpure resultとして返す。UIが片方だけ先に更新する構造にはしない。

Innの20 GはPATCH KIT 30 Gより安く、Hub回復とportable Battle回復の役割差を維持する。

## PlayerProgress / RpgState

Gold / consumableはPlayerProgress v4へ保存する。

```ts
inventory: {
  patchKit: number
}
```

current HP / Equipment / Party / World positionはRpgState v3の責務。

Inn導入でもschema versionは上げない。

## Architecture

```text
src/economy/
├── items.ts              # Item catalog / visual / usage presentation / use-state
├── economy.ts            # PATCH KIT purchase / consume
├── shop.ts               # Shop listing / quote / purchase resolver
├── inn.ts                # Inn quote / Gold+HP pure transaction
├── WorldShop.tsx         # Open World Shop UI / EQUIP NOW
├── WorldInn.tsx          # Inn confirmation / Provider commit
├── BattleItemPanel.tsx   # Battle Item presentation
├── items.test.ts
├── economy.test.ts
├── shop.test.ts
├── inn.test.ts
└── index.ts
```

WorldPageはShop / Innを開く責務だけ持ち、価格判定やGold transactionを直書きしない。

## Boundaries

Economy / Equipment / Item / Innが変更してはいけないもの:

- TargetRule
- code variant
- generator
- solvability
- correct target
- Party target

Gold sinkは攻略の余裕を作るが、code reading自体を飛ばせる仕組みにはしない。

## Save

PlayerProgress schema v4 / RpgState v3。

Shop / Inn / visual metadata / Item catalogの追加だけではschema versionを上げない。generic inventory等、保存shape自体を変更する場合のみmigrationとversion bumpを同時に行う。

## Tests

- Shop price table / Battle Gold table / JavaScript 100 G + DEBUG CACHE 120 G budget
- `getShopItemQuote()` wallet / price / after / shortage / state
- Shop purchase → Gold減少 → owned → `EQUIP NOW` → reload persistence
- Gold不足 → stat comparison維持 + exact `SHORT X G`
- PATCH KIT purchase / consume / one-use per Battle
- existing v4 `inventory.patchKit` compatibility
- TYPE CACHE → PATCH KIT reward / shared visual feedback
- `getInnRestQuote()` current HP / heal / price / Gold / after / shortage
- `resolveInnRest()` success → Gold -20 + full HP
- full HP → no-charge / state unchanged
- insufficient Gold → HP / Gold unchanged
- World INN confirmation → REST → reload persistence
- Gold獲得 → purchase → equip → Rest → reloadの統合E2E (#184)
