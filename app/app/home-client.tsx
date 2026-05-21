"use client";

import {
  FormEvent,
  MouseEvent,
  Suspense,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  trackChipClickEvent,
  trackProductClickEvent,
  trackSearchEvent,
  type SearchEventSource,
} from "@/lib/analytics";
import {
  PRODUCT_GRID_IMAGE_SIZES,
  getProductImageByIndex,
  getProductImageCandidates,
  shouldUseUnoptimizedImage,
} from "@/lib/images";
import {
  formatBrandName,
  getBrandAttribution,
  getBrandSearchTerms,
} from "@/lib/brands";
import { mockProducts, type Product } from "@/lib/products";

const suggestions = [
  "quiet luxury",
  "Marbella beach club outfit",
  "black oversized hoodie",
  "summer outfit under €200",
];

type QueryIntent = {
  words: string[];
  categories: string[];
  colors: string[];
  materials: string[];
  vibes: string[];
  styles: string[];
  occasions: string[];
  seasons: string[];
  genders: string[];
  fits: string[];
  brands: string[];
  exclusions: string[];
  onlyFilters: {
    categories: string[];
    colors: string[];
    materials: string[];
  };
  maxPrice: number | null;
  sortMode: "relevance" | "cheapest";
};

type FilterResult = {
  items: Product[];
  showFallbackNotice: boolean;
};

type ValidationResult = {
  query: string;
  passed: boolean;
  reason: string;
};

type ProductCardProps = {
  product: Product;
  href: LinkProps["href"];
  imageSizes: string;
  priority?: boolean;
  onProductClick?: (product: Product) => void;
};

const ProductCard = memo(function ProductCard({
  product,
  href,
  imageSizes,
  priority = false,
  onProductClick,
}: ProductCardProps) {
  const imageCandidates = useMemo(() => getProductImageCandidates(product), [product]);
  const brandAttribution = useMemo(
    () =>
      getBrandAttribution({
        brandName: product.brand,
        retailerName: product.retailer,
        existingSlug: product.brandSlug,
      }),
    [product.brand, product.brandSlug, product.retailer],
  );
  const [imageState, setImageState] = useState({
    productId: product.id,
    index: 0,
  });
  const imageIndex =
    imageState.productId === product.id ? imageState.index : 0;

  const activeImageSrc = useMemo(
    () => getProductImageByIndex(product, imageIndex),
    [imageIndex, product],
  );
  const useUnoptimizedImage = useMemo(
    () => shouldUseUnoptimizedImage(activeImageSrc),
    [activeImageSrc],
  );

  const handleImageError = () => {
    setImageState((currentState) => {
      const currentIndex =
        currentState.productId === product.id ? currentState.index : 0;
      return {
        productId: product.id,
        index: Math.min(currentIndex + 1, imageCandidates.length - 1),
      };
    });
  };

  return (
    <Link
      href={href}
      onClick={() => onProductClick?.(product)}
      className="group rounded-2xl transition duration-300 hover:scale-[1.02] hover:shadow-[0_22px_40px_-28px_rgba(0,0,0,0.45)]"
    >
      <article>
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100">
          <Image
            src={activeImageSrc}
            alt={product.name}
            fill
            sizes={imageSizes}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            unoptimized={useUnoptimizedImage}
            onError={handleImageError}
          />
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
            {brandAttribution.displayName}
            {brandAttribution.sourceLabel ? (
              <span className="normal-case tracking-normal text-zinc-400">
                {" "}
                via {brandAttribution.sourceLabel}
              </span>
            ) : null}
          </p>
          <p className="truncate text-sm text-zinc-800">{product.name}</p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </article>
    </Link>
  );
});

const colorKeywords: Record<string, string[]> = {
  black: ["black"],
  white: ["white"],
  beige: ["beige", "cream"],
  cream: ["cream", "off white", "offwhite"],
  brown: ["brown", "tan", "camel"],
  navy: ["navy"],
  blue: ["blue"],
  red: ["red", "burgundy"],
  green: ["green", "olive"],
  grey: ["grey", "gray", "charcoal"],
  pink: ["pink", "rose"],
};

const materialKeywords: Record<string, string[]> = {
  linen: ["linen"],
  cotton: ["cotton"],
  leather: ["leather"],
  denim: ["denim"],
  wool: ["wool"],
  silk: ["silk", "satin"],
  suede: ["suede"],
  knit: ["knit", "knitted"],
};

const categoryKeywords: Record<string, string[]> = {
  tshirt: ["tshirt", "t-shirt", "tee", "t shirt"],
  shirt: ["shirt", "shirts", "linen shirt", "button up", "button-up"],
  hoodie: ["hoodie", "hoodies", "sweatshirt"],
  trousers: ["trousers", "trouser", "pants"],
  jeans: ["jeans", "jean", "denim"],
  dress: ["dress", "dresses"],
  blazer: ["blazer", "blazers", "jacket", "jackets", "coat"],
  footwear: [
    "shoes",
    "shoe",
    "trainers",
    "sneakers",
    "sandals",
    "loafers",
    "boots",
  ],
  bag: ["bag", "bags", "handbag", "handbags", "tote", "totes"],
  jewellery: ["jewellery", "jewelry", "earrings", "necklace", "ring", "rings"],
};

const genderKeywords: Record<string, string[]> = {
  men: ["men", "mens", "male", "guy"],
  women: ["women", "womens", "female", "girl"],
  unisex: ["unisex"],
};

const occasionKeywords: Record<string, string[]> = {
  "date night": ["date night"],
  "beach club": ["beach club"],
  holiday: ["holiday"],
  "wedding guest": ["wedding guest"],
  office: ["office", "work"],
  gym: ["gym", "training", "workout"],
  "airport outfit": ["airport outfit", "airport"],
  dinner: ["dinner"],
  party: ["party"],
  casual: ["casual", "everyday"],
  formal: ["formal"],
};

const seasonKeywords: Record<string, string[]> = {
  summer: ["summer", "hot weather", "holiday", "beach"],
  winter: ["winter", "cold", "jacket", "coat"],
  spring: ["spring"],
  autumn: ["autumn", "fall"],
};

const fitKeywords: Record<string, string[]> = {
  oversized: ["oversized"],
  "slim fit": ["slim fit", "slim"],
  relaxed: ["relaxed"],
  tailored: ["tailored"],
  cropped: ["cropped"],
  "wide leg": ["wide leg", "wide-leg"],
  baggy: ["baggy"],
};

const vibeKeywords: Record<string, string[]> = {
  "quiet luxury": ["quiet luxury"],
  "old money": ["old money"],
  streetwear: ["streetwear"],
  minimalist: ["minimalist", "minimal"],
  casual: ["casual", "relaxed"],
  formal: ["formal"],
  classy: ["classy"],
  elegant: ["elegant"],
};

const styleKeywords: Record<string, string[]> = {
  minimalist: ["minimalist", "minimal", "clean"],
  resort: ["resort"],
  marbella: ["marbella"],
  dubai: ["dubai"],
  ibiza: ["ibiza"],
  paris: ["paris"],
  "smart casual": ["smart casual"],
};

const brandKeywords: Record<string, string[]> = mockProducts.reduce(
  (dictionary, product) => {
    const brandAttribution = getBrandAttribution({
      brandName: product.brand,
      retailerName: product.retailer,
      existingSlug: product.brandSlug,
    });
    const terms = getBrandSearchTerms({
      brandName: product.brand,
      retailerName: product.retailer,
      brandSlug: brandAttribution.brandSlug,
    });

    dictionary[brandAttribution.normalizedBrandId] = Array.from(
      new Set([...(dictionary[brandAttribution.normalizedBrandId] ?? []), ...terms]),
    );
    return dictionary;
  },
  {} as Record<string, string[]>,
);
const pricingSortWords = new Set([
  "cheap",
  "cheaper",
  "cheapest",
  "affordable",
  "budget",
]);
const fillerWords = new Set([
  "under",
  "below",
  "less",
  "than",
  "max",
  "budget",
  "make",
  "it",
  "only",
  "show",
  "similar",
  "euro",
  "euros",
  "pounds",
  "pound",
  "look",
  "style",
  "styles",
  "outfit",
  "query",
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

const detectExcludedCategories = (query: string) =>
  Object.entries(categoryKeywords).reduce<string[]>((excluded, [category, terms]) => {
    const excludedMatch = terms.some((term) =>
      new RegExp(
        `\\b(?:no|not|without|exclude)\\s+${escapeRegExp(term)}\\b`,
        "i",
      ).test(query),
    );

    if (excludedMatch) {
      excluded.push(category);
    }

    return excluded;
  }, []);

const detectOnlyFilters = (
  query: string,
  dictionary: Record<string, string[]>,
) =>
  Object.entries(dictionary).reduce<string[]>((hardMatches, [key, terms]) => {
    const onlyMatch = terms.some((term) =>
      new RegExp(
        `\\b(?:only\\s+${escapeRegExp(term)}|${escapeRegExp(term)}\\s+only)\\b`,
        "i",
      ).test(query),
    );

    if (onlyMatch) {
      hardMatches.push(key);
    }

    return hardMatches;
  }, []);

export const parseQueryIntent = (query: string): QueryIntent => {
  const normalizedQuery = query.toLowerCase();
  const allTokens = tokenizeQuery(query);
  const meaningfulWords = Array.from(
    new Set(
      allTokens.filter((word) => word.length > 2 && !fillerWords.has(word)),
    ),
  );
  const categories = detectIntentValues(normalizedQuery, categoryKeywords);
  const materials = detectIntentValues(normalizedQuery, materialKeywords);
  const colors = detectIntentValues(normalizedQuery, colorKeywords);
  const genders = detectIntentValues(normalizedQuery, genderKeywords);
  const occasions = detectIntentValues(normalizedQuery, occasionKeywords);
  const seasons = detectIntentValues(normalizedQuery, seasonKeywords);
  const fits = detectIntentValues(normalizedQuery, fitKeywords);
  const vibes = detectIntentValues(normalizedQuery, vibeKeywords);
  const styles = detectIntentValues(normalizedQuery, styleKeywords);
  const brands = detectIntentValues(normalizedQuery, brandKeywords);
  const excludedCategories = detectExcludedCategories(normalizedQuery);
  const normalizedCategories = categories.filter(
    (category) => !excludedCategories.includes(category),
  );
  const onlyCategoryFilters = detectOnlyFilters(normalizedQuery, categoryKeywords);
  const onlyColorFilters = detectOnlyFilters(normalizedQuery, colorKeywords);
  const onlyMaterialFilters = detectOnlyFilters(normalizedQuery, materialKeywords);

  const priceMatches = [
    ...Array.from(
      normalizedQuery.matchAll(
        /(?:under|below|less than|max|budget)\s*(?:£|€)?\s*(\d{2,4})/gi,
      ),
    ),
    ...Array.from(normalizedQuery.matchAll(/(?:£|€)\s*(\d{2,4})/gi)),
    ...Array.from(
      normalizedQuery.matchAll(/\b(\d{2,4})\s*(?:euros?|pounds?)\b/gi),
    ),
  ]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => !Number.isNaN(value));

  return {
    words: meaningfulWords,
    categories: normalizedCategories,
    colors,
    materials,
    vibes,
    styles,
    occasions,
    seasons,
    genders,
    fits,
    brands,
    exclusions: excludedCategories,
    onlyFilters: {
      categories: onlyCategoryFilters,
      colors: onlyColorFilters,
      materials: onlyMaterialFilters,
    },
    maxPrice: priceMatches.length ? Math.min(...priceMatches) : null,
    sortMode: allTokens.some((token) => pricingSortWords.has(token))
      ? "cheapest"
      : "relevance",
  };
};

const formatPrice = (amount: number, currency: Product["currency"]) => {
  const hasDecimals = !Number.isInteger(amount);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
};

const normalizeProductCategory = (category: Product["category"]) => category;

const isPriceSortedAscending = (list: Product[]) =>
  list.every((item, index) => index === 0 || list[index - 1].price <= item.price);

export const runSearchValidationCases = (items: Product[]): ValidationResult[] => {
  const cases = [
    {
      query: "black tshirt under 100",
      check: (result: FilterResult) =>
        result.items.every(
          (item) =>
            normalizeProductCategory(item.category) === "tshirt" && item.price <= 100,
        ),
      reason: "Expected only tshirts under 100.",
    },
    {
      query: "white linen shirt",
      check: (result: FilterResult) =>
        result.items.every(
          (item) => normalizeProductCategory(item.category) === "shirt",
        ),
      reason: "Expected only shirts for shirt-intent query.",
    },
    {
      query: "cheapest summer outfit",
      check: (result: FilterResult) => isPriceSortedAscending(result.items),
      reason: "Expected cheapest intent to sort ascending by price.",
    },
    {
      query: "black hoodie",
      check: (result: FilterResult) =>
        result.items.every(
          (item) => normalizeProductCategory(item.category) === "hoodie",
        ),
      reason: "Expected only hoodies for hoodie query.",
    },
    {
      query: "only black trousers",
      check: (result: FilterResult) =>
        result.items.every(
          (item) =>
            normalizeProductCategory(item.category) === "trousers" &&
            item.colors.includes("black"),
        ),
      reason: "Expected strict black trousers filtering.",
    },
    {
      query: "no bags",
      check: (result: FilterResult) =>
        result.items.every((item) => normalizeProductCategory(item.category) !== "bag"),
      reason: "Expected bag exclusions to be strict.",
    },
    {
      query: "red tshirt under 50",
      check: (result: FilterResult) =>
        result.items.every(
          (item) =>
            normalizeProductCategory(item.category) === "tshirt" && item.price <= 50,
        ),
      reason: "Expected tshirt-only results under 50.",
    },
    {
      query: "linen only",
      check: (result: FilterResult) =>
        result.items.every((item) => item.materials.includes("linen")),
      reason: "Expected strict linen-only filtering.",
    },
    {
      query: "oversized black hoodie",
      check: (result: FilterResult) =>
        result.items.every(
          (item) => normalizeProductCategory(item.category) === "hoodie",
        ),
      reason: "Expected hoodie category enforcement.",
    },
    {
      query: "quiet luxury summer outfit",
      check: (result: FilterResult) =>
        result.items.every((item) => {
          const category = normalizeProductCategory(item.category);
          return category !== "jewellery" && category !== "bag";
        }),
      reason: "Expected clothing intent to avoid jewellery and bags.",
    },
    {
      query: "Marbella beach club outfit",
      check: (result: FilterResult) =>
        result.items.every((item) => {
          const category = normalizeProductCategory(item.category);
          return category !== "jewellery" && category !== "bag";
        }),
      reason: "Expected clothing outfit intent to avoid accessory junk.",
    },
    {
      query: "black linen trousers under 200",
      check: (result: FilterResult) =>
        result.items.every(
          (item) =>
            normalizeProductCategory(item.category) === "trousers" && item.price <= 200,
        ),
      reason: "Expected trousers under 200 only.",
    },
  ];

  return cases.map(({ query, check, reason }) => {
    const result = getFilteredProducts(query, items);
    return {
      query,
      passed: check(result),
      reason,
    };
  });
};

export const getFilteredProducts = (
  query: string,
  items: Product[],
): FilterResult => {
  const intent = parseQueryIntent(query);
  if (!query.trim()) {
    return { items, showFallbackNotice: false };
  }

  const strictCategoryFilters = Array.from(
    new Set([...intent.categories, ...intent.onlyFilters.categories]),
  );
  const strictColorFilters = Array.from(
    new Set([...intent.onlyFilters.colors]),
  );
  const strictMaterialFilters = Array.from(
    new Set([...intent.onlyFilters.materials]),
  );
  const exclusionFilters = Array.from(new Set(intent.exclusions));
  const normalizedQuery = query.toLowerCase();
  const clothingCategories = new Set([
    "tshirt",
    "shirt",
    "hoodie",
    "trousers",
    "jeans",
    "dress",
    "blazer",
  ]);
  const accessoryCategories = new Set(["bag", "jewellery", "watch", "accessory"]);
  const explicitAccessoryIntent = strictCategoryFilters.some((category) =>
    accessoryCategories.has(category),
  );
  const clothingIntent =
    !explicitAccessoryIntent &&
    !strictCategoryFilters.includes("footwear") &&
    (strictCategoryFilters.some((category) => clothingCategories.has(category)) ||
      intent.materials.length > 0 ||
      intent.fits.length > 0 ||
      intent.occasions.length > 0 ||
      intent.seasons.length > 0 ||
      intent.vibes.length > 0 ||
      intent.styles.length > 0 ||
      containsTerm(normalizedQuery, "outfit"));

  const applyNonNegotiableFilters = (list: Product[]) =>
    list.filter((product) => {
      const productCategory = normalizeProductCategory(product.category);

      if (exclusionFilters.includes(productCategory)) {
        return false;
      }

      if (intent.maxPrice !== null && product.price > intent.maxPrice) {
        return false;
      }

      if (clothingIntent && accessoryCategories.has(productCategory)) {
        return false;
      }

      return true;
    });

  const strictMatches = applyNonNegotiableFilters(items).filter((product) => {
    const productCategory = normalizeProductCategory(product.category);

    if (
      strictCategoryFilters.length &&
      !strictCategoryFilters.includes(productCategory)
    ) {
      return false;
    }

    if (
      strictColorFilters.length &&
      !strictColorFilters.some((color) => product.colors.includes(color))
    ) {
      return false;
    }

    if (
      strictMaterialFilters.length &&
      !strictMaterialFilters.some((material) =>
        product.materials.includes(material),
      )
    ) {
      return false;
    }

    return true;
  });

  const softSignalsPresent =
    intent.brands.length > 0 ||
    intent.vibes.length > 0 ||
    intent.styles.length > 0 ||
    intent.occasions.length > 0 ||
    intent.seasons.length > 0 ||
    intent.fits.length > 0;

  const getRelevanceScore = (product: Product) => {
    const productCategory = normalizeProductCategory(product.category);
    const brandAttribution = getBrandAttribution({
      brandName: product.brand,
      retailerName: product.retailer,
      existingSlug: product.brandSlug,
    });
    const brandTerms = getBrandSearchTerms({
      brandName: product.brand,
      retailerName: product.retailer,
      brandSlug: brandAttribution.brandSlug,
    });
    let score = 0;

    if (strictCategoryFilters.length) {
      if (strictCategoryFilters.includes(productCategory)) {
        score += 5;
      } else {
        score -= 8;
      }
    }

    if (
      intent.colors.length &&
      intent.colors.some((color) => product.colors.includes(color))
    ) {
      score += 4;
    }

    if (
      intent.materials.length &&
      intent.materials.some((material) => product.materials.includes(material))
    ) {
      score += 4;
    }

    if (
      intent.genders.length &&
      product.gender.some(
        (gender) => intent.genders.includes(gender) || gender === "unisex",
      )
    ) {
      score += 3;
    }

    if (
      intent.occasions.length &&
      intent.occasions.some((occasion) => product.occasion.includes(occasion))
    ) {
      score += 3;
    }

    if (
      intent.vibes.length &&
      intent.vibes.some((vibe) => product.vibe.includes(vibe))
    ) {
      score += 3;
    }

    if (
      intent.seasons.length &&
      intent.seasons.some((season) => product.season.includes(season))
    ) {
      score += 2;
    }

    if (
      intent.fits.length &&
      intent.fits.some((fit) => product.fit.includes(fit))
    ) {
      score += 2;
    }

    if (
      intent.styles.length &&
      intent.styles.some((style) => product.style.includes(style))
    ) {
      score += 3;
    }

    if (intent.brands.length) {
      if (intent.brands.includes(brandAttribution.normalizedBrandId)) {
        score += 7;
      } else {
        score -= 5;
      }
    }

    const lowerName = product.name.toLowerCase();
    const lowerBrand = product.brand.toLowerCase();
    const lowerRetailer = product.retailer.toLowerCase();
    intent.words.forEach((word) => {
      if (lowerName.includes(word)) {
        score += 1;
      }
      if (lowerBrand.includes(word)) {
        score += 1;
      }
      if (lowerRetailer.includes(word)) {
        score += 1;
      }
      if (brandTerms.some((term) => term.includes(word))) {
        score += 1;
      }
    });

    if (exclusionFilters.includes(productCategory)) {
      score -= 10;
    }

    if (clothingIntent && accessoryCategories.has(productCategory)) {
      score -= 8;
    }

    return score;
  };

  const rankProducts = (list: Product[]) => {
    const scored = list.map((product) => ({
      product,
      score: getRelevanceScore(product),
    }));

    scored.sort((a, b) => {
      if (intent.sortMode === "cheapest" && a.product.price !== b.product.price) {
        return a.product.price - b.product.price;
      }

      if (a.score !== b.score) {
        return b.score - a.score;
      }

      return a.product.price - b.product.price;
    });

    return scored.map(({ product }) => product);
  };

  const softSignalMatches = strictMatches.filter((product) => {
    const hasOccasion =
      intent.occasions.length > 0 &&
      intent.occasions.some((occasion) => product.occasion.includes(occasion));
    const hasVibe =
      intent.vibes.length > 0 &&
      intent.vibes.some((vibe) => product.vibe.includes(vibe));
    const hasStyle =
      intent.styles.length > 0 &&
      intent.styles.some((style) => product.style.includes(style));
    const hasSeason =
      intent.seasons.length > 0 &&
      intent.seasons.some((season) => product.season.includes(season));
    const hasFit =
      intent.fits.length > 0 &&
      intent.fits.some((fit) => product.fit.includes(fit));

    return hasOccasion || hasVibe || hasStyle || hasSeason || hasFit;
  });

  if (softSignalsPresent && softSignalMatches.length) {
    return {
      items: rankProducts(softSignalMatches),
      showFallbackNotice: false,
    };
  }

  if (strictMatches.length) {
    return {
      items: rankProducts(strictMatches),
      showFallbackNotice: softSignalsPresent,
    };
  }

  const fallbackCandidates = applyNonNegotiableFilters(items);
  return {
    items: rankProducts(fallbackCandidates),
    showFallbackNotice: true,
  };
};

const fallbackTrendingProducts = mockProducts.slice(0, 8);

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const previewProducts = fallbackTrendingProducts.slice(0, 4);
  const [searchInput, setSearchInput] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gridAnimationKey, setGridAnimationKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextUrlSyncRef = useRef<string | null>(null);
  const filteredResults = useMemo(
    () => getFilteredProducts(activeQuery, mockProducts),
    [activeQuery],
  );
  const activeIntent = useMemo(() => parseQueryIntent(activeQuery), [activeQuery]);
  const visibleProducts = hasSearched ? filteredResults.items : previewProducts;
  const schemaQuery = hasSearched ? currentQuery || activeQuery : "";
  const productStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: visibleProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          image: product.images,
          description: product.description,
          category: product.category,
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency,
            url: product.productUrl,
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        },
      })),
    }),
    [visibleProducts],
  );
  const pageStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": hasSearched ? "SearchResultsPage" : "CollectionPage",
      name: hasSearched
        ? `SocialMall search results for ${schemaQuery}`
        : "SocialMall fashion discovery",
      description: hasSearched
        ? `Fashion search results for ${schemaQuery}.`
        : "Discover curated fashion looks from independent brands.",
      about: schemaQuery || undefined,
    }),
    [hasSearched, schemaQuery],
  );
  const trackingQuery = hasSearched ? currentQuery || activeQuery : "";
  const productImageSizes = PRODUCT_GRID_IMAGE_SIZES;
  const tagDrivenPhrases = useMemo(() => {
    const topProducts = filteredResults.items.slice(0, 8);
    const tags = topProducts.flatMap((product) => [
      ...product.vibe,
      ...product.style,
      ...product.fit,
      ...product.occasion,
    ]);

    const mappedPhrases = tags.flatMap((tag) => {
      const mappedPhrase = (() => {
        if (tag === "quiet luxury") return "quiet luxury";
        if (tag === "minimalist" || tag === "clean") return "Scandinavian minimal";
        if (tag === "marbella" || tag === "resort" || tag === "beach club") {
          return "Marbella beach club";
        }
        if (tag === "elegant" || tag === "dinner" || tag === "party") {
          return "Ibiza sunset dinner";
        }
        if (tag === "streetwear" || tag === "oversized") {
          return "oversized streetwear";
        }
        if (tag === "smart casual") return "smart casual";
        return null;
      })();

      return mappedPhrase ? [mappedPhrase] : [];
    });

    return Array.from(new Set(mappedPhrases));
  }, [filteredResults.items]);
  const relatedBrandLinks = useMemo(
    () =>
      Array.from(
        new Set(
          filteredResults.items
            .slice(0, 10)
            .map((product) => formatBrandName(product.brand)),
        ),
      ).slice(0, 3),
    [filteredResults.items],
  );
  const relatedSearchLinks = useMemo(() => {
    const dynamicTerms: string[] = [];
    const primaryCategory = activeIntent.categories[0];
    const primaryColor = activeIntent.colors[0];
    const primaryMaterial = activeIntent.materials[0];
    const primarySeason = activeIntent.seasons[0];

    if (trackingQuery) {
      dynamicTerms.push(trackingQuery);
    }
    if (primaryColor && primaryCategory) {
      dynamicTerms.push(`${primaryColor} ${primaryCategory}`);
    }
    if (primaryMaterial && primaryCategory) {
      dynamicTerms.push(`${primaryMaterial} ${primaryCategory}`);
    }
    if (primarySeason && primaryCategory) {
      dynamicTerms.push(`${primarySeason} ${primaryCategory}`);
    }
    if (primarySeason && !primaryCategory) {
      dynamicTerms.push(`${primarySeason} outfit`);
    }

    const fallbackTerms = [
      "quiet luxury",
      "Scandinavian minimal",
      "Marbella beach club",
      "Ibiza sunset dinner",
      "oversized streetwear",
    ];

    return Array.from(
      new Set([
        ...dynamicTerms,
        ...tagDrivenPhrases,
        ...relatedBrandLinks,
        ...fallbackTerms,
      ]),
    )
      .filter((term) => term.toLowerCase() !== trackingQuery.toLowerCase())
      .slice(0, 6);
  }, [activeIntent, relatedBrandLinks, tagDrivenPhrases, trackingQuery]);
  const trendingAestheticsLinks = useMemo(
    () =>
      Array.from(
        new Set([
          ...tagDrivenPhrases,
          "quiet luxury",
          "Scandinavian minimal",
          "Marbella beach club",
          "Ibiza sunset dinner",
          "oversized streetwear",
        ]),
      ).slice(0, 5),
    [tagDrivenPhrases],
  );
  const similarVibesLinks = useMemo(
    () =>
      Array.from(
        new Set([
          ...tagDrivenPhrases,
          ...(activeIntent.vibes.length ? activeIntent.vibes : []),
          ...(activeIntent.styles.length ? activeIntent.styles : []),
          "resort casual",
          "smart casual evening",
        ]),
      )
        .map((phrase) =>
          phrase === "minimalist" ? "Scandinavian minimal" : phrase,
        )
        .slice(0, 5),
    [activeIntent.styles, activeIntent.vibes, tagDrivenPhrases],
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

  const updateSearchUrl = (query: string) => {
    const trimmedQuery = query.trim();
    const nextParams = new URLSearchParams(searchParams.toString());

    if (trimmedQuery) {
      nextParams.set("q", trimmedQuery);
    } else {
      nextParams.delete("q");
    }

    const nextQueryString = nextParams.toString();
    const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
    const currentQueryString = searchParams.toString();
    const currentUrl = currentQueryString
      ? `${pathname}?${currentQueryString}`
      : pathname;

    if (nextUrl !== currentUrl) {
      skipNextUrlSyncRef.current = trimmedQuery;
      router.push(nextUrl, { scroll: false });
    } else {
      skipNextUrlSyncRef.current = null;
    }
  };

  const buildOutboundHref = (productId: number, query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return `/out/${productId}`;
    }

    return {
      pathname: `/out/${productId}`,
      query: { q: trimmedQuery },
    };
  };

  const buildSearchHref = (query: string) => ({
    pathname: "/",
    query: { q: query.trim() },
  });

  const buildRefinedQuery = (baseQuery: string, refinement: string) => {
    const base = baseQuery.trim();
    const next = refinement.trim();
    if (!next) return base;
    if (!base) return next;

    const normalize = (value: string) =>
      value.toLowerCase().replace(/\s+/g, " ").trim();

    const normalizedBase = normalize(base);
    const normalizedNext = normalize(next);

    if (normalizedNext.startsWith(normalizedBase)) {
      return next;
    }

    if (normalizedBase.includes(normalizedNext) && normalizedNext.length > 2) {
      return base;
    }

    const cleanedRefinement = next.replace(/^(and|with|for|to)\s+/i, "");
    return `${base} ${cleanedRefinement}`.replace(/\s+/g, " ").trim();
  };

  const trackSearchInteraction = (query: string, source: SearchEventSource) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return;
    }

    const resultCount = getFilteredProducts(normalizedQuery, mockProducts).items.length;
    trackSearchEvent({
      query: normalizedQuery,
      source,
      resultCount,
    });
  };

  const handleProductCardClick = (product: Product) => {
    trackProductClickEvent({
      productId: String(product.id),
      productName: product.name,
      brand: product.brand,
      category: product.category,
      vibe: product.vibe,
      price: product.price,
      searchQuery: trackingQuery,
    });
  };

  const handleInternalChipClick = (
    event: MouseEvent<HTMLAnchorElement>,
    term: string,
    chipType: "related_search" | "trending_aesthetic" | "similar_vibe",
  ) => {
    trackChipClickEvent({
      chipType,
      chipValue: term,
      activeQuery: trackingQuery,
    });
    trackSearchInteraction(term, "internal_chip");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    trackSearchInteraction(query, "hero_submit");
    runSearch(query);
    updateSearchUrl(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    trackChipClickEvent({
      chipType: "hero_suggestion",
      chipValue: suggestion,
      activeQuery: trackingQuery,
    });
    trackSearchInteraction(suggestion, "hero_chip");
    runSearch(suggestion);
    updateSearchUrl(suggestion);
  };

  const handleRefineSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const refinement = refineInput.trim();
    if (!refinement) return;

    const baseQuery = currentQuery || activeQuery;
    const nextQuery = buildRefinedQuery(baseQuery, refinement);
    if (!nextQuery) return;

    setRefineInput("");
    setSearchInput(nextQuery);
    trackSearchInteraction(nextQuery, "refine_submit");
    runSearch(nextQuery);
    updateSearchUrl(nextQuery);
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
    setHasSearched(false);
    setIsLoading(false);
    setGridAnimationKey(0);
    updateSearchUrl("");
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      skipNextUrlSyncRef.current !== null &&
      skipNextUrlSyncRef.current === urlQuery
    ) {
      skipNextUrlSyncRef.current = null;
      return;
    }

    const syncTimer = window.setTimeout(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!urlQuery) {
        setHasSearched(false);
        setSearchInput("");
        setRefineInput("");
        setCurrentQuery("");
        setActiveQuery("");
        setIsLoading(false);
        setGridAnimationKey(0);
        return;
      }

      setHasSearched(true);
      setSearchInput(urlQuery);
      setRefineInput("");
      setCurrentQuery(urlQuery);
      setActiveQuery(urlQuery);
      setIsLoading(false);
      setGridAnimationKey((currentKey) => currentKey + 1);
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
    };
  }, [urlQuery]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const validationResults = runSearchValidationCases(mockProducts);
    const failedCases = validationResults.filter((result) => !result.passed);

    if (failedCases.length) {
      console.warn("SocialMall search validation failures:", failedCases);
    } else {
      console.info(
        "SocialMall search validation passed for curated fallback test cases.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <script
        type="application/ld+json"
        // JSON-LD stays invisible while improving search engine understanding.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
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
              <h2 className="text-sm font-medium text-zinc-500">Trending now</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-10">
                {previewProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    href={buildOutboundHref(product.id, trackingQuery)}
                    product={product}
                    imageSizes={productImageSizes}
                    priority={index < 2}
                    onProductClick={handleProductCardClick}
                  />
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
              {filteredResults.items.map((product, index) => (
                <ProductCard
                  key={product.id}
                  href={buildOutboundHref(product.id, trackingQuery)}
                  product={product}
                  imageSizes={productImageSizes}
                  priority={index < 2}
                  onProductClick={handleProductCardClick}
                />
              ))}
            </div>
            {!isLoading ? (
              <div className="space-y-5 pt-2">
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Related searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedSearchLinks.map((term) => (
                      <Link
                        key={`related-${term}`}
                        href={buildSearchHref(term)}
                        onClick={(event) =>
                          handleInternalChipClick(event, term, "related_search")
                        }
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Trending aesthetics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingAestheticsLinks.map((term) => (
                      <Link
                        key={`aesthetic-${term}`}
                        href={buildSearchHref(term)}
                        onClick={(event) =>
                          handleInternalChipClick(event, term, "trending_aesthetic")
                        }
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Similar vibes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {similarVibesLinks.map((term) => (
                      <Link
                        key={`vibe-${term}`}
                        href={buildSearchHref(term)}
                        onClick={(event) =>
                          handleInternalChipClick(event, term, "similar_vibe")
                        }
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
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

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
