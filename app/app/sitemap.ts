import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://socialmall.com";

const STATIC_ROUTES = ["/"];
const SEARCHABLE_QUERY_ROUTES = [
  "black linen shirt",
  "quiet luxury summer outfit",
  "Marbella beach club outfit",
  "oversized streetwear",
  "Scandinavian minimal",
];

// Future-ready extension points for dedicated SEO landing pages and product pages.
const FUTURE_SEO_LANDING_ROUTES: string[] = [];
const FUTURE_PRODUCT_ROUTES: string[] = [];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,
  }));

  const searchableEntries: MetadataRoute.Sitemap = SEARCHABLE_QUERY_ROUTES.map(
    (query) => ({
      url: `${SITE_URL}/?q=${encodeURIComponent(query)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const futureLandingEntries: MetadataRoute.Sitemap =
    FUTURE_SEO_LANDING_ROUTES.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const futureProductEntries: MetadataRoute.Sitemap = FUTURE_PRODUCT_ROUTES.map(
    (route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  return [
    ...staticEntries,
    ...searchableEntries,
    ...futureLandingEntries,
    ...futureProductEntries,
  ];
}
