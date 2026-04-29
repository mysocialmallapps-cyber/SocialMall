"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const suggestions = [
  "quiet luxury",
  "Marbella beach club outfit",
  "black oversized hoodie",
  "summer outfit under €200",
];

type Product = {
  id: number;
  brand: string;
  name: string;
  price: number;
  image: string;
  category: string;
  color: string;
  material: string;
  styleTags: string[];
  vibeTags: string[];
};

type QueryIntent = {
  words: string[];
  colors: string[];
  materials: string[];
  categories: string[];
  vibes: string[];
  maxPrice: number | null;
  sortCheapest: boolean;
  explicitJewellery: boolean;
  clothingMaterialIntent: boolean;
};

type FilterResult = {
  items: Product[];
  showFallbackNotice: boolean;
};

const colorKeywords: Record<string, string[]> = {
  black: ["black"],
  white: ["white"],
  beige: ["beige", "sand"],
  blue: ["blue", "navy"],
  red: ["red", "burgundy"],
};

const materialKeywords: Record<string, string[]> = {
  linen: ["linen"],
  cotton: ["cotton"],
  leather: ["leather"],
  denim: ["denim"],
  wool: ["wool"],
};

const categoryKeywords: Record<string, string[]> = {
  shirt: ["shirt", "shirts"],
  trousers: ["trousers", "trouser", "pants"],
  hoodie: ["hoodie", "hoodies", "sweatshirt"],
  dress: ["dress", "dresses"],
  blazer: ["blazer", "blazers"],
  sandals: ["sandals", "sandal"],
  shoes: ["shoes", "shoe", "sneakers", "loafers"],
  bag: ["bag", "bags", "tote"],
  jewellery: ["jewellery", "jewelry"],
};

const vibeKeywords: Record<string, string[]> = {
  summer: ["summer"],
  marbella: ["marbella"],
  beach: ["beach", "beach club"],
  "quiet luxury": ["quiet luxury", "luxury"],
  casual: ["casual", "relaxed"],
  formal: ["formal"],
  minimal: ["minimal", "minimalist"],
  resort: ["resort"],
};

const clothingMaterials = new Set(["linen", "cotton", "denim", "wool"]);
const fillerWords = new Set([
  "under",
  "below",
  "less",
  "than",
  "euro",
  "euros",
  "look",
  "style",
  "styles",
  "outfit",
  "cheaper",
]);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsTerm = (query: string, term: string) => {
  if (term.includes(" ")) {
    return query.includes(term);
  }

  return new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(query);
};

const tokenizeQuery = (query: string) =>
  query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

const detectIntentValues = (
  query: string,
  dictionary: Record<string, string[]>,
) =>
  Object.entries(dictionary).reduce<string[]>((matches, [key, terms]) => {
    if (terms.some((term) => containsTerm(query, term))) {
      matches.push(key);
    }
    return matches;
  }, []);

const parseQueryIntent = (query: string): QueryIntent => {
  const normalizedQuery = query.toLowerCase();
  const allTokens = tokenizeQuery(query);
  const meaningfulWords = Array.from(
    new Set(
      allTokens.filter((word) => word.length > 2 && !fillerWords.has(word)),
    ),
  );

  const maxPriceMatch = normalizedQuery.match(
    /(?:under|below|less than)\s*(?:€|eur|euro)?\s*(\d{2,4})/i,
  );

  const categories = detectIntentValues(normalizedQuery, categoryKeywords);
  const materials = detectIntentValues(normalizedQuery, materialKeywords);

  return {
    words: meaningfulWords,
    colors: detectIntentValues(normalizedQuery, colorKeywords),
    materials,
    categories,
    vibes: detectIntentValues(normalizedQuery, vibeKeywords),
    maxPrice: maxPriceMatch ? Number.parseInt(maxPriceMatch[1], 10) : null,
    sortCheapest: containsTerm(normalizedQuery, "cheaper"),
    explicitJewellery: categories.includes("jewellery"),
    clothingMaterialIntent: materials.some((material) =>
      clothingMaterials.has(material),
    ),
  };
};

const scoreProduct = (product: Product, intent: QueryIntent) => {
  let score = 0;

  if (intent.categories.length) {
    if (intent.categories.includes(product.category)) {
      score += 4;
    } else {
      score -= 5;
    }
  }

  if (intent.materials.length && intent.materials.includes(product.material)) {
    score += 3;
  }

  if (intent.colors.length && intent.colors.includes(product.color)) {
    score += 3;
  }

  const vibeOrStyleMatches = intent.vibes.filter(
    (vibe) =>
      product.vibeTags.includes(vibe) || product.styleTags.includes(vibe),
  ).length;
  score += vibeOrStyleMatches * 2;

  const searchableText = `${product.name} ${product.brand}`.toLowerCase();
  intent.words.forEach((word) => {
    if (searchableText.includes(word)) {
      score += 1;
    }
  });

  return score;
};

const formatPrice = (amount: number) => {
  const hasDecimals = !Number.isInteger(amount);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
};

const getFilteredProducts = (
  query: string,
  items: Product[],
  fallbackItems: Product[],
): FilterResult => {
  const intent = parseQueryIntent(query);
  if (!query.trim()) {
    return { items, showFallbackNotice: false };
  }

  const applyHardFilters = (list: Product[]) => {
    let filtered = list;

    if (intent.maxPrice !== null) {
      filtered = filtered.filter((item) => item.price <= intent.maxPrice!);
    }

    if (intent.clothingMaterialIntent && !intent.explicitJewellery) {
      filtered = filtered.filter((item) => item.category !== "jewellery");
    }

    return filtered;
  };

  const fallbackPool = applyHardFilters(fallbackItems);
  const candidates = applyHardFilters(items);

  if (!candidates.length) {
    return { items: fallbackPool.length ? fallbackPool : fallbackItems, showFallbackNotice: true };
  }

  const ranked = candidates.map((item) => ({
    item,
    score: scoreProduct(item, intent),
  }));

  ranked.sort((a, b) => {
    if (intent.sortCheapest && a.item.price !== b.item.price) {
      return a.item.price - b.item.price;
    }

    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return a.item.price - b.item.price;
  });

  const strongMatches = ranked.filter(({ score }) => score >= 3);
  const hasPricingIntent = intent.maxPrice !== null || intent.sortCheapest;
  const hasStrongMatches = hasPricingIntent
    ? ranked.length > 0
    : strongMatches.length > 0;

  if (!hasStrongMatches) {
    return { items: fallbackPool.length ? fallbackPool : fallbackItems, showFallbackNotice: true };
  }

  return { items: ranked.map(({ item }) => item), showFallbackNotice: false };
};

const products: Product[] = [
  {
    id: 1,
    brand: "The Row",
    name: "Cashmere Blend Wide-Leg Trousers",
    price: 1190,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    category: "trousers",
    color: "black",
    material: "wool",
    styleTags: ["tailored", "minimal"],
    vibeTags: ["quiet luxury", "formal", "minimal"],
  },
  {
    id: 2,
    brand: "Jacquemus",
    name: "Le Chouchou Draped Linen Shirt",
    price: 520,
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    category: "shirt",
    color: "beige",
    material: "linen",
    styleTags: ["draped", "resort"],
    vibeTags: ["summer", "marbella", "resort"],
  },
  {
    id: 3,
    brand: "COS",
    name: "Relaxed Oversized Black Hoodie",
    price: 135,
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=80",
    category: "hoodie",
    color: "black",
    material: "cotton",
    styleTags: ["oversized", "streetwear"],
    vibeTags: ["casual", "minimal"],
  },
  {
    id: 4,
    brand: "Toteme",
    name: "Minimalist Structured Wool Blazer",
    price: 790,
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
    category: "blazer",
    color: "black",
    material: "wool",
    styleTags: ["structured", "tailored"],
    vibeTags: ["quiet luxury", "formal", "minimal"],
  },
  {
    id: 5,
    brand: "Aeyde",
    name: "Leather Slip-On Sandals",
    price: 280,
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
    category: "sandals",
    color: "beige",
    material: "leather",
    styleTags: ["minimal", "slip-on"],
    vibeTags: ["summer", "beach", "resort"],
  },
  {
    id: 6,
    brand: "Loulou Studio",
    name: "Silk Resort Shirt in Sand",
    price: 310,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    category: "shirt",
    color: "white",
    material: "cotton",
    styleTags: ["relaxed", "resort"],
    vibeTags: ["summer", "beach", "casual"],
  },
  {
    id: 7,
    brand: "Arket",
    name: "Linen Blend Summer Co-ord Set",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    category: "trousers",
    color: "blue",
    material: "denim",
    styleTags: ["co-ord", "relaxed"],
    vibeTags: ["summer", "casual", "minimal"],
  },
  {
    id: 8,
    brand: "Mango",
    name: "Open Knit Beach Club Dress",
    price: 89.99,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    category: "dress",
    color: "red",
    material: "cotton",
    styleTags: ["flowy", "beach club"],
    vibeTags: ["summer", "beach", "marbella", "resort"],
  },
  {
    id: 9,
    brand: "Demellier",
    name: "Minimal Leather Shoulder Bag",
    price: 360,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
    category: "bag",
    color: "white",
    material: "leather",
    styleTags: ["structured", "minimal"],
    vibeTags: ["quiet luxury", "formal", "minimal"],
  },
  {
    id: 10,
    brand: "Mejuri",
    name: "Gold Everyday Hoop Earrings",
    price: 110,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
    category: "jewellery",
    color: "beige",
    material: "leather",
    styleTags: ["delicate", "everyday"],
    vibeTags: ["minimal", "casual"],
  },
];

const fallbackTrendingProducts = products.slice(0, 8);

export default function Home() {
  const previewProducts = fallbackTrendingProducts.slice(0, 4);
  const [searchInput, setSearchInput] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [querySegments, setQuerySegments] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gridAnimationKey, setGridAnimationKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredResults = useMemo(
    () => getFilteredProducts(activeQuery, products, fallbackTrendingProducts),
    [activeQuery],
  );

  const runSearch = (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;

    setHasSearched(true);
    setCurrentQuery(query);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      setActiveQuery(query);
      setGridAnimationKey((currentKey) => currentKey + 1);
      setIsLoading(false);
    }, 500);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    setQuerySegments([query]);
    runSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    setQuerySegments([suggestion]);
    runSearch(suggestion);
  };

  const handleRefineSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const refinement = refineInput.trim();
    if (!refinement) return;

    const baseSegments = querySegments.length
      ? querySegments
      : currentQuery
        ? [currentQuery]
        : [];
    const nextSegments = [...baseSegments, refinement];
    const nextQuery = nextSegments.join(" ").trim();
    setQuerySegments(nextSegments);
    setRefineInput("");
    setSearchInput(nextQuery);
    runSearch(nextQuery);
  };

  const handleLogoClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSearchInput("");
    setRefineInput("");
    setActiveQuery("");
    setCurrentQuery("");
    setQuerySegments([]);
    setHasSearched(false);
    setIsLoading(false);
    setGridAnimationKey(0);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-7">
        <nav className="flex items-center">
          <button
            type="button"
            onClick={handleLogoClick}
            className="cursor-pointer text-[1.3rem] font-semibold tracking-tight text-[#111111] transition-opacity duration-200 hover:opacity-70"
            aria-label="Go to homepage"
          >
            SocialMall
          </button>
        </nav>
      </header>

      <main
        className={`mx-auto flex w-full max-w-6xl flex-col px-4 pt-10 sm:px-6 lg:px-8 lg:pt-12 ${
          hasSearched ? "gap-8 pb-44 lg:gap-10" : "gap-14 pb-16 lg:gap-16"
        }`}
      >
        {!hasSearched ? (
          <>
            <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
              <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Discover your next look
              </h1>
              <form
                className="w-full rounded-[2rem] border border-zinc-200 bg-white p-2.5 shadow-[0_24px_55px_-28px_rgba(0,0,0,0.35)]"
                onSubmit={handleSubmit}
              >
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Describe what you want… outfits, styles, brands"
                  className="h-[4.5rem] w-full rounded-[1.5rem] border border-zinc-200 bg-white px-6 text-[1.05rem] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:shadow-[0_0_0_3px_rgba(24,24,27,0.06)]"
                />
              </form>
              <div className="flex w-full flex-wrap items-center justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <p className="text-sm font-medium text-zinc-500">Trending now</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-10">
                {previewProducts.map((product) => (
                  <article
                    key={product.id}
                    className="group rounded-2xl transition duration-300 hover:scale-[1.02] hover:shadow-[0_22px_40px_-28px_rgba(0,0,0,0.45)]"
                  >
                    <div
                      className="aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                      style={{ backgroundImage: `url(${product.image})` }}
                      aria-label={product.name}
                      role="img"
                    />
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                        {product.brand}
                      </p>
                      <p className="truncate text-sm text-zinc-800">{product.name}</p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-6">
            <p className="text-sm text-zinc-500">
              {isLoading ? (
                "Updating results..."
              ) : (
                <>
                  Showing results for:{" "}
                  <span className="font-medium text-zinc-800">{activeQuery}</span>
                </>
              )}
            </p>
            {!isLoading && filteredResults.showFallbackNotice ? (
              <p className="text-sm text-zinc-500">
                No exact match — showing similar styles.
              </p>
            ) : null}

            <div
              key={gridAnimationKey}
              className={`animate-grid-fade-in grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity md:grid-cols-4 md:gap-x-6 md:gap-y-12 ${
                isLoading ? "opacity-70" : "opacity-100"
              }`}
            >
              {filteredResults.items.map((product) => (
                <article
                  key={product.id}
                  className="group rounded-2xl transition duration-300 hover:scale-[1.02] hover:shadow-[0_22px_40px_-28px_rgba(0,0,0,0.45)]"
                >
                  <div
                    className="aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                    style={{ backgroundImage: `url(${product.image})` }}
                    aria-label={product.name}
                    role="img"
                  />
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                      {product.brand}
                    </p>
                    <p className="truncate text-sm text-zinc-800">{product.name}</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {hasSearched ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200/80 bg-white/95 px-4 pb-5 pt-4 backdrop-blur-md sm:px-6">
          <form
            className="mx-auto w-full max-w-4xl rounded-[2.1rem] border border-zinc-200 bg-white px-3 py-3 shadow-[0_26px_55px_-28px_rgba(0,0,0,0.45)] transition duration-200 hover:shadow-[0_30px_64px_-30px_rgba(0,0,0,0.52)] focus-within:border-zinc-300 focus-within:shadow-[0_32px_70px_-34px_rgba(0,0,0,0.58)]"
            onSubmit={handleRefineSubmit}
          >
            <div className="flex items-center gap-3 rounded-[1.6rem] border border-zinc-200 bg-white px-4 transition focus-within:border-zinc-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-zinc-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6-4.6-1.9 4.6-1.9L12 3.5Z"
                  strokeLinejoin="round"
                />
                <path d="M18 14.5l.95 2.3 2.3.95-2.3.95L18 21l-.95-2.3-2.3-.95 2.3-.95L18 14.5Z" />
              </svg>
              <input
                type="text"
                value={refineInput}
                onChange={(event) => setRefineInput(event.target.value)}
                placeholder="Refine your look… try 'cheaper', 'black', 'more casual'"
                className="h-[4.5rem] w-full bg-transparent pr-2 text-[1.02rem] text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
