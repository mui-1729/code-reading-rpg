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

## 2. Cloudflareを採用している理由

現在の構成では、Vite SPAをCloudflare Workers Static Assetsで配信し、Workers BuildsのGitHub連携でPreview / Productionを管理する。

主な理由:

- Vite SPAをWorkers Static Assetsでそのまま配信できる
- GitHub連携でProduction / non-production branch buildを分けられる
- branchごとのPreview URLを発行できる
- SPA fallbackを設定でき、TanStack Routerのdeep linkを維持できる
- 将来Workers / D1 / KV / R2等を検討しやすい

ただし、Cloudflareでfrontendを配信していることは**将来backendをCloudflare製品へ固定する決定ではない**。認証・DB・同期要件が発生した時点で、Cloudflare Workers/D1/KV/R2、Supabase等を要件ベースで比較する。

---

## 3. Repo側のデプロイ設定

Static Assets / SPA fallbackは`wrangler.jsonc`をsource of truthにする。

```jsonc
{
  "name": "code-reading-rpg",
  "compatibility_date": "2026-08-25",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

重要点:

- Viteの成果物は`dist`
- `assets.directory`は`./dist`
- `single-page-application` fallbackで未知pathをSPAの`index.html`へ返す
- TanStack Routerのdeep link / reloadを維持する

Cloudflare Workers Buildsは`wrangler.jsonc`のCustom Builds設定をBuild stepとして扱わないため、`wrangler.jsonc`の`build.command`へ正しさを依存させない。また、install時に副作用でbuildする`postinstall`も置かない。

代わりに、**repoのdeploy script自体をself-containedにする**。Production / Previewのどちらも、deploy commandが必ず先に`npm run build`を実行して`dist`を生成する。

```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "deploy": "npm run build && wrangler deploy",
    "deploy:preview": "npm run build && wrangler versions upload"
  },
  "devDependencies": {
    "wrangler": "4.127.1"
  }
}
```

これにより、Cloudflare Dashboard側のBuild commandが空でもdeploy path単体で`dist`生成を保証できる。Dashboard設定のdriftだけでStatic Assets deployが壊れないことを優先する。

Wranglerはexact versionを`package-lock.json`へ固定し、deploy pathでbare `npx wrangler`が別versionを取得しない。更新はrelease notesを確認する専用dependency PRで行う。

local / manual deployでも同じnpm scriptを使う。

```bash
npm ci
npm run deploy

# Preview versionの場合
npm run deploy:preview
```

`npm run deploy` / `npm run deploy:preview`が内部でbuildするため、直前の手動`npm run build`は必須ではない。

---

## 4. GitHub連携

Cloudflare Workers Buildsでは次を基準にする。

```text
Git repository: mui-1729/code-reading-rpg
Production branch: main
Build command: (empty / optional)
Production deploy command: npm run deploy
Non-production deploy command: npm run deploy:preview
Root directory: /
```

Productionではpackage lock済みの`wrangler deploy`、PR / non-production branchでは`wrangler versions upload`がnpm script経由で使われる。どちらもnpm script内で先に`npm run build`を実行する。

Cloudflare DashboardのBuild commandに`npm run build`が設定されていてもdeploy自体は成功するが、同じbuildが2回走るため冗長になる。**correctnessのsource of truthはrepoのdeploy script**とし、DashboardのBuild commandは空を推奨する。

---

## 5. Preview運用

通常のPRは次の流れで確認する。

```text
branch push / PR
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

Cloudflare checkがGitHubに現れるまで時間差がある場合がある。GitHub Actionsだけ成功していてCloudflare checkがまだ無い場合は、Cloudflare Preview成功とみなさない。

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
- Production URLでsmoke testする

`main`へmergeしただけではIssue完了としない。Cloudflare Production成功まで確認する。

---

## 7. 障害時

### GitHub Actionsは成功、Cloudflare Productionだけ失敗

最初に次を分ける。

1. deploy script内の`npm run build`が失敗している
2. build後も`dist`が作られていない
3. Deploying / Wrangler uploadで失敗している
4. Cloudflare trigger / token等の外部設定で失敗している

`dist`不足の場合:

- `package.json`の`deploy` / `deploy:preview`が先に`npm run build`を実行しているか確認
- deploy logで`tsc -b && vite build`が成功しているか確認
- Build step後に`dist`が生成されるか確認
- `wrangler.jsonc`の`assets.directory`が`./dist`か確認

Deployingで失敗する場合:

- Wrangler config読込
- Static Assets upload
- Worker名
- Cloudflare側のBuild token / Production trigger

を確認する。

### Cloudflare Previewが成功し、Productionだけ失敗する

アプリ本体よりもProduction trigger固有設定を疑う。

- Production deploy command
- Production branch
- Build token
- Root directory

repo側commandが同じでもProductionだけ失敗する場合は、Cloudflare Dashboard / Builds API側の設定修正が必要。

---

## 8. push回数の考え方

意味のない小commitを連続pushしない。

基本方針:

- 1 Issue = 1 branch = 1 PR
- 関連変更をまとめてからpushする
- CI / Previewを回すだけのno-op commitは避ける
- `main`へは原則squash merge

---

## 9. 将来のデプロイ拡張

Backendが必要になった場合も、frontend deployとgame domainの責務を混ぜない。

候補:

- Cloudflare Worker API
- D1
- KV
- R2
- Durable Objects
- Supabase等の外部BaaS

選定基準は、アカウント、同期、データモデル、リアルタイム性、コスト、運用負荷、学習目的。Cloudflareで静的配信していることだけを理由にbackendを決めない。
