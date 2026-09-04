# CODE//READ RPG ロードマップ

この文書は**次に何を作るか**を管理する。

- current snapshot: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- game design: [`GAME_DESIGN.md`](./GAME_DESIGN.md)
- world / theme: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- JavaScript geography: [`JAVASCRIPT_WORLD_TOPOLOGY.md`](./JAVASCRIPT_WORLD_TOPOLOGY.md)
- world runtime / progression: [`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)
- learning content: [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)
- long-term chapters: [`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md)

## North Star

`CODE//READ RPG`を、

> **コードを知らない人でもfantasy RPGとして入り、世界のruleとしてコードを少しずつ読み、遊んでいるうちに自分でコードを追えるようになるRPG**

として育てる。

優先順位:

1. code readingがgame decisionになっている
2. コード未経験者がStory / dialogueを理解できる
3. fantasy RPGとして探索・戦闘・成長が楽しい
4. REAL WORLD problemとCODE WORLD symptomが同じ原因へつながる
5. RPG成長がcode readingを代替しない
6. runtime / save / testsを壊さず拡張できる
7. 同じconceptを十分反復してから次へ進む

---

## Current foundation

- multi-map World + viewport 11×9
- GREENFIELD VILLAGE
- JavaScript Forest / Deep Forest
- TypeScript Frontier
- incident-first JS-01〜JS-19 progression
- fixed-first learning Battle + clear済みRandom review
- World Objective / Story guidance
- persistent HP / equipment / party / economy
- Shop / paid Inn / Treasure
- Atlas
- pixel map transition
- atomic save + Battle session rollback

既存Forest / Deep Forestの31×27や東→西routeはcurrent implementation snapshotであり、今後のtarget layoutではない。

---

# P0 — JavaScript World redesign (#377)

Database等の次Region追加より先に、JavaScript地方を**旅するField + 探索するLocal Map + 複数safe hub**として成立させる。

## Phase 1 — Region topology / docs

最初に地方全体を設計する。

```text
Central Field
├─ Riverside optional
├─ GREENFIELD [SAFE HUB 1]
└─ woods / bridge / road → Forest
        ↓
JavaScript Forest
        ↓
Forest Settlement [SAFE HUB 2]
        ↓
JavaScript Deep Forest
        ↓
Final Approach
        ↓
JS Final
```

完了条件:

- Overworld / FieldとLocal Mapのscaleを分ける
- 第二の有人集落を配置する
- main route自体に複数direction changeを持たせる
- meaningful branch / rejoin loopを前提にする
- visual landmarkで場所を覚えられる構造にする
- #352 / #373 / #375を本topologyの下位作業にする

## Phase 2 — Overworld / Field scale

Overworldを細かい生活空間ではなく、地域間を旅する地理へ整理する。

- 草原 / 林 / 川 / 橋 / 街道
- GREENFIELDを地域として読める入口
- Forestを地形として読める入口
- optional riverside loop
- 次地方への境界

mapの数字ではなく、景色が変わり「次の土地へ移動した」と感じられることを基準にする。

## Phase 3 — Safe hub / interaction

順序:

1. #370 facing → Action interaction authority
2. #375 persistent safe checkpoint
3. #330 GREENFIELDの宿 / 道具 / 装備 / NPC導線を統合
4. Forest Settlementを追加

checkpoint:

- 初回入村で自動登録
- Inn利用でも再登録可能
- autosaveとは別責務
- Defeat RETURNは保存checkpointへ戻る
- camp / springは部分回復でありVillage代替にしない

## Phase 4 — JavaScript Forest (#352)

#352を#377 topologyへ従わせて実装する。

- width / heightだけでcloseしない
- main route自体で上下左右を使う
- 複数direction change
- meaningful branches
- loop / rejoin
- river / bridge / clearing / fallen-log等の景観landmark
- Treasure / recovery / NPC等を枝道へ置く
- fixed Battleを実際の場所へ結びつける
- hidden x threshold / Battle数だけの文字札へ戻さない

## Phase 5 — Deep Forest / Final Approach

Forestより明確に奥地の距離感を持たせる。

- wetland / spring / giant roots / giant tree
- Forestより長い縦横移動
- branch / loopを増やす
- Forest SettlementからFinalまでの旅として成立させる
- 第三集落は距離を測った結果必要なら比較し、先に数を決めない

## Phase 6 — Atlas / exploration (#371/#372/#373)

- Pause navigationをcompact selectorへ
- Atlas zoomを100/125/150%へ整理
- cell-level Fog of War
- 歩いた周辺だけreveal
- 地域地図をShopで購入可能
- 購入地図でもTreasure / secret位置は公開しない

一本道のままFogを入れない。

---

# P0 — Battle / moment-to-moment UX

World redesignと独立して安全に入れられるものは先に完了してよい。

## #347 Battle command hierarchy

```text
戦う / アイテム / 逃げる
```

を同階層へ統合し、Fight / Item詳細を同じpaneで切り替える。

## #374 Encounter cue

```text
遭遇
→ Player頭上 !
→ encounter SE
→ 短いinput lock
→ 遭遇専用transition
→ Battle
```

通常map transition #361とは別責務にする。

---

# P1 — Battle runtime responsibility split (#196)

大規模な新Region追加より先に`App.tsx`へ集まったBattle責務をgameplay-neutralに分離する。

候補:

- battle session identity / transition
- player action execution
- enemy turn
- persistent HP result handoff
- story / result presentation bridge

完了条件:

- TargetRule semanticsを変えない
- generator / solvabilityを変えない
- save schemaを不要に変えない
- JS / TS unit / E2Eを境界として維持

#196へ新learning contentを混ぜない。

---

# P1 — TypeScript visual / beginner Story pass

JavaScript自然地域の色違いにしない。

- stone road
- crystal
- rune
- ruins
- structured architecture

初心者には現象 / 普通の言葉を先に見せ、technical termは意味の後に添える。

---

# P2 — Database prototype (#246)

次の新規technical Region候補。

- underground / archive / mine / library
- SELECT / WHERE / ORDER BY / LIMITを読む1 Battle prototype

**現在のopen-issue一括実装では#246を対象外とする。** JavaScript World redesignのためにDatabase地域を先行実装しない。

---

# P2 — RPG depth

learning routeを壊さずRPGとして厚くする。

- optional side path / treasure
- equipment choice
- Party拡張
- region固有NPC
- Inn / Shopの地域差
- Boss前の準備

禁止:

- statだけでcorrect targetを無視できるauto battle
- mandatory grind
- Random Encounter回数だけの水増し
- 空白だけ増える巨大map

---

## Quality gate

すべてのgameplay PRでPR前 / PR後に確認する。

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

その後:

```text
GitHub Actions
Cloudflare Preview
Self Review
Merge
main CI
Cloudflare Production
```

実行していないcheckを「通った」とは扱わない。

---

## 当面やらない

- Stage Select / Area Select復活
- Login / Cloud Save / Ranking
- auto target / auto battle
- JavaScript地方へのtechnical concept詰め込み
- JavaScriptだけで遺跡 / 地下 / 城塞を使い切る
- numeric legacy Battle IDをchapter番号へ再利用
- width / heightだけ増やしてWorld redesign完了扱い
