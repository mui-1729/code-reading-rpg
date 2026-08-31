# CODE//READ RPG — Project Status

最終更新: 2026-08-31

この文書は、**このゲームが何を目指していて、今どこまで実装され、次に何を作るべきか**を短く把握するためのcurrent snapshotです。

詳細は、世界観[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、World構造[`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)、learning content基準[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、優先順位[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. North Star

`CODE//READ RPG`は、コードを書く練習ではなく、**既存コードを読んで「現在のstateに対して何が起きるか」を判断する力を、fantasy RPGを遊びながら身につけるゲーム**。

> **コードを知らない人でもRPGとして入り、世界のruleとしてコードを少しずつ読み、気づいたら自分でJavaScriptを追えるようになっている。**

コア原則:

- Battleのtarget / effect判断は表示コードを読んで行う
- Story / NPCは読み方を教えるがcorrect targetは教えない
- technical termは「普通の言葉 → 意味 → 正式名称」の順で導入する
- 同じconceptを値 / enemy順 / code variantを変えて反復する
- RPG成長はcode readingを代替しない
- Worldは1枚gridへ固定せず、意味のある複数mapを行き来できる
- **現象を先に体験し、必要性を知ってからcodeを学ぶ**
- numeric legacy Battle IDをchapter番号としてPlayerへ見せない

## 2. 現在のプレイ構造

```text
Title
↓
REAL WORLD briefing
↓ CONNECT
CODE WORLD
↓
最初の異変を実際に体験
↓
Villageで読めなかった部分を確認
↓
Forest / Deep Forestへ同じtraceを追う
↓
Code Core root cause
↓
REAL WORLD RETURN
```

通常導線へStage Select / Area Selectは戻さない。旧URLは互換redirectのみ残す。

## 3. JavaScript地方 — incident-first route

JavaScript編は19個のStory beatとして表示する。

```text
JS-01  LIVE INCIDENT
↓
JS-02  hp / comparison
JS-03  name / ===
JS-04  find()
↓
JS-05  find() + &&
JS-06  find() + ||
JS-07  combined conditions
JS-08  Forest MID BOSS
JS-09  find() vs filter()
↓
JS-10  SECOND SYMPTOM
↓
JS-11  filter() repetition
JS-12  map()
JS-13  some()
JS-14  every()
JS-15  Deep Forest MID BOSS
JS-16  sort() + [0]
JS-17  nested data + ?. + ??
JS-18  reduce()
↓
JS-19  Code Core ROOT CAUSE
```

### Story intent

- JS-01でPlayerはまだ全部のcodeを説明できなくてよい
- まず「何かおかしい」をstateと結果から観察する
- JS-02〜04はJS-01で読めなかった部分を小さく分解する
- Forest以降はsyntax syllabusではなく、同じincidentのtraceを追うために必要な読み方を導入する
- JS-10でREAL WORLD側にも影響が広がっていることを再確認する
- JS-18後はDeep Forest西口からCode Coreへ直接前進する
- 終盤に草原へ戻って古いBattleを消化するbacktrackは行わない

### Internal compatibility IDs

numeric `battleId`はURL / save / runtime互換用。

```text
JS-01 -> 1
JS-02 -> 7
JS-03 -> 8
JS-04 -> 9
JS-05 -> 10
JS-06 -> 11
JS-07 -> 12
JS-08 -> 13
JS-09 -> 14
JS-10 -> 2
JS-11 -> 15
JS-12 -> 16
JS-13 -> 17
JS-14 -> 18
JS-15 -> 19
JS-16 -> 20
JS-17 -> 21
JS-18 -> 22
JS-19 -> 3
```

Story順のauthorityはsemantic progression key。numeric IDの大小をchapter順として扱わない。

## 4. Multi-map World

stable map:

- `overworld` — 40 × 28
- `js-village` — GREENFIELD VILLAGE 21 × 15
- `js-forest` — JAVASCRIPT FOREST 31 × 27
- `js-deep-forest` — JAVASCRIPT DEEP FOREST 31 × 27
- `ts-frontier` — TYPESCRIPT FRONTIER 31 × 21

共通:

- viewport 11 × 9
- `worldMapId + local worldPosition`保存
- `/world` route上でmap transition
- local mapからBattleへ入り、same map / positionへ戻る
- Defeat時だけOverworld Hubへ戻す

### Portal gate authority

`src/world/worldMap.ts`のportal metadataをgateのauthorityにする。

```text
Village entrance      -> JS-01 clear required
Forest entrance       -> JS-04 clear required
Deep Forest entrance  -> JS-09 clear required
Code Core west exit   -> JS-18 clear required
TypeScript Frontier   -> JS-19 clear required
```

同じgate条件を`WorldPage` / `worldActions`へ特例として二重実装しない。

## 5. Battle runtime

現在:

- JavaScript 19 Story beat
- TypeScript 3 Story beat
- SELECT → EXECUTE
- safe internal `TargetRule`; display codeを`eval()`しない
- seeded Enemy / Skill / code variation
- semantic code variation
- battle-aware learned-syntax policy
- solvability / uniqueness regression tests
- CODE HELP / CODE DATA
- Boss GUARD
- staged result sequence
- persistent HP

Story / CODE HELPは読み方を説明するが、現在盤面のcorrect target名 / 対象数はPlayerへ残す。

## 6. RPG / Economy

実装済み:

- EXP / Level
- persistent HP
- Weapon / Armor / Accessory
- Shop / explicit equip
- PATCH KIT
- paid Inn
- first-clear / replay Gold
- Treasure
- BYTE party / follower

BYTEはPlayerがcodeから選んだ**同じtarget**へ追撃し、correct targetを自動決定しない。

Story reorderだけを理由にEconomyを変更しない。JS-01はGold 20 Gを維持し、EXPだけ序盤のoverlevelを防ぐよう抑える。

目安:

- JS-01: Lv1のまま
- Village完了〜Forest序盤: Lv2帯
- JS-10付近: recommended Lv3と整合
- Final付近: recommended Lv5へ自然に近づく

## 7. TypeScript

TypeScriptはJavaScriptと独立したplayer-facing番号系列。

```text
TS-01 CONTRACT TRACE
→ TS-02 DATA SHAPE
→ TS-03 ROOT CAUSE
```

internal compatibility IDは4 / 5 / 6。

今後のbeginner Story passでもJavaScriptと同様に、technical termから始めず**現象 → 普通の言葉 → 型情報**の順にする。

## 8. Persistence / compatibility

- `PlayerProgress` schema v4
- `RpgState` schema v4
- old schema migration
- current `worldMapId + local worldPosition`保存
- semantic prerequisiteを推移的に検証
- forged / partial clear bitでは後続へ進めない

#261以前のsaveは新しい序盤へ巻き戻さない。

- 旧Training以降へ進行済み → JS-01を論理的に通過済みとして補完
- 旧Deep Forest以降へ進行済み → second symptomも補完
- JavaScript Boss clear済み → modern JavaScript arc全体をcompletedとしてnormalize

numeric IDを維持するのは互換性のためであり、将来のchapter追加で既存IDを振り直す前提にはしない。

## 9. Quality gate

回帰対象:

- fresh saveの最初のStory BattleはJS-01
- JS-01前はVillageへ入れない
- JS-01 clear後にVillageへ進める
- JS-02 → JS-03 → JS-04
- JS-04前はForestへ入れない
- JS-04後にForestへ進める
- Forest JS-05〜09
- JS-09後にDeep ForestでJS-10 fixed second symptom
- JS-10後にDeep Forest JS-11〜18
- MID BOSSをRandom poolへ入れない
- new conceptをRandomで初登場させない
- JS-18後にCode Coreへ直接進む
- JS-19はfull semantic prerequisite chain完了までlocked
- old save normalization
- Economy invariant
- displayed code / TargetRule semantics一致
- correct target leakageなし

PR前 / PR CI:

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

## 10. 次の優先順位

JavaScript incident-first routeがgreenになった後:

1. Battle runtime responsibility split (#196)
2. TypeScript visual / beginner Story pass
3. Database編prototype
4. RPG depthの追加

新region追加時も、

```text
現象を先に体験
→ 必要性
→ 読解
→ trace
→ root cause
```

を基本にする。
