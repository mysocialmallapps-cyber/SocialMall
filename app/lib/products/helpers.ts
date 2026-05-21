import type {
  Product,
  ProductCategory,
  ProductCollectionKey,
  ProductFilterOptions,
  ProductGender,
  ProductSortMode,
  ProductTagField,
} from "./types";

type ProductCollections = Record<ProductCollectionKey, Product[]>;

const unique = <T,>(values: T[]) => Array.from(new Set(values));

const normalizeValue = (value: string) => value.trim().toLowerCase();

const intersects = (source: string[], target: string[]) =>
  target.some((value) => source.includes(value));

const matchesOptionalTerms = (source: string[], values?: string[]) => {
  if (!values?.length) {
    return true;
  }

  const normalizedSource = source.map(normalizeValue);
  const normalizedValues = values.map(normalizeValue);
  return intersects(normalizedSource, normalizedValues);
};

export const filterProducts = (
  products: Product[],
  options: ProductFilterOptions = {},
) =>
  products.filter((product) => {
    if (options.categories?.length && !options.categories.includes(product.category)) {
      return false;
    }

    if (options.genders?.length && !intersects(product.gender, options.genders)) {
      return false;
    }

    if (!matchesOptionalTerms(product.colors, options.colors)) {
      return false;
    }
    if (!matchesOptionalTerms(product.materials, options.materials)) {
      return false;
    }
    if (!matchesOptionalTerms(product.vibe, options.vibe)) {
      return false;
    }
    if (!matchesOptionalTerms(product.style, options.style)) {
      return false;
    }
    if (!matchesOptionalTerms(product.occasion, options.occasion)) {
      return false;
    }
    if (!matchesOptionalTerms(product.season, options.season)) {
      return false;
    }
    if (!matchesOptionalTerms(product.fit, options.fit)) {
      return false;
    }

    if (typeof options.maxPrice === "number" && product.price > options.maxPrice) {
      return false;
    }

    if (options.inStockOnly && !product.inStock) {
      return false;
    }

    return true;
  });

export const sortProducts = (products: Product[], mode: ProductSortMode = "featured") => {
  const copy = [...products];
  copy.sort((a, b) => {
    switch (mode) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "popularity-desc":
        return b.popularityScore - a.popularityScore;
      case "rating-desc":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "featured":
      default:
        if (a.featured !== b.featured) {
          return a.featured ? -1 : 1;
        }
        return b.popularityScore - a.popularityScore;
    }
  });
  return copy;
};

const getProductTagsByField = (product: Product, field: ProductTagField) => product[field];

export const extractUniqueProductTags = (
  products: Product[],
  fields: ProductTagField[] = [
    "colors",
    "materials",
    "vibe",
    "style",
    "occasion",
    "season",
    "fit",
  ],
) =>
  unique(
    products.flatMap((product) =>
      fields.flatMap((field) =>
        getProductTagsByField(product, field).map((tag) => normalizeValue(tag)),
      ),
    ),
  );

export const groupProductsByCategory = (products: Product[]) =>
  products.reduce<Record<ProductCategory, Product[]>>((groups, product) => {
    if (!groups[product.category]) {
      groups[product.category] = [];
    }
    groups[product.category].push(product);
    return groups;
  }, {} as Record<ProductCategory, Product[]>);

export const groupProductsByGender = (products: Product[]) =>
  products.reduce<Record<ProductGender, Product[]>>(
    (groups, product) => {
      product.gender.forEach((gender) => {
        if (!groups[gender]) {
          groups[gender] = [];
        }
        groups[gender].push(product);
      });
      return groups;
    },
    {
      men: [],
      women: [],
      unisex: [],
    },
  );

export const groupProductsByAesthetic = (products: Product[]) =>
  products.reduce<Record<string, Product[]>>((groups, product) => {
    const aesthetics = unique([...product.vibe, ...product.style].map(normalizeValue));
    aesthetics.forEach((aesthetic) => {
      if (!groups[aesthetic]) {
        groups[aesthetic] = [];
      }
      groups[aesthetic].push(product);
    });
    return groups;
  }, {});

const collectionMatchers: Record<
  ProductCollectionKey,
  {
    categories?: ProductCategory[];
    vibe?: string[];
    style?: string[];
    occasion?: string[];
  }
> = {
  featured: {},
  "quiet-luxury": {
    vibe: ["quiet luxury", "elegant"],
    style: ["minimalist", "classy"],
  },
  streetwear: {
    vibe: ["streetwear", "casual"],
    style: ["clean", "smart casual"],
  },
  vacation: {
    vibe: ["resort"],
    occasion: ["holiday", "beach club"],
  },
  occasionwear: {
    occasion: ["formal", "party", "dinner"],
  },
  essentials: {
    categories: ["tshirt", "shirt", "hoodie", "trousers", "jeans"],
  },
};

const matchesCollection = (
  product: Product,
  matcher: {
    categories?: ProductCategory[];
    vibe?: string[];
    style?: string[];
    occasion?: string[];
  },
) => {
  if (matcher.categories?.length && !matcher.categories.includes(product.category)) {
    return false;
  }
  if (!matchesOptionalTerms(product.vibe, matcher.vibe)) {
    return false;
  }
  if (!matchesOptionalTerms(product.style, matcher.style)) {
    return false;
  }
  if (!matchesOptionalTerms(product.occasion, matcher.occasion)) {
    return false;
  }
  return true;
};

export const groupProductsByCollection = (products: Product[]): ProductCollections => {
  const groups: ProductCollections = {
    featured: products.filter((product) => product.featured),
    "quiet-luxury": [],
    streetwear: [],
    vacation: [],
    occasionwear: [],
    essentials: [],
  };

  (Object.keys(collectionMatchers) as ProductCollectionKey[]).forEach((collectionKey) => {
    if (collectionKey === "featured") {
      return;
    }

    groups[collectionKey] = products.filter((product) =>
      matchesCollection(product, collectionMatchers[collectionKey]),
    );
  });

  return groups;
};

export const getRelatedProducts = ({
  sourceProduct,
  products,
  limit = 8,
}: {
  sourceProduct: Product;
  products: Product[];
  limit?: number;
}) =>
  [...products]
    .filter((product) => product.id !== sourceProduct.id)
    .map((product) => {
      let score = 0;
      if (product.brand === sourceProduct.brand) {
        score += 4;
      }
      if (product.category === sourceProduct.category) {
        score += 3;
      }
      if (intersects(product.vibe, sourceProduct.vibe)) {
        score += 2;
      }
      if (intersects(product.style, sourceProduct.style)) {
        score += 2;
      }
      if (intersects(product.gender, sourceProduct.gender)) {
        score += 1;
      }
      return { product, score };
    })
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return b.product.popularityScore - a.product.popularityScore;
    })
    .slice(0, limit)
    .map((entry) => entry.product);

export const buildProductIndexes = (products: Product[]) => ({
  byCategory: groupProductsByCategory(products),
  byAesthetic: groupProductsByAesthetic(products),
  byGender: groupProductsByGender(products),
  byCollection: groupProductsByCollection(products),
});
