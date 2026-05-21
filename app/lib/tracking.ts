import {
  trackOutboundRedirectEvent,
  type CommerceSearchSource,
} from "@/lib/analytics";
import type { AffiliateCommissionModel, AffiliateNetwork } from "@/lib/products";

const resolveSearchSource = (searchQuery: string): CommerceSearchSource =>
  searchQuery.trim() ? "onsite_search" : "homepage_browse";
const resolveRetailerName = (retailer: string, brand: string) =>
  retailer.trim() || brand.trim() || "Unknown Retailer";

type AffiliateClickAttribution = {
  provider: AffiliateNetwork | "direct" | "unknown";
  clickId?: string | null;
  commissionRate?: number;
  commissionModel?: AffiliateCommissionModel;
  source?: "affiliate" | "product" | "none";
  searchSource?: CommerceSearchSource;
  usedFallback?: boolean;
  trackingApplied?: boolean;
};

type ProductClickTrackingInput = {
  productId: string;
  productName: string;
  brand: string;
  retailer: string;
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
  retailer,
  category,
  vibe,
  price,
  searchQuery,
  destinationUrl,
  hasAffiliateUrl,
  attribution,
}: ProductClickTrackingInput) => {
  const resolvedRetailer = resolveRetailerName(retailer, brand);
  const resolvedSearchSource = attribution?.searchSource ?? resolveSearchSource(searchQuery);
  const trackingEvent = {
    productId,
    productName,
    brand,
    retailer: resolvedRetailer,
    category,
    price,
    searchQuery,
    searchSource: resolvedSearchSource,
    timestamp: new Date().toISOString(),
    destinationUrl,
    affiliateProvider: attribution?.provider,
    affiliateSource: attribution?.source,
    affiliateClickId: attribution?.clickId,
    commissionRate: attribution?.commissionRate,
    commissionModel: attribution?.commissionModel,
    usedFallback: attribution?.usedFallback,
  };

  trackOutboundRedirectEvent({
    productId,
    productName,
    brand,
    retailer: resolvedRetailer,
    category,
    vibe,
    price,
    destinationUrl,
    searchQuery,
    searchSource: resolvedSearchSource,
    hasAffiliateUrl,
    affiliateProvider: attribution?.provider,
    affiliateSource: attribution?.source,
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
