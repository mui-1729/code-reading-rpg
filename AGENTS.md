# AGENTS.md

## Project

`CODE//READ RPG` は、**既存コードを読むこと自体をゲームプレイにしたファンタジーRPG**です。

常に次の両方を守ってください。

- コード読解の学習価値
- RPGとしての探索・戦闘・成長の面白さ

## Before editing

実装前に、Issue・現在のコード・関連テストを確認してください。

docsは `docs/README.md` を入口とし、変更範囲に関係するcurrent docsだけを読んでください。

source of truthの優先順位も `docs/README.md` に従います。

historical / Issue固有の実装メモをcurrent仕様として扱わないでください。

既存のcode・docs・tests・設計は、現在の意図を理解するための重要な基準ですが、それ自体を維持することを目的にしないでください。

Issueの目的とProject North Starに照らして明確に優れる案がある場合は、既存案と比較した上で新しい案を採用して構いません。

ただし、Issueのscopeを超える独立した設計変更は同じPRへ混ぜず、必要なら別Issueとして扱ってください。

## Hard invariants

以下は、**その方針自体の変更を目的とするIssueでない限り変更しないでください。**

- 表示コードと内部の `TargetRule` / resolverは同じ意味にする
- 表示JavaScript / TypeScriptを `eval()` しない
- EXECUTE前に正解target・正解Skill・正解target数を表示しない
- Story / CODE HELPは読み方を教えてよいが、現在の正解を教えない
- Level / Equipment / Partyでコード読解そのものを不要にしない
- 未説明conceptをRandom EncounterやBossへ突然出さない
- Stage Select / Area Selectを通常進行へ戻さない
- 空白を増やすだけの巨大mapを作らない
- fantasy RPG要素をすべてengineering metaphorへ置き換えない

## Architecture

現在の設計を理解する基準は `docs/ARCHITECTURE.md` です。

主な責務:

- `game/` = Battle / code-reading domain
- `world/` = current World domain
- `progression/` = EXP / Gold / clear / unlock
- `rpg/` = HP / Equipment / Party / World persistence
- `story/` = Story
- `field/` / `quests/` = legacy / compatibility用途を含む

presentationへdomain logicを直接増やすより、既存domainのresolver / helper構造を優先してください。

ただし、既存境界より明確・単純・保守しやすい設計がIssueの目的達成に直接必要なら、比較した上で改善して構いません。

将来のためだけの抽象化は追加しないでください。

## Decision making

既存案と新しい案を比較するときは、少なくとも次を見てください。

- 学習体験
- RPGとしての面白さ
- UX / accessibility
- 実装の単純さ
- 保守性
- testability
- compatibility cost
- 将来の拡張性

「既存と違う」こと自体を欠点にしないでください。

逆に、「新しい」「きれい」「抽象化されている」こと自体も改善理由にしないでください。

Project North StarとIssueの目的に対して、実際にどちらが優れているかで判断してください。

## Tests and compatibility

既存testsは現在仕様を表す重要な証拠ですが、不変ではありません。

仕様を意図的に変更する場合は、**原則としてtestも新仕様を正しく検証する形へ更新してください。**

対象behavior自体を廃止した場合は、そのtestを削除して構いません。

禁止:

- CI failureを消すことだけを目的にtestを削除する
- testをskipして問題を隠す
- assertionを弱めて実質的に検証しなくする
- obsoleteなtestを守るためだけに新しい実装を旧仕様へ戻す

bug fixでは、可能なら原因となったinvariantを固定するregression testを追加してください。

save compatibilityやmigrationも絶対条件ではありません。

ただしbreaking changeには実際のユーザー影響があります。

単なるコード量削減や実装都合だけで既存saveを壊さず、変更する場合は影響を把握した上で、migration・reset・breaking changeのどれを採用するか明確にしてください。

## Change policy

- 1つのIssue / PRは原則1つの目的に集中させる
- gameplay変更と無関係な大規模refactorを混ぜない
- 既存API / dependencyで十分なら新しいdependencyを追加しない
- legacy code削除前にtest / fixture / migration / compatibility用途を確認する
- behaviorや設計方針を変更した場合は関連するcurrent docsも更新する
- current docsへ実装済み内容をfutureとして残さない

## UI / UX

現在のUI方針は `docs/UI_GUIDE.md` を基準にしてください。

- Pauseやcontextual feedbackで十分なら常設UIを増やさない
- UIからコード読解の答えを先に分からせない
- Desktop / Mobile / keyboard / focus / touchを確認する
- 一般的なWebアプリとしてだけでなく、RPGとして評価する
- 探索する意味、場所ごとの違い、戦闘判断、成長の手応えを損なっていないか確認する

current UIより明確に良い案がある場合は、既存レイアウトへ無理に合わせる必要はありません。

## Validation

Node.js 24を使用してください。

コード / config / dependency変更では、原則PR前に実行します。

```bash
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

純docs変更などで不要なcheckを省略する場合は、repositoryの開発フローに従い理由を明記してください。

実際に実行して成功していないcommandを、成功したと報告しないでください。

## Git / PR

Git / PR / deployのsource of truthは:

- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/DEPLOYMENT.md`

です。

- `main`へ直接commitしない
- Conventional Commitsを使う
- PR前にdiff全体をself-reviewする
- deploy先を過去の設定や外部サービスから推測しない

完了前に、Issue scope・tests・docs・Project North Star・Hard invariantsを満たしているか確認してください。
