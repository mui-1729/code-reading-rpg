# CODE//READ RPG 成長・探索ループ

## 1. この文書の役割

現在の`main`はBattle中心のMVP。

今後は「戦闘画面がRPG風」なだけではなく、**戦闘前後の移動・育成・再挑戦まで含めてRPGとして循環するゲーム**へ拡張する。

この文書は、Player成長、EXP、Stage、再挑戦、Field、Hub、NPC、Area進行の設計を定義する。

2026-08-26時点では、ここに書くLevel / EXP / Stage Select等は設計確定・実装予定であり、まだ`main`には未導入。

---

## 2. RPGとしてのコアループ

最小段階:

```text
Stage Select
↓
Stageを選ぶ
↓
Battle
↓
EXP・Skill・CLEAR報酬
↓
Playerが成長
↓
Stage Selectへ戻る
↓
次へ進む / 過去Stageへ戻る
```

将来の最終形:

```text
Field / Hub
↓
歩く・NPCと話す・目的を確認
↓
Battle入口へ移動
↓
Battle
↓
EXP・報酬・世界進行
↓
Field / Hubへ戻る
```

Stage SelectはこのRPG循環を早く成立させるための**暫定UI**。RPG最小ループ完成後、トップダウンFieldへ置き換え・統合する。

---

## 3. 「Levelが足りない」時の基本

強い敵に勝てない場合、ゲーム側が敵を自動的に弱くしない。

```text
強敵に敗北
↓
前のStage / Areaへ戻る
↓
EXPを稼ぐ
↓
Level Up
↓
同じ強敵へ再挑戦
```

**敵ではなくPlayerが成長する。**

これはRPGとして重要な原則。

ただし、Levelを上げればコードを読まなくても勝てるゲームにはしない。

```text
Level / 装備 = 戦える余裕を作る
コード読解 = 誰に何が起きるかを正しく判断する
戦略 = 今どのSkillを使うか決める
```

この3つの役割を分ける。

---

## 4. 世界側とPlayer側を分離する

### 世界側

Stage / Battleは固有の強さを持つ。

- 基準Enemy HP
- Enemy attack
- Enemy composition
- 学習テーマ
- 推奨Level
- EXP reward
- 初回報酬
- Boss属性

current Player Levelを見てruntimeでEnemy HP倍率を下げない。

同じBattle / seedは、PlayerがLevel Upしても基本的に同じ世界を表す。

### Player側

PlayerはBattleを重ねて成長する。

最初に持つ進行:

- EXP
- Level
- maxHP
- Skill POWERの小幅補正
- unlocked Skills
- cleared Stages
- unlocked Stages

将来候補:

- Area CLEAR
- Gold
- Equipment
- Items
- Deck slots
- Resistance / status

---

## 5. 初期PlayerProgress設計

予定する基礎データ:

```ts
PlayerProgress = {
  exp: number
  clearedStageIds: number[]
  unlockedStageIds: number[]
  unlockedSkillIds: string[]
}
```

Levelは保存値として二重管理せず、EXPから導出する方針。

初期状態:

```text
EXP: 0
Level: 1
maxHP: 100
Stage 1: unlocked
Initial Skills: TRACE / PULSE / NOVA
```

---

## 6. Level / EXP初期式

初期バランス案:

```text
累計必要EXP = 20 * level * (level - 1)
```

例:

- Lv1: 0
- Lv2: 40
- Lv3: 120
- Lv4: 240

Player stats:

```text
maxHP = 100 + (level - 1) * 8
powerMultiplier = 1 + (level - 1) * 0.02
```

Skill実ダメージ案:

```text
Math.round(basePower * powerMultiplier)
```

これらは定数・純粋関数として分離し、ゲームバランス調整で変更可能にする。

---

## 7. JavaScript Kingdom初期進行

予定Stage:

| Stage | Title | Recommended | EXP | Role |
| --- | --- | ---: | ---: | --- |
| 1 | First Read | Lv1 | 40 | Entry |
| 2 | One or Many | Lv2 | 60 | Mid |
| 3 | Priority Queue | Lv3 | 100 | Boss |

想定する初回進行:

```text
Stage 1 clear
→ total 40 EXP
→ Lv2

Stage 2 clear
→ total 100 EXP
→ Lv2

Stage 3 recommended Lv3
→ 難しければStage 1 / 2を再戦
→ total 120以上
→ Lv3
→ Boss再挑戦
```

これにより「前の場所へ戻って育てる」というRPG行動を意図的に作る。

数値は実プレイで調整する。

---

## 8. Stage Select

最初のRPG進行UIとして`/javascript`にJavaScript KingdomのStage Selectを追加する。

表示候補:

- Stage名
- 学習テーマ
- 推奨Level
- EXP reward
- READY / LOCKED / CLEAR
- Boss
- current Level / EXP / maxHP

解放済みStageは何度でも再挑戦可能。

再挑戦の用途:

- EXP稼ぎ
- コード概念の復習
- 別seedの盤面
- 自分の成長確認

Stage開始時は新しいseedを作り、同じseedを共有すれば盤面を再現できる。

---

## 9. Battle勝利と報酬

勝利時にRPG進行を更新する。

初期報酬:

- EXP
- Stage CLEAR
- next Stage unlock
- Skill unlock

初回clear:

- CLEARを記録
- 新Skillがあればunlock
- next Stageをunlock

再clear:

- CLEARは重複しない
- EXPは再度獲得可能

勝利UIでは最低限、

- 獲得EXP
- Level Up
- unlocked Skill / Stage
- Next Stage
- Stage Selectへ戻る

を分かるようにする。

敗北UIでは、

- RETRY
- 解説 / ヒント
- Stage Selectへ戻る

を選べるようにする。

---

## 10. Level成長をBattleへ反映する

Player statsだけBattleへ入力する。

- Battle開始HP = current maxHP
- HUDへLevel表示
- Skill POWERへ小幅倍率
- Retryでcurrent maxHPへ戻る

Enemy側:

- HPはcurrent Levelを参照しない
- attackはcurrent Levelを参照しない
- compositionはcurrent Levelを参照しない

Level差は「攻略不能を自動補正するdifficulty scaler」ではなく、Player自身の成長を表す。

---

## 11. 生成BattleとLevelの関係

現在のseed付きgeneratorは、基準Battleに対してEnemy HPを一定範囲で変化させ、敵順 / Skill順を変える。

これは世界をPlayerに合わせるauto scalingとは別物。

原則:

```text
Stageの基準難易度
+ seedによる制約付きvariation
```

Player Levelはこの生成式へ「弱くするための値」として渡さない。

---

## 12. solvabilityの役割

`isBattleSolvable()`は現在、MVPの固定Player条件に対するgenerator validationにも使っている。

Level導入後の方針:

- current Playerに合わせてEnemyを下げるために使わない
- Battle設計時の検証
- seed付き盤面の品質確認
- CIの回帰test
- Stageの基準 / 推奨Player statsで勝ち筋確認

Playerが推奨Level未満で挑戦して負けることは許容する。

「必ずcurrent Playerが勝てる」ことを保証する関数にはしない。

---

## 13. LocalStorage

RPG進行が入ったら最初はLocalStorageで保存する。

保存候補:

- schema version
- EXP
- clearedStageIds
- unlockedStageIds
- unlockedSkillIds
- Area CLEAR
- settings

保存しないもの:

- Battle中のturn
- Enemy current HP
- selected Skill
- animation state

不正data / 未知versionでは初期状態へ安全にfallbackする。

複数端末同期が必要になるまではbackendを入れない。

---

## 14. Boss / Area CLEAR

Battle 3をJavaScript Kingdom Bossとして扱う。

Boss初回clear:

```text
Stage 3 CLEAR
↓
JavaScript Kingdom CLEAR
↓
Area Clear UI
↓
Stage Select / Fieldへ戻れる
```

Area CLEAR後も過去Stageを再戦可能にする。

将来的には、

```text
World
├── JavaScript Kingdom
├── TypeScript Area
├── SQL Dungeon
└── React City
```

のように複数Areaを持てる構造へ発展させる。

---

## 15. Stage Selectは暫定

Stage Selectを「最終的なRPGマップ」とは考えない。

役割は、

- RPG progressionの動作確認
- 過去Stageへ戻れるようにする
- Level / EXP / CLEARのUIを先に作る
- BattleとWorld UIを分離する

こと。

この責務を維持したまま、次のFieldへ移行する。

---

## 16. Top-down Field

RPG最小ループ後の世界表現。

初期scope:

- 2D top-down 1画面程度
- Player 4方向移動
- wall / obstacle collision
- interaction
- Battle entrance
- Area exit
- Battle後に元のFieldへ戻る
- keyboard / mobile操作

最初から、

- 巨大open world
- 複雑なphysics
- 大量random encounter
- 高機能map editor

を導入しない。

Battle systemとField systemは分離する。

---

## 17. Hub / NPC / Dialogue

Field上にRPGとしての拠点を作る。

初期候補:

- NPC 2〜3人
- 話すinteraction
- 8-bit dialogue window
- next objective提示
- learning hint
- review recommendation
- Player Level / Area CLEARによる会話分岐

NPCは世界観だけでなく学習導線にも使う。

例:

- `find()`の特徴を思い出させるNPC
- 次Areaの概念を予告するNPC
- 前Stage復習を勧めるNPC

---

## 18. Story

最初から長大なstoryは作らない。

最低限、

- なぜコードを読んで戦うのか
- なぜ次Areaへ進むのか
- Bossを倒す意味

が分かる短い文脈を用意する。

Gameplay / learning loopが安定してから世界観を厚くする。

---

## 19. Equipment / Items

RPGらしいが、最小ループには不要。

追加順:

```text
Level / EXP
→ Stage / Retry
→ Persistence
→ Boss / Area
→ Field / NPC
→ Equipment / Items
```

追加する場合も単純な攻撃力inflationだけにはしない。

候補:

- maxHPを少し増やす
- 特定条件Skillを補助
- Deck枠を変える
- 1 Battle 1回のsupport item

避けること:

- 装備だけでコードを読まず勝つ
- Rare itemが全Skillの上位互換
- Grind量だけで攻略を解決する

---

## 20. Backend / Cloud save

Cloudflareへhostingを移行したが、backendは未決定。

複数端末同期やaccountが必要になった段階で検討する。

候補:

- Cloudflare Workers / D1 / KV / R2
- Supabase
- その他BaaS

frontend hosting先だけを理由に決めない。

---

## 21. RPG最小完成ライン

次まで揃った段階を「RPGループの最小完成」とする。

1. Stage Select
2. 過去Battleへ戻れる
3. Battle勝利でEXP
4. Level Up
5. Player stats成長
6. Stage CLEAR / next unlock
7. 敗北後に戻って育成
8. LocalStorage保存
9. Boss / Area CLEAR
10. コードを読まないと勝ちづらい原則を維持

---

## 22. 実装順

現在の優先:

```text
#43 PlayerProgress
↓
#44 Stage Select
↓
#45 EXP / CLEAR / unlock
↓
#46 Level growth in Battle
↓
#47 LocalStorage
↓
#48 Boss / Area CLEAR
↓
#49 Top-down Field
↓
#50 Hub / NPC / Dialogue
↓
Equipment / Items / Story expansion
```

コードvariant(#31) / 複数行code(#32)も重要だが、現在はRPG最小ループを先に成立させる方針。
