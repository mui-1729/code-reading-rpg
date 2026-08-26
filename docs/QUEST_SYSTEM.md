# Main Quest System

## 目的

Main Questは、Battle・Field・NPC・Area progressionを1つのRPGループとしてつなぐための目的管理レイヤーです。

Quest状態そのものは保存せず、既存の`PlayerProgress`にあるStage CLEAR / Area CLEARから毎回導出します。

```text
PlayerProgress
↓
Quest Progress
↓
Quest Tracker / Field Marker / Victory Feedback
```

このため、Quest追加だけを理由にsave schemaを増やしません。

## 現在のMain Quest

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

Quest definitionとstep条件は`src/quests/quests.ts`をsource of truthにします。

## プレイヤーへの表示

### Quest Tracker

World Map / Area / FieldでMain Quest一覧を開けます。

- `Q`: OPEN / CLOSE
- `Esc`: CLOSE
- `LOCKED / ACTIVE / COMPLETE`
- 現在の次stepを`▶`で表示

Battle中はコード読解UIを邪魔しないためTrackerを表示しません。

### Field Quest Marker

ACTIVE Questから次のField目標を導出します。

- 次のBattle Gate: `NEXT`
- Objective Guide NPC: `!`
- Area CLEAR後: markerなし

Markerは見た目だけで、collision / interaction / save schemaには影響しません。

### Victory Feedback

BattleでQuest条件が初めて成立したとき、Victory画面上にQuest更新を表示します。

```text
QUEST UPDATED
✓ 今回完了したstep
NEXT → 次のstep
```

Boss撃破でMain Quest全stepが完了した場合は、

```text
MAIN QUEST COMPLETE
```

として表示します。

再戦ではEXPが増えてもQuest条件自体は変化しないため、Quest更新を表示しません。

## 実装原則

- Quest判定は`src/quests/`のpure functionへ置く
- Battle logicへQuest条件判定を埋め込まない
- save schemaをQuest表示都合で増やさない
- Quest MarkerはField進行経路を塞がない
- Battle中のコード読解をQuest UIで邪魔しない
- 新Area追加時はArea固有UIを増やす前にdata-drivenなQuest definitionを追加する

## テスト

最低限、次をpure unit testで固定します。

- Stage CLEARで次stepへ進む
- Area CLEARでQuest COMPLETEになる
- JavaScript / TypeScriptが独立して進行する
- Field Markerが次Gateへ切り替わる
- Area CLEAR後にMarkerが消える
- 初回CLEARだけVictory Feedbackを返す
- replayではVictory Feedbackを返さない
