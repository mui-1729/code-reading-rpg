# CODE//READ RPG Tutorial

## 目的

初回Playerが既存UIを実際に操作しながら、最低限のゲーム操作だけを短時間で理解できるようにする。

Tutorialは構文学習そのものを担当しない。JavaScript / TypeScriptの概念はFieldの看板・NPC・Code Codex・CODE HELPへ任せる。

## 原則

- 初回だけ表示する
- 全画面overlayで操作を止めない
- 説明を読んでNEXTを押す形式にしない
- 実際の操作成功をstep完了条件にする
- Battleのtargetや正解Skillを教えない
- Tutorial都合のstateをBattle Domain / PlayerProgressへ混ぜない
- Desktop / Mobileの既存操作をそのまま使う
- `SKIP`後は再表示しない
- `RESET PROGRESS`時はTutorialも初期状態へ戻す

## Flow

```text
Fieldへ入る
↓
MOVE
↓ 実際に1tile以上移動
INTERACT
↓ 正面にinteraction objectがある状態で操作
Battle
↓
SELECT
↓ Skill cardを1回押す
EXECUTE
↓ 選択中Skillをもう1回押す
Tutorial COMPLETE
```

Stage SelectやbookmarkからBattleへ直接入った場合は、Field stepを飛ばしてBattle Tutorialへ進む。

## Field Tutorial

### MOVE

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

壁へ入力して座標が変化しなかった場合は完了しない。

### INTERACT

Playerの正面にBattle Gate / NPC / Sign / Exitのいずれかが存在する時だけ表示する。

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

特定objectを「正解」として強く囲わず、操作buttonだけを軽く強調する。

## Battle Tutorial

Tutorial側で`battle-select` / `battle-execute`を永続化しない。

Battle runtimeの既存DOM状態から、選択中Skillがあるかを判断する。

```text
.skill-card.selected がない
→ SELECT prompt

.skill-card.selected がある
→ EXECUTE prompt
```

これによりSELECT後にreloadしても、選択状態が消えたBattle UIとTutorial stateが矛盾しない。

### SELECT

```text
SELECT
コードを読んで、Skillを1枚選ぼう
```

特定SkillやEnemyはhighlightしない。

### EXECUTE

```text
EXECUTE
選んだSkillをもう一度押して実行
```

別Skillへ選び直した場合は、新しく選択されたSkillに対して引き続きEXECUTEを案内する。

最初のSkill実行開始でTutorialを完了する。targetの有無、damage、victory / defeatは完了条件にしない。

## CODE HELP

Battle Tutorial中に次だけ補助表示する。

```text
困ったら右下の ? から CODE HELP を確認できる
```

CODE HELPを開くことは必須にしない。

## Persistence

PlayerProgressとは別keyへ保存する。

```text
code-reading-rpg:tutorial
```

schema:

```ts
type TutorialStatus = 'active' | 'completed' | 'skipped'
type TutorialPhase = 'field-move' | 'field-interact' | 'battle'

type TutorialState = {
  version: 1
  status: TutorialStatus
  phase: TutorialPhase
}
```

壊れたJSON、未知version、未知status / phaseは初期状態へfallbackする。

## Architecture

```text
src/tutorial/
├── tutorial.ts              # pure state transition
├── storage.ts               # LocalStorage schema / restore
├── TutorialContext.ts
├── TutorialProvider.tsx
├── TutorialPrompt.tsx       # existing UI operation observation / prompt
├── useTutorial.ts
└── *.test.ts
```

TutorialPromptは既存Field / BattleのDOMを観測し、Tutorial専用の分岐をBattle Domainへ追加しない。

FieldではPlayer tileの実移動、正面interaction object、既存INTERACT操作を観測する。Battleでは既存`.skill-card` / `.selected`を観測する。

`RESET PROGRESS`はProgressionから汎用reset eventをdispatchし、TutorialProviderが受け取ってTutorial stateをresetする。ProgressionはTutorial moduleをimportしない。

## Accessibility / Motion

- promptは`aria-live="polite"`
- keyboard操作を塞がない
- Mobile D-Pad / INTERACT / Skill cardをpromptで覆わない
- highlightは色だけでなくoutlineを使用する
- `prefers-reduced-motion: reduce`ではpulse animationを停止する

## Test

Unit Test:

- `field-move → field-interact → battle → completed`
- Battle direct entry
- SKIP後に遷移しない
- completed後に遷移しない
- serialize / restore
- completed / skipped保持
- missing storage fallback
- broken JSON fallback
- unknown version fallback
- unknown status / phase fallback

Manual QA:

- JavaScript Field Desktop
- JavaScript Field Mobile
- TypeScript Fieldから初回開始
- Stage SelectからBattleへdirect entry
- Skill選び直し
- SELECT後reload
- CODE HELP open / close
- SKIP
- RESET PROGRESS後の再表示
- reduced motion
