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
  ├─ RETRY BATTLE
  │    └─ start snapshotへrollbackし、同じBattle / seedを再開
  └─ RETURN TO CHECKPOINT
       └─ start snapshotへrollback
          + encounter cooldownだけreset

RUN / browser back / route abort
  └─ start snapshotへrollback

RELOAD
  └─ unfinished sessionをrestoreせずstart snapshotへrollback
```

## 2. Authority

Battle transactionのauthorityは次の層。

- `src/battle/sessionTransaction.ts`
  - START / tentative update / commit / rollbackのpure domain rule
- `src/persistence/GameStateProvider.tsx`
  - Progress + RPGを同じrevisionでatomic persistence
  - session snapshotの保存 / rollback
- `src/battle/useBattleSession.ts`
  - component lifecycleとtransactionを接続
- `src/App.tsx`
  - Playerが選ぶRETRY / RETURNのUX policy

旧split LocalStorage keyやBattle component内だけのstateをpersistent authorityにしない。

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

### RETRY BATTLE

- START時点のHPへ戻す
- START時点のPATCH KIT在庫へ戻す
- Gold / progress / World locationもSTARTへ戻す
- 同じBattle / seedを再利用する

失敗attemptで使ったPATCH KITを永久消費しない一方、reload等で「Battle中1回」の制限だけをresetしてpersistent在庫を減らすような分断も作らない。

### RETURN TO CHECKPOINT

- START時点のHPへ戻す
- START時点のPATCH KIT在庫へ戻す
- START時点のmap / local positionへ戻す
- **全回復しない**
- `stepsSinceEncounter`だけsafe window用にresetする

そのためDefeatは無料Innにならず、同時に長距離歩き直しも主penaltyにならない。

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
Battle 1回制限     -> new attempt
```

HPだけ減少済み、Itemだけ消費済みというpartial restoreを作らない。

## 7. Multi-tab / stale callback

他tabはlocal attemptのtentative stateをWorld authorityとして使わず、session START snapshotを見る。

別revisionを検出したBattle componentは古いEnemy / Turn stateと新しいpersistent stateを混ぜずWorldへ退避する。

Battleが終了/abortした後のtimer・unmount cleanup・stale callbackは、既に別attemptへ移ったtransactionを変更しない。

## 8. Reward presentation

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

## 9. Test contract

最低限固定する。

- reload -> START HP / Itemへrollback
- browser back -> START World / HP / Itemへrollback
- RUN -> tentative damage / Itemをcommitしない
- RETRY -> 同じSTART resourceへ戻る
- RETURN -> START location / HP / Item、no full heal、encounter safe window
- VICTORY -> current HP / used Item / rewardを1回だけcommit
- Level Up stat deltaがvisible result sequenceへ出る
- Replay reward policyがvisible result sequenceへ出る
- stale attemptが次attemptを変更しない
- full E2Eがgreen
