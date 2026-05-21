import { generateBrandSlug } from "@/lib/brands";
import { productCatalog, type Product } from "@/lib/products";

export type TrendPage = {
  slug: string;
  name: string;
  query: string;
  description: string;
  keywords: string[];
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const sanitize = (value: string) => normalize(value).replace(/[^a-z0-9\s-]/g, "").trim();
const slugify = (value: string) => generateBrandSlug(sanitize(value));

const baseTrendSeeds: Omit<TrendPage, "slug">[] = [
  {
    name: "Quiet Luxury",
    query: "quiet luxury outfits",
    description:
      "Discover quiet luxury outfits from independent fashion brands with elevated tailoring and refined textures.",
    keywords: ["quiet luxury", "minimalist", "classy", "tailored"],
  },
  {
    name: "Old Money",
    query: "old money aesthetic outfits",
    description:
      "Explore old money-inspired outfits with timeless tailoring, premium materials, and polished layering.",
    keywords: ["old money", "classy", "elegant", "formal", "tailored"],
  },
  {
    name: "Clean Girl",
    query: "clean girl outfits",
    description:
      "Shop clean girl fashion with minimalist silhouettes, neutral palettes, and effortless everyday styling.",
    keywords: ["clean", "minimalist", "casual", "smart casual"],
  },
  {
    name: "Scandinavian Minimal",
    query: "scandinavian minimal outfits",
    description:
      "Explore minimalist Scandinavian-inspired fashion with clean lines and premium essentials.",
    keywords: ["scandinavian minimal", "minimalist", "clean", "quiet luxury"],
  },
  {
    name: "Coastal Granddaughter",
    query: "coastal granddaughter outfits",
    description:
      "Discover coastal granddaughter style with relaxed resort layers, soft textures, and breezy summer pieces.",
    keywords: ["coastal granddaughter", "resort", "holiday", "beach club", "summer"],
  },
  {
    name: "Ibiza Sunset Fashion",
    query: "ibiza sunset fashion",
    description:
      "Shop Ibiza sunset fashion with statement resort looks, elevated evening textures, and vacation-ready edits.",
    keywords: ["ibiza", "sunset", "resort", "party", "dinner", "holiday"],
  },
];

const generatedAestheticTrends: Omit<TrendPage, "slug">[] = Object.entries(
  productCatalog.indexes.byAesthetic,
)
  .filter(([, products]) => products.length >= 6)
  .sort(([, left], [, right]) => right.length - left.length)
  .slice(0, 8)
  .map(([aesthetic]) => ({
    name: aesthetic
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    query: `${aesthetic} outfits`,
    description: `Explore ${aesthetic} outfits curated from independent fashion brands and trend-led labels.`,
    keywords: [aesthetic, "outfits"],
  }));

const dedupeTrends = (trends: Omit<TrendPage, "slug">[]) => {
  const map = new Map<string, TrendPage>();
  trends.forEach((trend) => {
    const slug = slugify(trend.name);
    if (map.has(slug)) {
      return;
    }
    map.set(slug, {
      ...trend,
      slug,
      query: sanitize(trend.query),
      keywords: Array.from(new Set(trend.keywords.map(sanitize))),
    });
  });
  return Array.from(map.values());
};

export const trendPages: TrendPage[] = dedupeTrends([
  ...baseTrendSeeds,
  ...generatedAestheticTrends,
]);

const trendBySlug = new Map(trendPages.map((trend) => [trend.slug, trend] as const));
const trendByNormalizedQuery = new Map(
  trendPages.map((trend) => [sanitize(trend.query), trend] as const),
);

const tokenize = (value: string) =>
  sanitize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const getTrendMatchScore = (trend: TrendPage, product: Product) => {
  const searchable = [
    product.category,
    product.subcategory,
    product.brand,
    ...product.vibe,
    ...product.style,
    ...product.occasion,
    ...product.season,
    ...product.fit,
    ...product.materials,
    ...product.colors,
  ].map(sanitize);

  let score = 0;
  trend.keywords.forEach((keyword) => {
    if (!keyword) {
      return;
    }
    if (searchable.some((value) => value.includes(keyword))) {
      score += keyword.includes(" ") ? 3 : 2;
    }
  });

  tokenize(trend.query).forEach((token) => {
    if (searchable.some((value) => value.includes(token))) {
      score += 1;
    }
  });

  return score;
};

export const getTrendProducts = (trendSlugOrQuery: string) => {
  const trend =
    getTrendBySlug(trendSlugOrQuery) ?? getTrendByQuery(trendSlugOrQuery) ?? null;
  if (!trend) {
    return [];
  }

  const scored = productCatalog.all
    .map((product) => ({
      product,
      score: getTrendMatchScore(trend, product),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }
      return right.product.popularityScore - left.product.popularityScore;
    });

  if (!scored.length) {
    return productCatalog.all.slice(0, 24);
  }

  return scored.slice(0, 36).map((entry) => entry.product);
};

const trendRelationships = new Map(
  trendPages.map((trend) => {
    const related = trendPages
      .filter((candidate) => candidate.slug !== trend.slug)
      .map((candidate) => {
        const overlap = candidate.keywords.filter((keyword) =>
          trend.keywords.includes(keyword),
        ).length;
        const sharedTokens = tokenize(candidate.query).filter((token) =>
          tokenize(trend.query).includes(token),
        ).length;
        return {
          candidate,
          score: overlap * 2 + sharedTokens,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map((entry) => entry.candidate);

    return [trend.slug, related] as const;
  }),
);

export const getTrendBySlug = (slug: string) => trendBySlug.get(sanitize(slug)) ?? null;

export const getTrendByQuery = (query: string) => trendByNormalizedQuery.get(sanitize(query)) ?? null;

const findClosestTrendByQuery = (query: string) => {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return null;
  }

  const scored = trendPages
    .map((trend) => {
      const trendTokens = Array.from(
        new Set([...tokenize(trend.query), ...trend.keywords.flatMap((keyword) => tokenize(keyword))]),
      );
      const score = queryTokens.filter((token) => trendTokens.includes(token)).length;
      return { trend, score };
    })
    .sort((left, right) => right.score - left.score);

  if (!scored[0] || scored[0].score === 0) {
    return null;
  }

  return scored[0].trend;
};

export const getTrendPaths = () => trendPages.map((trend) => `/trends/${trend.slug}`);

export const getTrendPathByQuery = (query: string) => {
  const matched = getTrendByQuery(query);
  if (!matched) {
    return null;
  }
  return `/trends/${matched.slug}`;
};

export const getRelatedTrends = (
  trendLookup: { slug?: string; query?: string },
  limit = 6,
) => {
  const baseTrend =
    (trendLookup.slug ? getTrendBySlug(trendLookup.slug) : null) ??
    (trendLookup.query ? getTrendByQuery(trendLookup.query) : null) ??
    (trendLookup.query ? findClosestTrendByQuery(trendLookup.query) : null);
  if (!baseTrend) {
    return [];
  }

  return (trendRelationships.get(baseTrend.slug) ?? []).slice(0, limit);
};

export const getRelatedTrendQueries = (
  trendLookup: { slug?: string; query?: string },
  limit = 6,
) => getRelatedTrends(trendLookup, limit).map((trend) => trend.query);
