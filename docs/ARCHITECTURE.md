# CODE//READ RPG アーキテクチャ

この文書は**現在のコードの責務境界**を説明する。今後の優先順位は[`ROADMAP.md`](./ROADMAP.md)、現在の実装一覧は[`PROJECT_STATUS.md`](./PROJECT_STATUS.md)を参照する。

## 1. 設計目標

中心原則は、**code reading domain / Battle runtime / World / progression / RPG state / story / presentationを必要以上に密結合させない**こと。

特に次を守る。

- 表示コードをruntimeで`eval()`しない
- codeの意味はsafe internal ruleへ対応させる
- Player成長でtarget判断を置き換えない
- World UIへ座標条件の`if`を増やす前にpure resolverへ置く
- save互換fieldとcurrent featureを分ける
- story都合のstateをGame Domainへ混ぜない

## 2. Runtime composition

```text
Browser
  ↓
React 19 + TanStack Router
  ↓
GameStateProvider (ProgressContext + RpgContext + BattleSessionContext)
  ↓
TutorialProvider
  ↓
BattleRuntimeProvider
  ↓
RouterProvider
  ├─ Home / Opening
  ├─ WorldPage
  └─ Battle route → App.tsx

Global presentation
  ├─ TutorialPrompt
  ├─ PauseMenu
  ├─ WorldProgressFeedback
  └─ AudioUnlock
```

`AppRouter.tsx`はproviderとroute外overlayのcompositionだけを担当する。

`RootLayout.tsx`はroute outletにBattleRouteGate / Tutorial / Pause / World progress feedbackを重ねる。router stateを読むcomponentはRouterProviderの内側へ置く。

CODE DATA / Item / Escape / Result / StoryはBattle runtimeがpropsで組み立てる。PortalやDOM textをBattle状態のsource of truthにしない。

## 3. Current routes

通常route:

```text
/
/world
/javascript/battle/$battleId?seed=...&returnTo=/world
/typescript/battle/$battleId?seed=...&returnTo=/world
```

Legacy redirect:

```text
/javascript          → /world
/javascript/field    → /world
/javascript/complete → /world
/typescript          → /world
/typescript/field    → /world
/typescript/complete → /world
```

旧Field URLはbookmark / old link互換のためrouteだけ残す。旧Field React pageをcurrent runtimeへ戻さない。

`game/areas.ts`がAreaのbattle base path、Battle sequence、World map membership、capability、Story resolver、clear equipment rewardを登録する。共通の `/$areaId/battle/$battleId` adapterが登録済みAreaを受け付け、Gate / CODE DATA / Escape / Tutorial / Storyは同じregistryを参照する。registry testはBattle definition・progression node・Story handlerとの対応漏れを検出する。

## 4. Directory responsibilities

```text
src/
├── App.tsx                     # common Battle runtime orchestration
├── AppRouter.tsx               # providers + global overlays
├── RootLayout.tsx              # route outlet + global menu/feedback
├── routeComponents.tsx         # Home / Opening / Battle route adapters
├── router.tsx                  # current routes + legacy redirects
├── game/                       # code-reading Battle domain
├── battle/                     # Battle session transaction / runtime snapshot / lifecycle
├── persistence/                # atomic root save / provider / migration / cross-tab sync
├── world/                      # Open World domain + World UI
├── progression/                # EXP / Gold / clears / unlock / consumable
├── rpg/                        # HP / Equipment / Party / World persistence
├── story/                      # opening / battle story events
├── tutorial/                   # onboarding domain + presentation
├── inspector/                  # CODE DATA
├── results/                    # staged result sequence
├── learning/                   # Codex / hint content
├── economy/                    # PATCH KIT / current World Shop
├── dialogue/                   # NPC definitions / dialogue resolver
├── ui/                         # Pause and shared UI
├── audio/                      # Web Audio presentation
├── motion/                     # battle/world feedback motion
├── field/                      # legacy Field content/test fixtures only
└── quests/                     # legacy quest content/helpers; not current runtime guidance
```

### Legacy directories

`field/`と`quests/`は「directoryが存在する = current runtime feature」ではない。

- current playable mapは`world/`
- current progress guidanceは`world/worldObjective.ts`
- old Field content definitionはlearning/story regression testで一部利用
- `completedSideQuestIds`はsave compatibilityのためPlayerProgressに残る

unused React UIは削除してよいが、migration / regression testに意味があるdataを一括削除しない。

## 5. Game Domain

`src/game/`は「表示されたコードが何を意味するか」とBattle content definitionを担当する。

主な責務:

- Battle definitions
- Skill definitions
- `TargetRule`
- seeded generator
- code variant generation
- code uniqueness
- solvability
- runtimeとsolvabilityが共有するpure combat turn resolver
- Boss guard resolver

```text
Skill displayed code
        ↓ semantic mapping
safe TargetRule
        ↓
current Enemy[]
        ↓
target Enemy[]
```

表示文字列をparse / evalしてtargetを決めない。

表示codeとの一致は`TargetRule`実装を再利用しないreview-owned fixtureで検証する。fixtureはcode fingerprint、expected target、POWERを明示し、semantic変更時に意図的なreview更新を要求する。

### Variation

Battle / Encounter seedによってEnemy state・Skill order・code representationを変える。

variationしても次は変えない。

- concept
- TargetRuleの意味
- base damage intent
- CODE HELPとの対応
- solvability

意味のない識別commentだけでunique扱いしない。

## 6. Battle Runtime

`src/App.tsx`はJavaScript / TypeScript共通のBattle runtime adapter。

主なtransient state:

- Battle phase
- player HP view state
- Enemy[]
- selected Skill
- turn / log
- item use state
- attack / damage motion
- story scene connection

Enemy / turn / selected Skill / `patchKitUsed`等の一時stateはLocalStorageのsource of truthにしない。`battle/sessionTransaction.ts`は開始時の`PlayerProgress + RpgState + Battle identity`を`BattleSessionSnapshot`として保持するpure transaction境界。

永続HPは`RpgState.currentHp`へ接続し、Battle中のdamage / heal / Item消費は同じroot saveの開始snapshotとともに仮更新する。終了policyは次の通り。

| Event | Persistent state / runtime |
| --- | --- |
| START | 開始時のProgress / RPG全体とarea・Battle ID・seed・returnTo・attempt IDをsnapshot |
| VICTORY | 報酬・clear・registry装備報酬・現HP・消費を同時commit |
| DEFEAT | 現行のfull HP / Hub位置 / cooldown回復policyと消費をcommit |
| RUN | 現HP・消費をcommit、報酬なし |
| ABORT | browser back / route leave / 別Battle移動では開始snapshotへ全体rollback |
| RELOAD | 未完sessionを開始snapshotへ全体rollback後、新しいattemptとして敵・turn・per-battle flagsも初期化 |

reloadでItem使用枠だけを回復したり、Enemyだけを初期化して消費を残したりしない。Retry / checkpoint UXの変更はこの基盤と分離する。

`useBattleSession`はmount / unmountをSTART / ABORTへ接続する。StrictModeのsetup / cleanup / setupは同じ開始snapshotへ戻る。全Battle timerをunmount時にcancelし、persistent mutationもattempt IDでguardする。別tabの新revisionを採用したBattleは古いEnemy / turnと混ぜずWorldへ退出する。

別tabの未完Battleを受信したWorld / Pauseは開始snapshotのProgress / RPGを参照する。そこでの操作は同じ開始値を計算baseにし、未完sessionのrollbackと新しい操作を1commitにまとめる。他tabの仮HPで計算した移動・Shop結果を、rollback後の在庫と合成しない。

`BattleRuntimeProvider`はphase / resolving / enemies / HP / selected Skill / turn / resultのread-only snapshotを共有する。TutorialはそのsnapshotからSELECT / EXECUTEと実行完了を判断し、DOM参照はhighlightの配置だけに使う。

Battle MENUの可否もこのsnapshotから決める。行動の合間だけ開き、resolving / Story / HELP / DATA / Resultとは重ねない。Battle中の装備は参照専用で、Worldに戻ってから変更する。MENUをBattle timerの途中freeze機構として扱わない。

Victory transactionからtyped result eventを生成する。`BattleResultSequence`はそれを順次表示し、報酬文言・勝利DOM・隠しWorld feedbackをparseしない。CODE DATAはraw attackDamageとDEF適用後incomingDamageを分離してpropsで受け取る。

Enemyのsprite / Boss presentation / GUARDはstable `visualId` / `role`、Story portraitは`speakerId`で決定する。code-reading ruleが明示的に読む`name`は学習dataとして維持する。

### Current technical debt

`App.tsx`はorchestration責務が大きいため、将来は次を分離候補とする。

- player action execution
- enemy turn
- story event bridge
- result handoff
- presentation

ただしgameplay変更と同時に大規模refactorしない。

## 7. World Domain

### `worldMap.ts`

pure data / helper:

- World width / height
- terrain / region
- walkable判定
- viewport
- Encounter terrain / chance
- Boss / Shop / Recovery / Treasure positions
- adjacency

### `worldActions.ts`

current state + inputからintentを返すpure resolver。

- move / blocked
- encounter cooldown / roll / Battle intent
- BYTE
- Shop
- Recovery
- Treasure
- JS / TS Boss

Router / DOM / Audioへ依存しない。

### `WorldPage.tsx`

resolver結果をbrowser side effectへ接続するUI adapter。

```text
input
↓
worldActions resolver
↓
next state / intent
↓
WorldPage
├─ RpgState update
├─ navigate
├─ SE
├─ short feedback
└─ presentation
```

新しいWorld objectを追加する時は位置条件を`WorldPage.tsx`へ直書きせずdomain側を更新する。

### Shared World scene

`WorldPage.tsx`と`TypeScriptFrontierPage.tsx`は地域ごとのinteraction / feedbackを担当し、描画と入力の共通部分を次へ委譲する。

- `WorldScene.tsx` — tile viewport、objective、player / follower layer、D-Pad / INTERACT
- `worldSceneGeometry.ts` — map座標からviewport内座標への変換と可視範囲（寸法は`worldMap.ts`の定義を共有）
- `useWorldKeyboardControls.ts` — Arrow / WASD / Enter / Space、Pauseとnative controlの入力所有権

terrain labelとobject rendererは地域側から渡し、共通sceneへJavaScript / TypeScript固有の条件を追加しない。移動のdomain判断は両地域とも`resolveWorldMove`を使う。

## 8. Story

StoryはBattle rulesと分離する。

現在:

- `story/javascriptOpening.ts` — 初回Opening scene data
- `story/javascriptBattleEvents.ts` — Chapter間 / Boss前 / ending events
- `routeComponents.tsx` — Opening route adapter
- Battle runtime — eventを表示するタイミングだけ接続

JavaScript storyはChapter 1 → Chapter 2 → Finalの因果関係を持つ。

Story eventがtarget rule / damage / generatorを変更してはいけない。

## 9. State ownership

### PlayerProgress v4

担当:

- EXP
- Gold
- PATCH KIT inventory
- cleared Stage / Area
- unlocked Stage / Skill
- `completedSideQuestIds`（legacy compatibility）

LevelはEXPから導出する。

### RpgState v5

担当:

- current HP
- Equipment / owned Equipment
- joined Party member IDs
- current World map ID
- World position
- Encounter pacing
- opened Treasure

restore時に次をnormalizeする。

- World bounds
- known Equipment / Party / Treasure ID
- Equipment slot / ownership consistency
- non-negative Encounter counters
- current HP upper bound

v1 / v2 / v3 / v4からv5へmigrationし、未使用partyEquipmentを除去する。旧Overworld上のTypeScript座標は`ts-frontier`へ移す。

### Logical save transaction

`persistence/GameStateProvider` が両stateとBattle開始snapshotのReact ownershipをまとめる。Treasure / Shop / Inn / Itemの同期更新は同じcommitへbatchされ、`gameStateStorage`がroot schema v2のrevision snapshotを1keyへatomicに保存する。root v1はsessionなしとして移行し、Progress v4 / RPG v5は維持する。旧分割keyはmigration専用。直前backupからのrecovery、portal graphに基づくlocked map位置の正規化、storage event同期、stale revisionの上書き回避をこの境界で行う。Area clear装備報酬もregistryから同じnormalizationで補完し、World mount effectへ依存しない。

### TutorialState v1

PlayerProgress / RpgStateと別storage。

- active / completed / skipped
- current onboarding phase
- replay

### User settings

Sound settingsはprogress resetと分離したLocalStorage。`RESET PROGRESS`で保持する。

## 10. Reset boundary

progress resetはprovider同士を直接importして連鎖させない。

```text
GameStateProvider
  ↓ dispatch generic reset event
TutorialProvider → own state reset
FullResetCoordinator → root / backup / legacy saveを削除しTitleへhard navigation
```

Soundはresetしない。

## 11. Progress guidance

current runtimeの主導線はQuest Trackerではなく**World Objective**。

`PlayerProgress`からpureにderiveし、

- World上のNEXT OBJECTIVE
- Pause STATUS
- Battle後のWorld progress feedback

へ使う。

legacy quest helpersはcurrent routeを制御しない。

## 12. Economy / Equipment / Party

### Economy

- PATCH KIT purchase / consume
- World Shop item purchase
- Gold不足 / owned判定はpure resolver

### Equipment

- weapon / armor / accessory
- Attack / Defense / Max HP等へbonus
- role差を持たせ、完全上位互換だけにしない

### Party

- current companion: BYTE
- joined stateをRpgStateへsave
- Battleでは1 ACTIONに1回、codeが選んだtarget群の生存先頭1体へfollow-up
- 独立HP / Defense / Party Equipmentは持たず、未使用statをPauseに示さない

Partyが独自にcorrect targetを決めない。

## 13. Presentation boundary

### Pause

```text
STATUS
MAP
ITEMS
EQUIPMENT
PARTY
CODEX
SYSTEM
```

EXP / Gold / Equipment / Party / Sound等を通常HUDへ詰め込まずPauseへ寄せる。

header / navigationとcontentのscroll領域を分離し、選択状態をaccessibility属性に反映する。CODEXの初期languageはBattleのAreaと現在のWorld mapを考慮する。

Mobile BattleではEnemyのRPG cardと選択中Skill codeを近接配置し、source改行単位の行番号を表示する。presentationは既存Enemy / Skill propsを利用し、target計算を追加しない。

### CODE DATA

runtime data / derived valueを確認できるが、

- correct target
- recommended Skill
- damage preview

は出さない。

### Audio / motion / pixel art

state changeのfeedbackであり、Game Domainのsource of truthにしない。

Resultの自動送りは`prefers-reduced-motion`へ追従し、reduce時はNEXT / SKIPのみで進める。報酬transaction自体のタイミングは変更しない。

## 14. Testing boundary

Unit Test:

- TargetRule / Skill definition
- generator / solvability / code uniqueness
- independent displayed-code oracle / shared combat turn resolver
- progression / migration
- RpgState normalization
- Battle START / commit / rollback / stale attempt guard / root v1→v2 migration
- World resolver
- Economy / Equipment / Party
- Tutorial reducer / storage
- Story / objective data consistency

Playwright E2E:

- Title / Opening → World
- movement / interaction
- Random Encounter → Battle → World return
- HP persistence / Recovery / Defeat
- Battle reload全体rollback / browser back後timer停止 / RUN消費commit
- Treasure / Shop / Equipment
- BYTE / follow-up
- Pause / CODEX / SYSTEM
- Tutorial
- Boss mechanic / story flow
- built `dist` smoke / Chromium / WebKit / portrait / short / landscape
- visual visibility / Pause interaction・focus invariant

Unitはdomainの意味、E2Eはsystem間の接続を担当する。

## 15. Deployment

Vite SPAをCloudflare Workers Static Assetsへdeployする。

標準gate:

```text
local / branch checks
→ Pull Request
→ GitHub Actions
→ Cloudflare Preview
→ self-review
→ squash merge
→ main CI
→ Cloudflare Production
```

## 16. Backend

現在不要。

Login / Cloud Save / Ranking / Shared Challenge等の具体的要件が出た時点で追加を検討する。
