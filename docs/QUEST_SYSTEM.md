# Quest System

## 目的

QuestはBattle・Field・NPC・Area progressionを1つのRPGループとしてつなぐ。

```text
PlayerProgress
↓
Quest Progress
↓
Quest Tracker / Field Marker / Victory Feedback
```

## Main Quest

Main Questは保存せず、Stage CLEAR / Area CLEARから毎回導出する。

### JavaScript Kingdom

```text
FIRST READ GATE CLEAR
↓
ONE OR MANY GATE CLEAR
↓
Boss撃破 / AREA CLEAR
```

### TypeScript Frontier

```text
TYPED ENTRY GATE CLEAR
↓
MAYBE VALUE GATE CLEAR
↓
Frontier Compiler撃破 / AREA CLEAR
```

definitionとstep条件は`src/quests/quests.ts`をsource of truthにする。

## Side Quest

Main Quest完了後に、過去Stageを再攻略する目的を追加する。

現在のSide Quest:

```text
JavaScript AREA CLEAR
→ SECOND PASS
→ Stage 1を再攻略
→ +40 EXP
```

```text
TypeScript AREA CLEAR
→ TYPE RECHECK
→ Stage 4を再攻略
→ +50 EXP
```

Side Questの進行は次のルールにする。

- Area CLEAR前: `LOCKED`
- Area CLEAR後: `ACTIVE`
- 対象Battleを再攻略: `COMPLETE`
- bonus EXPはQuestごとに1回だけ
- COMPLETE後の再攻略ではbonus EXPを重複付与しない

一度だけの報酬を保証するため、`completedSideQuestIds`だけをPlayerProgressへ保存する。

## Quest Tracker

World Map / Area / Fieldで`Q`から開く。

- 常設toggleは従来の`QUEST`のみ
- Main Questを表示
- Side Questは解放後だけ同じpanel内へ表示
- Battle中は非表示
- `Esc`で閉じる

Side Questのために常設panelや別toggleは追加しない。

## Field Quest Marker

Main QuestのACTIVE stepだけをField Markerへ使う。

- 次のBattle Gate: `NEXT`
- Objective Guide NPC: `!`
- Area CLEAR後: markerなし

Side Questは現在Markerを増やさず、Quest Logから確認する。

## Victory Feedback

Main Quest条件が初めて成立した場合:

```text
QUEST UPDATED
```

Main Quest全step完了時:

```text
MAIN QUEST COMPLETE
```

Side Quest完了時:

```text
SIDE QUEST COMPLETE
+XX EXP
```

Battle結果画面へ長い説明文を追加せず、状態変化だけを短く通知する。

## Save

schema v3:

```text
exp
clearedStageIds
clearedAreaIds
completedSideQuestIds
unlockedStageIds
unlockedSkillIds
```

- Main Quest: Stage / Area進行から導出
- Side Quest: 完了IDだけ保存
- v1 / v2 migration: 既存CLEARを維持し、Side Questは未完了から開始

## 実装原則

- Quest判定は`src/quests/`のpure functionへ置く
- BattleのTargetRuleへQuest条件を混ぜない
- Main Questは導出可能な状態を重複保存しない
- Side Questの永続化は一度だけの報酬に必要な最小情報だけ
- Quest UIでBattleのコード読解を邪魔しない
- Side Questを増やしてもField objectを無制限に増やさない

## テスト

最低限:

- Main Quest Stage / Area進行
- Field Marker切替
- Main Quest replayでfeedbackなし
- Side Quest LOCKED → ACTIVE → COMPLETE
- 対象外BattleではSide Questが進まない
- bonus EXPは一度だけ
- JavaScript / TypeScript Side Questが独立
- v1 / v2 → v3 migration
