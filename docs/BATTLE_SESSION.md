# Battle Session Transaction

## 1. 目的

Battle中のHP / Item / rewardを、Worldへ保存されるpersistent stateと途中状態が混ざらないように扱う。

Battle開始時に`GameStateProvider`のroot stateへimmutableなsession snapshotを保存し、Battle中の変更は同じroot transaction内のtentative stateとして扱う。

```text
START
  └─ PlayerProgress + RpgStateをsnapshot

Battle中
  ├─ HP damage
  ├─ PATCH KIT consume / heal
  └─ その他attempt-local change

VICTORY
  └─ tentative HP / Item + rewardをcommit

DEFEAT
  ├─ RETRY
  │    └─ start snapshotへrollbackし、同じBattle / seedを再開
  └─ SAFE RETURN
       └─ start snapshotのHP / Itemへrollback
          + World位置だけ保存済みsafe checkpointへ移す

RUN / browser back / route abort
  └─ start snapshotへrollback

RELOAD
  └─ unfinished sessionをrestoreせずstart snapshotへrollback
```

## 2. Authority

Battle transactionのauthorityは次の層。

- `src/battle/sessionTransaction.ts`
  - START / tentative update / commit / rollbackのpure domain rule
- `src/battle/safeReturn.ts`
  - Defeat RETURNで保存済みcheckpointへWorld位置を移すpure rule
- `src/world/worldCheckpoints.ts`
  - safe hubのsemantic ID / canonical位置 / 登録policy
- `src/rpg/state.ts`
  - RpgState v7の`safeCheckpoint` persistence / legacy migration
- `src/persistence/GameStateProvider.tsx`
  - Progress + RPGを同じrevisionでatomic persistence
  - session snapshotの保存 / rollback
- `src/battle/useBattleSession.ts`
  - component lifecycleとtransactionを接続
- `src/App.tsx`
  - Playerが選ぶRETRY / RETURNのUX policy

旧split LocalStorage key、Battle component内だけのstate、current map / x座標からの復帰先推測をpersistent authorityにしない。

## 3. START snapshot

START時点で最低限以下を同じsnapshotとして保持する。

- PlayerProgress
  - EXP / Gold
  - PATCH KIT inventory
  - clear / mastery state
- RpgState
  - current HP
  - Equipment / Party
  - current map / local position
  - safe checkpoint
  - encounter counters
  - Treasure等のpersistent state
- Battle identity
  - areaId
  - battleId
  - seed
  - returnTo

Enemy HP / turn / animation等はBattle runtime state。unfinished sessionをreloadした場合はこれらだけを初期化してpersistent HPだけ減った状態にはせず、session全体をSTARTへrollbackする。

## 4. VICTORY

VICTORYだけがBattleの成功commit point。

commit対象:

- Battle終了時HP
- Battle中に実際に使ったPATCH KIT
- EXP / Gold
- first clear
- Skill mastery / unlock
- Area clear等のVictory reward

transactionをclearした後はunmount cleanupやstale callbackが同じrewardを二重commitしない。

## 5. DEFEAT

DEFEAT表示が出た時点ではsessionをcommitしない。Playerが次のactionを選ぶまでSTART snapshotを保持する。

### RETRY

- START時点のHPへ戻す
- START時点のPATCH KIT在庫へ戻す
- Gold / progress / World location / safe checkpointもSTARTへ戻す
- 同じBattle / seedを再利用する

失敗attemptで使ったPATCH KITを永久消費しない一方、reload等で「Battle中1回」の制限だけをresetしてpersistent在庫を減らすような分断も作らない。

### SAFE RETURN

- START時点のHPへ戻す
- START時点のPATCH KIT在庫へ戻す
- **全回復はしない**
- World位置だけSTART snapshotに保存されていたsafe checkpointへ移す
- current map / x座標 / camp通過位置から復帰先を推測しない
- `stepsSinceEncounter`をsafe window用にresetする

current checkpointは`RpgState.safeCheckpoint`へ明示的に保存する。

```text
初期状態
→ 中央Hub

GREENFIELD VILLAGEへ入場
→ GREENFIELDを登録

GREENFIELDの宿で休む
→ GREENFIELDを再登録

TypeScript辺境の境界監視所へ到達
→ 境界監視所を登録

境界監視所の宿で休む
→ 境界監視所を再登録

将来の主要有人集落へ到達
→ そのsafe hubへ更新
```

checkpointはsemantic IDをauthorityにし、保存された古い座標をそのまま信用しない。map layout変更後はregistryのcanonical位置へ復元する。Progress上まだ到達不能なcheckpointが保存されていた場合は中央Hubへ安全にfallbackする。

legacy RpgState v1〜v6にはcheckpoint fieldが無いため、restore時に安全なfallbackを付与する。JavaScript local map内のlegacy saveはGREENFIELD、その他は中央Hubを基本fallbackとする。旧TypeScript saveから未訪問の境界監視所を訪問済みとは推測しない。

Defeat自体を無料Innにはしない。一方で危険tileへ同じ消耗状態のまま戻してsoft lockさせない。GREENFIELD VILLAGEとTypeScript境界監視所には宿・補給手段があり、Forest / Deep Forestのcamp・springは道中の部分回復地点として残す。

## 6. RUN / browser back / reload

### RUN

Random Encounter等、escape可能Battleだけで利用できる。

- reward / clearなし
- START snapshotへrollback
- Battle中のdamage / PATCH KIT使用もrollback
- 元いたWorld位置へ戻る

### browser back / route abort

Game rule上の別のescape rewardとして扱わず、ABORTとしてrollbackする。BossでRUN buttonがlockedでもbrowser navigationだけで半端なstateをcommitしない。

### reload

root saveにunfinished `battleSession`が残っていた場合、起動時にSTART snapshotへrollbackする。

```text
Enemy / Turn       -> new runtime
Player HP / Item   -> Battle START snapshot
Safe checkpoint    -> Battle START snapshot
Battle 1回制限     -> new attempt
```

HPだけ減少済み、Itemだけ消費済みというpartial restoreを作らない。

## 7. Multi-tab / stale callback

他tabはlocal attemptのtentative stateをWorld authorityとして使わず、session START snapshotを見る。

別revisionを検出したBattle componentは古いEnemy / Turn stateと新しいpersistent stateを混ぜずWorldへ退避する。

Battleが終了/abortした後のtimer・unmount cleanup・stale callbackは、既に別attemptへ移ったtransactionを変更しない。

## 8. Recovery hub / checkpoint policy

current Worldは、**有人safe hub**と**道中の部分回復**を分ける。

```text
GREENFIELD VILLAGE [SAFE HUB]
  ├─ 宿: Goldで全回復 + checkpoint再登録
  ├─ 道具屋: 消耗品
  ├─ 装備屋: 武器 / 防具 / Accessory
  └─ NPC / TRAIN

TypeScript 境界監視所 [SAFE HUB]
  ├─ 宿: Goldで全回復 + checkpoint再登録
  ├─ 補給所: Item / Equipment
  ├─ TYPE WARDENほか常駐NPC
  └─ crystal / ruins側へ進む前の準備

JavaScriptの森
  └─ 野営地: 無料の部分回復

JavaScript深層の森
  └─ 湧き水: 無料の部分回復
```

camp / springは長い攻略区間の救済として残すが、主要checkpointの代替にはしない。Forest Settlementは#377側のtarget topologyとして残すが、current second human safe hubはTypeScript境界監視所とする。

序盤ほど立て直し手段を近くし、奥へ進むほど間隔を広げる。ただし回復地点を隠して難しくするのではなく、World上のscenery / NPC / settlementとして理解できる状態にする。

無料地点は0 Gold時のsoft lock回避用で、全回復やItem補充はしない。Goldを使う宿・道具・装備の価値を残す。

## 9. Reward presentation

Victory resultはdomain rewardからtyped eventを生成する。

- EXP GAINED
- GOLD GAINED
- Replay: `REPLAY CLEAR · EXP 100% / GOLD 50%`
- Level Up: `LEVEL UP! · MAX HP +N · POWER +N%`
- Stage / World progress
- Skill unlock
- Area clear
- Equipment

Level Upは「Lv1 → Lv2」だけでなく、実際に増えたstatを表示する。Stage unlockはinternal numeric Battle IDではなくplayer-facing `JS-xx` / `TS-xx` codeを表示する。

## 10. Test contract

最低限固定する。

- reload -> START HP / Item / checkpointへrollback
- browser back -> START World / HP / Itemへrollback
- RUN -> tentative damage / Itemをcommitしない
- RETRY -> 同じSTART resourceへ戻る
- SAFE RETURN -> START HP / Itemを保ちつつ保存safe checkpointへ戻る、no full heal
- Battle開始tileとcheckpoint位置が違ってもRETURNはcheckpoint位置を使う
- GREENFIELD入場 / 宿利用でGREENFIELD checkpointを登録できる
- TypeScript境界監視所到達 / 宿利用でoutpost checkpointを登録できる
- TypeScript東側で敗北しても保存済み境界監視所へ戻る
- legacy saveにcheckpointが無くても安全なfallbackを得る
- Progress上lockedなcheckpointを保存しても中央Hubへ正規化する
- Village / outpostの宿・補給が利用できる
- Forest / Deep Forestの部分回復地点は0 Goldでも利用できる
- VICTORY -> current HP / used Item / rewardを1回だけcommit
- Level Up stat deltaがvisible result sequenceへ出る
- Replay reward policyがvisible result sequenceへ出る
- stale attemptが次attemptを変更しない
- full E2Eがgreen
