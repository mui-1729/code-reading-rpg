# CODE//READ RPG Economy

## 目的

Battle報酬を次のBattleの余裕へ変換する最小economy loopを定義する。

```text
Battle Victory
↓
Gold
↓
Open World Hub SHOP
↓
PATCH KIT
↓
Battle中のHP回復
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

current flowではCentral Hubの`SHOP` objectへ隣接してINTERACTする。

現在の商品:

```text
PATCH KIT
30 G
最大24 HP回復
```

購入時:

- Gold不足なら購入不可
- 成功時Gold -30
- Inventory +1
- short FIELD LOGで結果を伝える

旧Area header modalの`AreaShop.tsx`はlegacy UI。新しいShop featureの基準にしない。

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
├── economy.ts
├── economy.test.ts
├── AreaShop.tsx   # legacy Area modal
└── index.ts
```

`economy.ts`のpure functions:

- `purchasePatchKit(progress)`
- `consumePatchKit(progress, hp, maxHp, usedThisBattle)`

World UIはpurchase結果をPlayerProgressへ反映するだけ。

Battle UIはconsume結果とBattle内used stateを管理する。

## Boundaries

Economyが変更してはいけないもの:

- TargetRule
- code variant
- generator
- solvability
- correct target
- Party target

PATCH KITは「間違えても少し耐えられる」余裕だけを作る。

## Save

PlayerProgress schema v4。

v1 / v2 / v3 migrationでは既存進行を維持し、Economy fieldが存在しないsaveは:

```text
gold = 0
patchKit = 0
```

から開始する。

## Tests

- purchase success
- insufficient Gold
- Inventory増加
- consume
- heal cap
- full HP no consume
- no stock
- one-use per Battle
- victory Gold
- v1 / v2 / v3 → v4
- v4 serialize / restore
