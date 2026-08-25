# CODE//READ RPG テスト方針

## 1. この文書の役割

この文書は、現在どこまでをUnit / CI / Preview / smoke testで保証し、RPG拡張後にどのtest layerを追加するかを定義する。

目的はtest数を増やすことではなく、**コード読解ロジック・盤面生成・RPG進行・主要ユーザーフローを壊しにくくすること**。

---

## 2. 現在の自動確認

Vitestは導入済み。

GitHub Actions CIはNode.js 24で次を実行する。

```bash
npm ci
npm run lint
npm test
npm run build
```

現在のUnit Testは主にGame Domainを対象にしている。

- TargetRule / targeting
- Battle定義の整合性
- seeded random
- generator
- SkillDefinition
- solvability

「自動test frameworkは未導入」「`npm install && npm run build`だけ」という旧状態ではない。

---

## 3. PRの確認レイヤー

現在の標準:

```text
Unit / Lint / Build
↓
GitHub Actions CI
↓
Cloudflare Workers Preview
↓
自己レビュー
↓
merge
↓
Cloudflare Production
```

Vercel Preview / Productionは現在のtest / merge条件ではない。

---

## 4. Unit Test

純粋Domain logicを優先する。

### Targeting

最低限:

- `firstBelow`
- `allBelow`
- `firstAbove`
- `allAbove`
- `named`
- `lowestHp`
- dead Enemyを対象外
- no targetで空配列
- 同HP時の順序

### Seeded Random

- 同じseedで同じ出力
- 別seedでvariationが出る
- shuffleが決定的
- range外の値を出さない

### Battle Generator

現在のgeneratorで見るもの:

- 同じBattle ID + seedで同じ盤面
- Enemy数を維持
- HPが基準値の許容variation内
- Enemy / Skill順variation
- base Battleで意味があるtargetを消さない
- initial valid targetがある
- solvabilityを満たす
- generation失敗時に安全なfallback

### SkillDefinition

- `codeVariants`が最低1つある
- default variantからSkillCardを作れる
- code / TargetRule / conceptの対応が壊れていない

#31導入後:

- 同じseedで同じvariant
- 複数seedで複数variant
- variantがTargetRule / POWER / explanationを変えない

#32導入後:

- `lineMode: multi`の表示
- 改行維持
- multi-line codeとTargetRuleの意味一致

---

## 5. Solvability Test

可変Battleでは重要度が高い。

現在は生成候補の勝ち筋検証にも利用する。

Level導入後は意味を明確に分ける。

### 保証すること

- Stage設計上の基準 / 推奨Player statsで合理的な勝ち筋がある
- seed variationが理不尽な詰みを作らない
- 学習用Battleとして成立する

### 保証しないこと

- current Player Levelで必ず勝てる
- Playerが弱いときEnemyを自動弱体化する
- 常に戦略的最適解が1つ

将来はStageごとのreference statsをtest inputへ入れる。

---

## 6. Progression Unit Test

#43以降で追加する。

対象:

- initial PlayerProgress
- EXP → Level境界
- Level → maxHP
- Level → powerMultiplier
- EXP加算のimmutability
- clearedStageIds重複防止
- unlockedStageIds
- unlockedSkillIds
- victory reward適用
- first clear / replayの差

初期境界:

```text
Lv1: 0 EXP
Lv2: 40 EXP
Lv3: 120 EXP
Lv4: 240 EXP
```

---

## 7. Persistence Test

#47でLocalStorage layerを追加したら、UIから独立してtestする。

最低限:

- save / load
- schema version
- invalid JSON
- unknown version
- missing fields
- reset
- migration

Battle transient stateを永続化しないことも確認する。

---

## 8. Component Test

React Testing Library等は、RPG UIのstate分岐が増えた段階で導入する。

優先候補:

### Battle

- 1回目tapでSELECT
- 同じSkill 2回目でEXECUTE
- 別SkillでSELECT変更
- resolving中は追加入力不可
- damage後にHP更新
- victory / defeat
- explanation modal

### Stage Select

- READY / LOCKED / CLEAR表示
- unlocked Stageだけ開始可能
- Level / EXP表示
- replay可能

### Reward

- EXP表示
- Level Up表示
- Skill / Stage unlock表示

全部のcomponentを機械的にtestせず、壊れるとユーザーフローが止まるstate transitionを優先する。

---

## 9. Timerを使うUI

Battle演出で`setTimeout`等を使う場合、Component Testでは実時間待機を避ける。

- fake timers
- timerを進めてstate transition確認

420ms等の実時間にtestを依存させない。

---

## 10. E2E Test

Playwright等はRPG最小ループが入った段階で価値が高くなる。

優先フロー:

```text
Title
↓
Stage Select
↓
Battle
↓
Victory
↓
EXP / Unlock
↓
Stage Select
↓
Next Stage
```

Persistence導入後:

```text
Stage Select
↓
Battle CLEAR
↓
reload
↓
CLEAR / EXPが保持
```

Field導入後:

```text
Field
↓
Battle entrance
↓
Battle
↓
Victory
↓
Fieldへ復帰
```

細かいTargetRule境界値はE2EではなくUnitで守る。

---

## 11. Cloudflare Preview確認

PR / branch pushではCloudflare Workers Previewを確認する。

最低限:

- `Workers Builds: code-reading-rpg` success
- Preview URL発行
- 対象routeが開く
- UI変更ならDesktop / Mobile
- code表示が読める
- route追加なら直URL / reload

seed関連変更:

- 同じPreview URLで同じseedを再読込して盤面再現

Stage Select / persistence導入後:

- navigation
- reload
- browser storage

も確認する。

---

## 12. Production smoke test

`main` merge後、Cloudflare Production Build successを確認する。

必要に応じて、変更範囲だけ軽くsmoke testする。

毎回全Battleを完全攻略する必要はない。

例:

- route変更 → direct URL
- generator変更 → seed URL
- Stage Select変更 → Stage開始
- persistence変更 → reload

---

## 13. Visual / Accessibility

専用visual regression toolは現時点では必須にしない。

UI変更時に見るもの:

- Desktop
- Mobile
- Enemy HP / NEXT
- Skill code
- 複数Skill表示
- modal
- focus
- 色だけで状態を表していないか
- reduced motionを悪化させていないか

Field導入時はmobile controlsとcollision UIも対象にする。

---

## 14. Content Test

Battle / Skill追加時はprogramが動くだけでなく、学習コンテンツとして検証する。

- codeが正しいJavaScript
- codeとTargetRuleが同じ意味
- 学習themeが明確
- seed variation後もtheme維持
- reference statsで勝ち筋
- 未習syntaxを突然混ぜない
- POWERだけで選択が決まらない
- NEXTを見る意味がある

詳細は[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)。

---

## 15. Regression Test

bug fix時は再発防止testを検討する。

例:

- Battle 3でSkillが減る → cumulative Skill test
- seedで盤面が再現しない → deterministic generator test
- generated Battleが詰む → solvability regression
- Level境界がずれる → progression boundary test
- LocalStorage migrationで起動不能 → invalid data test

---

## 16. すべてのPRの最低条件

- [ ] 必要なUnit Test追加
- [ ] `npm run lint` success
- [ ] `npm test` success
- [ ] `npm run build` success
- [ ] GitHub Actions CI success
- [ ] Cloudflare Preview success
- [ ] 自己レビュー
- [ ] merge後Cloudflare Production success

Vercelは確認項目に含めない。

---

## 17. 次のtest優先順位

```text
[現在]
Vitest / seeded random / generator / solvability / SkillDefinition

[次]
Progression Unit
→ Reward Unit
→ Persistence Unit

[RPG UIが増えたら]
Component Test

[主要画面横断が増えたら]
E2E

[Fieldが増えたら]
movement / collision / Battle復帰のtest
```

ツールを先に増やすのではなく、守るべき挙動が増えた時点で追加する。
