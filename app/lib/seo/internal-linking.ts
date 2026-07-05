import type { ChipEventType } from "@/lib/analytics";
import { extractUniqueProductTags, type Product } from "@/lib/products";

type LinkingIntent = {
  categories: string[];
  colors: string[];
  materials: string[];
  seasons: string[];
  vibes: string[];
  styles: string[];
  genders: string[];
};

type InternalLinkSectionDefinition = {
  key: string;
  title: string;
  chipType: ChipEventType;
  candidates: string[];
  limit: number;
  onlyCollectionLinks?: boolean;
};

export type InternalLinkItem = {
  query: string;
  href: string;
  chipType: ChipEventType;
};

export type InternalLinkSection = {
  key: string;
  title: string;
  chipType: ChipEventType;
  links: InternalLinkItem[];
};

export type SeoRelatedLinkItem = InternalLinkItem & {
  label: string;
  pageType: "trend" | "collection";
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const normalizePath = (value: string) => {
  const normalized = value.trim().replace(/\/+$/, "");
  return normalized || "/";
};

const toTitleCase = (value: string) =>
  normalize(value)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const toSearchHref = (
  query: string,
  resolveSeoPath: (query: string) => string | null,
) => {
  const normalizedQuery = normalize(query);
  const seoPath = resolveSeoPath(normalizedQuery);
  if (seoPath) {
    return seoPath;
  }
  return `/?q=${encodeURIComponent(normalizedQuery)}`;
};

const mapTagToAestheticPhrase = (tag: string) => {
  if (tag === "quiet luxury") return "quiet luxury outfits";
  if (tag === "minimalist" || tag === "clean") return "Scandinavian minimal outfits";
  if (tag === "marbella" || tag === "resort" || tag === "beach club") {
    return "Marbella beach club outfits";
  }
  if (tag === "elegant" || tag === "dinner" || tag === "party") {
    return "old money aesthetic outfits";
  }
  if (tag === "streetwear" || tag === "oversized") {
    return "oversized streetwear outfits";
  }
  if (tag === "smart casual") return "smart casual outfits";
  return null;
};

const pickUniqueLinks = ({
  candidates,
  limit,
  chipType,
  usedQueries,
  resolveSeoPath,
  onlyCollectionLinks = false,
}: {
  candidates: string[];
  limit: number;
  chipType: ChipEventType;
  usedQueries: Set<string>;
  resolveSeoPath: (query: string) => string | null;
  onlyCollectionLinks?: boolean;
}): InternalLinkItem[] => {
  const links: InternalLinkItem[] = [];

  for (const candidate of candidates) {
    const query = normalize(candidate);
    if (!query || usedQueries.has(query)) {
      continue;
    }

    const seoPath = resolveSeoPath(query);
    if (onlyCollectionLinks && !seoPath) {
      continue;
    }

    usedQueries.add(query);
    links.push({
      query,
      href: seoPath ?? toSearchHref(query, resolveSeoPath),
      chipType,
    });

    if (links.length >= limit) {
      break;
    }
  }

  return links;
};

export const buildInternalLinkSections = ({
  currentQuery,
  intent,
  topProducts,
  relatedCollectionQueries,
  relatedTrendQueries,
  resolveSeoPath,
}: {
  currentQuery: string;
  intent: LinkingIntent;
  topProducts: Product[];
  relatedCollectionQueries: string[];
  relatedTrendQueries: string[];
  resolveSeoPath: (query: string) => string | null;
}) => {
  const primaryCategory = intent.categories[0];
  const primaryColor = intent.colors[0];
  const primaryMaterial = intent.materials[0];
  const primarySeason = intent.seasons[0];
  const primaryGender = intent.genders[0];
  const topTags = extractUniqueProductTags(topProducts, [
    "vibe",
    "style",
    "occasion",
    "season",
    "materials",
    "colors",
  ]);
  const mappedAestheticPhrases = topTags.flatMap((tag) => {
    const mappedPhrase = mapTagToAestheticPhrase(tag);
    return mappedPhrase ? [mappedPhrase] : [];
  });
  const contextualCandidates = [
    primaryColor && primaryMaterial && primaryCategory
      ? `${primaryColor} ${primaryMaterial} ${primaryCategory}${primaryCategory.endsWith("s") ? "" : "s"}`
      : null,
    primarySeason && primaryCategory ? `${primarySeason} ${primaryCategory} outfits` : null,
    primaryGender && primaryCategory ? `${primaryCategory} outfits ${primaryGender}` : null,
    ...topProducts.slice(0, 6).flatMap((product) => [
      `${product.brand} ${product.category} outfits`,
      `${product.materials[0]} ${product.category} ${product.gender[0] ?? "unisex"}`,
    ]),
  ].filter((entry): entry is string => Boolean(entry));

  const sectionDefinitions: InternalLinkSectionDefinition[] = [
    {
      key: "related-searches",
      title: "Related searches",
      chipType: "related_search",
      candidates: [
        primaryColor && primaryCategory ? `${primaryColor} ${primaryCategory}` : "",
        primaryMaterial && primaryCategory ? `${primaryMaterial} ${primaryCategory}` : "",
        primarySeason && primaryCategory ? `${primarySeason} ${primaryCategory}` : "",
        ...topProducts.slice(0, 4).map((product) => `${product.brand} ${product.category}`),
        "quiet luxury outfits",
        "minimalist wardrobe staples",
      ],
      limit: 6,
    },
    {
      key: "similar-aesthetics",
      title: "Similar aesthetics",
      chipType: "trending_aesthetic",
      candidates: [
        ...mappedAestheticPhrases,
        ...intent.vibes.map((vibe) => `${vibe} outfits`),
        ...intent.styles.map((style) => `${style} outfits`),
        "Scandinavian minimal outfits",
        "old money aesthetic outfits",
        "quiet luxury summer outfits",
      ],
      limit: 5,
    },
    {
      key: "related-collections",
      title: "Related collections",
      chipType: "related_collection",
      candidates: relatedCollectionQueries,
      limit: 5,
      onlyCollectionLinks: true,
    },
    {
      key: "related-trends",
      title: "Related trends",
      chipType: "related_trend",
      candidates: relatedTrendQueries,
      limit: 4,
      onlyCollectionLinks: true,
    },
    {
      key: "contextual-links",
      title: "Contextual links",
      chipType: "contextual_link",
      candidates: contextualCandidates,
      limit: 5,
    },
  ];

  const usedQueries = new Set<string>([normalize(currentQuery)]);

  return sectionDefinitions
    .map<InternalLinkSection>((section) => ({
      key: section.key,
      title: section.title,
      chipType: section.chipType,
      links: pickUniqueLinks({
        candidates: section.candidates,
        chipType: section.chipType,
        limit: section.limit,
        usedQueries,
        resolveSeoPath,
        onlyCollectionLinks: section.onlyCollectionLinks,
      }),
    }))
    .filter((section) => section.links.length > 0);
};

export const buildSeoRelatedLinks = ({
  currentPath,
  currentQuery,
  relatedTrendQueries,
  relatedCollectionQueries,
  resolveTrendPath,
  resolveCollectionPath,
  limit = 8,
}: {
  currentPath: string;
  currentQuery: string;
  relatedTrendQueries: string[];
  relatedCollectionQueries: string[];
  resolveTrendPath: (query: string) => string | null;
  resolveCollectionPath: (query: string) => string | null;
  limit?: number;
}) => {
  const links: SeoRelatedLinkItem[] = [];
  const usedQueries = new Set<string>([normalize(currentQuery)]);
  const usedPaths = new Set<string>([normalizePath(currentPath)]);
  const trendCandidates = relatedTrendQueries.map((query) => ({
    query,
    pageType: "trend" as const,
    chipType: "related_trend" as const,
    href: resolveTrendPath(query),
  }));
  const collectionCandidates = relatedCollectionQueries.map((query) => ({
    query,
    pageType: "collection" as const,
    chipType: "related_collection" as const,
    href: resolveCollectionPath(query),
  }));
  const candidates: Array<
    (typeof trendCandidates)[number] | (typeof collectionCandidates)[number]
  > = [];

  for (let index = 0; index < Math.max(trendCandidates.length, collectionCandidates.length); index += 1) {
    const trendCandidate = trendCandidates[index];
    const collectionCandidate = collectionCandidates[index];
    if (trendCandidate) {
      candidates.push(trendCandidate);
    }
    if (collectionCandidate) {
      candidates.push(collectionCandidate);
    }
  }

  for (const candidate of candidates) {
    const query = normalize(candidate.query);
    if (!query || usedQueries.has(query) || !candidate.href) {
      continue;
    }

    const href = normalizePath(candidate.href);
    if (usedPaths.has(href)) {
      continue;
    }

    usedQueries.add(query);
    usedPaths.add(href);
    links.push({
      query,
      label: toTitleCase(query),
      href,
      chipType: candidate.chipType,
      pageType: candidate.pageType,
    });

    if (links.length >= limit) {
      break;
    }
  }

  return links;
};
