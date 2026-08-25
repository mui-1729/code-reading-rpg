# CODE//READ RPG ロードマップ

## 1. この文書の目的

この文書は、MVP完成後の`CODE//READ RPG`をどの順序で拡張するかを定義する。

2026-08-26時点で方針を更新し、**「Battleを増やし続ける」より先に、RPGとしての成長・再挑戦・探索ループを成立させる**ことを次の優先事項とする。

ただしゲームの中心は常にコードリーディング。

1. コードを読まないと判断しづらいか
2. 同じ手順の暗記だけで攻略できないか
3. コードを読んだ結果がゲーム内の意思決定につながるか
4. RPGの数値成長が読解を不要にしていないか
5. コンテンツを増やしても保守・テストできるか

---

## 2. 現在地

### Battle MVP: 完成済み

現在の`main`では以下が成立している。

- JavaScript編3 Battle
- コードカードのSELECT → EXECUTE
- 対象プレビューなし
- HP / NEXTを使った戦略判断
- `find` / `filter` / 比較 / `sort`
- Skill解放
- コード解説
- 勝利 / 敗北 / Retry
- 8-bit RPG風UI

### 暗記防止・生成基盤: 実装済み

すでに以下を`main`へ導入済み。

- seed付き決定的乱数
- Battle URLの`seed` search param
- 敵HPの制約付きvariation
- 敵順shuffle
- Skill順shuffle
- 学習対象を維持するgenerator validation
- `isBattleSolvable()`による勝ち筋検証
- `SkillDefinition`
- `codeVariants`を持てる構造
- ProblemTemplate抽象の削除

したがって、旧ロードマップの「seed / generator / solvabilityをこれから作る」という項目は完了扱いとする。

### 品質・運用基盤: 実装済み

- `package-lock.json`
- Node.js 24
- Vitest
- ESLint
- Prettier
- GitHub Actions CI
- Cloudflare Workers Static Assets
- Cloudflare Workers Builds Preview / Production

Vercelは自動deploy経路から外した。

---

## 3. 最重要プロダクト方針

現在のMVPは**RPGの戦闘要素しか持っていない**。

次は「RPGっぽい戦闘UI」ではなく、次の循環を作る。

```text
Stage Select / Field / Hub
↓
行き先を選ぶ
↓
Battle
↓
EXP・Skill・CLEAR報酬
↓
Playerが成長
↓
次へ進む / 前へ戻って育成する
↓
強敵へ再挑戦
```

強い敵に勝てないとき、ゲーム側がcurrent Player Levelを見て敵を自動弱体化する設計にはしない。

```text
Level不足
↓
過去Stageへ戻る
↓
EXPを稼ぐ
↓
Level Up
↓
同じ世界へ再挑戦
```

これをRPGの基本とする。

---

## 4. P0: RPG最小ループ

次の大きな優先は#43〜#48。

### #43 Player Progression Model

追加するもの:

- EXP
- Level導出
- 最大HP
- 小幅なPOWER倍率
- cleared Stage
- unlocked Stage
- unlocked Skill

初期案:

```text
累計EXP: 20 * level * (level - 1)
Lv2: 40
Lv3: 120
Lv4: 240

maxHp = 100 + (level - 1) * 8
powerMultiplier = 1 + (level - 1) * 0.02
```

UI / LocalStorageから独立した純粋Domainとして作る。

### #44 JavaScript Kingdom Stage Select

`/javascript`へStage Selectを追加する。

- Battle 1〜3をStage表示
- 推奨Level
- EXP報酬
- READY / LOCKED / CLEAR
- Boss表示
- 過去Stage再挑戦
- 新seedで再挑戦
- 現在Level / EXP / maxHP表示

重要: **Stage Selectは最終世界UIではない。**

RPGループを早く成立させるための暫定UIとして作り、後でFieldへ置き換えられる構造にする。

### #45 Battle Reward / Stage Progress

Battle勝利をRPG進行へ接続する。

初期EXP案:

- Battle 1: 40 EXP
- Battle 2: 60 EXP
- Battle 3: 100 EXP

想定:

```text
Battle 1 clear → 40 → Lv2
Battle 2 clear → total 100 → Lv2
Battle 3 recommended Lv3
↓
必要なら過去Battleを再戦
↓
120以上 → Lv3
↓
Boss再挑戦
```

再クリアでもEXPを得られる。

### #46 Level Growth in Battle

Player側だけ成長させる。

- Battle開始HP = current maxHP
- HUDにLevel
- Skill damageへ小幅POWER倍率
- Retry時もcurrent maxHP

敵のHP / 攻撃力 / 構成はcurrent Player Levelで変えない。

### #47 LocalStorage Persistence

保存するもの:

- EXP
- clearedStageIds
- unlockedStageIds
- unlockedSkillIds
- Area進行
- schema version

Battle中のターンや敵残HPは保存しない。

### #48 Boss / Area CLEAR

Battle 3をJavaScript Kingdom Bossとして扱う。

- Boss属性
- Area CLEAR
- Area Clear画面
- CLEAR後も過去Stage再戦可能
- 将来の複数Areaへ拡張可能な進行構造

### P0完了条件

次が揃った段階を「RPG最小ループ完成」とする。

1. Stage Select
2. 過去Battle再挑戦
3. EXP獲得
4. Level Up
5. Player stats成長
6. Stage CLEAR / unlock
7. 敗北後に戻って育成
8. LocalStorage保存
9. Boss / Area CLEAR
10. コードを読む必要性を維持

---

## 5. P1: RPG世界を歩けるようにする

RPG最小ループ完成後、Stage Select中心の画面遷移から**トップダウンのField / Hub**へ拡張する。

### #49 Top-down Field

最初のスコープ:

- 2D 1画面程度
- 4方向移動
- collision
- interaction
- Battle入口
- Area出口
- Battle終了後にFieldへ復帰
- Keyboard / Mobile操作

最初から巨大なopen worldや複雑なphysicsは作らない。

### #50 Hub / NPC / Dialogue

- NPC 2〜3人
- 汎用Dialogue data
- 進行状態による会話分岐
- 次の目的の提示
- 学習ヒント / 復習導線

将来候補:

- Quest
- Shop
- 回復施設
- Story event
- 装備変更

RPGの世界観はBattleから独立した飾りではなく、学習導線にも利用する。

---

## 6. P1: 読解体験の再強化

#31 / #32は重要だが、現在は**RPG最小ループを先に成立させる**ため後ろへ回す。

### #31 同概念のcode variant

`SkillDefinition.codeVariants`の基盤はすでにある。

次に行うこと:

- 同じTargetRuleの複数1行表現
- `battleId + seed + skillId`から決定的選択
- 同じseedでは同じコード
- 新しい未習構文を急に混ぜない

例:

```js
enemies.find(e => e.hp < 45)
enemies.find(enemy => enemy.hp < 45)
```

### #32 複数行コード

Battle 3から少量導入する。

```js
const ordered = [...enemies].sort((a, b) => a.hp - b.hp)
ordered[0]
```

新しい概念を同時に増やすのではなく、既知の処理を複数行で追う体験から始める。

---

## 7. P2: JavaScript学習コンテンツ拡張

RPGループとvariant基盤が安定した後、学習内容を広げる。

候補:

- `some()` / `every()`
- object property access
- 複数条件
- `map()`
- `reduce()`
- nested data
- status / shield等の状態
- 実行順序

構文網羅ではなく、**ゲーム上の判断へ変換しやすい順**に追加する。

---

## 8. P2: Area拡張

JavaScript Kingdomの次の候補:

```text
World
├── JavaScript Kingdom
├── TypeScript Area
├── SQL Dungeon
└── React City
```

名前や順序は固定ではない。

Area追加時も、単なる問題カテゴリ選択ではなく、RPG世界の進行と学習カリキュラムを一致させる。

---

## 9. P3: RPGの深さ

RPG最小ループとField / NPCが成立してから検討する。

候補:

- 装備
- アイテム
- Gold
- Shop
- Quest
- Status effect
- Deck編成
- Boss固有mechanic

禁止したい方向:

- 攻撃力を上げるだけでコードを読まなくてよくなる
- Rare装備が既存Skillを完全に無意味にする
- Grind量だけで全Battleを突破できる

成長は「余裕」を増やし、読解は「正しい行動」を決める役割にする。

---

## 10. P4: サービス化

必要性が出てから導入する。

トリガー:

- 複数端末同期
- ログイン
- Cloud Save
- Ranking
- Shared Challenge
- 教員 / 管理者向け機能

候補技術:

- Cloudflare Workers / D1 / KV / R2
- Supabase
- その他BaaS

Cloudflareでfrontendをhostingしていることだけを理由にbackendをCloudflareへ固定しない。

---

## 11. 長期候補

必要性を検証してから着手する。

- Daily Challenge
- Seed共有
- 学習履歴分析
- Achievement
- Cosmetic
- BGM / SE拡張
- Gamepad
- PWA / Offline
- 多言語化
- AIによる補助的な問題作成

AIに問題を作らせる場合も、表示コード / TargetRule / solvabilityを機械的に検証できる構造を前提とする。

---

## 12. 優先順位まとめ

```text
[実装済み]
Battle MVP
→ seeded RNG / constrained generation / solvability
→ SkillDefinition / codeVariants foundation
→ CI / Cloudflare deployment

[次]
#43 PlayerProgress
→ #44 Stage Select
→ #45 EXP / CLEAR / unlock
→ #46 Level growth
→ #47 LocalStorage
→ #48 Boss / Area CLEAR

[RPG世界]
#49 Top-down Field
→ #50 Hub / NPC / Dialogue

[読解強化]
#31 code variants
→ #32 multi-line code

[その後]
新Area / 装備 / Quest / Backend等
```

優先順位は変更可能だが、**Battleだけを増やしてRPGの外側が無い状態を長く続けない**ことを現在の方針とする。
