# CODE//READ RPG Economy

## 目的

Battle報酬を、次のBattleへ向かうための回復・Item・Equipment選択へ変換するRPG economy loopを定義する。

この文書は**現在実装されているGold / Shop / Item / Equipment / Inn / replay reward**のsource of truthとして扱う。設計の背景と#178で決めた境界は[`RPG_ECONOMY_EQUIPMENT_DESIGN.md`](./RPG_ECONOMY_EQUIPMENT_DESIGN.md)を参照する。

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

このloopはコード読解を代替しない。Equipmentや回復はsurvivability / damage marginだけを変え、TargetRule・correct target・code semanticsは変えない。

## Gold source

各Battleの`goldReward`が初回Battle Goldのsource of truth。

| Source | First clear Gold | Replay Gold |
| --- | ---: | ---: |
| JavaScript Chapter 1 | 20 G | 10 G |
| JavaScript Chapter 2 | 30 G | 15 G |
| JavaScript Final | 50 G | 25 G |
| TypeScript Chapter 1 | 25 G | 12 G |
| TypeScript Chapter 2 | 35 G | 17 G |
| TypeScript Final | 60 G | 30 G |

Treasure:

| Source | Reward |
| --- | --- |
| DEBUG CACHE | 20 G + Debug Charm |
| TYPE CACHE | 35 G + PATCH KIT ×1 |

JavaScript初回3Battleだけで100 G、DEBUG CACHE込みで120 G + Debug Charmになる。

### Replay

初回clearは`goldReward`を100%付与する。再clearは**50%・端数切り捨て**。

```ts
REPLAY_GOLD_MULTIPLIER = 0.5
```

JavaScript 1周のreplayは:

```text
20 / 30 / 50 G
↓ 50%
10 / 15 / 25 G
= 50 G
```

初回100 G + DEBUG CACHE 20 G + JavaScript 1周replay 50 G = 170 G。現在のShop全商品195 Gには届かないため、1周replayだけで即全購入できるinflationを避ける。

CLEAR / unlock / Area clearは初回だけ。EXPは現在replayでも通常量を獲得する。

通常進行にreplay farmingは要求しない。

## Gold sink

| Sink | Price | Persistence | Role |
| --- | ---: | --- | --- |
| Inn / Rest | 20 G | per use | Hubでfull recovery |
| PATCH KIT | 30 G | consumable | Battle中のportable recovery |
| Life Charm | 50 G | permanent | Max HP特化Accessory |
| Guard Edge | 55 G | permanent | ATK + DEF型Weapon |
| Vital Coat | 60 G | permanent | Max HP型Armor |

JavaScript初回100 Gは、たとえば次をちょうど組み合わせられる。

```text
Life Charm 50 G
+ PATCH KIT 30 G
+ Inn 20 G
= 100 G
```

InnはPATCH KITより10 G安い。Hubでしか使えないfull recoveryと、Battle中に持ち運べるPATCH KITの役割差を価格へ反映する。

Shop / Innはmandatory progress gateにしない。初期装備のままでもコードを正しく読めれば進行可能にする。

## Shop

Central Hubの`SHOP` objectへ隣接してINTERACTするとShop UIを開く。

```text
CONSUMABLE
└─ PATCH KIT          30 G

EQUIPMENT
├─ Guard Edge         55 G
├─ Vital Coat         60 G
└─ Life Charm         50 G
```

### Purchase quote

各商品は購入前にcurrent wallet / price / after-purchase Goldを表示する。

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

`getShopItemQuote()`がprice / wallet / afterPurchaseGold / shortage / owned / equipped / affordableを一括算出する。React側へGold計算を重複させない。

### Equipment purchase

Equipment購入成功時:

1. Goldを減らす
2. `ownedEquipmentIds`へ追加
3. loadoutは自動変更しない
4. Shop内に`EQUIP NOW`を表示
5. Playerが明示的に押した時だけ装備する

Pause > EQUIPMENTから後で装備することもできる。

Equipment cardは現在装備との差分を表示する。

### Consumable purchase

PATCH KIT購入成功時:

- Gold -30 G
- `inventory.patchKit + 1`

Item countは0未満にならない。

## Equipment

現在のEquipment:

| Equipment | Slot | Bonus / Role |
| --- | --- | --- |
| Training Blade | Weapon | ATK +3 / starter |
| Guard Edge | Weapon | ATK +4 / DEF +2 |
| Branch Saber | Weapon | ATK +6 |
| Traveler Coat | Armor | HP +8 / DEF +3 / starter |
| Vital Coat | Armor | HP +22 / DEF +1 |
| Typed Mail | Armor | HP +12 / DEF +5 |
| Debug Charm | Accessory | ATK +2 / DEF +1 |
| Life Charm | Accessory | HP +16 |

全Equipmentは共通visual registryを持ち、Shop / Pause / Rewardで同じpixel SVGを使う。

save restore時は:

- unknown Equipmentを除外
- starter ownershipを補完
- ownershipを重複排除
- equipped IDがknown / owned / slot一致しない場合は外す

を行う。

## PATCH KIT / Inventory

PATCH KIT definition:

```text
Price: 30 G
Heal: +24 HP
Usage: BATTLE ONLY
Limit: 1 USE / BATTLE
```

Battle Item state:

- `READY · BATTLE ONLY`
- `NO STOCK`
- `HP FULL`
- `USED THIS BATTLE`
- `ACTION LOCKED`

使用成功時:

- 最大24 HP回復
- max HPを超えない
- stock -1
- 同Battle2回目は使用不可

Pause > ITEMS / Shop / Battle / TYPE CACHE rewardは同じItem definition / visualを共有する。

## Inn / Rest

Central Hubの`INN` objectへ隣接してINTERACTすると確認dialogを開く。無料即時Recovery Pointは廃止済み。

価格は**fixed 20 G**。

```text
INTERACT
↓
CURRENT HP / RECOVER / PRICE / GOLD → AFTER
↓
REST
↓
成功時だけ Gold -20 + HP full recovery
```

### Rules

- HPが減っていてGold >= 20 G: REST可能
- HP full: `HP FULL` / `NO CHARGE`、Goldを減らさない
- Gold不足: `SHORT X G`、HP / Goldを変更しない
- success時だけGoldとHPを同時に更新
- partial recoveryは作らない

`getInnRestQuote()`がprice / wallet / after-rest Gold / shortage / heal amountを算出する。

`resolveInnRest()`が`PlayerProgress`と`RpgState`の両方をpure resultとして返し、UIは成功時だけGameStateProviderの同じcommitへ両stateを更新する。

## Save ownership

| State | Version | Economy関連責務 |
| --- | ---: | --- |
| `PlayerProgress` | v4 | EXP / Gold / `inventory.patchKit` / progression |
| `RpgState` | v5 | current HP / Equipment ownership・loadout / Party / World / Treasure |

Economy loop追加のためだけにschema versionは上げない。

Legacy migration:

- PlayerProgress v1 / v2 / v3 → v4
- Economy fieldが存在しないlegacy saveはGold 0 / PATCH KIT 0で開始
- RpgState v1 / v2 / v3 / v4 → v5（未使用Party Equipmentを除去）
- legacy current HP / known Equipmentは可能な範囲で保持

LocalStorageのcommitは両stateを含む単一revision snapshot。直前backup復旧とstale tab上書き回避を行い、旧分割keyはmigration入力としてだけ読む。

`RESET PROGRESS`はPlayerProgressとRpgStateを初期化する。Sound設定は別storageなので保持する。

## Architecture

```text
src/economy/
├── items.ts
├── economy.ts            # PATCH KIT purchase / consume
├── shop.ts               # quote / purchase resolver
├── inn.ts                # Inn quote / Gold+HP transaction
├── WorldShop.tsx
├── WorldInn.tsx
└── BattleItemPanel.tsx

src/progression/
└── progression.ts        # first-clear / replay Gold rule
```

WorldPageはShop / Innを開く責務だけ持ち、price / Gold transactionを直書きしない。

## Boundaries

Economy / Equipment / Item / Innが変更してはいけないもの:

- TargetRule
- code variant
- generator
- solvability
- correct target
- Party target

RPG systemは「間違えた時の余裕」「火力か耐久か」「回復をどこで買うか」を作るだけで、コードの答えを変えない。

## Regression tests

Unit / data tests:

- Battle first-clear Gold table
- replay Gold 50% / floor
- JavaScript first-clear 100 G
- first-clear + DEBUG CACHE + 1 replay = 170 G < Shop total 195 G
- Shop price / quote / shortage
- Equipment ownership / loadout consistency
- PATCH KIT purchase / consume / underflow防止
- Inn success / full HP no-charge / insufficient Gold
- PlayerProgress / RpgState legacy migration
- Economy domain loop serialize / restore

E2E:

- Battle Gold → Shop purchase → `EQUIP NOW` → Inn → reload → next Battle
- insufficient Gold Shop / Inn
- full HP Inn no-charge
- Item purchase / Battle consume / reload
- Equipment purchase / persistence
- RESET PROGRESSとSound storage境界
- 390px viewportでShop / Inn / Pauseの横overflow・Escape操作

CIでは`npm ci / lint / test / build / test:e2e`を全てgreenにしてからmergeする。
