import { trackOutboundRedirectEvent } from "@/lib/analytics";
import type { AffiliateCommissionModel, AffiliateNetwork } from "@/lib/products";

type AffiliateClickAttribution = {
  provider: AffiliateNetwork | "direct" | "unknown";
  clickId?: string | null;
  commissionRate?: number;
  commissionModel?: AffiliateCommissionModel;
  usedFallback?: boolean;
  trackingApplied?: boolean;
};

type ProductClickTrackingInput = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe?: string[];
  price: number;
  searchQuery: string;
  destinationUrl: string;
  hasAffiliateUrl: boolean;
  attribution?: AffiliateClickAttribution;
};

export const trackProductClick = ({
  productId,
  productName,
  brand,
  category,
  vibe,
  price,
  searchQuery,
  destinationUrl,
  hasAffiliateUrl,
  attribution,
}: ProductClickTrackingInput) => {
  const trackingEvent = {
    productId,
    productName,
    brand,
    category,
    price,
    searchQuery,
    timestamp: new Date().toISOString(),
    destinationUrl,
    affiliateProvider: attribution?.provider,
    affiliateClickId: attribution?.clickId,
    commissionRate: attribution?.commissionRate,
    commissionModel: attribution?.commissionModel,
    usedFallback: attribution?.usedFallback,
  };

  trackOutboundRedirectEvent({
    productId,
    productName,
    brand,
    category,
    vibe,
    destinationUrl,
    searchQuery,
    hasAffiliateUrl,
    affiliateProvider: attribution?.provider,
    affiliateClickId: attribution?.clickId,
    commissionRate: attribution?.commissionRate,
    commissionModel: attribution?.commissionModel,
    usedFallback: attribution?.usedFallback,
    trackingApplied: attribution?.trackingApplied,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("SocialMall product click", trackingEvent);
  }

  return trackingEvent;
};
