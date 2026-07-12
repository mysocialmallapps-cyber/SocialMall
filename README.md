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
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — enables GA4 event tracking.
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` — enable PostHog event tracking.
- Affiliate provider variables are listed in `app/.env.example`. Without them, product clicks fall back to direct retailer URLs with SocialMall tracking parameters.

### Pilot analytics

After testing on the live site, open `/pilot/analytics` to review browser-local pilot signals: popular searches, product clicks, outbound redirects, product catalogue status and affiliate provider configuration.
