import {
  extractUniqueProductTags,
  productCatalog,
  type Product,
  type ProductCategory,
  type ProductCollectionKey,
} from "@/lib/products";
import { generateBrandSlug } from "@/lib/brands";
import {
  longTailSeoPageDefinitions,
  type SeoPageType,
} from "@/lib/seo/seo-page-config";

export type SeoCollectionKind = "aesthetic" | "category" | "trend" | "long-tail";

export type SeoCollectionPage = {
  slug: string;
  query: string;
  searchQuery: string;
  title?: string;
  description?: string;
  introCopy?: string[];
  whatToExplore?: string;
  kind: SeoCollectionKind;
  relatedSlugs: string[];
  pageType: SeoPageType;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase().replace(/\s+/g, " ");
const sanitizeSeoKeyword = (value: string) =>
  normalizeQuery(value).replace(/[^a-z0-9\s-]/g, "").trim();
const seoSlugFromQuery = (query: string) => generateBrandSlug(sanitizeSeoKeyword(query));
const collectionPathFromSlug = (slug: string) => `/collections/${slug}`;
const pageTypeFromKind = (kind: SeoCollectionKind): SeoPageType =>
  kind === "trend" || kind === "aesthetic" ? "trend" : "collection";

const defineSeoCollectionPage = ({
  slug,
  query,
  searchQuery,
  title,
  description,
  introCopy,
  whatToExplore,
  kind,
  relatedSlugs = [],
  pageType,
}: {
  slug: string;
  query?: string;
  searchQuery?: string;
  title?: string;
  description?: string;
  introCopy?: string[];
  whatToExplore?: string;
  kind: SeoCollectionKind;
  relatedSlugs?: string[];
  pageType?: SeoPageType;
}): SeoCollectionPage => {
  const normalizedSearchQuery = sanitizeSeoKeyword(searchQuery ?? query ?? slug);
  return {
    slug: seoSlugFromQuery(slug),
    query: normalizedSearchQuery,
    searchQuery: normalizedSearchQuery,
    title,
    description,
    introCopy,
    whatToExplore,
    kind,
    relatedSlugs: Array.from(new Set(relatedSlugs.map(seoSlugFromQuery))).filter(Boolean),
    pageType: pageType ?? pageTypeFromKind(kind),
  };
};

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
  defineSeoCollectionPage({
    slug: "quiet-luxury-outfits",
    searchQuery: "quiet luxury outfits",
    title: "Quiet Luxury Outfits | SocialMall",
    description:
      "Explore quiet luxury outfits curated from independent brands and premium minimal labels.",
    introCopy: [
      "Discover quiet luxury outfits from independent fashion brands, curated around minimal silhouettes, neutral tones, and elevated everyday pieces.",
      "This edit focuses on refined staples that feel polished, wearable, and quietly distinctive.",
    ],
    whatToExplore:
      "What to explore: soft tailoring, tonal layers, premium basics, and understated accessories.",
    kind: "aesthetic",
    relatedSlugs: ["quiet-luxury-summer-outfits", "scandinavian-minimal-outfits"],
    pageType: "trend",
  }),
  defineSeoCollectionPage({
    slug: "old-money-style-men",
    searchQuery: "old money style men",
    title: "Old Money Style Men | SocialMall",
    description:
      "Discover old money style for men with tailored essentials, refined layers, and elevated textures.",
    introCopy: [
      "Discover old money style for men with tailored essentials, refined layers, and classic textures that feel timeless.",
      "The collection leans into polished wardrobe foundations rather than trend-heavy statements.",
    ],
    whatToExplore:
      "What to explore: blazers, tailored trousers, crisp shirts, and smart casual layers.",
    kind: "trend",
    relatedSlugs: ["old-money-aesthetic-outfits", "quiet-luxury-outfits"],
    pageType: "trend",
  }),
  defineSeoCollectionPage({
    slug: "marbella-beach-club-outfits",
    searchQuery: "marbella beach club outfits",
    title: "Marbella Beach Club Outfits | SocialMall",
    description:
      "Shop Marbella beach club outfit inspiration with resort shirts, dresses, and statement accessories.",
    introCopy: [
      "Shop Marbella beach club outfits with breezy resort layers, sun-ready textures, and accessories that still feel elevated.",
      "The page brings together polished holiday pieces for poolside lunches, beach clubs, and warm evening plans.",
    ],
    whatToExplore:
      "What to explore: resort shirts, summer dresses, relaxed tailoring, and refined bags.",
    kind: "trend",
    relatedSlugs: ["quiet-luxury-summer-outfits", "black-linen-shirts"],
    pageType: "trend",
  }),
  defineSeoCollectionPage({
    slug: "scandinavian-minimal-outfits",
    searchQuery: "scandinavian minimal outfits",
    title: "Scandinavian Minimal Outfits | SocialMall",
    description:
      "Find Scandinavian minimal outfits with clean silhouettes, tonal palettes, and premium everyday staples.",
    introCopy: [
      "Explore Scandinavian minimal outfits with clean silhouettes, calm colours, and effortless wardrobe staples.",
      "This edit focuses on quiet pieces that layer well and keep everyday dressing polished.",
    ],
    whatToExplore:
      "What to explore: tonal basics, structured layers, minimal footwear, and clean accessories.",
    kind: "aesthetic",
    relatedSlugs: ["quiet-luxury-outfits", "black-linen-shirts"],
    pageType: "trend",
  }),
];

const configuredLongTailCollections: SeoCollectionPage[] =
  longTailSeoPageDefinitions.map((definition) =>
    defineSeoCollectionPage({
      slug: definition.slug,
      searchQuery: definition.searchQuery,
      title: definition.title,
      description: definition.description,
      introCopy: definition.introCopy,
      whatToExplore: definition.whatToExplore,
      kind: definition.pageType === "trend" ? "trend" : "long-tail",
      relatedSlugs: definition.relatedSlugs,
      pageType: definition.pageType,
    }),
  );

const buildCollectionFromQuery = (
  query: string,
  kind: SeoCollectionKind,
): SeoCollectionPage => {
  const normalizedQuery = sanitizeSeoKeyword(query);
  const slug = seoSlugFromQuery(normalizedQuery);
  return {
    slug,
    query: normalizedQuery,
    searchQuery: normalizedQuery,
    kind,
    relatedSlugs: [],
    pageType: pageTypeFromKind(kind),
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
  const normalizedQueries = new Set<string>();
  const slugs = new Set<string>();
  collections.forEach((collection) => {
    const normalizedQuery = normalizeQuery(collection.query);
    if (normalizedQueries.has(normalizedQuery) || slugs.has(collection.slug)) {
      return;
    }
    collectionMap.set(collection.slug, collection);
    normalizedQueries.add(normalizedQuery);
    slugs.add(collection.slug);
  });
  return Array.from(collectionMap.values());
};

export const seoCollectionPages = dedupeCollections([
  ...configuredLongTailCollections,
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
    collectionPathFromSlug(collection.slug),
  ]),
);
const collectionByNormalizedQuery = new Map(
  seoCollectionPages.map((collection) => [normalizeQuery(collection.query), collection] as const),
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
    const configuredRelatedQueries = collection.relatedSlugs
      .map((slug) => collectionBySlug.get(slug)?.query)
      .filter((query): query is string => Boolean(query));
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

    return [
      collection.slug,
      Array.from(new Set([...configuredRelatedQueries, ...related])).slice(0, 8),
    ] as const;
  }),
);

export const getSeoCollectionBySlug = (slug: string) => collectionBySlug.get(slug) ?? null;

export const getSeoCollectionPaths = () =>
  seoCollectionPages.map((collection) => collectionPathFromSlug(collection.slug));

export const getRootSeoCollectionPaths = () =>
  seoCollectionPages.map((collection) => `/${collection.slug}`);

export const getCollectionPathByQuery = (query: string) =>
  collectionPathByQuery.get(sanitizeSeoKeyword(query)) ?? null;

export const getSeoCollectionByQuery = (query: string) =>
  collectionByNormalizedQuery.get(sanitizeSeoKeyword(query)) ?? null;

export const getRelatedCollectionQueries = (
  collectionLookup: { slug?: string; query?: string },
  limit = 6,
) => {
  const slugFromLookup =
    collectionLookup.slug ??
    (collectionLookup.query ? getCollectionPathByQuery(collectionLookup.query) : null)
      ?.split("/")
      .filter(Boolean)
      .at(-1);
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
