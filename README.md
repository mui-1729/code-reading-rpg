# CODE//READ RPG

コードを「書く」のではなく、**読んで意味を判断して戦う**コードリーディングRPGです。

現在の`main`はBattle中心のMVPから、**育成・再挑戦・探索・会話を含むRPGそのもの**へ外側のループを拡張している段階です。

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
- 同じ概念の複数code variantとBattle 3の複数行コード
- PlayerProgress / EXP / Level導出
- JavaScript Kingdom Stage Select
- 過去Stageへの再挑戦
- Battle勝利によるEXP / Stage CLEAR / 次Stage / Skill解放
- Level成長のBattle反映（最大HP / POWER倍率）
- version付きLocalStorage進行保存 / 安全な復元 / リセット
- Boss属性 / JavaScript Kingdom Area CLEAR / CLEAR後の再挑戦
- JavaScript KingdomのトップダウンField
- 4方向移動 / collision / interactable object / Battle Gate / Area出口
- Keyboard / Mobile操作
- Fieldから入ったBattleの勝利・敗北後にFieldへ戻る導線
- 3人のNPC / 汎用Dialogueデータ / 進行状態による会話分岐
- 次の目的・コード読解ヒント・復習導線をField内会話から確認
- Battle motion / damage feedback / reduced motion対応
- SE / Battle BGM / Mute / SE・BGM別音量のAudio基盤
- Vitest / ESLint / Prettier / GitHub Actions CI

このbranchではさらに、複数Areaへ拡張する入口としてWorld Mapを追加しています。

- `/world`にArea Select
- JavaScript KingdomをAVAILABLEとして表示
- JavaScript Kingdom CLEAR状態をWorld Mapへ反映
- TypeScript FrontierをCOMING SOONとして表示し、未実装の進行データは作らない
- Area metadataからdata-drivenに表示・進入可否を決定

まだ入っていない主なRPG機能:

- TypeScript / SQL / Reactなど次Areaの実コンテンツ
- 装備 / アイテム
- Quest / Shop / 回復施設などの拠点機能
- Backend / Database / Authentication

## Product direction

現在のRPGループは次の形です。

```text
World Map
↓
Areaを選ぶ
↓
JavaScript Kingdom Hub / Field
↓
NPCと話して目的・ヒントを確認
↓
歩いてBattle Gateを探す
↓
Battle
↓
EXP・Skill・CLEAR報酬
↓
Playerが成長
↓
Fieldへ戻る / 次のBattleへ進む
↓
必要ならStage Selectから過去Stageへ再挑戦
```

敵はPlayer Levelに合わせてruntimeで弱体化しません。強い敵に勝てない場合は、過去Stageへ戻り、EXPを稼いでPlayer側を成長させて再挑戦します。

ただしLevelはコード読解を不要にするためのものではありません。**育成で戦える余裕を増やし、勝ち方はコード読解と戦略で決める**ことを基本原則とします。

Stage Selectは進行確認・再挑戦用として残し、通常の冒険導線はWorld Map → Field → Battle Gateへ向かう形へ拡張しています。

## World Map / Area progression

`/world`は複数Areaを選ぶ入口です。

- Titleの`START RUN`からWorld Mapへ入る
- JavaScript Kingdomは`AVAILABLE`
- CLEAR済みなら`AREA CLEAR`を表示
- 未実装Areaは`COMING SOON`で進入不可
- Areaの表示名・説明・availability・entry routeは`src/game/areas.ts`へ集約
- 未実装Areaには架空のBattleやsave dataを作らない
- Stage Select / Area CLEAR画面からWorld Mapへ戻れる

Area追加時はWorld Mapの条件分岐を増やすのではなく、Area metadataを追加して拡張する方針です。

## Field exploration

`/javascript/field`にJavaScript Kingdomの1画面Fieldがあります。

- Arrow / WASDで4方向移動
- wall / rock / interactable tileとのcollision
- Enter / Spaceまたは画面上の`INTERACT`で正面を調べる
- Stage 1〜3のBattle GateはPlayerProgressのunlock状態を参照
- CLEAR済みGateは見た目でも区別
- Stage Selectへの出口あり
- Mobile向けD-Pad + INTERACTあり
- FieldからBattleへ入ると`returnTo=/javascript/field`を渡し、終了後にFieldへ戻れる

Fieldの座標・collision・interaction判定は`src/field/`の純粋ロジックへ分離し、Battle Domainへ混ぜていません。

## NPC / Dialogue

JavaScript Kingdom Hubには3人のNPCがいます。

- `ARCHIVIST ADA` — 次に向かうStage / Bossを案内
- `LAMBDA SAGE` — `find()` / `filter()` / `sort()`などの読解ヒント
- `BYTE SCOUT` — 過去Stage再挑戦、seed違いの復習導線

Dialogueは`src/dialogue/`へ分離しています。

- NPCと会話本文をデータとして追加できる
- `always` / `minLevel` / `stageCleared` / `areaCleared`条件を持てる
- Player Level / Stage CLEAR / Area CLEARに応じて会話を切り替える
- BattleロジックはDialogueの条件評価や表示を知らない
- Enter / Spaceまたは`NEXT`で会話を進める

これにより、次の目的と学習ヒントをメニュー外のRPG世界から確認できます。

## Progress persistence

RPG進行はブラウザのLocalStorageへversion付きschemaで保存します。

- 保存対象: EXP / Stage CLEAR / Area CLEAR / Stage解放 / Skill解放
- Level / 最大HP / POWER倍率はEXPから導出し、重複保存しない
- schema v1 → v2 migrationで既存のBoss CLEARもArea CLEARへ引き継ぐ
- 壊れたJSONや未知schema versionは初期状態へ安全にfallback
- Battle中のターンや敵残HPなど、一時的な戦闘状態は保存しない
- Stage Selectから進行をリセット可能

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
- `/world` - World Map / Area Select
- `/javascript/field` - JavaScript Kingdom / Top-down Hub & Field
- `/javascript` - JavaScript Kingdom / Stage Select
- `/javascript/battle/$battleId?seed=...&returnTo=...` - JavaScript編の各Battle
- `/javascript/complete` - JavaScript KingdomのArea CLEAR / status画面

同じBattle IDとseedなら同じ可変盤面を再現できます。`returnTo`は現在FieldからBattleへ入った場合の戻り先だけを許可しています。

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
- Web Audio API
- Node.js 24
- Vitest
- ESLint / Prettier
- GitHub Actions
- Cloudflare Workers Static Assets / Workers Builds

## Design note

表示されているコードを`eval()`してゲームロジックとして実行しません。コード表示と安全な内部ルールを同じ定義から対応させ、JavaScript上の意味とゲーム効果がずれない構造を維持します。
