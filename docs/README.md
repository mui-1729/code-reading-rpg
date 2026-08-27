# CODE//READ RPG Documentation

このdirectoryは、**現在の仕様**・**設計原則**・**今後の計画**を分けて読むための入口です。

## 最初に読む

| 文書 | 役割 |
| --- | --- |
| [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) | 目的、現状実装、残っている負債、次に実装する候補 |
| [`GAME_DESIGN.md`](./GAME_DESIGN.md) | ゲームとして守るコア原則 |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | 現行コードの責務境界とstate ownership |
| [`ROADMAP.md`](./ROADMAP.md) | 次に何を作るか。実装済み項目はfutureへ残さない |
| [`ENGINEER_STORY_ROADMAP.md`](./ENGINEER_STORY_ROADMAP.md) | 各技術編を「エンジニアの仕事」としてつなぐ長期コンテンツ方針 |

## Current design / system docs

### World / RPG

- [`OPEN_WORLD_DESIGN.md`](./OPEN_WORLD_DESIGN.md) — World、Encounter、HP持続、Treasure、Objective
- [`RPG_PROGRESSION.md`](./RPG_PROGRESSION.md) — EXP / Level / unlock / save progression
- [`ECONOMY.md`](./ECONOMY.md) — 現在のGold / PATCH KIT / Shop仕様
- [`RPG_ECONOMY_EQUIPMENT_DESIGN.md`](./RPG_ECONOMY_EQUIPMENT_DESIGN.md) — Equipment / Item / Gold / Shop / Innを1つのRPG loopとして完成させる設計
- [`QUEST_SYSTEM.md`](./QUEST_SYSTEM.md) — 旧Quest domainを含む進行表現の背景。current runtimeではWorld Objectiveが主導線

### Learning / content

- [`CONTENT_GUIDE.md`](./CONTENT_GUIDE.md) — Battle / Skill / code variant追加ルール
- [`CODE_DATA.md`](./CODE_DATA.md) — runtime data inspector
- [`CODE_CODEX.md`](./CODE_CODEX.md) — 学習参照UI
- [`TUTORIAL.md`](./TUTORIAL.md) — MOVE → INTERACT → SELECT → EXECUTE

### UI / visual

- [`UI_GUIDE.md`](./UI_GUIDE.md) — 常設HUD、Pause、mobile、accessibility
- [`PIXEL_ART_VISUAL_REFERENCE.md`](./PIXEL_ART_VISUAL_REFERENCE.md) — 現在のpixel visual基準
- [`PIXEL_ART_INTEGRATION_PLAN.md`](./PIXEL_ART_INTEGRATION_PLAN.md) — pixel art導入時の実装計画。導入自体は完了済みのため歴史資料として扱う

### Engineering / operations

- [`DEVELOPMENT_WORKFLOW.md`](./DEVELOPMENT_WORKFLOW.md) — Issue → Branch → pre-PR checks → PR → Preview → merge → Production
- [`TESTING.md`](./TESTING.md) — Unit / E2Eの責務
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — Cloudflare deployment

## Historical / one-off implementation notes

次の文書は、現在の仕様のsource of truthではありません。

- [`ISSUE_116_IMPLEMENTATION.md`](./ISSUE_116_IMPLEMENTATION.md) — Gold / Shop / PATCH KIT導入時の実装メモ。現行仕様は`ECONOMY.md`を参照
- [`PIXEL_ART_INTEGRATION_PLAN.md`](./PIXEL_ART_INTEGRATION_PLAN.md) — pixel art導入時の計画。現行visualは`PIXEL_ART_VISUAL_REFERENCE.md`を参照

新しいIssue固有の実装メモを恒久的なsource of truthとして増やさず、実装後はcurrent design docsへ反映します。

## Source of truthの優先順位

同じ内容が食い違う場合は、原則として次の順で判断します。

1. current code + tests
2. `PROJECT_STATUS.md` / `ARCHITECTURE.md`
3. 対象systemのcurrent design doc
4. `ROADMAP.md`
5. historical / one-off implementation notes

仕様変更時はcodeだけでなく、上位のcurrent docsも同じPRで更新します。
