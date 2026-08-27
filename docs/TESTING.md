# CODE//READ RPG テスト方針

## 1. 目的

コード読解ロジックだけでなく、Open World探索・RPG state・進行導線を壊しにくくする。

## 2. CI

Node.js 24で必ず:

```bash
npm ci
npm run lint
npm test
npm run build
```

加えてPR / mainではChromiumを使ったPlaywright E2Eを実行する。

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

PR前にも4項目を実行し、Open World / route / persistenceへ触れる変更ではE2Eも通す。PR CIは二重確認。

## 3. Unit Test

### Game Domain

- TargetRule / targeting
- Battle定義整合性
- seeded random / generator
- SkillDefinition
- code variant / multiline CODE HELP
- solvability
- JavaScript / TypeScript構文
- Battle + seed code uniqueness
- CODE DATA resolver

### World Domain

- World bounds
- region判定
- terrain判定
- walkable / encounter terrain
- viewport clipping
- adjacency
- encounter chance helper
- progressに応じたencounter Battle選択
- move成功 / blocked
- encounter cooldown
- encounter intent
- Boss / Shop / NPC interaction intent
- state transitionのimmutability

### Player Progression

- initial PlayerProgress
- EXP / Level境界
- maxHP / POWER倍率
- victory EXP / Gold
- first clear / replay
- Stage / Skill / Area unlock
- legacy save migration

### RPG State

- initial RpgState
- serialize / restore
- invalid JSON / unknown version fallback
- Equipment persistence
- Party persistence
- World position persistence
- encounter counters
- reset event連携
- out-of-bounds World position
- unknown Equipment ID
- unknown Party ID
- invalid loadout

### Economy / Equipment / Party

Economy:

- PATCH KIT purchase / insufficient Gold
- consume / heal cap / one-use

Equipment:

- equip / unequip
- Attack / Defense / maxHP bonus

Party:

- joined member
- follow-up damage
- codeが選んだ同じtarget以外へ攻撃しない設計境界

### World Objective

- JS / TS各progress状態
- first encounter → next encounter → Boss → CLEAR
- Boss unlock時のobjective
- replayでobjectiveを巻き戻さない
- all clear状態

### Tutorial

- `field-move → field-interact → battle → completed`の内部phase互換
- World実座標変化でMOVE UIが進む
- World object隣接でINTERACT UI
- direct Battle entry
- SKIP / RESET
- persistence fallback

内部phase名はlegacy field由来でも、UI testではcurrent `/world`を基準にする。

### Audio / Motion / Result

- audio settings normalization
- BGM track / release
- motion helper
- result sequence grouping / order
- reduced-motionをpresentationだけに閉じ込める

## 4. Generator / Solvability

保証する:

- 同じBattle ID + seedで同じ盤面
- initial valid target
- solvability
- code variantのsemantic invariant
- Battle固有codeにしても行数 / CODE HELP対応を壊さない

保証しない:

- current Player Levelで必ず勝てる
- Equipmentに合わせてEnemyを自動弱体化する
- 常に最適解が1つ

## 5. Content Test

新Skill / code variantでは:

- codeが正しいJavaScript / TypeScript
- display codeとTargetRuleが一致
- variantでPOWER / rule / conceptを変えない
- multi-line codeとCODE HELP行数一致
- Battle間の表示code重複を避ける
- 序盤へ発展構文を突然混ぜない

## 6. Browser E2E

Playwright + Chromiumを使用する。Unit Testを置き換えず、route・DOM・LocalStorageをまたぐ主要loopだけを固定する。

### Core loop

```text
Title
→ World
→ deterministic Random Encounter
→ Battle victory
→ Worldへreturn
→ position保持
```

### Party

```text
World
→ BYTE join
→ Pause PARTY
→ Battle
→ follow-up確認
```

### Equipment

```text
JS Boss clear state
→ Equipment reward
→ Pause EQUIPMENT
→ equip
→ Battle POWER反映
```

### Persistence

```text
World位置 / Gold / Equipment / Party
→ reload
→ state保持
```

### E2Eの安定性ルール

- Random Encounterは正規save + seeded stateで決定論的に再現する
- `waitForTimeout`を成功条件にしない
- URL / role / visible state / LocalStorageを待機条件にする
- 1本の巨大scenarioにせず、core / persistence / party / equipmentを分ける
- `npm test`は`src`のみを対象にし、Playwright specをVitestが拾わないよう分離する

## 7. Cloudflare Preview

PRごとに最低限:

- Workers Build success
- Preview URL発行
- 変更routeが開く
- World movementを妨げない
- Pauseが開閉できる
- Battle→World returnが壊れていない
- MobileでD-Pad / INTERACT / MENUが重ならない
- persistence変更ならreload確認

## 8. Production

main merge後:

- GitHub Actions build job success
- GitHub Actions e2e job success
- Cloudflare Production success
- 変更範囲に応じたsmoke check

## 9. Regression Test

bug fixでは原因に対応するtestを残す。

例:

- cameraでTutorial MOVEが進まない → World座標検出test
- code固有化で1行/3行仕様破壊 → multiline regression
- invalid World saveでmap外へ出る → RpgState validation
- objectiveが旧Gate文言を出す → World Objective derivation
- Partyが別targetへ攻撃 → follow-up target invariant

## 10. PR最低条件

- [ ] 必要なUnit Test追加
- [ ] 必要なE2E追加 / 更新
- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Open World / route / persistence変更なら`npm run test:e2e`
- [ ] GitHub Actions build + e2e
- [ ] Cloudflare Preview
- [ ] Self Review
- [ ] Squash Merge
- [ ] main CI
- [ ] Cloudflare Production
