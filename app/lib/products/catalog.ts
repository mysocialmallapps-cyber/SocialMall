import { buildProductIndexes, extractUniqueProductTags } from "./helpers";
import { curatedProducts } from "./curated-products";

export const productCatalog = {
  all: curatedProducts,
  indexes: buildProductIndexes(curatedProducts),
  tags: extractUniqueProductTags(curatedProducts),
};
