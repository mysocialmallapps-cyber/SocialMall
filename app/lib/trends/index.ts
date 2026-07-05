import { generateBrandSlug } from "@/lib/brands";
import { productCatalog, type Product } from "@/lib/products";

export type TrendPage = {
  slug: string;
  name: string;
  query: string;
  description: string;
  introCopy?: string[];
  whatToExplore?: string;
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
    introCopy: [
      "Discover quiet luxury outfits from independent fashion brands, curated around minimal silhouettes, neutral tones, and elevated everyday pieces.",
      "The mood is understated and polished, with wardrobe staples that feel premium without relying on obvious logos.",
    ],
    whatToExplore:
      "What to explore: soft tailoring, tonal basics, structured layers, and refined accessories.",
    keywords: ["quiet luxury", "minimalist", "classy", "tailored"],
  },
  {
    name: "Old Money",
    query: "old money aesthetic outfits",
    description:
      "Explore old money-inspired outfits with timeless tailoring, premium materials, and polished layering.",
    introCopy: [
      "Explore old money-inspired outfits with timeless tailoring, refined materials, and polished pieces that feel classic rather than costume-like.",
      "This edit is built around calm colours, smart layers, and elevated wardrobe foundations.",
    ],
    whatToExplore:
      "What to explore: blazers, premium shirts, tailored trousers, and elegant footwear.",
    keywords: ["old money", "classy", "elegant", "formal", "tailored"],
  },
  {
    name: "Clean Girl",
    query: "clean girl outfits",
    description:
      "Shop clean girl fashion with minimalist silhouettes, neutral palettes, and effortless everyday styling.",
    introCopy: [
      "Shop clean girl fashion with minimalist silhouettes, neutral palettes, and effortless pieces designed for everyday wear.",
      "The edit keeps styling simple and fresh, with polished basics that feel easy to repeat.",
    ],
    whatToExplore:
      "What to explore: tonal layers, simple dresses, soft knits, and clean accessories.",
    keywords: ["clean", "minimalist", "casual", "smart casual"],
  },
  {
    name: "Scandinavian Minimal",
    query: "scandinavian minimal outfits",
    description:
      "Explore minimalist Scandinavian-inspired fashion with clean lines and premium essentials.",
    introCopy: [
      "Explore Scandinavian minimal fashion with clean lines, calm colours, and effortless wardrobe staples.",
      "This page highlights refined basics, soft tailoring, and understated pieces that work across seasons.",
    ],
    whatToExplore:
      "What to explore: structured basics, tonal layers, minimal footwear, and modern outerwear.",
    keywords: ["scandinavian minimal", "minimalist", "clean", "quiet luxury"],
  },
  {
    name: "Coastal Granddaughter",
    query: "coastal granddaughter outfits",
    description:
      "Discover coastal granddaughter style with relaxed resort layers, soft textures, and breezy summer pieces.",
    introCopy: [
      "Discover coastal granddaughter style with relaxed resort layers, soft textures, and breezy pieces made for slow summer dressing.",
      "The mood is easy and nostalgic while still feeling modern, polished, and wearable.",
    ],
    whatToExplore:
      "What to explore: linen layers, relaxed shirts, soft knits, and beach-to-city accessories.",
    keywords: ["coastal granddaughter", "resort", "holiday", "beach club", "summer"],
  },
  {
    name: "Marbella Beach Club",
    query: "marbella beach club outfits",
    description:
      "Discover Marbella beach club outfits with resort textures, elevated swim-ready layers, and warm-weather accessories.",
    introCopy: [
      "Discover Marbella beach club outfits with resort textures, elevated swim-ready layers, and warm-weather accessories.",
      "The edit moves easily from poolside afternoons to sunset drinks, keeping holiday style polished but relaxed.",
    ],
    whatToExplore:
      "What to explore: resort shirts, summer dresses, refined sandals, and statement bags.",
    keywords: ["marbella", "beach club", "resort", "holiday", "summer"],
  },
  {
    name: "Ibiza Sunset Dinner",
    query: "ibiza sunset dinner outfits",
    description:
      "Shop Ibiza sunset dinner outfits with statement vacation silhouettes and elevated evening textures.",
    introCopy: [
      "Shop Ibiza sunset dinner outfits with statement vacation silhouettes, refined evening textures, and warm-night styling.",
      "This page balances expressive resort pieces with wearable details for dinners, parties, and late summer plans.",
    ],
    whatToExplore:
      "What to explore: evening dresses, relaxed shirts, metallic accents, and elevated footwear.",
    keywords: ["ibiza", "sunset", "dinner", "resort", "party", "holiday"],
  },
  {
    name: "Ibiza Sunset Fashion",
    query: "ibiza sunset fashion",
    description:
      "Shop Ibiza sunset fashion with statement resort looks, elevated evening textures, and vacation-ready edits.",
    introCopy: [
      "Shop Ibiza sunset fashion with statement resort looks, elevated evening textures, and vacation-ready pieces.",
      "The edit is designed for warm evenings, beach clubs, and relaxed dinners where styling can feel more expressive.",
    ],
    whatToExplore:
      "What to explore: resort dresses, relaxed tailoring, bold accessories, and summer footwear.",
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
    introCopy: [
      `Explore ${aesthetic} outfits curated from independent fashion brands and trend-led labels.`,
      "The edit uses product tags and styling context to surface pieces that feel relevant, wearable, and visually cohesive.",
    ],
    whatToExplore: "What to explore: matching staples, seasonal layers, and complementary accessories.",
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
