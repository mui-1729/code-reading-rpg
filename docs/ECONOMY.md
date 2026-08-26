# CODE//READ RPG Economy

## 目的

Battleで得た報酬を次のBattleの余裕へ変換する、最小のRPG economy loopを定義する。

```text
Battle victory
  ↓
Gold
  ↓
Area SHOP
  ↓
PATCH KIT
  ↓
Battle中のHP回復
```

このloopはコード読解を代替しない。攻撃力、TargetRule、Skill選択、generator、solvabilityには影響させない。

## Gold

各Battleは`goldReward`を持つ。

- Battle 01: 20 G
- Battle 02: 30 G
- JavaScript Boss: 50 G
- Battle 04: 25 G
- Battle 05: 35 G
- TypeScript Boss: 60 G

再攻略でもGoldは獲得できる。Stage CLEAR / unlockは従来どおり初回のみ記録する。

Victory resultでは`GOLD GAINED`を表示する。

## Shop

JavaScript / TypeScript Area画面のheaderから`SHOP`を開く。

Shopは常設panelにせず、必要時だけmodalとして表示する。

現在の商品は1種類のみ。

### PATCH KIT

- 価格: 30 G
- 回復量: 最大24 HP
- 購入数はInventoryへ保存
- Gold不足時は購入不可

## Battle Item

PATCH KITを1個以上所持している場合だけBattle consoleへcompact actionを表示する。

使用条件:

- Battle中である
- そのBattleでまだ使っていない
- HPが最大HP未満
- PATCH KITを1個以上所持している

使用すると:

- 最大24 HP回復する
- 最大HPを超えない
- PATCH KITを1個消費する
- 同じBattleでは2個目を使えない

Item使用自体はEnemy targetやSkill damageを変更しない。

## PlayerProgress

```ts
type PlayerInventory = {
  patchKit: number
}

type PlayerProgress = {
  exp: number
  gold: number
  inventory: PlayerInventory
  // existing progression fields...
}
```

## Save schema

Player progress schemaはv4。

v1 / v2 / v3からrestoreする場合:

- EXP / CLEAR / unlock / Side Questなど既存進行は維持する
- `gold = 0`
- `inventory.patchKit = 0`

v4ではGoldとInventoryもLocalStorageへ保存する。

## Architecture

```text
src/economy/
├── AreaShop.tsx
├── economy.ts
├── economy.test.ts
└── index.ts
```

`economy.ts`は購入と消費をpure functionとして扱う。

`AreaShop.tsx`はArea UIとの接続だけを担当する。

Battle側は現在HPとBattle内の使用済みstateを管理し、消費結果をPlayerProgressへ反映する。

## Boundaries

Economyが変更してはいけないもの:

- `TargetRule`
- Skill POWER計算
- code variant
- Battle generator
- solvability verification
- correct target判定

PATCH KITは「間違えても少し耐えられる」余裕を増やすだけで、コードを読まずに勝てる機能にはしない。

## Tests

固定するもの:

- Goldを消費して購入できる
- Gold不足では購入できない
- PATCH KITを1個消費する
- 最大24 HP回復する
- 最大HPを超えない
- HP満タンでは消費しない
- 未所持では消費しない
- 同一Battleで2回使えない
- Battle勝利でGoldを得る
- v1 / v2 / v3 → v4 migration
- v4 serialize / restore
