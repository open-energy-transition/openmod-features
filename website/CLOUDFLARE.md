# Cloudflare Pages Deployment

This dashboard is deployed as a static Cloudflare Pages site. It does not use a Worker or Pages Functions.

## One-Time Setup

Authenticate Wrangler:

```bash
npx wrangler login
npx wrangler whoami
```

Create the Pages project once:

```bash
npx wrangler pages project create openmod-features-dashboard --production-branch feat/feature-gap-dashboard
```

## Direct Upload Deploy

From `website/`:

```bash
pnpm deploy:cloudflare
```

This runs:

```bash
DEPLOY_BASE=/ pnpm build
npx wrangler pages deploy dist/client --project-name openmod-features-dashboard
```

Cloudflare Pages serves the site at the domain root, so `DEPLOY_BASE=/` is required. Do not use the GCS bucket base for Cloudflare.

## Git Integration Settings

If deploying through the Cloudflare dashboard instead of direct upload:

- Framework preset: None
- Root directory: `website`
- Build command: `pnpm build:cloudflare`
- Build output directory: `dist/client`
- Environment variables: none required

## Output

The static build writes deployable files to:

```text
website/dist/client
```

Important generated files:

- `index.html`
- `404.html`
- `_shell.html`
- `tools/index.html`
- `use-cases/index.html`
- `builder/index.html`
- `assets/*`
- `data/features.json`
- `_headers`
