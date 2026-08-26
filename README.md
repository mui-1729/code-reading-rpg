# CODE//READ RPG

コードを「書く」のではなく、**読んで意味を判断して戦う**コードリーディングRPGです。

現在の`main`はBattle中心のMVPから、**育成・再挑戦・探索を含むRPGそのもの**へ外側のループを拡張している段階です。

## Current main

現在実装済みの主な機能:

- JavaScript編 3 Battles
- コードカードを1回押して選択、同じカードを2回目に押して実行
- 表示コードが攻撃対象を決定し、POWERがダメージを決定
- 対象プレビューなし
- 敵のHP / NEXT行動を見て戦略を決める
- `find` / `filter` / 比較 / `sort` を使用
- 任意のコード解説
- BattleクリアによるSkill解放
- seed付き乱数とURLの`seed` queryによる盤面再現
- seedに基づく敵HP・敵順・Skill順の制約付き可変Battle
- 生成盤面の学習条件・有効対象・solvability検証
- `SkillDefinition` / `codeVariants`によるコード表現拡張の基盤
- PlayerProgress / EXP / Level導出
- JavaScript Kingdom Stage Select
- 過去Stageへの再挑戦
- Battle勝利によるEXP / Stage CLEAR / 次Stage / Skill解放
- Level成長のBattle反映（最大HP / POWER倍率）
- version付きLocalStorage進行保存 / 安全な復元 / リセット
- Boss属性 / JavaScript Kingdom Area CLEAR / CLEAR後の再挑戦
- Vitest / ESLint / Prettier / GitHub Actions CI

まだ`main`には入っていない主なRPG機能:

- トップダウンフィールド
- NPC / 会話 / 拠点
- 装備 / アイテム
- Backend / Database / Authentication

## Product direction

次の優先は、Battleの種類を増やすことより先にRPGの外側の循環を作ることです。

```text
Stage Select / 将来のフィールド・拠点
↓
行き先を選ぶ
↓
Battle
↓
EXP・Skill・CLEAR報酬
↓
Playerが成長
↓
前のStageへ戻って育成・復習もできる
↓
強敵へ再挑戦
```

敵はPlayer Levelに合わせてruntimeで弱体化しません。強い敵に勝てない場合は、過去Stageへ戻り、EXPを稼いでPlayer側を成長させて再挑戦します。

ただしLevelはコード読解を不要にするためのものではありません。**育成で戦える余裕を増やし、勝ち方はコード読解と戦略で決める**ことを基本原則とします。

Stage Selectはこのループを早く成立させるための暫定UIです。RPG最小ループ完成後は、プレイヤーが歩いてBattle入口・NPC・拠点へ移動するトップダウンフィールドへ発展させます。

## Progress persistence

RPG進行はブラウザのLocalStorageへversion付きschemaで保存します。

- 保存対象: EXP / Stage CLEAR / Area CLEAR / Stage解放 / Skill解放
- Level / 最大HP / POWER倍率はEXPから導出し、重複保存しない
- schema v1 → v2 migrationで既存のBoss CLEARもArea CLEARへ引き継ぐ
- 壊れたJSONや未知schema versionは初期状態へ安全にfallback
- Battle中のターンや敵残HPなど、一時的な戦闘状態は保存しない
- Stage Selectから進行をリセット可能

## Area progression

現在はJavaScript Kingdomを最初のAreaとして定義しています。

- 各Battleは`areaId`を持つ
- Battle 3は`isBoss: true`
- Boss初回勝利で`clearedAreaIds`へ`javascript`を記録
- Stage Selectに`AREA CLEAR`状態を表示
- Area CLEAR画面からStage Selectへ戻る / Bossを再戦できる
- CLEAR後も過去Stageはそのまま再挑戦可能

Area定義とBattleの所属を分離しているため、将来はTypeScript / SQL / Reactなど複数Areaを追加できる構造です。

## Docs

- [ロードマップ](./docs/ROADMAP.md) — 実装済み基盤、次の優先順位、長期展望
- [ゲーム設計](./docs/GAME_DESIGN.md) — コードリーディングRPGとして守る原則
- [RPG成長ループ](./docs/RPG_PROGRESSION.md) — Level / EXP / 再挑戦 / Stage / Fieldの設計
- [アーキテクチャ](./docs/ARCHITECTURE.md) — 現在の構成と将来の責務分割
- [コンテンツ作成ガイド](./docs/CONTENT_GUIDE.md) — SkillDefinition / Battle生成 / 学習コンテンツ設計
- [テスト方針](./docs/TESTING.md) — Unit / Preview / E2E / solvability方針
- [開発フロー](./docs/DEVELOPMENT_WORKFLOW.md) — IssueからCloudflare Production確認までの運用
- [デプロイ運用](./docs/DEPLOYMENT.md) — Cloudflare Workers Builds / Preview / Production設定

## Production

正式なデプロイ先はCloudflare Workers Static Assetsです。

- Production: https://code-reading-rpg.profuse-comb.workers.dev
- Production branch: `main`
- PR / branch: Cloudflare Workers Builds Preview
- `main` merge: Cloudflare Workers Production Build
- deploy設定のsource of truth: `wrangler.jsonc`

## Routes

TanStack Routerで画面遷移とBattle URLを管理しています。

- `/` - スタート画面
- `/javascript` - JavaScript Kingdom / Stage Select
- `/javascript/battle/$battleId?seed=...` - JavaScript編の各Battle
- `/javascript/complete` - JavaScript KingdomのArea CLEAR / status画面

同じBattle IDとseedなら同じ可変盤面を再現できます。

## Run

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm ci
npm run lint
npm test
npm run build
```

## Tech

- Vite
- React 19
- TypeScript
- TanStack Router
- CSS
- Node.js 24
- Vitest
- ESLint / Prettier
- GitHub Actions
- Cloudflare Workers Static Assets / Workers Builds

## Design note

表示されているコードを`eval()`してゲームロジックとして実行しません。コード表示と安全な内部ルールを同じ定義から対応させ、JavaScript上の意味とゲーム効果がずれない構造を維持します。
