# CODE//READ RPG ロードマップ

## 1. この文書の目的

この文書は`CODE//READ RPG`をどの順序で拡張するかを定義する。

2026-08-26時点では、JavaScript KingdomのRPGループが成立し、**World Mapから2つ目以降のAreaへ拡張する段階**に入っている。

ゲームの中心は常にコードリーディングとする。

1. コードを読まないと正しい行動を選びにくいか
2. 同じ手順の暗記だけで攻略できないか
3. 読んだ結果がゲーム内の意思決定へつながるか
4. Levelや装備の数値だけで読解を不要にしていないか
5. コンテンツを増やしても自動テストできる構造か

---

## 2. 実装済み

### Battle / 読解基盤

- JavaScript編 3 Battles
- Skill SELECT → EXECUTE
- `find()` / `filter()` / 比較 / `sort()`
- HP / NEXT行動による戦略判断
- Target Previewなし
- CODE HELP
- seeded generation / solvability
- SkillDefinition / TargetRule
- 同一概念の複数code variant
- Battle 3の複数行code

### RPG進行

#43〜#48で実装済み。

- PlayerProgress
- EXP / Level
- 最大HP / POWER倍率
- Stage Select
- Stage CLEAR / unlock
- Skill unlock
- 再挑戦
- LocalStorage / migration / reset
- Boss / Area CLEAR

Enemyはcurrent Player Levelへ自動追従させない。

### Field / NPC

#49 / #50で実装済み。

- JavaScript Kingdom Field
- 4方向移動 / collision
- Keyboard / Mobile操作
- Battle Gate
- Battle後のField復帰
- NPC 3人
- Dialogue data / 進行分岐

### Battle presentation

#64 / #63 / #83で実装済み。

- hit / shake / damage / defeat motion
- Victory / Defeat / reward motion
- `prefers-reduced-motion`
- SE
- menu / field / battle BGM
- Mute / SE・BGM別volume
- 最初のユーザー操作によるWeb Audio unlock

### 読解variation

#31 / #32で実装済み。

- seed付き1行code variant
- Battle 3の複数行variant
- TargetRule / POWER / solvability不変test

### World Map

#81で実装済み。

- `/world`
- JavaScript Kingdom AVAILABLE / AREA CLEAR
- TypeScript Frontier COMING SOON
- Area metadataによるdata-driven表示
- 未実装Areaへの進入禁止

### 品質 / Deploy

- Node.js 24
- Vitest
- ESLint / Prettier
- PR前 `npm ci` / `lint` / `test` / `build`
- GitHub Actions
- Cloudflare Workers Preview / Production

---

## 3. 現在のRPGループ

```text
World Map
↓
Area
↓
Hub / Field
↓
NPC
↓
Battle Gate
↓
コードを読んでBattle
↓
EXP / Skill / Stage CLEAR
↓
Fieldへ復帰
↓
Boss
↓
Area CLEAR
↓
World Map
```

このループを次Areaにも再利用する。

---

## 4. 現在: #85 複数Area routing基盤

World Mapはできたが、JavaScriptの進行routeはまだJavaScript固有URLへ強く結びついている。

#85では次Areaを実装する前に責務を整理する。

- Area metadataへField / Stage Select / Complete routeを集約
- Area ↔ Battle lookup helper
- Battle `areaId`の整合性test
- Bossが同Areaへ所属することをtest
- COMING SOON Areaはrouteなし
- JavaScript既存URLを完全維持
- LocalStorage schema / Stage IDを変更しない

これにより、次Area追加時の大規模な条件分岐を避ける。

---

## 5. 次: TypeScript Frontier

#85完了後、2つ目の実Areaを追加する。

第一候補:

```text
World
├── JavaScript Kingdom
├── TypeScript Frontier
├── SQL Dungeon
└── React City
```

TypeScript Frontierでは、単にTypeScriptの問題集を置くのではなく、**型情報を読んでゲーム上の結果を予測する**体験にする。

初期テーマ候補:

- primitive type
- union type
- object type
- optional property
- narrowing
- function parameter / return type

初回Areaは3 Battles程度を基本にするが、学習概念を一気に増やしすぎない。

TypeScript Battle追加時に必要な検討:

- Stage IDをJavaScriptと重複させない
- TypeScript専用Skill / code variant
- TargetRuleで安全に意味を表現できるか
- generator / solvabilityを再利用できるか
- TypeScript FieldをJavaScript Fieldの巨大分岐として作らない
- JavaScript save dataをmigrationなしで維持できるか

---

## 6. JavaScript Kingdomの追加学習候補

2つ目Areaと並行せず、優先順位を見て追加する。

- `some()` / `every()`
- object property access
- 複数条件
- `map()`
- `reduce()`
- nested data
- 実行順序
- shield / status

Skill追加時は次を機械的に検証する。

- codeとTargetRuleの意味一致
- POWER表示と実ダメージ一致
- valid target
- solvability
- seed再現性

---

## 7. RPGの深さ

複数Area構造が安定してから検討する。

- Quest
- Shop
- Inn / 回復
- 装備
- アイテム
- Gold
- Treasure
- Story event
- Status effect
- Deck編成
- Boss固有mechanic

禁止したい方向:

- 攻撃力だけでコードを読まなくてよい
- Rare装備がSkillの意味を消す
- Grind量だけで全Battleを突破できる

RPG要素はコード読解の代替ではなく、読解を使う意思決定を増やすために使う。

---

## 8. Field / Hub拡張

必要性が確認できたら追加する。

- 複数map
- Area transition
- 宝箱
- Quest NPC
- Shop / Inn
- Story event
- environment sound
- footstep
- Gamepad

巨大open worldや複雑なphysicsは先に作らない。

---

## 9. Audio / Presentation改善

BGMの基本経路は実装済み。実機確認を続ける。

今後候補:

- AreaごとのBGM motif
- BGM曲数追加
- transition音
- dialogue音
- footstep
- environment sound
- mix調整

ブラウザautoplay制約を守り、既存作品の音源・メロディ・効果音をコピーしない。

---

## 10. Backend / サービス化

必要性が出てから導入する。

トリガー:

- Login
- Cloud Save
- 複数端末同期
- Ranking
- Shared Challenge
- 教員 / 管理者機能

候補:

- Cloudflare Workers / D1 / KV / R2
- Supabase
- その他BaaS

FrontendがCloudflareだからという理由だけでbackendを固定しない。

---

## 11. 長期候補

- Daily Challenge
- Seed共有
- Achievement
- Cosmetic
- 学習履歴分析
- PWA / Offline
- 多言語化
- AIによる補助的な問題作成

AIで問題を作る場合も、code / TargetRule / solvabilityを機械的に検証できる構造を前提にする。

---

## 12. 優先順位まとめ

```text
[実装済み]
Battle MVP
→ seeded generation / solvability
→ RPG Progression / LocalStorage / Area CLEAR
→ Field / NPC / Dialogue
→ Battle Motion / Audio
→ code variants / multi-line
→ World Map

[現在]
#85 複数Area routing / lookup基盤

[次]
TypeScript Frontier
→ TypeScript Battles / Field / Boss
→ 必要に応じJavaScript学習拡張

[その後]
Quest / Shop / 装備等のRPG深化

[必要になってから]
Backend / Login / Cloud Save / Ranking
```

**Battleだけを増やしてRPGの外側が無い状態へ戻さないこと**、そして新しいAreaでもコード読解をゲーム上の意思決定にすることを基本方針とする。
