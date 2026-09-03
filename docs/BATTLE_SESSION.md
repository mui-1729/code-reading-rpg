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
          + World位置だけ直近の安全拠点へ移す

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
  - Defeat後に戻る安全なWorld拠点のpolicy
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

### RETRY

- START時点のHPへ戻す
- START時点のPATCH KIT在庫へ戻す
- Gold / progress / World locationもSTARTへ戻す
- 同じBattle / seedを再利用する

失敗attemptで使ったPATCH KITを永久消費しない一方、reload等で「Battle中1回」の制限だけをresetしてpersistent在庫を減らすような分断も作らない。

### SAFE RETURN

- START時点のHPへ戻す
- START時点のPATCH KIT在庫へ戻す
- **全回復はしない**
- World位置だけ安全な復帰地点へ移す
- Forest序盤ではGREENFIELD VILLAGEへ戻す
- Forestの野営地を通過した後は野営地の隣へ戻す
- Deep Forest序盤ではForestの野営地へ戻し、湧き水を通過した後は湧き水の隣へ戻す
- TypeScript辺境からは中央Hubへ戻す
- すでに安全なlocal mapではそのmapの開始地点へ戻す
- `stepsSinceEncounter`をsafe window用にresetする

Defeat自体を無料Innにはしない。一方で危険tileへ同じ消耗状態のまま戻してsoft lockさせない。GREENFIELD VILLAGEには宿・道具屋・装備屋があり、Forest / Deep Forestにも無料の部分回復地点を置くため、Playerは直近の安全地点で立て直してから再挑戦できる。

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

## 8. Recovery hub policy

JavaScript地方は次の順で立て直し手段を配置する。

```text
GREENFIELD VILLAGE
  ├─ 宿: Goldで全回復
  ├─ 道具屋: 消耗品
  └─ 装備屋: 武器 / 防具 / Accessory

JavaScriptの森
  └─ 野営地: 入口から約8tile、無料で最大HPの60%まで部分回復

JavaScript深層の森
  └─ 湧き水: 入口から約12tile、無料で最大HPの60%まで部分回復
```

序盤ほど安全地点を近くし、奥へ進むほど間隔を広げる。ただし回復地点を隠して難しくするのではなく、World上のscenery / labelとして見える状態にする。

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

- reload -> START HP / Itemへrollback
- browser back -> START World / HP / Itemへrollback
- RUN -> tentative damage / Itemをcommitしない
- RETRY -> 同じSTART resourceへ戻る
- SAFE RETURN -> START HP / Itemを保ちつつ直近の安全拠点へ戻る、no full heal
- Forest序盤 -> GREENFIELD VILLAGE、進行後 -> 野営地へ戻る
- Deep Forest序盤 -> Forest野営地、進行後 -> 湧き水へ戻る
- Village宿 / 道具屋 / 装備屋が利用できる
- Forest / Deep Forestの部分回復地点は0 Goldでも利用できる
- VICTORY -> current HP / used Item / rewardを1回だけcommit
- Level Up stat deltaがvisible result sequenceへ出る
- Replay reward policyがvisible result sequenceへ出る
- stale attemptが次attemptを変更しない
- full E2Eがgreen
