import {
  extractUniqueProductTags,
  productCatalog,
  type Product,
  type ProductCategory,
  type ProductCollectionKey,
} from "@/lib/products";
import { generateBrandSlug } from "@/lib/brands";
import { toTitleCase } from "@/lib/seo/search-metadata";

export type SeoCollectionKind = "aesthetic" | "category" | "trend" | "long-tail";

export type SeoCollectionPage = {
  slug: string;
  query: string;
  title: string;
  description: string;
  kind: SeoCollectionKind;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase().replace(/\s+/g, " ");
const sanitizeSeoKeyword = (value: string) =>
  normalizeQuery(value).replace(/[^a-z0-9\s-]/g, "").trim();
const seoSlugFromQuery = (query: string) => generateBrandSlug(sanitizeSeoKeyword(query));

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
  const normalizedQuery = sanitizeSeoKeyword(query);
  const slug = seoSlugFromQuery(normalizedQuery);
  return {
    slug,
    query: normalizedQuery,
    title: `${toTitleCase(normalizedQuery)} | SocialMall`,
    description: `Discover ${normalizedQuery} curated from independent fashion brands on SocialMall.`,
    kind,
  };
};

const buildLongTailKeywordCollections = () => {
  const colors = extractUniqueProductTags(productCatalog.all, ["colors"]).filter((color) =>
    new Set(["black", "white", "beige", "brown", "blue", "grey"]).has(color),
  );
  const materials = extractUniqueProductTags(productCatalog.all, ["materials"]).filter(
    (material) => new Set(["linen", "cotton", "wool", "silk", "denim", "leather"]).has(material),
  );
  const seasons = extractUniqueProductTags(productCatalog.all, ["season"]).filter((season) =>
    new Set(["spring", "summer", "autumn", "winter"]).has(season),
  );
  const aesthetics = Object.keys(productCatalog.indexes.byAesthetic).filter((aesthetic) =>
    new Set(["quiet luxury", "old money", "minimalist", "streetwear", "resort"]).has(
      aesthetic,
    ),
  );

  const categoryTerms: Record<ProductCategory, string> = {
    tshirt: "tshirts",
    shirt: "shirts",
    hoodie: "hoodies",
    trousers: "trousers",
    jeans: "jeans",
    dress: "dresses",
    blazer: "blazers",
    footwear: "footwear",
    bag: "bags",
    jewellery: "jewellery",
  };

  const seededLongTailQueries = [
    "black linen shirts men",
    "quiet luxury summer outfits",
    "old money aesthetic outfits",
  ];
  const generatedLongTailQueries = new Set<string>();
  const preferredGenderTerms = ["men", "women"];
  const longTailCategoryPool: ProductCategory[] = ["shirt", "hoodie", "trousers", "blazer"];

  colors.slice(0, 4).forEach((color) => {
    materials.slice(0, 3).forEach((material) => {
      longTailCategoryPool.forEach((category) => {
        preferredGenderTerms.forEach((gender) => {
          generatedLongTailQueries.add(
            `${color} ${material} ${categoryTerms[category]} ${gender}`,
          );
        });
      });
    });
  });

  aesthetics.forEach((aesthetic) => {
    seasons.slice(0, 4).forEach((season) => {
      generatedLongTailQueries.add(`${aesthetic} ${season} outfits`);
    });
  });

  const orderedLongTailQueries = Array.from(
    new Set([...seededLongTailQueries, ...Array.from(generatedLongTailQueries)]),
  );

  return orderedLongTailQueries
    .map((query) => buildCollectionFromQuery(query, "long-tail"))
    .slice(0, 60);
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
  ...buildLongTailKeywordCollections(),
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

const scoreQueryRelationship = (baseQuery: string, candidateQuery: string) => {
  const baseTokens = new Set(baseQuery.split(" "));
  const candidateTokens = new Set(candidateQuery.split(" "));
  let overlap = 0;
  baseTokens.forEach((token) => {
    if (candidateTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap;
};

const collectionRelationsBySlug = new Map<string, string[]>(
  seoCollectionPages.map((collection) => {
    const related = seoCollectionPages
      .filter((candidate) => candidate.slug !== collection.slug)
      .map((candidate) => ({
        query: candidate.query,
        score: scoreQueryRelationship(collection.query, candidate.query),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map((candidate) => candidate.query);

    return [collection.slug, related] as const;
  }),
);

export const getSeoCollectionBySlug = (slug: string) => collectionBySlug.get(slug) ?? null;

export const getSeoCollectionPaths = () =>
  seoCollectionPages.map((collection) => `/${collection.slug}`);

export const getCollectionPathByQuery = (query: string) =>
  collectionPathByQuery.get(sanitizeSeoKeyword(query)) ?? null;

export const getRelatedCollectionQueries = (
  collectionLookup: { slug?: string; query?: string },
  limit = 6,
) => {
  const slugFromLookup =
    collectionLookup.slug ??
    (collectionLookup.query ? getCollectionPathByQuery(collectionLookup.query) : null)?.replace(
      /^\//,
      "",
    );
  if (!slugFromLookup) {
    return [];
  }

  return (collectionRelationsBySlug.get(slugFromLookup) ?? []).slice(0, limit);
};

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
