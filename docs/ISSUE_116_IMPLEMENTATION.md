# Issue #116 Implementation Note

Gold / Shop / PATCH KITの最小RPG loop実装記録。

## Implemented

- Battleごとの`goldReward`
- VictoryでGold獲得表示
- PlayerProgressへ`gold` / `inventory.patchKit`
- save schema v4 / v1-v3 migration
- Area headerの`SHOP`
- PATCH KIT購入（30 G）
- Battle中のPATCH KIT使用（最大24 HP回復）
- 1 Battle 1回制限
- Gold / Inventory persistence
- Economy / migration Unit Test

## Domain boundary

Economyは次を変更しない。

- TargetRule
- Skill POWER
- code variant
- generator
- solvability

## Pre-PR checks

Feature source codeを含むbranch buildで次をすべて成功確認した。

```bash
npm ci
npm run lint
npm test
tsc -b
vite build
```

確認後、検証用に一時変更したbuild scriptとCI triggerは元へ戻した。
