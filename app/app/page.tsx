import type { Metadata } from "next";
import HomeClient from "./home-client";

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

type SearchParamValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamValue>;
type MetadataProps = {
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>;
};

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const buildSeoPhrase = (query: string) => {
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

const buildSearchMetadata = (query: string): Metadata => {
  const seoPhrase = buildSeoPhrase(query);
  if (!seoPhrase) {
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

  const title = `${toTitleCase(seoPhrase)} | SocialMall`;
  const description = seoPhrase.includes("outfit")
    ? `Explore ${seoPhrase} curated from indie fashion brands.`
    : `Discover ${seoPhrase} from independent fashion brands.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
};

const getSearchQueryFromParams = async (
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>,
) => {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  const rawQuery = resolved.q;
  const queryValue = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  return (queryValue ?? "").trim();
};

export async function generateMetadata({
  searchParams,
}: MetadataProps): Promise<Metadata> {
  const query = await getSearchQueryFromParams(searchParams);
  return buildSearchMetadata(query);
}

type PageProps = {
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>;
};

export default async function Page({ searchParams }: PageProps) {
  const initialQuery = await getSearchQueryFromParams(searchParams);
  return <HomeClient initialQuery={initialQuery} />;
}
