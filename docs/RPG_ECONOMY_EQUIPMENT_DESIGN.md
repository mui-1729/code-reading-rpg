# RPG Economy / Equipment Design

最終更新: 2026-08-28

この文書は、`CODE//READ RPG`の**Equipment / Item / Gold / Shop / Innを1つのRPG loopとして設計するsource of truth**です。

既存のGold / PATCH KIT / Shopの現在仕様だけを確認したい場合は[`ECONOMY.md`](./ECONOMY.md)を参照してください。この文書は現状に加えて、#178で完成させるtarget designと実装境界を定義します。

関連Issue:

- #178 — RPG Economy / Equipment loop epic
- #180 — Equipment visual system
- #181 — Item / Inventory UX
- #182 — Gold economy / Shop
- #183 — Inn / paid recovery
- #184 — Integration / balance / E2E

---

## 1. Goal

現在はEquipment、PATCH KIT、Gold、Shop、Recoveryが個別には存在するが、Playerから見ると1つのRPG loopとして十分につながっていません。

完成形は次です。

```text
探索 / Code Reading Battle
        ↓
Gold / Item / Equipment reward
        ↓
Central Hubへ戻る
        ↓
┌──────────────────────────────┐
│ Shop                         │
│ ├─ Equipmentを比較して買う   │
│ └─ Itemを補充する             │
│                              │
│ Inn                          │
│ └─ Goldを払ってHPを全回復     │
└──────────────────────────────┘
        ↓
Pause Menuで装備 / 所持品を確認
        ↓
次の探索 / Battle
```

RPG側の目的は、**コード読解を代替することではなく、次のBattleへ向かう準備に選択を作ること**です。

---

## 2. Current implementation snapshot

### 2.1 State ownership

現在のsave ownershipは意図的に分かれています。

| State | Version | 責務 |
| --- | ---: | --- |
| `PlayerProgress` | v4 | EXP / Gold / PATCH KIT / Stage・Area clear / unlock |
| `RpgState` | v3 | current HP / Equipment ownership・loadout / Party / World position / Treasure |

重要:

- Goldとconsumableは`PlayerProgress`
- current HPとEquipmentは`RpgState`
- UI都合だけで1つの巨大stateへ統合しない
- 2つのstateをまたぐtransactionはpure resolverで結果を作り、UI adapterが両Providerへcommitする

### 2.2 Equipment

slot:

- Weapon
- Armor
- Accessory

現在のEquipment:

| Equipment | Slot | Role |
| --- | --- | --- |
| Training Blade | Weapon | starter / ATK +3 |
| Guard Edge | Weapon | ATK +4 / DEF +2 |
| Branch Saber | Weapon | ATK +6 |
| Traveler Coat | Armor | HP +8 / DEF +3 |
| Vital Coat | Armor | HP +22 / DEF +1 |
| Typed Mail | Armor | HP +12 / DEF +5 |
| Debug Charm | Accessory | ATK +2 / DEF +1 |
| Life Charm | Accessory | HP +16 |

現在はWeaponだけ`visualAssets.ts`でSVG visual mappingを持ちます。Armor / Accessoryはvisual未整備です。

### 2.3 Item

現在のconsumableはPATCH KITのみです。

- Price: 30 G
- Heal: 24 HP
- Battle中のみ
- 1 Battleにつき1回
- HP full / stock 0 / 使用済みでは使えない

`Pause > ITEMS`は現在、名前・説明・個数だけを表示します。

### 2.4 Gold source

Battle reward:

| Battle | Gold |
| --- | ---: |
| JavaScript Chapter 1 | 20 G |
| JavaScript Chapter 2 | 30 G |
| JavaScript Final | 50 G |
| TypeScript Chapter 1 | 25 G |
| TypeScript Chapter 2 | 35 G |
| TypeScript Final | 60 G |

Treasure:

| Treasure | Reward |
| --- | --- |
| DEBUG CACHE | 20 G + Debug Charm |
| TYPE CACHE | 35 G + PATCH KIT ×1 |

現状はreplayでもBattle Goldを獲得できます。

### 2.5 Shop

Current Central Hub Shop:

| Product | Price |
| --- | ---: |
| PATCH KIT | 30 G |
| Guard Edge | 55 G |
| Vital Coat | 60 G |
| Life Charm | 50 G |

Equipment purchaseはownedへ追加するだけで、自動equipしません。

### 2.6 Recovery

現在のHub Recovery Pointは:

- 隣接してINTERACT
- HPが減っていれば即full recovery
- 無料
- 確認UIなし

このためGold sinkとして機能していません。

---

## 3. Current gaps

### Equipment

- Weapon以外にiconがない
- Shop / Pause / Rewardでvisual presentationが揃っていない
- 「今の装備より何が増減するか」が分かりにくい
- owned / equipped / purchasableが弱い

### Item

- PATCH KITのdefinitionがShop / Battle / Pauseへ分散しやすい
- Itemのvisual sourceがない
- 使えない理由がPlayerへ十分伝わらない

### Gold / Shop

- Goldを得る意味がShopにほぼ限定される
- 購入後残額が事前に分からない
- Equipment比較が弱い
- Gold不足時に「あと何G必要か」が分からない

### Recovery

- 無料full recoveryなのでGold economyと接続していない
- 回復量 / price / 所持Goldを判断するinteractionがない

---

## 4. Design principles

### 4.1 Code reading remains the core

Equipment / Item / Goldで変えてよいもの:

- survivability
- damage margin
- exploration endurance
- preparation choice

変えてはいけないもの:

- correct target
- `TargetRule`
- displayed code semantics
- code variant
- solvability
- Partyのtarget判断

### 4.2 Meaningful choices, not item inflation

Equipmentは少数のrole差を維持します。

```text
高Attack
vs
Attack + Defense

高Max HP
vs
高Defense

複合補助
vs
HP特化
```

「数値が1だけ高い剣」を大量に追加しません。

### 4.3 No mandatory grinding

通常の初回進行でShop / Innの選択が成立するようにします。

- replay farmingを前提に価格を決めない
- Shop購入を必須progress gateにしない
- 装備なしでもコードを正しく読めればclear可能にする

---

## 5. Unified RPG catalog

Equipment / ItemのUI情報を各componentへ直書きしないため、definitionをsource of truth化します。

### EquipmentDefinition

現在の`EquipmentDefinition`へpresentation metadataを追加する方向を基本とします。

```ts
type EquipmentDefinition = {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'accessory'
  description: string
  bonuses: {
    maxHp?: number
    attack?: number
    defense?: number
  }
  visualId: string
  roleLabel: string
}
```

`visualId`はsaveへ保存しません。Equipment IDから導出可能なpresentation dataです。

### ItemDefinition

初回はPATCH KITをgeneric definitionへ載せます。

```ts
type ItemDefinition = {
  id: 'patch-kit'
  name: string
  description: string
  price: number
  visualId: string
  usage: 'battle'
  maxUsesPerBattle: 1
}
```

将来Itemを追加しても、roleが重ならない少数だけにします。

---

## 6. Visual asset system

### 6.1 Target

現在の`weaponVisuals`をEquipment / Item共通visual registryへ一般化します。

候補:

```text
public/pixel-art/
├── equipment/
│   ├── weapons/
│   ├── armor/
│   └── accessories/
└── items/
```

API例:

```ts
getEquipmentVisual(equipmentId)
getItemVisual(itemId)
```

### 6.2 Rules

- repo内static SVGをsource of truthにする
- 8-bit / pixel-art visual referenceへ合わせる
- 小さいiconでもslotが分かるsilhouetteにする
- decorative imageではなくitem identityとして使う
- Shop / Pause / Rewardで同じassetを使う

### 6.3 UI state

同じcard presentationで次を表現します。

- `OWNED`
- `EQUIPPED`
- `FOR SALE`
- `GOLD SHORTAGE`
- rewardとして`NEW`

---

## 7. Equipment UX

### Shop

Equipment cardで表示するもの:

```text
[ICON] Guard Edge        55 G
WEAPON · BALANCED
ATK +4 / DEF +2

CURRENT → Training Blade
DELTA   → ATK +1 / DEF +2

Wallet 70 G → After 15 G
[ BUY ]
```

### Purchase後

基本方針:

- purchaseはowned追加
- save semanticsを変えず自動equipしない
- 成功後に`EQUIP NOW`を出すか、Pause > EQUIPMENTへの導線を出す

「購入しただけでloadoutが勝手に変わる」挙動は避けます。

### Pause > Equipment

slotごとに:

- current equipped
- owned options
- icon
- role
- bonus
- currentとの差分
- description

を同じcard languageで表示します。

---

## 8. Inventory / Item UX

### Pause > Items

PATCH KITを次のように表示します。

```text
[ICON] PATCH KIT                      ×2
BATTLE ITEM
HP +24 / 1 BATTLE 1 USE

Battle中、HPが減っている時だけ使用可能
```

### Battle

使用不可理由を明示します。

- `NO STOCK`
- `HP FULL`
- `ALREADY USED THIS BATTLE`
- resolving中はaction disabled

### Save policy

第1段階では既存`inventory.patchKit`を維持します。

generic inventoryへmigrationするのは、**実際に2種類目以降のItemを追加する必要が出た時だけ**です。UI整理だけのためにschema v5へ上げません。

---

## 9. Gold economy

### 9.1 Resource roles

Goldのsinkを3種類へ分けます。

| Sink | 特徴 | 初期価格帯 |
| --- | --- | ---: |
| Inn | 安い / Hubへ戻る必要あり / full recovery | 20 G |
| PATCH KIT | 持ち運べる / Battle中 / +24 HP | 30 G |
| Equipment | 恒久的なbuild choice | 50〜60 G |

これにより「回復アイテムと宿が同じ機能」になりません。

### 9.2 Initial balance target

初期値としてInnは**20 G fixed**を採用します。実装後のE2E / play balanceで調整可能ですが、ruleは単純に保ちます。

理由:

- Playerがpriceを即理解できる
- current HP量で複雑な計算をさせない
- PATCH KIT 30 Gより安くし、Hubへ戻るtrade-offを価格へ反映できる

### 9.3 Budget examples

JavaScript初回clear rewardsだけで:

```text
20 + 30 + 50 = 100 G
```

DEBUG CACHEも取ると:

```text
120 G + Debug Charm
```

120 Gなら例として:

- Vital Coat 60 G + Inn 20 G ×3
- Guard Edge 55 G + PATCH KIT 30 G + Inn 20 G = 105 G
- Life Charm 50 G + Guard Edge 55 G = 105 G

のように複数の使い方ができます。

すべてを一度に買えるほどは多くなく、1つ買ったら何もできないほど少なくもない状態を目標にします。

### 9.4 Replay Gold

current behaviorではreplayでもGoldを得ます。

#178ではまずRPG loopを完成させます。replay reward減衰は必須にしません。ただし#184でinflationを確認し、必要なら別Issueで:

- replay Gold減額
- daily/first-clear bonus等ではなく単純な減衰

を検討します。

---

## 10. Shop design

### Wallet context

常に次を同時に見せます。

- current Gold
- price
- after-purchase Gold
- insufficient amount

例:

```text
GOLD 42 G
Vital Coat 60 G
SHORT 18 G
```

### Purchase state

pure resolverが返すreasonをUIへ変換します。

- purchased
- insufficient-gold
- owned
- unknown-item

必要なら`equipped`はpurchase失敗reasonではなくpresentation stateとして扱います。

### Responsibility

```text
shop.ts
  ↓ pure purchase result
WorldShop.tsx
  ↓ Provider commit / SE / feedback
PlayerProgress + RpgState
```

price判定をReact componentへ重複実装しません。

---

## 11. Inn / Rest design

### 11.1 Interaction

Current Recovery PointをInn / Restへ置き換えます。

```text
Innへ隣接
↓ INTERACT
REST dialog
├─ HP 43 / 108
├─ RECOVER +65
├─ PRICE 20 G
├─ GOLD 70 G → 50 G
└─ [REST] [CANCEL]
```

### 11.2 Rules

初期rule:

```ts
INN_PRICE = 20
```

- HP fullならchargeしない
- Gold < 20なら回復しない
- success時だけGold -20 / currentHp = maxHp
- partial recoveryは作らない
- Inn item stock等は作らない

### 11.3 Transaction boundary

GoldとHPは別stateにあるため、domain resolverは両方を入力・出力します。

```ts
resolveInnRest(progress, rpgState, maxHp)
→ {
    rested,
    reason,
    progress,
    rpgState,
    price,
    healed,
  }
```

UIが先にGoldだけ減らしてからHPを更新するような処理にしません。

### 11.4 Reasons

- `rested`
- `full-hp`
- `insufficient-gold`

をunit testで固定します。

---

## 12. Reward presentation

RewardでEquipment / Itemを得た時もShopとは別の文字列表現を作りません。

共通catalogから:

- visual
- name
- role
- bonus / effect

を表示します。

Treasure例:

```text
DEBUG CACHE OPEN
[Debug Charm icon]
NEW ACCESSORY
ATK +2 / DEF +1
+20 G
```

Boss rewardも同じpresentation languageへ寄せます。

---

## 13. World presentation

現在の`RECOVERY` objectはInnとして見せます。

変更候補:

- terrain label: `Inn`
- world object label: `INN`
- blocked message: `Inn。隣からINTERACTして休む。`

ShopとInnをHubの「準備地点」として視覚的にセットで理解できるようにします。

常設HUDへShop priceやItem一覧を追加しません。

---

## 14. Save / migration

### Keep

- `PlayerProgress v4.gold`
- `PlayerProgress v4.inventory.patchKit`
- `RpgState v3.currentHp`
- `RpgState v3.equipment`
- `RpgState v3.ownedEquipmentIds`

### No schema bump for

- Equipment visual metadata追加
- Shop comparison UI
- Inn price追加
- Inn paid recovery
- PATCH KIT presentation整理

### Schema bump only when necessary

generic multi-item inventory等、保存shape自体を変更するときだけversionを上げます。

その場合:

- old save migration
- unknown item normalization
- non-negative count
- reset behavior

を同じPRで追加します。

---

## 15. Architecture boundaries

### Domain

```text
rpg/equipment.ts
  Equipment stats / slot / loadout

rpg/visualAssets.ts (or split catalog)
  Equipment / Item visual lookup

economy/shop.ts
  Shop listing / purchase resolver

economy/economy.ts
  consumable behavior

economy/inn.ts
  Rest price / transaction resolver
```

### Presentation

```text
WorldShop.tsx
PauseMenu.tsx (later split possible)
WorldPage.tsx
Battle item action
Reward sequence
```

UIはdomainの結果を表示・commitするadapterにします。

---

## 16. Test matrix

### Unit

Equipment:

- 全Equipmentにvisualが存在
- slot / bonuses / equip resolver
- compare delta

Item:

- PATCH KIT purchase
- consume
- heal cap
- no stock
- full HP
- one-use

Shop:

- purchase success
- Gold不足
- owned
- after-purchase Gold

Inn:

- success: Gold減少 + full HP
- full HP: no charge
- insufficient Gold: no mutation
- healed amount

Save:

- owned Equipment / loadout consistency
- Item count underflowなし
- reload persistence
- old save migration

### E2E

最終統合scenario:

```text
BattleでGold獲得
→ Hub Shop
→ Equipment購入
→ Equip
→ BattleでHP減少
→ Innへ戻る
→ 20 G支払い
→ full recovery
→ reload
→ Gold / HP / Equipment保持
```

negative paths:

- Shop Gold shortage
- Inn Gold shortage
- Inn full HP
- owned Equipment再購入

---

## 17. Rollout order

```text
#179 Design
  ↓
#180 Equipment visual / UX
#181 Item / Inventory UX
#182 Gold / Shop balance
#183 Inn / Recovery
  ↓
#184 Integration / balance / E2E
```

#180〜#183は一部parallel可能ですが、#182と#183はprice balanceを共有するため同時期に確認します。

---

## 18. Non-goals

#178では次をしません。

- 何十種類ものEquipment追加
- rarity / gacha
- Equipment durability
- crafting
- sell / resale economy
- complex Inn simulation
- random Shop inventory
- codeの正解targetを教えるEquipment
- Gold grindを前提にするprogress gate

必要性が実プレイから出た場合だけ別Issueにします。

---

## 19. Definition of done

RPG Economy loop全体の完成条件:

- Equipment / Itemに統一visualがある
- Shop / Pause / Rewardで同じcatalogを使う
- Shopでcurrent装備との差と購入後Goldが分かる
- purchase → owned → equipが自然につながる
- Item所持 / 使用条件が明確
- GoldのsinkとしてShopとInnが機能する
- Innが20 Gでfull recoveryし、失敗pathも明確
- reload後もGold / HP / inventory / Equipmentが維持される
- existing save compatibilityが保たれる
- RPG成長がcode readingを代替しない
- Unit / E2E / Cloudflare Preview / Productionがgreen
