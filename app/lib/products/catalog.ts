import { buildProductIndexes, extractUniqueProductTags } from "./helpers";
import { mockProducts } from "./mock-products";

export const productCatalog = {
  all: mockProducts,
  indexes: buildProductIndexes(mockProducts),
  tags: extractUniqueProductTags(mockProducts),
};
