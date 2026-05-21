import type { Metadata } from "next";

const DEFAULT_TITLE = "SocialMall | Discover Independent Fashion";
const DEFAULT_DESCRIPTION =
  "Discover curated outfits, styles, and brands from independent fashion labels.";
const DEFAULT_SOCIAL_IMAGE =
  "https://socialmall.com/og/socialmall-default-share.jpg";

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

export const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const buildSeoPhrase = (query: string) => {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
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

type MetadataOverrides = {
  title?: string;
  description?: string;
  canonicalPath?: string;
};

export const buildSearchMetadata = (
  query: string,
  overrides: MetadataOverrides = {},
): Metadata => {
  const seoPhrase = buildSeoPhrase(query);
  const baseTitle = overrides.title ?? DEFAULT_TITLE;
  const baseDescription = overrides.description ?? DEFAULT_DESCRIPTION;

  if (!seoPhrase && !overrides.title && !overrides.description) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [DEFAULT_SOCIAL_IMAGE],
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        images: [DEFAULT_SOCIAL_IMAGE],
      },
    };
  }

  const title = overrides.title ?? `${toTitleCase(seoPhrase)} | SocialMall`;
  const description =
    overrides.description ??
    (seoPhrase.includes("outfit")
      ? `Explore ${seoPhrase} curated from indie fashion brands.`
      : `Discover ${seoPhrase} from independent fashion brands.`);

  return {
    title: seoPhrase ? title : baseTitle,
    description: seoPhrase ? description : baseDescription,
    alternates: overrides.canonicalPath
      ? { canonical: overrides.canonicalPath }
      : undefined,
    openGraph: {
      title: seoPhrase ? title : baseTitle,
      description: seoPhrase ? description : baseDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
      url: overrides.canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title: seoPhrase ? title : baseTitle,
      description: seoPhrase ? description : baseDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
};
