import {
  productCatalog,
  type Product,
  type ProductCategory,
  type ProductCollectionKey,
} from "@/lib/products";
import { generateBrandSlug } from "@/lib/brands";
import { toTitleCase } from "@/lib/seo/search-metadata";

export type SeoCollectionKind = "aesthetic" | "category" | "trend";

export type SeoCollectionPage = {
  slug: string;
  query: string;
  title: string;
  description: string;
  kind: SeoCollectionKind;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase().replace(/\s+/g, " ");

const categoryQueryMap: Record<ProductCategory, string> = {
  tshirt: "t-shirt outfits",
  shirt: "linen shirts",
  hoodie: "oversized hoodies",
  trousers: "tailored trousers",
  jeans: "streetwear jeans",
  dress: "occasion dresses",
  blazer: "quiet luxury blazers",
  footwear: "minimal footwear outfits",
  bag: "designer bag outfits",
  jewellery: "minimal jewellery looks",
};

const collectionQueryMap: Record<ProductCollectionKey, string> = {
  featured: "featured fashion picks",
  "quiet-luxury": "quiet luxury outfits",
  streetwear: "streetwear outfits",
  vacation: "marbella beach club outfits",
  occasionwear: "event-ready occasionwear",
  essentials: "everyday essentials outfits",
};

const curatedCollections: SeoCollectionPage[] = [
  {
    slug: "quiet-luxury-outfits",
    query: "quiet luxury outfits",
    title: "Quiet Luxury Outfits | SocialMall",
    description:
      "Explore quiet luxury outfits curated from independent brands and premium minimal labels.",
    kind: "aesthetic",
  },
  {
    slug: "old-money-style-men",
    query: "old money style men",
    title: "Old Money Style Men | SocialMall",
    description:
      "Discover old money style for men with tailored essentials, refined layers, and elevated textures.",
    kind: "trend",
  },
  {
    slug: "marbella-beach-club-outfits",
    query: "marbella beach club outfits",
    title: "Marbella Beach Club Outfits | SocialMall",
    description:
      "Shop Marbella beach club outfit inspiration with resort shirts, dresses, and statement accessories.",
    kind: "trend",
  },
  {
    slug: "scandinavian-minimal-outfits",
    query: "Scandinavian minimal outfits",
    title: "Scandinavian Minimal Outfits | SocialMall",
    description:
      "Find Scandinavian minimal outfits with clean silhouettes, tonal palettes, and premium everyday staples.",
    kind: "aesthetic",
  },
];

const buildCollectionFromQuery = (
  query: string,
  kind: SeoCollectionKind,
): SeoCollectionPage => {
  const normalizedQuery = normalizeQuery(query);
  const slug = generateBrandSlug(normalizedQuery);
  return {
    slug,
    query: normalizedQuery,
    title: `${toTitleCase(normalizedQuery)} | SocialMall`,
    description: `Discover ${normalizedQuery} curated from independent fashion brands on SocialMall.`,
    kind,
  };
};

const buildDynamicCategoryCollections = () =>
  (Object.keys(productCatalog.indexes.byCategory) as ProductCategory[])
    .filter((category) => productCatalog.indexes.byCategory[category].length > 0)
    .map((category) => buildCollectionFromQuery(categoryQueryMap[category], "category"));

const buildDynamicAestheticCollections = () =>
  Object.entries(productCatalog.indexes.byAesthetic)
    .filter(([, products]) => products.length >= 6)
    .sort(([, left], [, right]) => right.length - left.length)
    .slice(0, 8)
    .map(([aesthetic]) => buildCollectionFromQuery(`${aesthetic} outfits`, "aesthetic"));

const buildDynamicTrendCollections = () =>
  (Object.keys(productCatalog.indexes.byCollection) as ProductCollectionKey[])
    .filter((key) => productCatalog.indexes.byCollection[key].length > 0)
    .map((key) => buildCollectionFromQuery(collectionQueryMap[key], "trend"));

const dedupeCollections = (collections: SeoCollectionPage[]) => {
  const collectionMap = new Map<string, SeoCollectionPage>();
  collections.forEach((collection) => {
    collectionMap.set(collection.slug, collection);
  });
  return Array.from(collectionMap.values());
};

export const seoCollectionPages = dedupeCollections([
  ...curatedCollections,
  ...buildDynamicCategoryCollections(),
  ...buildDynamicAestheticCollections(),
  ...buildDynamicTrendCollections(),
]);

const collectionBySlug = new Map(
  seoCollectionPages.map((collection) => [collection.slug, collection] as const),
);

const collectionPathByQuery = new Map(
  seoCollectionPages.map((collection) => [
    normalizeQuery(collection.query),
    `/${collection.slug}`,
  ]),
);

export const getSeoCollectionBySlug = (slug: string) => collectionBySlug.get(slug) ?? null;

export const getSeoCollectionPaths = () =>
  seoCollectionPages.map((collection) => `/${collection.slug}`);

export const getCollectionPathByQuery = (query: string) =>
  collectionPathByQuery.get(normalizeQuery(query)) ?? null;

export const getCollectionProducts = (query: string) => {
  const normalizedQuery = normalizeQuery(query);
  const matchingProducts = productCatalog.all.filter((product: Product) => {
    const searchableValues = [
      product.name,
      product.brand,
      product.retailer,
      product.category,
      product.subcategory,
      ...product.vibe,
      ...product.style,
      ...product.occasion,
      ...product.season,
      ...product.fit,
      ...product.colors,
      ...product.materials,
    ].map((value) => normalizeQuery(String(value)));

    return searchableValues.some((value) => value.includes(normalizedQuery));
  });

  return matchingProducts.length ? matchingProducts : productCatalog.all;
};
