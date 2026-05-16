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
  gender: ("men" | "women" | "unisex")[];
  colors: string[];
  materials: string[];
  fitTags: string[];
  occasionTags: string[];
  seasonTags: string[];
  vibeTags: string[];
  styleTags: string[];
  url: string;
};

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

const parseQueryIntent = (query: string): QueryIntent => {
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
  const excludedCategories = detectExcludedCategories(normalizedQuery);
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
    categories,
    colors,
    materials,
    vibes,
    styles,
    occasions,
    seasons,
    genders,
    fits,
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

const formatPrice = (amount: number) => {
  const hasDecimals = !Number.isInteger(amount);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
};

const normalizeProductCategory = (category: string) => {
  if (category === "sandals") return "footwear";
  return category;
};

const isPriceSortedAscending = (list: Product[]) =>
  list.every((item, index) => index === 0 || list[index - 1].price <= item.price);

const runSearchValidationCases = (items: Product[]): ValidationResult[] => {
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

const getFilteredProducts = (
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
    intent.vibes.length > 0 ||
    intent.styles.length > 0 ||
    intent.occasions.length > 0 ||
    intent.seasons.length > 0 ||
    intent.fits.length > 0;

  const getRelevanceScore = (product: Product) => {
    const productCategory = normalizeProductCategory(product.category);
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
      intent.occasions.some((occasion) => product.occasionTags.includes(occasion))
    ) {
      score += 3;
    }

    if (
      intent.vibes.length &&
      intent.vibes.some((vibe) => product.vibeTags.includes(vibe))
    ) {
      score += 3;
    }

    if (
      intent.seasons.length &&
      intent.seasons.some((season) => product.seasonTags.includes(season))
    ) {
      score += 2;
    }

    if (
      intent.fits.length &&
      intent.fits.some((fit) => product.fitTags.includes(fit))
    ) {
      score += 2;
    }

    if (
      intent.styles.length &&
      intent.styles.some((style) => product.styleTags.includes(style))
    ) {
      score += 3;
    }

    const lowerName = product.name.toLowerCase();
    const lowerBrand = product.brand.toLowerCase();
    intent.words.forEach((word) => {
      if (lowerName.includes(word)) {
        score += 1;
      }
      if (lowerBrand.includes(word)) {
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
      intent.occasions.some((occasion) => product.occasionTags.includes(occasion));
    const hasVibe =
      intent.vibes.length > 0 &&
      intent.vibes.some((vibe) => product.vibeTags.includes(vibe));
    const hasStyle =
      intent.styles.length > 0 &&
      intent.styles.some((style) => product.styleTags.includes(style));
    const hasSeason =
      intent.seasons.length > 0 &&
      intent.seasons.some((season) => product.seasonTags.includes(season));
    const hasFit =
      intent.fits.length > 0 &&
      intent.fits.some((fit) => product.fitTags.includes(fit));

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

const products: Product[] = [
  {
    id: 1,
    brand: "The Row",
    name: "Cashmere Blend Wide-Leg Trousers",
    price: 1190,
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    category: "trousers",
    gender: ["women"],
    colors: ["black"],
    materials: ["wool"],
    fitTags: ["wide leg", "tailored"],
    occasionTags: ["dinner", "office", "formal"],
    seasonTags: ["winter", "autumn"],
    vibeTags: ["quiet luxury", "elegant", "minimalist"],
    styleTags: ["minimalist", "clean", "classy"],
    url: "#",
  },
  {
    id: 2,
    brand: "Jacquemus",
    name: "Le Chouchou Draped Linen Shirt",
    price: 520,
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    category: "shirt",
    gender: ["men"],
    colors: ["beige", "cream"],
    materials: ["linen"],
    fitTags: ["relaxed"],
    occasionTags: ["holiday", "beach club", "dinner"],
    seasonTags: ["summer", "spring"],
    vibeTags: ["marbella", "resort", "elegant"],
    styleTags: ["resort", "smart casual", "minimalist"],
    url: "#",
  },
  {
    id: 3,
    brand: "COS",
    name: "Relaxed Oversized Black Hoodie",
    price: 135,
    image:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=80",
    category: "hoodie",
    gender: ["unisex"],
    colors: ["black"],
    materials: ["cotton", "knit"],
    fitTags: ["oversized", "relaxed"],
    occasionTags: ["airport outfit", "casual"],
    seasonTags: ["winter", "autumn"],
    vibeTags: ["casual", "streetwear", "minimalist"],
    styleTags: ["streetwear", "clean"],
    url: "#",
  },
  {
    id: 4,
    brand: "Toteme",
    name: "Minimalist Structured Wool Blazer",
    price: 790,
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
    category: "blazer",
    gender: ["women"],
    colors: ["black"],
    materials: ["wool"],
    fitTags: ["tailored"],
    occasionTags: ["office", "formal", "dinner"],
    seasonTags: ["winter", "autumn", "spring"],
    vibeTags: ["quiet luxury", "elegant", "minimalist"],
    styleTags: ["classy", "smart casual", "minimalist"],
    url: "#",
  },
  {
    id: 5,
    brand: "Arket",
    name: "White Cotton Essential Tee",
    price: 55,
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
    category: "tshirt",
    gender: ["men"],
    colors: ["white"],
    materials: ["cotton"],
    fitTags: ["relaxed"],
    occasionTags: ["casual", "airport outfit"],
    seasonTags: ["summer", "spring"],
    vibeTags: ["casual", "minimalist"],
    styleTags: ["clean", "minimalist"],
    url: "#",
  },
  {
    id: 6,
    brand: "Aeyde",
    name: "Leather Slip-On Sandals",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    category: "sandals",
    gender: ["women"],
    colors: ["beige", "brown"],
    materials: ["leather"],
    fitTags: ["relaxed"],
    occasionTags: ["holiday", "beach club", "casual"],
    seasonTags: ["summer"],
    vibeTags: ["beach", "resort", "casual"],
    styleTags: ["minimalist", "resort"],
    url: "#",
  },
  {
    id: 7,
    brand: "Loulou Studio",
    name: "Silk Resort Shirt in Sand",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
    category: "shirt",
    gender: ["women"],
    colors: ["beige", "cream"],
    materials: ["silk"],
    fitTags: ["relaxed"],
    occasionTags: ["holiday", "dinner", "beach club"],
    seasonTags: ["summer", "spring"],
    vibeTags: ["resort", "marbella", "elegant"],
    styleTags: ["resort", "classy", "clean"],
    url: "#",
  },
  {
    id: 8,
    brand: "Levi's",
    name: "Blue Relaxed Straight Jeans",
    price: 95,
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80",
    category: "jeans",
    gender: ["unisex"],
    colors: ["blue", "navy"],
    materials: ["denim", "cotton"],
    fitTags: ["relaxed", "baggy"],
    occasionTags: ["casual", "airport outfit"],
    seasonTags: ["autumn", "winter", "spring"],
    vibeTags: ["casual", "streetwear"],
    styleTags: ["streetwear", "clean"],
    url: "#",
  },
  {
    id: 9,
    brand: "Mango",
    name: "Open Knit Beach Club Dress",
    price: 89.99,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
    category: "dress",
    gender: ["women"],
    colors: ["red"],
    materials: ["cotton", "knit"],
    fitTags: ["relaxed"],
    occasionTags: ["beach club", "holiday", "party"],
    seasonTags: ["summer"],
    vibeTags: ["marbella", "beach", "resort"],
    styleTags: ["resort", "elegant"],
    url: "#",
  },
  {
    id: 10,
    brand: "Arket",
    name: "White Linen Wide-Leg Trousers",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
    category: "trousers",
    gender: ["women"],
    colors: ["white", "cream"],
    materials: ["linen"],
    fitTags: ["wide leg", "relaxed"],
    occasionTags: ["holiday", "office", "casual"],
    seasonTags: ["summer", "spring"],
    vibeTags: ["quiet luxury", "minimalist", "resort"],
    styleTags: ["clean", "minimalist", "smart casual"],
    url: "#",
  },
  {
    id: 11,
    brand: "Demellier",
    name: "Minimal Leather Shoulder Bag",
    price: 360,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
    category: "bag",
    gender: ["women"],
    colors: ["white", "beige"],
    materials: ["leather"],
    fitTags: ["relaxed"],
    occasionTags: ["office", "dinner", "formal"],
    seasonTags: ["autumn", "winter", "spring"],
    vibeTags: ["quiet luxury", "classy", "minimalist"],
    styleTags: ["clean", "elegant", "minimalist"],
    url: "#",
  },
  {
    id: 12,
    brand: "Mejuri",
    name: "Gold Everyday Hoop Earrings",
    price: 110,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
    category: "jewellery",
    gender: ["women"],
    colors: ["beige"],
    materials: ["silk"],
    fitTags: ["relaxed"],
    occasionTags: ["party", "dinner", "casual"],
    seasonTags: ["summer", "spring", "autumn"],
    vibeTags: ["minimalist", "elegant"],
    styleTags: ["clean", "classy"],
    url: "#",
  },
  {
    id: 13,
    brand: "Common Projects",
    name: "Minimal White Leather Sneakers",
    price: 430,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    category: "footwear",
    gender: ["men"],
    colors: ["white"],
    materials: ["leather"],
    fitTags: ["slim fit"],
    occasionTags: ["casual", "airport outfit", "office"],
    seasonTags: ["spring", "summer", "autumn"],
    vibeTags: ["quiet luxury", "minimalist"],
    styleTags: ["clean", "smart casual"],
    url: "#",
  },
  {
    id: 14,
    brand: "Uniqlo",
    name: "Black Cotton Oversized Tee",
    price: 35,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    category: "tshirt",
    gender: ["unisex"],
    colors: ["black"],
    materials: ["cotton"],
    fitTags: ["oversized", "relaxed"],
    occasionTags: ["casual", "gym", "airport outfit"],
    seasonTags: ["summer", "spring"],
    vibeTags: ["streetwear", "casual"],
    styleTags: ["streetwear", "clean"],
    url: "#",
  },
];

const fallbackTrendingProducts = products.slice(0, 8);

export default function Home() {
  const previewProducts = fallbackTrendingProducts.slice(0, 4);
  const [searchInput, setSearchInput] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gridAnimationKey, setGridAnimationKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIntent = useMemo(() => parseQueryIntent(activeQuery), [activeQuery]);
  const filteredResults = useMemo(
    () => getFilteredProducts(activeQuery, products),
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    runSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    runSearch(suggestion);
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

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const validationResults = runSearchValidationCases(products);
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
            {!isLoading ? (
              <p className="text-xs text-zinc-500">
                Detected: category=[{activeIntent.categories.join(", ") || "-"}],
                color=[{activeIntent.colors.join(", ") || "-"}], material=[
                {activeIntent.materials.join(", ") || "-"}], maxPrice=[
                {activeIntent.maxPrice ?? "-"}], exclusions=[
                {activeIntent.exclusions.join(", ") || "-"}], sort=[
                {activeIntent.sortMode === "cheapest" ? "cheapest" : "-"}]
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
