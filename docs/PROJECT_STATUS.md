# CODE//READ RPG — Project Status

最終更新: 2026-08-28

この文書は、**このゲームが何を目指していて、今どこまで実装され、次に何を作るべきか**を短く把握するためのcurrent snapshotです。

詳細な世界観は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、World設計は[`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)、content作成基準は[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)を参照する。

## 1. 目的

`CODE//READ RPG`は、コードを書く練習ではなく、**既存コードを読んで「現在のstateに対して何が起きるか」を判断する力を、fantasy RPGを遊びながら身につけるゲーム**です。

現在のNorth Star:

> **コードを知らない人でもRPGとして入り、世界のruleとしてコードを少しずつ読み、気づいたら自分でJavaScriptを追えるようになっている。**

REAL WORLDでは新人エンジニアとして問題を受けるが、専門用語の理解を開始条件にしない。

コア原則:

- Battleのtarget / effect判断は表示コードを読んで行う
- codeはCODE WORLDのruleとして実際のgame stateへ作用する
- Story / NPCは読み方を教えるが、正解targetは教えない
- technical termは原則「普通の言葉 → 意味 → 正式名称」の順で導入する
- REAL WORLD problemとCODE WORLD symptomを同じ原因としてつなぐ
- fantasy RPGらしい探索・村・戦闘・成長を残す
- RPG成長は読解を代替しない
- 同じconceptを値 / enemy順 / code variantを変えて反復する
- Open Worldを1枚gridへ固定せず、意味のある複数mapを行き来できるようにする

## 2. 現在のプレイ構造

```text
Title
↓
REAL WORLD briefing
まず普通の言葉で「何がおかしいか」を知る
↓ CONNECT
CODE WORLD
Overworld / Village等を探索
↓
Random Encounter / Fixed Battle / Boss
↓
Code Reading Battle
↓
EXP / Gold / Item / Equipment / Story
↓
次のmap / 地域へ進む
↓
root causeへ到達
↓ RETURN
REAL WORLD
何が直ったかを確認
```

通常導線にStage Select / Area Select /専用Complete画面はない。旧URLは互換redirectのみ残す。

## 3. World framing

既存のREAL WORLD → CONNECT → CODE WORLD二層構造は維持する。

ただしStory copyは、`incident` / `target selection` / `shared processing`等の用語を最初から理解している前提から、初心者が症状を先に理解できる表現へ段階的に移行する。

例:

```text
Before:
target selectionの異常を調査する

Direction:
技が、ときどき狙った相手と違う敵へ飛ぶ
→ どこで相手を決めているのか見る
→ 必要なら後でtarget selectionという名前を知る
```

CODE WORLDでは、monster / village / Gold / Equipment / Shop / Inn等を普通のRPG要素として残す。

## 4. JavaScript地方 — 拡張中

既存JavaScript Battle 1〜3は現在動作しているmain story baselineだが、**JavaScript編を最終的に3戦で完結させる前提は撤回した**。

Issue #203で、その前段に`GREENFIELD VILLAGE`のbeginner Training Battle 7〜9を追加した。

```text
Training 7: enemy.hp + < / >
↓
Training 8: enemy.name + ===
↓
Training 9: enemies + find()
↓
既存JavaScript地方へ
```

Trainingでは新しいTargetRuleを増やさず、既存`TRACE` / `PULSE` / `NOVA`を再利用する。各Battleは8 EXP / 0 Goldで、既存Economy / level curveへの影響を小さくする。

現在採用する地域方向:

```text
Central Hub
↓
草原
↓
林 / 川辺
↓
Village
↓
森
↓
深い森
↓
中Boss
↓
最深部
↓
Final Boss
```

JavaScriptは自然系visualで統一し、遺跡・地下・城塞等を最初の地方だけで使い切らない。

学習面では、最終的に通常戦闘20〜30回程度を目安に、同じconceptを異なる盤面で反復する。

```text
新conceptをStory / NPCで知る
→ 2〜4戦で反復
→ 既習conceptと組み合わせる
→ 中Boss
→ 次のconcept
```

20〜30個の新syntaxを覚えさせる意味ではない。

## 5. Multi-map World — Issue #201で基盤導入

Overworldを1枚mapのまま無限に広げるのではなく、classic JRPG型のmap transitionを導入する。

現在のbaseline:

- Overworldは既存save / coordinate互換のため40 × 28を維持
- viewport 11 × 9
- `worldMapId + local worldPosition`で現在地を管理
- `overworld` / `js-village`のstable map ID
- JavaScript側に`woods` / `deep-woods` terrain
- OverworldのVillage入口から`GREENFIELD VILLAGE`へ遷移
- Villageは21 × 15の別map
- Village内はRandom Encounterなし
- Village中央に固定`TRAIN` object
- Training進捗に応じて7 → 8 → 9をinteractionから開始
- 南のEXITからOverworldへ戻る
- current map / positionはsave / reloadで保持
- BYTE / Shop / Inn / Treasure / Bossは所属map外で誤発火しない

Village入口へ向かう主要導線はroadとして確保し、onboardingへ向かう途中にRandom Encounterを強制しない。

今後同じ仕組みで、Villageの先にForest / Deep Forest / Boss area等を追加できる。

## 6. Region visual identity

各技術編で大きな景観categoryを使い切らない。

現在の方向:

| 編 | 主なvisual identity |
| --- | --- |
| JavaScript | 草原 / 林 / 森 / 深い森 / 川辺 / 自然の村 |
| TypeScript | 石造道 / crystal / rune / ruins / temple |
| Database | underground archive / mine / library |
| Backend / API | gate city / road / port / network |
| React | machine city / living UI district |
| Next.js | server citadel / layered city |

TypeScriptをJavaScript Forestの色違いとして固定しない。

## 7. Story / onboarding

現在実装済み:

- REAL WORLD → CONNECT → CODE WORLD Opening
- JavaScript既存3Battleのstory
- JavaScript Village Training 7〜9のbeginner-first pre-Battle Story
- TypeScript既存3Battleのstory
- pre / post Battle story event
- REAL WORLD / CODE WORLD / REMOTE / RETURN presentation metadata
- World Objective / progress feedback
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- Tutorial skip / replay

Village Trainingでは、

```text
普通の言葉
→ enemy.hp / enemy.name
→ < / > / ===
→ enemiesという集まり
→ find()は前から探して最初で止まる
```

の順で説明する。Storyは構文の読み方を説明するが、現在盤面の正解Enemy名は直接言わない。

現在の改善方針:

- 初登場codeはStory / NPCでも短く説明する
- 比較記号など小さい単位から入ってよい
- CODE HELPは復習
- CODE DATAは現在値 / 中間値確認
- BattleでPlayer自身がtargetを判断
- Bossで初見syntaxを大量投入しない

## 8. Battle / learning runtime

現在:

- JavaScript main Battle 1〜3
- JavaScript Village Training Battle 7〜9
- TypeScript Battle 4〜6
- Training 7 → 8 → 9 first-clear unlock
- Training reward: 8 EXP / 0 Gold each
- SELECT → EXECUTE
- safe internal `TargetRule`。表示コードを`eval()`しない
- seeded Enemy / Skill / code variation
- Encounterごとのsemantic-equivalent variation
- multiline code + line-by-line CODE HELP
- CODE DATA inspector
- solvability / uniqueness regression tests
- Boss GUARD mechanic
- staged result sequence

JavaScript content拡張では、このBattle engineを複製せず、既存generator / TargetRule / seed基盤を利用する。

## 9. RPG / Economy

実装済み:

### Equipment

- Weapon / Armor / Accessory
- Shop / Pause / Reward共通visual
- currentとの差分
- owned / equipped / unavailable表示
- purchase後の明示equip

### Item

PATCH KIT:

- 30 G
- HP +24
- Battle only
- 1 use / Battle
- READY / NO STOCK / HP FULL / USED / ACTION LOCKED

### Gold / Shop / Inn

- Shop: WALLET / PRICE / AFTER / SHORT
- Inn: fixed 20 G full recovery
- HP full no charge
- insufficient Gold no mutation
- first-clear Gold 100%
- replay Gold 50% floor
- Village TrainingはGold 0で通常進行Gold budgetから分離

RPG Economyはcodeの正解targetを変えず、探索・準備・survivabilityへ使う。

## 10. Persistence / quality

現在:

- `PlayerProgress` schema v4
- `RpgState` schema **v4**
- RpgState v1〜v3 → v4 migration
- v1〜v3の旧worldPositionは`overworld`の同座標として復元
- v4はcurrent `worldMapId + local worldPosition`を保存
- unknown map / bounds外locationはHub開始地点へfallback
- Training 7をinitial stage baselineへ追加し、既存PlayerProgress saveにもrestore時に補う
- Training 7 / 8 / 9のclear / unlockは既存`PlayerProgress`へ保存しschema bumpしない
- Tutorial state別storage
- Sound settingsをprogress resetから分離
- old save migration / invalid value normalization
- Vitest Unit Test
- Playwright E2E
- GitHub Actions
- Cloudflare Workers Preview / Production

multi-map migration / portal / no-encounter Village / reload persistenceに加え、Village TRAIN → 7 → 8 → 9 → TRAINING COMPLETEの回帰E2Eを持つ。

## 11. 現在残っている整理対象

### Legacy code

Open World化前のField / Quest / Area dataの一部が残る。

- `/javascript/field` / `/typescript/field`は`/world`へredirect
- 旧Field definitionはlearning / story regression fixtureで一部利用
- `completedSideQuestIds`はsave migration互換で残す

unused UIと、互換・test fixtureとして必要なdataを分ける。

### Large orchestration components

- `src/App.tsx` — Battle runtime orchestrationが大きい（Issue #196）
- `src/world/WorldPage.tsx` — resolver分離済みだがUI adapter責務が多い
- `src/ui/PauseMenu.tsx` — tabs presentationが1file

挙動変更と大規模refactorを同じIssueへ混ぜない。

## 12. 次に実装する優先候補

### P0 — JavaScript Forest / boolean condition expansion

Village onboardingの次は、JavaScript地方を西へ進める意味を増やす。

次candidate:

```text
Village Trainingで既習:
comparison / property / collection / find
↓
Forest入口:
&& / ||
↓
Random Encounterでfind + && / ||を反復
↓
filter
↓
最初の中Boss
↓
Deep Forest
```

実装では、

- Village以西のForest進行
- `&&` / `||`をbeginner-first Storyで導入
- 既習conceptと組み合わせたrepeated Encounter variation
- 最初の中Boss

を小さいsliceへ分ける。

### P1 — Battle runtime responsibility split (#196)

Database等の大規模content追加前に、`src/App.tsx`のsession / action / enemy turn / result handoff境界を低リスクで分離する。

JavaScript content expansionと同じPRへ混ぜない。

### P1 — TypeScript visual / Story pass

- JavaScript自然地域との差を明確にする
- stone / crystal / rune / ruins方向
- 「API契約」等のStory用語を初心者向けへ噛み砕く
- TS固有Boss mechanicを検討

### P2 — Database編 prototype

JavaScript / TypeScriptの基盤が十分になったあと3つ目のlearning regionとして検証する。

candidate:

- table / row / column
- SELECT / WHERE
- AND / OR
- ORDER BY / LIMIT
- JOIN
- NULL
- GROUP BY / aggregate

field candidateはunderground archive / mine / library。

## 13. 長期learning content

```text
JavaScript
→ TypeScript
→ Database
→ Backend / API
→ React
→ Next.js
→ TanStack
→ Team Development / Delivery
→ Security
→ Production / Performance
→ Architecture / Refactoring
```

順番はmental model / prototype結果に応じて調整可能。

## 14. 当面やらない

- Stage Select / Area Select復活
- 大量Quest Log /常設HUD
- Login / Cloud Save / Ranking
- auto target / auto battle
- 数値だけ違うEquipment大量追加
- 空白だけ増える巨大map expansion
- Random Encounter回数だけを水増しすること
- office map / meeting / Slack操作等のreal-world simulation
- fantasy要素をtechnical UIへ全面置換
- JavaScriptだけで遺跡 / 地下 / 城塞等の景観を使い切ること
- Storyが正解targetを直接教えること

## 15. 決定済みの大きな方向

- beginner-firstなcode-reading fantasy RPG
- REAL WORLD + fantasy CODE WORLD二層構造
- codeはCODE WORLDのruleとして実際のtarget / effectを決める
- Storyは「普通の言葉 → 意味 → technical term」の順
- Story / NPCは読み方を教え、正解はPlayerが判断
- Worldはmulti-mapへ拡張可能にする
- JavaScript = 自然系地方
- TypeScript = stone / crystal / ruins方向
- Database = underground / archive方向
- JavaScript既存3Battleはmain story baselineであり、最終的なBattle数の上限ではない
- JavaScript Village Training 7〜9をmain story前段のbeginner onboardingとして使う
- JSは同じconceptを何度も異なる盤面で反復する
- JavaScript地方には中Bossを置いてよい
- 3つ目の新規技術region候補はDatabase
- RPG Economy / Equipment loopは既存基盤を利用する

今後は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)を世界観、[`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)をWorld構造、[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)をlearning contentのsource of truthとして扱う。
