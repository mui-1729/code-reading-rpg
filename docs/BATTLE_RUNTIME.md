# Battle Runtime Boundaries

`src/App.tsx` は JavaScript / TypeScript 共通の Battle UI と turn orchestration を担当するが、route/session identity と persistent RPG handoff は `src/battle/` へ分離する。

## Session boundary

`src/battle/session.ts` が `battleId` / `seed` / `returnTo` を1つの Battle session として扱う。

- `generateBattle()` を呼んで current Battle を確定する
- 同じ Area 内だけ `nextBattle` を解決する
- unknown Battle ID は runtime UI を描画する前に拒否する
- JavaScript / TypeScript で同じ seed semantics を使う

`App.tsx` は session が返した `battle` / `nextBattle` を表示・進行に使い、Battle definition の探索方法を持たない。

## RPG result handoff boundary

`src/battle/resultHandoff.ts` が Battle と persistent `RpgState` の境界を担当する。

- `withBattleHp()` は damage / heal 後の current HP だけを persistent state へ渡す
- `createDefeatRecoveryState()` は defeat 時の Hub 復帰状態を作る
- defeat recovery は HP / map / position / encounter cooldown だけを変更し、Equipment / Party / Treasure / encounter count 等を保持する

Victory の EXP / Gold / Stage clear / unlock は従来どおり `progression/applyBattleVictory()` が source of truth。TargetRule、generator、damage、enemy turn algorithmはこの境界へ移さない。

## App.tsx に残す責務

- transient Battle phase
- Enemy[] / selected Skill / turn / log
- player action と enemy turn の orchestration
- attack / damage presentation
- victory / defeat overlay
- navigation adapter
- audio presentation

今後さらに分離する場合も、gameplay変更と同じPRで大規模state-machine化しない。

## Regression contract

境界変更では次を維持する。

- JS / TS route と seed semantics
- persistent HP
- victory reward / unlock
- defeat → Overworld Hub recovery
- TargetRule / generator / solvability
- Random Encounter / fixed Battle / Boss の既存E2E
