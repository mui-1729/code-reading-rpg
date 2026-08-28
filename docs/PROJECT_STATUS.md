# CODE//READ RPG — Project Status

最終更新: 2026-08-28

この文書は、**このゲームが何を目指していて、今どこまで実装され、次に何を作るべきか**を短く把握するためのcurrent snapshotです。

詳細な世界観は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)、World設計は[`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)、content作成基準は[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)、優先順位は[`ROADMAP.md`](./ROADMAP.md)を参照する。

## 1. 目的

`CODE//READ RPG`は、コードを書く練習ではなく、**既存コードを読んで「現在のstateに対して何が起きるか」を判断する力を、fantasy RPGを遊びながら身につけるゲーム**です。

現在のNorth Star:

> **コードを知らない人でもRPGとして入り、世界のruleとしてコードを少しずつ読み、気づいたら自分でJavaScriptを追えるようになっている。**

REAL WORLDでは新人エンジニアとしてproblemを受けるが、専門用語の理解を開始条件にしない。

コア原則:

- Battleのtarget / effect判断は表示コードを読んで行う
- codeはCODE WORLDのruleとして実際のgame stateへ作用する
- Story / NPCは読み方を教えるが、正解targetは教えない
- technical termは原則「普通の言葉 → 意味 → 正式名称」の順で導入する
- REAL WORLD problemとCODE WORLD symptomを同じ原因としてつなぐ
- fantasy RPGらしい探索・村・戦闘・成長を残す
- RPG成長は読解を代替しない
- 同じconceptを値 / enemy順 / code variantを変えて反復する
- Worldを1枚gridへ固定せず、意味のある複数mapを行き来できるようにする

## 2. 現在のプレイ構造

```text
Title
↓
REAL WORLD briefing
まず普通の言葉で「何がおかしいか」を知る
↓ CONNECT
CODE WORLD
Overworld / Village / Forest等を探索
↓
Fixed Learning Battle / Random Encounter / Boss
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

Story copyは、`incident` / `target selection` / `shared processing`等の用語を最初から理解している前提から、初心者が症状を先に理解できる表現へ段階的に移行する。

```text
Before:
target selectionの異常を調査する

Direction:
技が、ときどき狙った相手と違う敵へ飛ぶ
→ どこで相手を決めているのか見る
→ 必要なら後でtarget selectionという名前を知る
```

CODE WORLDではmonster / village / Gold / Equipment / Shop / Inn等を普通のRPG要素として残す。

## 4. JavaScript地方 — beginner route拡張中

既存JavaScript Battle 1〜3は現在動作しているmain story baselineだが、**JavaScript編を3戦だけで完結させる前提は撤回済み**。

現在のbeginner route:

```text
GREENFIELD VILLAGE
Training 7: enemy.hp + < / >
↓
Training 8: enemy.name + ===
↓
Training 9: enemies + find()
↓
JAVASCRIPT FOREST
Fixed Battle 10: find() + &&
↓
Fixed Battle 11: find() + ||
↓
Fixed Battle 12: comparison / find() / && / || combined
↓
MID BOSS Battle 13: 既習内容だけの理解確認
↓
次: filter / Deep Forest
```

Village Trainingは各8 EXP / 0 Gold。既存`TRACE` / `PULSE` / `NOVA`を使い、小さい単位からコードを読む。

Forestでは新しい`LINK` / `FORK` Skillを使うが、Battle 13までは`filter()`を導入しない。

- `LINK`: `find()` + `&&`
- `FORK`: `find()` + `||`
- 表示codeは既習のproperty / comparison / `find()`に論理条件を足す
- Battle 10〜12はForestを奥へ進む途中の固定Lessonとして順番に導入する
- Random Encounterはclear済みLessonだけを値 / enemy順 / code variant違いで反復する
- Battle 13はForest西側main trailの固定MID BOSSで、Random Encounterには入れない
- Battle 13はJavaScript Area CLEARやBoss GUARDには接続しない
- 未学習conceptはRandom Encounter / MID BOSSで先に出さない

JavaScript地方のvisual identityは自然系で統一する。

```text
Central Hub
↓
草原
↓
林 / 川辺
↓
Village
↓
Forest
↓
Deep Forest
↓
中Boss
↓
最深部
↓
Final Boss
```

遺跡・地下・城塞等はTypeScript / Database以降へ温存する。

最終的な通常戦闘は20〜30回程度を目安にするが、Random Encounter回数だけを増やさない。同じconceptを異なる盤面で反復することに意味を持たせる。

## 5. Multi-map World

Issue #201でmulti-map基盤、Issue #203でVillage Training、Issue #205でForest learning route、Issue #207で最初のForest MID BOSSを追加する。

現在:

- Overworld 40 × 28
- viewport 11 × 9
- `worldMapId + local worldPosition`
- stable map IDs:
  - `overworld`
  - `js-village`
  - `js-forest`
- `GREENFIELD VILLAGE`: 21 × 15
- `JAVASCRIPT FOREST`: 31 × 21
- Village内Random Encounterなし
- Forest入口はTraining 9 clearで解放
- Village / Forestとも同じ`/world`上でmap transition
- current map / positionはsave / reloadで保持
- fixed objectは所属map外で誤発火しない
- Forest西側main trailのMID BOSSは直接踏めず、隣からINTERACTする

Forestのlearning / Encounter順:

```text
9 clear / 10未clear
→ Randomなし
→ 最初のWoodsでFixed Battle 10

10 clear / 11未clear
→ Random 10のみ
→ Forest中盤でFixed Battle 11

11 clear / 12未clear
→ Random 10 / 11のみ
→ Forest最深側でFixed Battle 12

12 clear / 13未clear
→ Random 10 / 11 / 12を反復
→ 西側main trailのMID BOSSからFixed Battle 13

13 clear後
→ MID BOSS突破済み
→ 次はfilter / Deep Forest sliceへ進む
```

新conceptをRandom抽選やMID BOSSで初登場させない。

## 6. Region visual identity

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
- Village Training 7〜9 beginner-first pre-Battle Story
- Forest Battle 10〜12 beginner-first pre / post Story
- Forest MID BOSS Battle 13 beginner-first pre / post Story
- TypeScript既存3Battleのstory
- REAL WORLD / CODE WORLD / REMOTE / RETURN presentation metadata
- World Objective / progress feedback
- Tutorial: MOVE → INTERACT → SELECT → EXECUTE
- Tutorial skip / replay

学習説明順:

```text
普通の言葉
→ value / property
→ comparison
→ collection
→ find()
→ && = 両方true
→ || = どちらかtrue
→ 小さく分けて組み合わせる
→ MID BOSSで既習内容だけを確認
→ 次に「条件に合うものをまとめて集める」へ進む
```

Storyは構文の読み方を説明するが、現在盤面の正解Enemy名は直接言わない。Battle 13 clear後も`filter()`という正式名称は先取りせず、次の課題の意味だけを示す。

## 8. Battle / learning runtime

現在:

- JavaScript main Battle 1〜3
- JavaScript Village Training 7〜9
- JavaScript Forest Learning 10〜12
- JavaScript Forest MID BOSS 13
- TypeScript Battle 4〜6
- SELECT → EXECUTE
- safe internal `TargetRule`。表示コードを`eval()`しない
- seeded Enemy / Skill / code variation
- Encounterごとのsemantic-equivalent variation
- multiline code + line-by-line CODE HELP
- CODE DATA inspector
- solvability / uniqueness regression tests
- Boss GUARD mechanic
- staged result sequence

Forest用にsafe domainへ最小追加したrule:

```text
firstAboveAndNamed
firstBelowOrAbove
```

Battle 13では新しいTargetRuleを追加せず、既存のTRACE / PULSE / NOVA / LINK / FORKだけを使う。

## 9. RPG / Economy

実装済み:

- Weapon / Armor / Accessory
- Shop / Pause / Reward共通visual
- purchase後の明示equip
- PATCH KIT: 30 G / HP +24 / Battle only / 1 use per Battle
- Inn: 20 G full recovery
- first-clear Gold 100%
- replay Gold 50% floor
- Village TrainingはGold 0
- Forest Learning / MID BOSSは少量Goldを持つ
- Treasure / Equipment / BYTE party

RPG Economyはcodeの正解targetを変えず、探索・準備・survivabilityへ使う。

## 10. Persistence / quality

現在:

- `PlayerProgress` schema v4
- `RpgState` schema v4
- RpgState v1〜v3 → v4 migration
- v1〜v3の旧worldPositionは`overworld`の同座標として復元
- v4はcurrent `worldMapId + local worldPosition`を保存
- `js-forest` / MID BOSS追加ではschema versionを上げない
- unknown map / bounds外locationはHub開始地点へfallback
- Training 7をinitial stage baselineへ追加
- Training / Forest clear・unlockは既存PlayerProgressへ保存
- #203時点のv4 saveでTraining 9 clear済みならrestore時にStage 10を補う
- 10 clear済みならStage 11 + LINK、11 clear済みならStage 12 + FORKをderivedして補う
- #205時点のBattle 12 clear済みv4 saveならStage 13をderivedして補う
- Tutorial state別storage
- Sound settingsをprogress resetから分離
- Vitest Unit Test
- Playwright E2E
- GitHub Actions
- Cloudflare Workers Preview / Production

回帰対象には、Village TRAIN → 7 → 8 → 9、Forest gate / transition / reload persistence、Fixed Battle 10〜12、Forest Random pool、Forest Storyの`&&` / `||`ページ送り、Battle 13 gate / Story、旧v4 save normalizationを含める。

## 11. 現在残っている整理対象

### Legacy code

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

### P0 — filter / Deep Forest

最初のForest MID BOSSを突破したあと、`find()`との違いとして`filter()`を導入する。

```text
find(): 最初の1体で止まる
filter(): 条件に合うものを全部集める
```

Storyでは先に「条件に合うものを一体ではなく全部集める」と意味を説明し、その後で`filter()`という名前へ接続する。

その後`map()` / `some()` / `every()`等へ段階的に進める。

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
- Village Training 7〜9をbeginner onboardingとして使う
- Forest Learning 10〜12は固定Lessonで順番に導入し、Randomはclear済みconceptだけを反復する
- Battle 13を最初のJavaScript MID BOSSとして使い、新syntaxを入れない理解確認にする
- `filter()`はBattle 13まで先取りしない
- JSは同じconceptを何度も異なる盤面で反復する
- JavaScript地方には複数の中Boss候補を持てる
- 3つ目の新規技術region候補はDatabase
- RPG Economy / Equipment loopは既存基盤を利用する

今後は[`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)を世界観、[`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md)をWorld構造、[`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)をlearning contentのsource of truthとして扱う。
