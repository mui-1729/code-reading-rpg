# CODE//READ RPG テスト方針

## 1. 目的

コード読解ロジック、盤面生成、RPG進行、Quest、主要ユーザーフローを壊しにくくする。

## 2. CI

GitHub ActionsはNode.js 24で必ず次を実行する。

```bash
npm ci
npm run lint
npm test
npm run build
```

PR前にも同じ4項目をfeature branchで成功させる。PR CIは代替ではなく二重確認。

## 3. 現在のUnit Test

### Game Domain

- TargetRule / targeting
- Battle / Area定義整合性
- seeded random / generator
- SkillDefinition
- code variant / multiline CODE HELP
- solvability
- JavaScript / TypeScript発展構文

### Progression

- initial PlayerProgress
- EXP / Level境界
- maxHP / POWER倍率
- victory reward
- first clear / replay
- Stage / Skill / Area unlock
- immutability

### Persistence

現行schemaはv3。

- serialize / restore
- invalid JSON
- unknown version
- missing / invalid field
- baseline Stage / Skill補完
- v1 → v3 migration
- v2 → v3 migration
- `completedSideQuestIds`保存

旧saveのEXP / Stage CLEAR / Area CLEAR / unlockを失わないことを優先する。

### Quest

Main Quest:

- Stage CLEARでnext step更新
- Area CLEARでCOMPLETE
- JavaScript / TypeScript独立
- Field `NEXT` / `!` focus
- replayで更新feedbackなし

Side Quest:

- Area CLEAR前LOCKED
- Area CLEAR後ACTIVE
- 指定Battle再攻略でCOMPLETE
- 対象外Battleでは進行しない
- bonus EXPは一度だけ
- JavaScript / TypeScript独立
- completion feedback差分

### Field / Learning / Dialogue

- movement / collision
- Gate / 看板 / NPC / Exit reachability
- LearningHint参照
- JavaScript / TypeScript Field定義
- Dialogue進行条件

### Audio / Motion

- audio settings normalization
- BGM track / release
- motion helper
- reduced-motionをpresentationだけに閉じ込める

## 4. Generator / Solvability

seed variationは次を守る。

- 同じBattle ID + seedで同じ盤面
- Enemy数維持
- HPが許容variation内
- Enemy / Skill / code variant variation
- initial valid target
- base Battleの意味あるtargetを消さない
- solvability
- 生成失敗時fallback

保証しないこと:

- current Player Levelで必ず勝てる
- Playerが弱いときEnemyを自動弱体化する
- 常に最適解が1つ

## 5. Content Test

新しいSkill / code variantでは、動作だけでなく意味を確認する。

- codeが正しいJavaScript / TypeScript
- display codeとTargetRuleが同じ結果
- variantでPOWER / rule / conceptを変えない
- multi codeの物理行数とCODE HELP数一致
- seed variation後も学習theme維持
- 序盤へ発展構文を突然混ぜない

## 6. UI Testの考え方

現時点はpure/domain testを優先する。React Testing LibraryやPlaywrightは、壊れやすい画面横断stateが増えた時点で導入する。

Component Test候補:

- Skill SELECT → EXECUTE
- resolving中の追加入力不可
- Victory / Defeat
- Quest Log open / close
- Side Quest unlock表示
- Sound Settings / Codex modal

E2E候補:

```text
Title
→ World
→ Field
→ Battle
→ Victory
→ Quest更新
→ Field復帰
```

Persistence:

```text
CLEAR / Side Quest COMPLETE
→ reload
→ EXP / CLEAR / Quest完了を保持
```

## 7. Cloudflare Preview

PR / branchで最低限確認する。

- `Workers Builds: code-reading-rpg` success
- Preview URL発行
- 変更routeが開く
- UI変更ならDesktop / Mobileで崩れない
- persistence変更ならreload互換

## 8. Production

main merge後:

- GitHub Actions success
- Cloudflare Production Build success
- 変更範囲に応じたsmoke check

毎回すべてのBattleを手動完全攻略する必要はない。

## 9. Regression Test

bug fix時は原因に対応するtestを残す。

例:

- Field objectで奥へ進めない → reachability
- variant追加で旧testが固定構文を仮定 → semantic invariantへ修正
- save migrationで起動不能 → old schema migration
- replay報酬が重複 → one-time Side Quest reward

## 10. PR最低条件

- [ ] 必要なUnit Test追加
- [ ] `npm ci` success
- [ ] `npm run lint` success
- [ ] `npm test` success
- [ ] `npm run build` success
- [ ] GitHub Actions CI success
- [ ] Cloudflare Preview success
- [ ] 自己レビュー
- [ ] merge後main CI success
- [ ] Cloudflare Production success
