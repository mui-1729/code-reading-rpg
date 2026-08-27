# Progress Guidance / Legacy Quest Domain

この文書は、旧Quest systemが現在どう扱われているかを説明する。

**current runtimeの進行案内はQuest TrackerではなくWorld Objectiveがsource of truth**。

## 1. Current progress guidance

```text
PlayerProgress
↓
worldObjective pure derivation
↓
NEXT OBJECTIVE / Pause STATUS / Battle result feedback
```

現在は、Stage Select / Field Gate / Quest Logを経由せず、Open World上で次の行動を案内する。

### JavaScript

current storyに合わせて、概ね次を案内する。

```text
Opening
→ BYTEと合流
→ JavaScript Grassland
→ Chapter 1
→ Chapter 2
→ Code Core / Final
→ clear
```

### TypeScript

TypeScript regionもPlayerProgressからEncounter / next Battle / Boss unlock / clearをderiveする。

今後storyを再構成する場合も、objective derivationはWorld側に置く。

## 2. Presentation

current progress presentation:

- World上部の`NEXT OBJECTIVE`
- Pause > STATUS
- Battle後のshort progress feedback

旧仕様の次はcurrent runtimeに存在しない。

- persistent Quest Tracker
- `Q` toggle
- Field Gate marker `NEXT`
- Guide NPC `!` marker
- `QUEST UPDATED` overlay
- Side Quest bonus EXP runtime

これらを新featureの前提にしない。

## 3. `src/quests/`が残っている理由

`src/quests/quests.ts`等には、旧Main Quest definition / generic helperが残る。

現在の役割は主に:

- story / content regression testのfixture
- legacy data shapeの背景
- 過去仕様からの移行履歴

current route / World navigationを制御しない。

今後、testsをcurrent `worldObjective` / story dataへ完全移行できた単位から段階的に削除してよい。

## 4. Side Quest

current active Side Quest definitionは空。

旧saveとの互換のため、PlayerProgressには`completedSideQuestIds`が残る。

```text
completedSideQuestIds
= legacy save compatibility
≠ current Side Quest feature
```

「fieldがunusedに見える」ことだけを理由にschemaから削除しない。save schema migrationを明示的に設計する場合だけ変更する。

## 5. World Objective boundary

World Objectiveは次の責務だけを持つ。

- current clear / unlock stateから次の目的をderive
- presentation用の短いlabelを返す
- Battle rulesを変更しない
- RpgStateへquest progressを重複保存しない

Battle target / damage / generator / story scene stateをobjective domainへ混ぜない。

## 6. Storyとの関係

Story copyとprogress conditionを分ける。

```text
PlayerProgress condition
→ objective state
→ storyに合ったlabel
```

JavaScript storyの文言を変えても、Stage clear / Area clear等のprogress sourceまで不用意に変更しない。

TypeScript storyを再構成する際も同じ方針を使う。

## 7. Cleanup rule

legacy Quest codeを整理する時は、次を順番に確認する。

1. current runtime importがない
2. current testsがそのdataをfixtureとして使っていない、または置換済み
3. PlayerProgress migration互換を壊さない
4. docsがWorld Objectiveをsource of truthとしている
5. Unit / E2Eがcurrent flowを固定している

この条件を満たした単位だけ削除する。
