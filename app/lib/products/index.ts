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
export { getProductMonetizationMetadata } from "./monetization";
export type { ProductMonetizationMetadata } from "./monetization";
export type {
  AffiliateCommissionModel,
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
