export type SearchSeoPage = {
  slug: string;
  query: string;
  title: string;
  description: string;
};

const normalizeSearchQuery = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const slugFromQuery = (query: string) =>
  normalizeSearchQuery(query)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const defineSearchSeoPage = ({
  slug,
  query,
  title,
  description,
}: {
  slug?: string;
  query: string;
  title: string;
  description: string;
}): SearchSeoPage => ({
  slug: slug ?? slugFromQuery(query),
  query: normalizeSearchQuery(query),
  title,
  description,
});

export const searchSeoPages = [
  defineSearchSeoPage({
    slug: "black-hoodies-under-20",
    query: "black hoodie under 20",
    title: "Black Hoodies Under 20 | SocialMall",
    description:
      "Search verified black hoodie product pages under 20, with close matches clearly separated from similar styles.",
  }),
  defineSearchSeoPage({
    slug: "black-tshirts-under-20",
    query: "black tshirt under 20",
    title: "Black T-Shirts Under 20 | SocialMall",
    description:
      "Browse verified black T-shirt product pages under 20 with live retailer images, prices, and product links where available.",
  }),
  defineSearchSeoPage({
    slug: "adidas-hoodies-under-50",
    query: "adidas hoodie under 50",
    title: "Adidas Hoodies Under 50 | SocialMall",
    description:
      "Find Adidas hoodie matches under 50 and see when SocialMall is showing exact products, close matches, or similar styles.",
  }),
  defineSearchSeoPage({
    slug: "white-linen-shirts",
    query: "white linen shirt",
    title: "White Linen Shirts | SocialMall",
    description:
      "Discover white linen shirt results with product confidence labels, verified retailer links, and related fashion searches.",
  }),
  defineSearchSeoPage({
    slug: "wedding-guest-dresses",
    query: "wedding guest dress",
    title: "Wedding Guest Dresses | SocialMall",
    description:
      "Explore wedding guest dress results from verified feeds and curated fashion edits, with clear product-page trust labels.",
  }),
  defineSearchSeoPage({
    slug: "black-party-dresses-under-50",
    query: "black party dress under 50",
    title: "Black Party Dresses Under 50 | SocialMall",
    description:
      "Search black party dress options under 50 and compare exact product matches against broader similar styles.",
  }),
  defineSearchSeoPage({
    slug: "quiet-luxury-trousers",
    query: "quiet luxury trousers",
    title: "Quiet Luxury Trousers | SocialMall",
    description:
      "Browse quiet luxury trouser results with confidence labels, verified product links, and related minimalist styling pages.",
  }),
  defineSearchSeoPage({
    slug: "oversized-blazers",
    query: "oversized blazer",
    title: "Oversized Blazers | SocialMall",
    description:
      "Find oversized blazer product results and see which cards are verified retailer products versus style references.",
  }),
  defineSearchSeoPage({
    slug: "minimalist-trainers",
    query: "minimalist trainers",
    title: "Minimalist Trainers | SocialMall",
    description:
      "Search minimalist trainers with SocialMall result confidence, retailer feed products, and related clean outfit pages.",
  }),
  defineSearchSeoPage({
    slug: "smart-casual-outfits-men",
    query: "smart casual outfits men",
    title: "Smart Casual Outfits Men | SocialMall",
    description:
      "Explore smart casual outfits for men using search-led fashion results, verified product cards, and useful related pages.",
  }),
  defineSearchSeoPage({
    slug: "summer-dresses-under-50",
    query: "summer dress under 50",
    title: "Summer Dresses Under 50 | SocialMall",
    description:
      "Find summer dress results under 50 with verified product-page links where available and clear fallback labels.",
  }),
  defineSearchSeoPage({
    slug: "denim-jeans-under-50",
    query: "denim jeans under 50",
    title: "Denim Jeans Under 50 | SocialMall",
    description:
      "Browse denim jeans under 50 with product confidence labels, retailer feed data, and related fashion search links.",
  }),
];

const searchSeoPageBySlug = new Map(
  searchSeoPages.map((page) => [page.slug, page] as const),
);

const searchSeoPathByQuery = new Map(
  searchSeoPages.map((page) => [normalizeSearchQuery(page.query), `/shop/${page.slug}`] as const),
);

export const getSearchSeoPageBySlug = (slug: string) =>
  searchSeoPageBySlug.get(slug) ?? null;

export const getSearchSeoPaths = () => searchSeoPages.map((page) => `/shop/${page.slug}`);

export const getSearchSeoPathByQuery = (query: string) =>
  searchSeoPathByQuery.get(normalizeSearchQuery(query)) ?? null;

