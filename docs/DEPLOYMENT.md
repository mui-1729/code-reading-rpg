# CODE//READ RPG デプロイ運用

## 1. 正式なデプロイ先

CODE//READ RPGの正式なPreview / Production基盤は**Cloudflare Workers Static Assets + Workers Builds**とする。

運用対象:

- Cloudflare Account: `Profuse Comb`
- Worker: `code-reading-rpg`
- GitHub repository: `mui-1729/code-reading-rpg`
- Production branch: `main`
- Production URL: https://code-reading-rpg.profuse-comb.workers.dev

Cloudflareの同一ログインユーザーに複数Accountが存在しても、このプロジェクトは`Profuse Comb`配下を正とする。Account IDや個人メールアドレスはrepoへ保存しない。

---

## 2. なぜCloudflareへ移行したか

Vercel Hobbyのdeployment rate limitにより、細かいbranch pushが多い開発フローでPreview deploymentが止まることがあったため、2026-08にCloudflareへ移行した。

Cloudflareを選んだ理由:

- Vite SPAをWorkers Static Assetsでそのまま配信できる
- GitHub連携でProduction / non-production branch buildを分けられる
- branchごとのPreview URLを発行できる
- SPA fallbackを設定でき、TanStack Routerのdeep linkを維持できる
- 将来Workers / D1 / KV / R2等を検討しやすい

ただし、Cloudflareへ移行したことは**将来backendをCloudflare製品へ固定する決定ではない**。認証・DB・同期要件が発生した時点で、Cloudflare Workers/D1/KV/R2、Supabase等を要件ベースで比較する。

またCloudflare側にもbuild利用量の上限はあるため、「無制限だから細かくpushしてよい」という運用にはしない。

---

## 3. Source of truth

Cloudflareのbuild / assets設定はrepoの`wrangler.jsonc`を正とする。

```jsonc
{
  "name": "code-reading-rpg",
  "compatibility_date": "2026-08-25",
  "build": {
    "command": "npm run build"
  },
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

重要点:

- Viteのbuild成果物は`dist`
- Wrangler実行前に`npm run build`を実行する
- `single-page-application` fallbackで未知pathをSPAの`index.html`へ返す
- TanStack Routerの`/javascript/battle/:id?seed=...`を直URLから開いても動作する構成にする

移行初期にCloudflare DashboardのBuild commandが`None`のままPreview deployされ、`dist`が存在せず失敗したため、**build commandをrepo側のWrangler設定へ持たせる**方針にした。

---

## 4. GitHub連携

Cloudflare Workers Buildsで次を設定する。

```text
Git repository: mui-1729/code-reading-rpg
Production branch: main
Production deploy command: npx wrangler deploy
Non-production branch builds: ON
Root directory: /
```

Productionでは`npx wrangler deploy`が実行される。

non-production branch / PRではCloudflare側が`npx wrangler versions upload`を使用し、Worker versionとPreview URLを作成する。Preview側でdeploy commandが`versions upload`と表示されるのは正常。

---

## 5. Preview運用

通常のPRは次の流れで確認する。

```text
branch push
↓
GitHub Actions CI
↓
Cloudflare Workers Build
↓
Preview Version作成
↓
Preview URL確認
↓
自己レビュー
↓
merge
```

merge前の最低条件:

- GitHub Actions CI success
- Cloudflare `Workers Builds: code-reading-rpg` success
- Preview URLが発行される
- UI変更時は対象画面を確認する
- route追加・変更時は直URLと再読み込みを確認する

Cloudflare checkがGitHubに現れるまで少し時間差がある場合がある。GitHub Actionsだけ成功していてCloudflare checkがまだ無い場合は、Cloudflare Preview成功とみなさない。

---

## 6. Production運用

`main`へのmergeをProduction Buildのトリガーとする。

```text
PR squash merge
↓
main push
↓
GitHub Actions CI
↓
Cloudflare Workers Production Build
↓
Version deploy
↓
Production確認
```

merge後は最低限、merge commitに対して次を確認する。

- GitHub Actions CI success
- `Workers Builds: code-reading-rpg` success
- Cloudflare Version IDが発行される
- 必要に応じてProduction URLでsmoke testする

`main`へmergeしただけではIssue完了としない。Cloudflare Production成功まで確認する。

---

## 7. Vercelの扱い

Vercelは正式なdeploy基盤から外した。

現在の決定:

- Vercel Git repository接続はDisconnect済み
- Vercel Previewをmerge条件にしない
- Vercel Productionを完了条件にしない
- `vercel.json`では`git.deploymentEnabled = false`を設定し、自動Git deployを停止している
- 旧Vercel Project / URLが残っていても、現在のProduction source of truthではない

`vercel.json`は現時点では再接続時の誤deployを防ぐsafety lockとして残す。完全削除する場合は別Issueで、Vercel Project / config / docsをまとめて整理する。

---

## 8. push回数の考え方

Cloudflare移行後も、意味のない小commitを連続pushしない。

基本方針:

- 1 Issue = 1 branch = 1 PR
- local / Git object上で関連変更をまとめてからbranchへpushする
- 論理的に必要な修正commitは許容する
- CI / Previewを回すだけのno-op commitは避ける
- PR内commit数を無理に1つへ固定しないが、deploy資源を浪費しない
- `main`へは原則squash merge

---

## 9. 障害時

### GitHub Actionsは成功、Cloudflareが失敗

Cloudflare Build logを確認する。

特に見るもの:

- Installing
- Building
- Deploying
- Wrangler config読込
- `dist`生成
- Static Assets upload

### Cloudflare Previewが発火しない

確認するもの:

- Workers BuildsのGit repository接続
- non-production branch buildsがONか
- 対象commitがGitHubへpushされているか
- Cloudflare GitHub Appがrepoへアクセスできるか

### Productionだけ失敗

merge済みでもIssue完了にしない。原因を切り分け、必要ならfix Issueを作って通常のbranch / PRフローで復旧する。

---

## 10. 将来のデプロイ拡張

Backendが必要になった場合も、frontend deployとgame domainの責務を混ぜない。

候補:

- Cloudflare Worker API
- D1
- KV
- R2
- Durable Objects
- Supabase等の外部BaaS

選定基準は、アカウント、同期、データモデル、リアルタイム性、コスト、運用負荷、学習目的。Cloudflareで静的配信していることだけを理由にbackendを決めない。
