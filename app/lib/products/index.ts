export { productCatalog } from "./catalog";
export {
  buildProductIndexes,
  extractUniqueProductTags,
  filterProducts,
  getRelatedProducts,
  groupProductsByAesthetic,
  groupProductsByCategory,
  groupProductsByCollection,
  groupProductsByGender,
  sortProducts,
} from "./helpers";
export { mockProducts } from "./mock-products";
export type {
  AffiliateNetwork,
  BrandProfileSeed,
  Product,
  ProductCategory,
  ProductCollectionKey,
  ProductCurrency,
  ProductFilterOptions,
  ProductGender,
  ProductShippingCountry,
  ProductSortMode,
  ProductTagField,
  RecipeSeed,
} from "./types";
