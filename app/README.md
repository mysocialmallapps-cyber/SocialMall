This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Verified Product Feed

SocialMall keeps generated style-reference items separate from verified retailer-feed products.

- Feed imports are written to `lib/products/data/verified-products.generated.ts`.
- Imported feed rows are marked as `verified-retailer`, `verified-product-image`, `verified-product-page`, and `verified` price.
- Generated catalogue items stay as `style-inspiration`, `illustrative`, `brand-site`, and `estimated`.

To import one Awin or Impact export locally:

```bash
PRODUCT_FEED_FILE=../exports/products.csv PRODUCT_FEED_NETWORK=awin npm run import:feed
```

For a hosted feed URL:

```bash
PRODUCT_FEED_URL="https://example.com/product-feed.csv" PRODUCT_FEED_NETWORK=impact npm run import:feed
```

The importer accepts CSV, TSV, JSON, simple XML, and gzip-compressed feeds. It imports up to `PRODUCT_FEED_LIMIT` products, capped at 500. By default it requires at least 100 valid rows when a feed is configured; set `PRODUCT_FEED_MINIMUM=1` for a smaller pilot export.

For daily sync, add these GitHub repository settings:

- Secret: `PRODUCT_FEED_URL`
- Variable: `PRODUCT_FEED_NETWORK` as `awin` or `impact`
- Optional variable: `PRODUCT_FEED_LIMIT`, normally `500`
- Optional variable: `PRODUCT_FEED_MINIMUM`, normally `100`
- Optional variable: `PRODUCT_FEED_CURRENCY`, normally `EUR`
- Optional variable: `PRODUCT_FEED_RETAILER`, only if the feed does not include retailer names

Do not put private feed URLs or API credentials in `NEXT_PUBLIC_*` variables.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
