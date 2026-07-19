import type { Product } from "./types";

export type ProductTrustLevel = "verified-product" | "verification-needed";

export type ProductTrustSummary = {
  totalCount: number;
  verifiedProductCount: number;
  needsVerificationCount: number;
  verifiedImageCount: number;
  verifiedProductUrlCount: number;
  brandSiteLinkCount: number;
  trustScore: number;
};

export const isVerifiedProduct = (product: Product) =>
  product.catalogSource === "verified-retailer" &&
  product.imageVerificationStatus === "verified-product-image" &&
  product.productUrlVerificationStatus === "verified-product-page";

export const getProductTrustLevel = (product: Product): ProductTrustLevel =>
  isVerifiedProduct(product) ? "verified-product" : "verification-needed";

export const getProductTrustLabel = (product: Product) =>
  isVerifiedProduct(product) ? "Verified product" : "Verification needed";

export const getProductActionLabel = (product: Product) =>
  isVerifiedProduct(product) ? "View exact product" : "Browse brand";

export const getProductTrustSummary = (products: Product[]): ProductTrustSummary => {
  const totalCount = products.length;
  const verifiedProductCount = products.filter(isVerifiedProduct).length;
  const verifiedImageCount = products.filter(
    (product) => product.imageVerificationStatus === "verified-product-image",
  ).length;
  const verifiedProductUrlCount = products.filter(
    (product) => product.productUrlVerificationStatus === "verified-product-page",
  ).length;
  const brandSiteLinkCount = products.filter(
    (product) => product.productUrlVerificationStatus === "brand-site",
  ).length;

  return {
    totalCount,
    verifiedProductCount,
    needsVerificationCount: totalCount - verifiedProductCount,
    verifiedImageCount,
    verifiedProductUrlCount,
    brandSiteLinkCount,
    trustScore: totalCount ? verifiedProductCount / totalCount : 0,
  };
};

export const getVerificationQueue = (products: Product[], limit = 12) =>
  [...products]
    .filter((product) => !isVerifiedProduct(product))
    .sort((a, b) => {
      if (a.popularityScore !== b.popularityScore) {
        return b.popularityScore - a.popularityScore;
      }

      return a.price - b.price;
    })
    .slice(0, limit);
