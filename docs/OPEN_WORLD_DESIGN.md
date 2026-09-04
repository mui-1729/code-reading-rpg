# CODE//READ RPG Open World Design

この文書は、**World runtime / progression / persistenceの設計ルール**を扱う。

- JavaScript地方の地理構造・scale・safe hub: [`JAVASCRIPT_WORLD_TOPOLOGY.md`](./JAVASCRIPT_WORLD_TOPOLOGY.md)
- 世界観 / Region visual: [`WORLD_DIRECTION.md`](./WORLD_DIRECTION.md)
- current snapshot: [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
- learning content: [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md)
- 優先順位: [`ROADMAP.md`](./ROADMAP.md)

JavaScript地方の個別map layoutは、この文書の旧座標や旧寸法ではなく`JAVASCRIPT_WORLD_TOPOLOGY.md`を上位authorityとして設計する。

## 1. 目的

Stage Select / Area Selectを繰り返すのではなく、**Worldを歩き、incidentを追いながら必要なcodeを読むこと自体をRPGの進行にする**。

```text
現象を先に体験
→ 何が読めなかったか分かる
→ 必要な読み方だけを小さく学ぶ
→ 同じincidentのtraceを先へ追う
→ root causeへ到達
```

Open Worldを「1枚の巨大grid」とは定義しない。Overworld / Village / Forest / Settlement等を意味のあるscaleで分ける。

## 2. Current implementation snapshot

以下は**現時点のruntime snapshotであり、target topologyではない**。

- `overworld` — 40 × 28
- `js-village` — 21 × 15
- `js-forest` — 31 × 27
- `js-deep-forest` — 31 × 27
- `ts-frontier` — 31 × 21
- viewport — 11 × 9

共通:

- `worldMapId + local worldPosition`をRpgStateへ保存
- `/world` route上でmap transition
- VillageはRandom Encounterなし
- fixed Story / learning BattleはRandom chance / cooldownより優先

#377でJavaScript地方を再設計するため、31×27や「東→西main trail」を将来layoutの制約にしない。

## 3. JavaScript geography authority

JavaScript地方は次の役割分担を採用する。

```text
Overworld / Field
→ 地域間を旅する大きな地理

Local Map
→ Village / Settlement / Forest等を詳細に歩く空間
```

target topology:

```text
Arrival / Central Field
├─ Riverside optional loop
├─ GREENFIELD VILLAGE [SAFE HUB 1]
└─ woods / bridge / road → Forest Gate
        ↓
JavaScript Forest
        ↓
Forest Settlement [SAFE HUB 2]
        ↓
JavaScript Deep Forest
        ↓
Final Approach
        ↓
JS Final Boss
```

Forest / Deep Forestのmain route自体で上下左右を使い、meaningful branchとrejoin loopを持たせる。詳細は`JAVASCRIPT_WORLD_TOPOLOGY.md`を参照する。

## 4. JavaScript incident-first progression

player-facing Story順:

```text
Opening
↓
JS-01 LIVE INCIDENT
↓
GREENFIELD VILLAGE
JS-02 → JS-03 → JS-04
↓
JAVASCRIPT FOREST
JS-05 → JS-06 → JS-07 → JS-08 MID BOSS → JS-09
↓
FOREST SETTLEMENT
↓
JS-10 SECOND SYMPTOM
↓
JAVASCRIPT DEEP FOREST
JS-11 → JS-12 → JS-13 → JS-14
→ JS-15 MID BOSS
→ JS-16 → JS-17 → JS-18
↓
FINAL APPROACH
↓
JS-19 ROOT CAUSE / Final Boss
↓
REAL WORLD RETURN
```

internal numeric Battle IDはsave / URL互換用stable identifier。

```text
JS-01 -> 1
JS-02 -> 7
JS-03 -> 8
JS-04 -> 9
JS-05 -> 10
JS-06 -> 11
JS-07 -> 12
JS-08 -> 13
JS-09 -> 14
JS-10 -> 2
JS-11 -> 15
JS-12 -> 16
JS-13 -> 17
JS-14 -> 18
JS-15 -> 19
JS-16 -> 20
JS-17 -> 21
JS-18 -> 22
JS-19 -> 3
```

Story順のauthorityはsemantic progression key。numeric IDの大小を進行順に使わない。

## 5. Portal / gate authority

portal gateは`src/world/worldMap.ts`の`WORLD_PORTALS`をruntime authorityにする。`WorldPage`や`worldActions`へ同じ解放条件を重複実装しない。

現在の解放条件:

- Overworld → GREENFIELD: JS-01 clear
- Forest方面: JS-04 clear
- Deep Forest方面: JS-09 clear
- Final Approach: JS-18 clear
- TypeScript方面: JS-19 clear

#377実装でmap graphが増えても、解放条件をUI componentへ散らさない。

## 6. GREENFIELD / Forest Settlement

### GREENFIELD VILLAGE

序盤safe hub。

- Random Encounterなし
- JS-02 / 03 / 04
- 宿 / 道具 / 装備 / NPC / TRAIN
- Forestへ出る前の準備

### Forest Settlement

Forest後半〜Deep Forest前に置く第二の有人safe hub。

- GREENFIELDのコピーにしない
- 森の小規模集落として自然Region identityを維持
- 宿 / 補給 / NPC / Story
- Deep Forest前の準備
- safe checkpoint更新

camp / springは部分回復地点であり、有人集落の代替ではない。

## 7. Safe checkpointとautosave

役割を分ける。

```text
autosave
→ current game stateを永続化

safe checkpoint
→ 敗北時に戻る村 / 集落の位置
```

checkpointはRpgStateへ明示的に保存し、current mapやx座標から毎回推測しない。

- 初回入村時に自動登録
- 宿利用時にも再登録可能
- save / reload後も維持
- legacy saveに無い場合は安全なfallbackを使う
- RETRYは同Battle再挑戦
- RETURNは保存されたsafe hubを基本にする
- Defeatを無料full healの手段にはしない

## 8. Fixed Story / learning Battle policy

fixed Battleは「座標当て」ではなく、Playerが認識できる場所 / eventへ対応させる。

優先順位:

```text
地形そのもの
→ 実物object / landmark
→ NPC / Story guidance
→ 必要な場合だけ短いlabel
```

Battle数だけ文字札を並べない。hidden `x <= N` progressionへ戻さない。

### JS-01

Opening後の最初のlive incident。全部説明できなくてもよく、症状を体験してGREENFIELDへ向かう理由を作る。

### JS-10

JS-09後、第二集落からDeep Forestへ向かう旅の中でsecond symptomを固定体験する。

## 9. Random Encounter policy

Random Encounterは既習conceptの反復用。新conceptの初登場に使わない。

Worldが広くなってもBattle回数を歩数比例で増やさない。

- safe route / 街道: 低密度
- optional risky route: 必要なら高め
- safe hub: なし
- MID BOSS: Random poolへ入れない

clear済みLessonだけreview poolへ追加する。

## 10. World domain boundary

### `worldMap.ts`

- map ID / dimensions / terrain / walkability
- viewport
- portal / gate metadata
- fixed object positions
- Encounter pool helper
- adjacency

### `worldActions.ts`

UI / Routerへ依存しないpure resolver。

- movement
- facing targetに対するinteraction intent
- portal transition intent
- fixed Story / learning Battle
- Encounter pacing
- Treasure / Boss / facility interaction

### `RpgState`

- current map / position
- Player facing（interaction authorityとして必要な場合）
- Encounter pacing
- HP / equipment / party
- persistent safe checkpoint
- Atlas reveal等のpersistent World state

### `WorldPage.tsx`

resolver結果をnavigation / audio / visual feedbackへ接続するadapter。map固有game ruleを増やしすぎない。

## 11. Facing / Action rule

World interactionは基本:

```text
方向入力
→ facing更新

Action
→ facing先1tileのtargetをresolve
→ interaction
```

non-walkable objectの方向へ入力しただけで冒険ログやinteractionを発火しない。NPC / Treasure / Inn / Shop / Training / Boss / Portalを同じ基本操作へ寄せる。

## 12. Atlas / Fog of War

Map単位の発見とcell-level revealを分ける。

- 新Mapへ入っただけで全terrainを公開しない
- 歩いた周辺を蓄積してreveal
- regional map購入で通常地形 / public geographyを先に確認可能
- Treasure / secretの正確な位置は自動公開しない

Fog of Warは#377のbranch / loop構造を先に成立させてから導入する。

## 13. Save compatibility

旧saveをStory reorderだけで巻き戻さない。

- numeric Battle IDは互換用として維持
- semantic progressionをauthorityにする
- 新checkpoint / reveal stateはmigrationで安全なdefaultを補う
- atomic root save / valid backup復旧の既存policyを維持

Battle開始snapshotは未完了Battleのtransaction authorityとして扱う。Victory / Run / Defeat / route leaveの既存session semanticsをWorld checkpoint追加で曖昧にしない。

## 14. Future region rule

TypeScript / Database等も:

```text
現象
→ region内で必要な概念を読む
→ traceを追う
→ root cause
```

を使うが、visual identityを共有しすぎない。

- JavaScript: natural / grass / river / forest
- TypeScript: stone / crystal / ruins
- Database: underground / archive / mine / library

JavaScript地方を広げるために後続Regionの主要景観を消費しない。
