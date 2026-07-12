export type SeoPageType = "trend" | "collection";

export type LongTailSeoPageDefinition = {
  slug: string;
  title: string;
  description: string;
  introCopy: string[];
  whatToExplore?: string;
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
    introCopy: [
      "Discover black linen shirts from independent fashion brands, curated around breathable fabrics, sharp silhouettes, and easy warm-weather styling.",
      "This edit focuses on versatile pieces that work across resort dressing, city weekends, and elevated everyday wardrobes.",
    ],
    whatToExplore:
      "What to explore: relaxed linen shirts, minimal black layers, and refined summer staples.",
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
    introCopy: [
      "Explore quiet luxury summer outfits built around minimal silhouettes, neutral tones, and polished pieces that still feel relaxed.",
      "The edit highlights breathable textures, soft tailoring, and premium-feeling essentials for warm-weather dressing.",
    ],
    whatToExplore:
      "What to explore: linen shirts, tonal trousers, understated dresses, and clean accessories.",
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
    introCopy: [
      "Discover old money style for men through tailored essentials, classic proportions, and refined materials that feel timeless rather than loud.",
      "This page brings together polished layers, smart casual staples, and understated pieces for a wardrobe with quiet confidence.",
    ],
    whatToExplore:
      "What to explore: tailored trousers, structured blazers, premium shirts, and neutral knitwear.",
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
      "Explore Marbella beach club outfits with resort shirts, breezy dresses, and statement accessories.",
    introCopy: [
      "Explore Marbella beach club outfits with resort textures, breezy silhouettes, and sun-ready pieces that move easily from poolside to dinner.",
      "The selection keeps the mood elevated and wearable, pairing relaxed summer staples with polished accessories.",
    ],
    whatToExplore:
      "What to explore: linen shirts, resort dresses, refined sandals, and statement bags.",
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
      "Explore Ibiza sunset dinner outfits with statement resort looks, refined evening pieces, and vacation-ready accessories.",
    introCopy: [
      "Explore Ibiza sunset dinner outfits with expressive resort pieces, refined evening textures, and silhouettes made for warm nights.",
      "This edit balances statement styling with wearable details, so vacation dressing still feels curated and premium.",
    ],
    whatToExplore:
      "What to explore: evening dresses, relaxed shirts, metallic accents, and elevated footwear.",
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
    introCopy: [
      "Explore Scandinavian minimal fashion with clean lines, calm colours, and effortless wardrobe staples that feel considered without being overdone.",
      "The page focuses on crisp basics, soft tailoring, and understated pieces that can anchor a modern capsule wardrobe.",
    ],
    whatToExplore:
      "What to explore: tonal basics, tailored layers, minimal footwear, and structured outerwear.",
    searchQuery: "scandinavian minimal outfits",
    relatedSlugs: [
      "quiet-luxury-outfits",
      "quiet-luxury-summer-outfits",
      "black-linen-shirts",
    ],
    pageType: "trend",
  },
];
