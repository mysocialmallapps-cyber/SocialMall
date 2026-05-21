import type { AffiliateCommissionModel, AffiliateNetwork, Product } from "./types";

export type ProductMonetizationMetadata = {
  productId: number;
  productName: string;
  retailer: string;
  category: string;
  hasAffiliateUrl: boolean;
  affiliateProvider: AffiliateNetwork | "direct" | "unknown";
  commissionRate?: number;
  commissionModel?: AffiliateCommissionModel;
  estimatedCommissionValue?: number;
};

const estimateCommission = (price: number, commissionRate?: number) => {
  if (!Number.isFinite(price) || price <= 0) {
    return undefined;
  }
  if (!Number.isFinite(commissionRate) || !commissionRate || commissionRate <= 0) {
    return undefined;
  }

  return Number((price * commissionRate).toFixed(2));
};

export const getProductMonetizationMetadata = (
  product: Pick<
    Product,
    | "id"
    | "name"
    | "retailer"
    | "category"
    | "price"
    | "affiliateUrl"
    | "affiliateNetwork"
    | "affiliateCommissionRate"
    | "affiliateCommissionModel"
  >,
): ProductMonetizationMetadata => {
  const hasAffiliateUrl = Boolean(product.affiliateUrl?.trim());
  const affiliateProvider = hasAffiliateUrl
    ? product.affiliateNetwork ?? "unknown"
    : "direct";
  const commissionRate = hasAffiliateUrl ? product.affiliateCommissionRate : undefined;
  const commissionModel = hasAffiliateUrl ? product.affiliateCommissionModel : undefined;

  return {
    productId: product.id,
    productName: product.name,
    retailer: product.retailer,
    category: product.category,
    hasAffiliateUrl,
    affiliateProvider,
    commissionRate,
    commissionModel,
    estimatedCommissionValue: estimateCommission(product.price, commissionRate),
  };
};
