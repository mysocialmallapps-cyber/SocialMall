import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://social-mall.vercel.app";
const SITE_NAME = "SocialMall";
const DEFAULT_TITLE = "SocialMall | Discover Independent Fashion";
const DEFAULT_DESCRIPTION =
  "Discover curated outfits, styles, and brands from independent fashion labels.";
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og/socialmall-default-share.jpg`;

const pluralizedQueryWords: Record<string, string> = {
  tshirt: "tshirts",
  "t-shirt": "t-shirts",
  tee: "tees",
  shirt: "shirts",
  hoodie: "hoodies",
  trouser: "trousers",
  trousers: "trousers",
  jeans: "jeans",
  dress: "dresses",
  blazer: "blazers",
  outfit: "outfits",
  sandal: "sandals",
  sandals: "sandals",
  shoe: "shoes",
  shoes: "shoes",
  sneaker: "sneakers",
  sneakers: "sneakers",
  bag: "bags",
  jewellery: "jewellery",
};

export type MetadataPageType = "home" | "search" | "collection";
export type MetadataCollectionKind = "aesthetic" | "category" | "trend" | "long-tail";

export type MetadataTemplateOptions = {
  pageType?: MetadataPageType;
  collectionKind?: MetadataCollectionKind;
  canonicalPath?: string;
  title?: string;
  description?: string;
};

export const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const buildSeoPhrase = (query: string) => {
  const normalized = normalize(query);
  if (!normalized) return "";

  const words = normalized.split(" ");
  for (let index = words.length - 1; index >= 0; index -= 1) {
    const replacement = pluralizedQueryWords[words[index]];
    if (replacement) {
      words[index] = replacement;
      break;
    }
  }

  return words.join(" ");
};

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const pickTemplateVariant = (query: string, variants: string[]) => {
  if (!variants.length) {
    return "";
  }
  const variantIndex = hashString(query) % variants.length;
  return variants[variantIndex];
};

const buildDescriptionFromTemplate = ({
  query,
  pageType,
  collectionKind,
}: {
  query: string;
  pageType: MetadataPageType;
  collectionKind?: MetadataCollectionKind;
}) => {
  if (!query) {
    return DEFAULT_DESCRIPTION;
  }

  const variantsByKind: Record<MetadataCollectionKind, string[]> = {
    aesthetic: [
      `Discover ${query} from independent fashion brands and premium labels.`,
      `Explore ${query} with curated looks from modern independent fashion labels.`,
      `Explore ${query} edits featuring elevated staples and contemporary silhouettes.`,
    ],
    category: [
      `Browse ${query} with curated cuts, fabrics, and styling-led product picks.`,
      `Discover ${query} from independent labels with refined fit and material options.`,
      `Explore ${query} built around premium essentials and trend-aware styling.`,
    ],
    trend: [
      `Explore ${query} with trend-led edits from independent fashion brands.`,
      `Explore ${query} looks curated for modern styling and elevated wardrobe building.`,
      `Discover ${query} featuring seasonal picks from independent labels.`,
    ],
    "long-tail": [
      `Discover ${query} with focused style edits from independent fashion brands.`,
      `Browse ${query} for targeted outfit inspiration and curated product picks.`,
      `Explore ${query} with relevant cuts, materials, and fashion-forward combinations.`,
    ],
  };

  const defaultSearchVariants = [
    `Discover ${query} from independent fashion brands.`,
    `Explore ${query} curated from independent labels and emerging fashion brands.`,
    `Explore ${query} with premium edits and modern outfit inspiration.`,
  ];

  const variants =
    pageType === "collection"
      ? variantsByKind[collectionKind ?? "long-tail"]
      : defaultSearchVariants;
  return pickTemplateVariant(query, variants);
};

const resolveAbsoluteUrl = (pathOrQuery?: string) => {
  if (!pathOrQuery) {
    return SITE_URL;
  }

  if (/^https?:\/\//i.test(pathOrQuery)) {
    return pathOrQuery;
  }

  const normalizedPath = pathOrQuery.startsWith("/") ? pathOrQuery : `/${pathOrQuery}`;
  return `${SITE_URL}${normalizedPath}`;
};

export const buildTemplatedMetadata = (
  query: string,
  options: MetadataTemplateOptions = {},
): Metadata => {
  const pageType = options.pageType ?? "search";
  const seoPhrase = buildSeoPhrase(query);
  const canonicalPath =
    options.canonicalPath ??
    (seoPhrase ? `/?q=${encodeURIComponent(seoPhrase)}` : "/");
  const canonicalUrl = resolveAbsoluteUrl(canonicalPath);
  const resolvedTitle =
    options.title ?? (seoPhrase ? `${toTitleCase(seoPhrase)} | ${SITE_NAME}` : DEFAULT_TITLE);
  const resolvedDescription =
    options.description ??
    buildDescriptionFromTemplate({
      query: seoPhrase,
      pageType,
      collectionKind: options.collectionKind,
    });

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      type: "website",
      siteName: SITE_NAME,
      url: canonicalUrl,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
};

export const getMetadataDefaults = () => ({
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  socialImage: DEFAULT_SOCIAL_IMAGE,
});
