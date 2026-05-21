import type { MetadataRoute } from "next";
import { getSeoCollectionPaths } from "@/lib/collections";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://socialmall.com";

const STATIC_ROUTES = ["/"];
const SEARCHABLE_QUERY_ROUTES = [
  "black linen shirt",
  "quiet luxury summer outfit",
  "Marbella beach club outfit",
  "oversized streetwear",
  "Scandinavian minimal",
];
const SEO_COLLECTION_ROUTES = getSeoCollectionPaths();

// Future-ready extension points for dedicated product pages.
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

  const collectionEntries: MetadataRoute.Sitemap = SEO_COLLECTION_ROUTES.map((route) => ({
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
    ...collectionEntries,
    ...futureProductEntries,
  ];
}
