import type { Product } from "@/lib/products";
import type { SeoCollectionKind } from "@/lib/collections";
import { toTitleCase } from "./search-metadata";

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const ensureSentence = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const splitSentences = (value: string) =>
  value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => ensureSentence(sentence))
    .filter(Boolean);

const getMostFrequent = (values: string[]) => {
  if (!values.length) {
    return null;
  }

  const counts = values.reduce<Record<string, number>>((map, value) => {
    map[value] = (map[value] ?? 0) + 1;
    return map;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
};

const pickLeadTemplate = (query: string, kind: SeoCollectionKind) => {
  switch (kind) {
    case "aesthetic":
      return `Discover ${query} from independent fashion brands.`;
    case "category":
      return `Explore ${query} curated with premium staples and directional silhouettes.`;
    case "trend":
      return `Shop ${query} with trend-led edits from independent labels.`;
    case "long-tail":
      return `Browse ${query} with focused product edits built for specific style intent.`;
    default:
      return `Discover ${query} curated from independent fashion brands.`;
  }
};

const pickContextSentence = ({
  topProducts,
}: {
  topProducts: Product[];
}) => {
  if (!topProducts.length) {
    return "";
  }

  const topVibe = getMostFrequent(
    topProducts.flatMap((product) => product.vibe).map((vibe) => normalize(vibe)),
  );
  const topSeason = getMostFrequent(
    topProducts.flatMap((product) => product.season).map((season) => normalize(season)),
  );
  const topBrands = Array.from(
    new Set(topProducts.slice(0, 8).map((product) => product.brand)),
  ).slice(0, 2);

  if (topVibe && topSeason) {
    return ensureSentence(
      `Explore ${topVibe} pieces designed for ${topSeason} dressing, featuring edits from ${topBrands.join(
        " and ",
      )}`,
    );
  }

  if (topVibe) {
    return ensureSentence(
      `Expect ${topVibe} styling with clean lines and elevated textures across curated labels`,
    );
  }

  if (topBrands.length) {
    return ensureSentence(`Featuring independent edits from ${topBrands.join(" and ")}`);
  }

  return "";
};

export const buildCollectionIntroCopy = ({
  query,
  kind,
  collectionTitle,
  collectionDescription,
  configuredIntroCopy,
  whatToExplore,
  topProducts,
}: {
  query: string;
  kind: SeoCollectionKind;
  collectionTitle?: string;
  collectionDescription?: string;
  configuredIntroCopy?: string[];
  whatToExplore?: string;
  topProducts: Product[];
}) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return null;
  }

  const headline = collectionTitle
    ? collectionTitle.replace(/\s+\|\s+SocialMall$/i, "").trim()
    : toTitleCase(normalizedQuery);
  const fallbackLead = collectionDescription || pickLeadTemplate(normalizedQuery, kind);
  const configuredSentences = configuredIntroCopy?.flatMap(splitSentences) ?? [];
  const leadSentences = configuredSentences.length
    ? configuredSentences
    : splitSentences(fallbackLead);
  const supporting = pickContextSentence({
    topProducts,
  });
  const sentences = Array.from(
    new Set([...leadSentences, supporting].map(ensureSentence).filter(Boolean)),
  ).slice(0, 4);

  return {
    eyebrow: "Collection overview",
    headline,
    sentences: sentences.length ? sentences : [ensureSentence(fallbackLead)],
    whatToExplore: whatToExplore ? ensureSentence(whatToExplore) : "",
  };
};
