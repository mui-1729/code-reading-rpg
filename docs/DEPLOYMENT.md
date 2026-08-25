# CODE//READ RPG デプロイ運用

## Production

CODE//READ RPG は Cloudflare Workers Static Assets を正式なデプロイ先として運用する。

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Static assets: `dist`
- SPA fallback: `single-page-application`

`main` へのmergeをCloudflare Production Buildのトリガーとする。

## Preview

`main` 以外のbranch / Pull Requestでは、Cloudflare Workers BuildsのPreviewを使用する。

merge前に以下を確認する。

- GitHub Actions CIが成功している
- Cloudflare Preview Buildが成功している
- 対象画面が開ける
- route追加・変更時は直URLと再読込が機能する

## Vercel

VercelはCloudflareへの移行確認中のfallbackとして当面残す。

CloudflareのPreview / Production運用が安定したことを確認した後、Vercel連携の整理は別Issueで行う。

## Cloudflare設定

`wrangler.jsonc` でViteのbuild成果物を配信する。

```json
{
  "name": "code-reading-rpg",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

TanStack Routerのcode-based routingを使っているため、SPA fallbackを有効にして直URLと再読込を維持する。
