# CODE//READ RPG ロードマップ

## 1. この文書の目的

この文書は、`CODE//READ RPG`をどの順序で拡張するかを定義する。

2026-08-26時点では、Battleだけを増やす段階から、**育成・探索・会話・Area移動を含むRPG世界を拡張する段階**へ進んでいる。

ゲームの中心は常にコードリーディングとする。

1. コードを読まないと正しい行動を選びにくいか
2. 同じ手順の暗記だけで攻略できないか
3. 読んだ結果がゲーム内の意思決定へつながるか
4. Levelや装備の数値だけで読解を不要にしていないか
5. コンテンツを増やしても自動テストできる構造か

---

## 2. 現在地

### Battle / 読解基盤: 実装済み

- JavaScript編 3 Battles
- Skill SELECT → EXECUTE
- `find()` / `filter()` / 比較 / `sort()`
- HP / NEXT行動を見た戦略判断
- Skill実行前のTarget Previewなし
- 任意のCODE HELP
- seed付き決定的乱数
- 敵HP・敵順・Skill順の制約付きvariation
- generator validation / solvability検証
- `SkillDefinition` / `TargetRule`
- 同一概念の複数code variant
- Battle 3の複数行code variant

表示コードを`eval()`してBattleを実行せず、表示内容と安全な内部TargetRuleを対応させる構造を維持する。

### RPG最小ループ: 実装済み

#43〜#48で次を実装済み。

- PlayerProgress
- EXP / Level導出
- 最大HP / POWER倍率
- Stage Select
- Stage CLEAR / unlock
- Skill unlock
- 過去Battleへの再挑戦
- 敗北後の育成と再挑戦
- LocalStorage保存 / migration / reset
- Boss属性
- JavaScript Kingdom Area CLEAR
- CLEAR後の再戦

敵はcurrent Player Levelに合わせてruntimeで弱体化しない。

```text
強敵に負ける
↓
過去Stageへ戻る
↓
EXPを獲得
↓
Playerが成長
↓
同じ世界へ再挑戦
```

育成は「余裕」を増やし、読解は「正しい行動」を決める役割にする。

### RPG世界: 実装済み

#49 / #50でJavaScript KingdomのHub / Fieldを実装済み。

- 1画面トップダウンField
- 4方向移動
- collision
- Keyboard / Mobile操作
- Battle Gate
- Stage Select出口
- Battle後にFieldへ復帰
- NPC 3人
- 汎用Dialogue data
- 進行状態による会話分岐
- 次の目的 / 学習ヒント / 復習導線

Stage Selectは進行確認・再挑戦用として残し、通常の冒険はFieldを歩いてGateへ向かう。

### Battleの手触り: 実装済み

#64 / #63でBattle presentationを追加済み。

- Skill予備動作
- 被弾flash / shake
- damage表示
- Enemy撃破演出
- Player被弾演出
- Victory / Defeat / Level Up等の短い演出
- `prefers-reduced-motion`対応
- SE / BGM channel
- Mute / SE音量 / BGM音量
- Web Audio APIによるオリジナル8-bit風音響

Audio / MotionはBattleのTargetRuleやdamage計算とは分離する。

### 品質・デプロイ: 実装済み

- Node.js 24
- Vitest
- ESLint
- Prettier
- PR前 `npm ci` / `lint` / `test` / `build`
- GitHub Actions CI
- Cloudflare Workers Static Assets
- Cloudflare Workers Builds Preview / Production

Vercelは現在の自動deploy経路から除外済み。

---

## 3. 現在のRPGループ

```text
World Map / Area Select
↓
Areaへ入る
↓
Hub / Fieldを探索
↓
NPCから目的・ヒントを得る
↓
Battle Gate
↓
コードを読んでBattle
↓
EXP / Skill / Stage CLEAR
↓
Fieldへ戻る
↓
Boss撃破でArea CLEAR
↓
World Mapへ戻る
```

この循環を今後のAreaにも共通化する。

---

## 4. 現在の最優先: World Map / 複数Area基盤

### #81 World Map

複数Areaを追加できる入口を作る。

初期スコープ:

- `/world`にArea Select
- TitleのSTART RUN → World Map
- JavaScript KingdomをAVAILABLE表示
- Area CLEAR状態を表示
- TypeScript FrontierをCOMING SOON表示
- 未実装Areaは進入不可
- Area metadataにdescription / availability / entry routeを持たせる
- Stage Select / Area CLEARからWorld Mapへ戻れる
- data-drivenなArea表示
- unit test

重要:

- COMING SOON Areaに架空のBattleやsave dataを作らない
- JavaScript Kingdomの既存route / save dataを壊さない
- World MapをBattle Domainへ依存させない

---

## 5. 次: 2つ目のArea

World Mapが安定した後、実際の2つ目のAreaを追加する。

第一候補はTypeScript。

```text
World
├── JavaScript Kingdom
├── TypeScript Frontier
├── SQL Dungeon
└── React City
```

名前・順序は固定ではない。

TypeScript Areaを実装する場合も、単に問題カテゴリを増やすのではなく、RPG上の地域と学習内容を一致させる。

候補テーマ:

- primitive type
- union type
- object type
- optional property
- narrowing
- function parameter / return type
- genericの初歩

一度に新しい概念を増やしすぎず、「コードを読んで対象・結果を判断できるもの」を優先する。

---

## 6. JavaScript学習コンテンツの拡張

既存Areaを深くする場合の候補:

- `some()` / `every()`
- object property access
- 複数条件
- `map()`
- `reduce()`
- nested data
- 実行順序
- shield / status等の状態

Skill追加時は次を機械的に検証できる状態を維持する。

- code variantとTargetRuleの意味が一致する
- POWERが表示と実ダメージで一致する
- valid targetが存在する
- Battleがsolvable
- 同seedで再現可能

---

## 7. RPGの深さ

World / Area構造が安定してから追加を検討する。

候補:

- Quest
- Shop
- 回復施設
- 装備
- アイテム
- Gold
- Treasure
- Story event
- Status effect
- Deck編成
- Boss固有mechanic

避ける方向:

- 攻撃力だけを上げればコードを読まなくてよい
- Rare装備が既存Skillを完全に無意味にする
- Grind量だけで全Battleを突破できる

RPG要素はコード読解の代替ではなく、読解を使う場面を増やすために利用する。

---

## 8. Field / Hubの拡張

現在のJavaScript Kingdomは1画面Hubなので、必要性が確認できたら次を追加する。

- 複数map
- Area transition
- 宝箱
- Quest NPC
- Shop / Inn
- Story event
- field BGM / environment sound
- footstep
- Gamepad

最初から巨大なopen worldや複雑なphysicsへ拡張しない。

---

## 9. Audio / Presentation改善

Audio基盤は実装済みだが、実機で聞こえ方を継続確認する。

候補:

- Title / World / Field BGM
- Battle BGMのmix調整
- BGM曲数の追加
- Areaごとのmotif
- 環境音
- footstep
- dialogue開始音
- transition音

ブラウザautoplay制約を守り、最初のユーザー操作後にAudioを有効化する。

既存作品の音源・メロディ・効果音はコピーしない。

---

## 10. サービス化

必要性が出てからbackendを追加する。

トリガー:

- 複数端末同期
- Login
- Cloud Save
- Ranking
- Shared Challenge
- 教員 / 管理者機能

候補:

- Cloudflare Workers / D1 / KV / R2
- Supabase
- その他BaaS

frontendをCloudflareでhostingしていることだけを理由にbackendをCloudflareへ固定しない。

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

AIで問題を生成する場合も、表示コード / TargetRule / solvabilityを機械的に検証できる構造を前提にする。

---

## 12. 優先順位まとめ

```text
[実装済み]
Battle MVP
→ seeded generation / solvability
→ PlayerProgress / Stage / EXP / LocalStorage / Area CLEAR
→ Battle animation / Audio
→ Top-down Field / NPC / Dialogue
→ code variants / multi-line code

[現在]
#81 World Map / Area Select

[次]
2つ目のArea
→ 学習コンテンツ拡張
→ Quest / Shop / 装備等のRPG深化

[必要になってから]
Backend / Login / Cloud Save / Ranking
```

**Battleだけを増やしてRPGの外側が無い状態へ戻さないこと**、そして新しいRPG要素も常にコード読解の意思決定へつなげることを基本方針とする。
