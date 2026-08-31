# CODE//READ RPG Tutorial

## 目的

初回Playerが**現在のOpen World UIとBattle UIを実際に操作しながら**最低限の操作を理解できるようにする。

Tutorialは構文学習そのものを担当しない。JavaScript / TypeScriptの概念はCode Codex / CODE HELP / CODE DATAへ任せる。

## 原則

- 初回だけ自動表示
- overlayで操作を止めない
- NEXTを読むだけのTutorialにしない
- 実操作成功を完了条件にする
- target / 正解Skillを教えない
- Tutorial stateをPlayerProgress / RpgState / Battle Domainへ混ぜない
- Desktop / Mobileの既存操作を使う
- SKIP後は自動再表示しない
- MENU > SYSTEM > REPLAY TUTORIALからいつでもやり直せる
- RESET PROGRESSでTutorialも初期状態へ戻す

## Flow

```text
Open World
↓
MOVE
↓ World実座標が変化
INTERACT
↓ interaction object隣接時に操作
Battle
↓
SELECT
↓ Skill cardを1回押す
EXECUTE
↓ selected Skillをもう1回押す
COMPLETE
```

Battle URLへdirect entryした場合はWorld stepを飛ばしてBattle Tutorialへ進める。

## MOVE

Desktop:

```text
MOVE
WASD / Arrowで歩いてみよう
```

Mobile:

```text
MOVE
D-Padで歩いてみよう
```

camera追従でPlayerがviewport中央に見え続けても、Tutorialはvisible tile indexではなく`data-world-x / data-world-y`の**実World座標変化**を観測する。

blocked terrainへ入力し座標が変わらなければ完了しない。

## INTERACT

現在のWorldでinteraction対象になりうるもの:

- BYTE NPC
- Hub SHOP
- JavaScript Boss
- TypeScript Boss

隣接した状態でのみINTERACT promptを表示する。

World characterはtileの子要素ではなく専用overlay layerにいるため、隣接判定はPlayerと各World tileの`data-world-x / data-world-y`を比較して行う。

Desktop:

```text
INTERACT
Enter / Spaceで調べる
```

Mobile:

```text
INTERACT
INTERACTを押して調べる
```

特定objectを「正解」として強調しない。

## Battle Tutorial

Tutorial側でbattle-select / battle-executeを永続化しない。

BattleRuntimeのReact snapshotからselected Skillと実行状態を判定する。表示文言やCSS classは進行判定のsource of truthにしない。

```text
snapshot.selectedSkillId なし
→ SELECT

snapshot.selectedSkillId あり
→ EXECUTE
```

### SELECT

```text
SELECT
コードを読んで、Skillを1枚選ぼう
```

正解SkillやEnemyはhighlightしない。

### EXECUTE

```text
EXECUTE
選んだSkillをもう一度押して実行
```

最初のSkill実行開始でTutorial COMPLETE。target有無 / damage / victoryは条件にしない。

## CODE HELP

Battle Tutorial中に必要なら短く:

```text
困ったら右下の ? から CODE HELP
```

CODE HELP使用は必須にしない。

## Replay

TutorialをSKIP / COMPLETEした後でも、Pause MENUのSYSTEMから`REPLAY TUTORIAL`を選べる。

- World / Battleのどちらで実行しても、Overworld開始地点へ移動し`field-move`から再開する
- Battleで実行: 未完sessionのHP / Item等を開始snapshotへrollbackしてから、World位置とEncounter歩数を再設定する
- PlayerProgress / Equipment / Party等の確定済み進行は維持する。Battleの仮回復・仮消費だけはABORT policyに従って両方戻す

## Persistence

PlayerProgress / RpgStateとは別key。

```text
code-reading-rpg:tutorial
```

schema v1:

```ts
type TutorialStatus = 'active' | 'completed' | 'skipped'
type TutorialPhase = 'field-move' | 'field-interact' | 'battle'
```

`field-*`という内部phase名は旧実装由来。current UIは`/world`を対象にする。schema migrationの必要が生じるまで名前だけを理由に変更しない。

invalid JSON / unknown version / unknown status / phaseはinitialへfallbackする。

## Architecture

```text
src/tutorial/
├── tutorial.ts
├── storage.ts
├── TutorialContext.ts
├── TutorialProvider.tsx
├── TutorialPrompt.tsx
├── useTutorial.ts
└── *.test.ts
```

TutorialPromptはWorldの実座標DOMを観測する。Battleでは`BattleRuntimeProvider`のselected Skill / phase / resolving / modal状態を購読し、DOM参照はhighlight配置だけに使う。route判定はArea registryから導出し、Tutorial専用分岐をBattleのtarget / damage domainへ入れない。

RESETはProgressionの共通reset eventを受けてTutorialProvider自身が行う。

## Accessibility / Motion

- `aria-live="polite"`
- keyboard操作を塞がない
- Mobile D-Pad / INTERACT / Skill cardを覆わない
- highlightはoutlineも使う
- reduced motionではpulseを停止する

## Test

Unit:

- phase transition
- direct Battle entry
- SKIP / completed後の停止
- serialize / restore
- broken storage fallback

Manual / E2E:

- `/world` Desktop MOVE
- `/world` Mobile MOVE
- BYTE / SHOP / Boss隣接INTERACT
- camera端でのMOVE
- Battle SELECT / EXECUTE
- Skill選び直し
- direct Battle entry
- SKIP
- SYSTEMからREPLAY TUTORIAL
- RESET後の再表示
- reduced motion
