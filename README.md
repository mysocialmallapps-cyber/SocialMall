# SocialMall

## Deploy on Vercel

This repository is a monorepo-style layout with the Next.js app in `/app`.

Use these Vercel project settings:

- **Framework Preset:** Next.js
- **Root Directory:** `app`
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** *(leave default for Next.js)*
- **Node.js Version:** `22.x` (or Vercel default current LTS)

### Environment variables

No required environment variables for build or runtime.

Optional:

- `NEXT_PUBLIC_SITE_URL` — set to your production domain for canonical sitemap/robots host values.