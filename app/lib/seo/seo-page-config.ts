export type SeoPageType = "trend" | "collection";

export type LongTailSeoPageDefinition = {
  slug: string;
  title: string;
  description: string;
  searchQuery: string;
  relatedSlugs: string[];
  pageType: SeoPageType;
};

export const longTailSeoPageDefinitions: LongTailSeoPageDefinition[] = [
  {
    slug: "black-linen-shirts",
    title: "Black Linen Shirts | SocialMall",
    description:
      "Discover black linen shirts and warm-weather tailoring from independent fashion brands.",
    searchQuery: "black linen shirts",
    relatedSlugs: [
      "black-linen-shirts-men",
      "quiet-luxury-summer-outfits",
      "scandinavian-minimal-outfits",
    ],
    pageType: "collection",
  },
  {
    slug: "quiet-luxury-summer-outfits",
    title: "Quiet Luxury Summer Outfits | SocialMall",
    description:
      "Explore quiet luxury summer outfits with refined linen, clean tailoring, and elevated resort staples.",
    searchQuery: "quiet luxury summer outfits",
    relatedSlugs: [
      "quiet-luxury-outfits",
      "scandinavian-minimal-outfits",
      "black-linen-shirts",
    ],
    pageType: "trend",
  },
  {
    slug: "old-money-style-men",
    title: "Old Money Style Men | SocialMall",
    description:
      "Discover old money style for men with tailored essentials, premium knits, and polished layers.",
    searchQuery: "old money style men",
    relatedSlugs: [
      "old-money-aesthetic-outfits",
      "quiet-luxury-outfits",
      "scandinavian-minimal-outfits",
    ],
    pageType: "trend",
  },
  {
    slug: "marbella-beach-club-outfits",
    title: "Marbella Beach Club Outfits | SocialMall",
    description:
      "Shop Marbella beach club outfits with resort shirts, breezy dresses, and statement accessories.",
    searchQuery: "marbella beach club outfits",
    relatedSlugs: [
      "ibiza-sunset-dinner-outfits",
      "quiet-luxury-summer-outfits",
      "black-linen-shirts",
    ],
    pageType: "trend",
  },
  {
    slug: "ibiza-sunset-dinner-outfits",
    title: "Ibiza Sunset Dinner Outfits | SocialMall",
    description:
      "Shop Ibiza sunset dinner outfits with statement resort looks, refined evening pieces, and vacation-ready accessories.",
    searchQuery: "ibiza sunset dinner outfits",
    relatedSlugs: [
      "marbella-beach-club-outfits",
      "quiet-luxury-summer-outfits",
      "scandinavian-minimal-outfits",
    ],
    pageType: "trend",
  },
  {
    slug: "scandinavian-minimal-outfits",
    title: "Scandinavian Minimal Outfits | SocialMall",
    description:
      "Find Scandinavian minimal outfits with clean silhouettes, tonal palettes, and premium everyday staples.",
    searchQuery: "scandinavian minimal outfits",
    relatedSlugs: [
      "quiet-luxury-outfits",
      "quiet-luxury-summer-outfits",
      "black-linen-shirts",
    ],
    pageType: "trend",
  },
];
