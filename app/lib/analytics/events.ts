import { trackEvent } from "./client";
import {
  estimateCommissionValue,
  resolveCommerceSearchSource,
  trackMonetizationEvent,
} from "./monetization";
import { trackProductEngagement } from "./product-engagement";
import { trackSearchIntent } from "./search-intent";
import type { CommerceSearchSource } from "./monetization";
import type { AffiliateCommissionModel, AffiliateNetwork } from "@/lib/products";
import type { ChipEventType, SearchEventSource } from "./types";

const AFFILIATE_PROVIDERS = new Set<AffiliateNetwork | "direct" | "unknown">([
  "awin",
  "skimlinks",
  "sovrn",
  "impact",
  "rakuten",
  "shopify-collabs",
  "direct",
  "unknown",
]);
const COMMISSION_MODELS = new Set<AffiliateCommissionModel>(["cpa", "cps"]);

const resolveAffiliateProvider = (provider?: string) =>
  provider && AFFILIATE_PROVIDERS.has(provider as AffiliateNetwork | "direct" | "unknown")
    ? (provider as AffiliateNetwork | "direct" | "unknown")
    : "unknown";

const resolveCommissionModel = (model?: string) =>
  model && COMMISSION_MODELS.has(model as AffiliateCommissionModel)
    ? (model as AffiliateCommissionModel)
    : undefined;

export const trackSearchEvent = ({
  query,
  source,
  resultCount,
}: {
  query: string;
  source: SearchEventSource;
  resultCount: number;
}) => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return;
  }

  const searchIntent = trackSearchIntent({
    rawQuery: query,
    source,
    resultCount,
  });

  if (searchIntent?.duplicate) {
    return;
  }

  trackEvent(
    "search",
    {
      raw_query: searchIntent?.rawQuery ?? query.trim(),
      normalized_query:
        searchIntent?.normalizedQuery ?? normalizedQuery.toLowerCase(),
      source,
      timestamp: searchIntent?.timestamp ?? new Date().toISOString(),
      search_frequency: searchIntent?.searchFrequency,
      zero_results: searchIntent?.zeroResults ?? resultCount === 0,
      result_count: resultCount,
    },
    {
      dedupeKey: `search:${source}:${
        searchIntent?.normalizedQuery ?? normalizedQuery.toLowerCase()
      }`,
    },
  );
};

export const trackChipClickEvent = ({
  chipType,
  chipValue,
  activeQuery,
}: {
  chipType: ChipEventType;
  chipValue: string;
  activeQuery?: string;
}) => {
  const normalizedValue = chipValue.trim();
  if (!normalizedValue) {
    return;
  }

  trackEvent("chip_click", {
    chip_type: chipType,
    chip_value: normalizedValue,
    active_query: activeQuery?.trim() || undefined,
  });
};

export const trackProductClickEvent = ({
  productId,
  productName,
  brand,
  category,
  vibe,
  price,
  searchQuery,
}: {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe?: string[];
  price: number;
  searchQuery: string;
}) => {
  const engagementRecord = trackProductEngagement({
    eventType: "product_click",
    productId,
    productName,
    brand,
    category,
    vibe,
    searchQuery,
  });

  if (engagementRecord?.duplicate) {
    return;
  }

  trackEvent(
    "product_click",
    {
      product_id: productId,
      product_name: productName,
      brand,
      category,
      aesthetic_vibe: engagementRecord?.vibe.join("|") || vibe?.join("|") || undefined,
      price,
      originating_search_query:
        engagementRecord?.searchQuery || searchQuery.trim() || undefined,
      timestamp: engagementRecord?.timestamp ?? new Date().toISOString(),
    },
    {
      dedupeKey: `product_click:${productId}:${
        engagementRecord?.searchQuery ?? searchQuery.toLowerCase()
      }`,
    },
  );
};

export const trackOutboundRedirectEvent = ({
  productId,
  productName,
  brand,
  retailer,
  category,
  vibe,
  price,
  destinationUrl,
  searchQuery,
  searchSource,
  hasAffiliateUrl,
  affiliateProvider,
  affiliateSource,
  affiliateClickId,
  commissionRate,
  commissionModel,
  usedFallback,
  trackingApplied,
}: {
  productId: string;
  productName: string;
  brand: string;
  retailer: string;
  category: string;
  vibe?: string[];
  price: number;
  destinationUrl: string;
  searchQuery: string;
  searchSource?: CommerceSearchSource;
  hasAffiliateUrl: boolean;
  affiliateProvider?: string;
  affiliateSource?: "affiliate" | "product" | "none";
  affiliateClickId?: string | null;
  commissionRate?: number;
  commissionModel?: string;
  usedFallback?: boolean;
  trackingApplied?: boolean;
}) => {
  const engagementRecord = trackProductEngagement({
    eventType: "outbound_redirect",
    productId,
    productName,
    brand,
    category,
    vibe,
    searchQuery,
    destinationUrl,
    hasAffiliateUrl,
  });

  if (engagementRecord?.duplicate) {
    return;
  }

  const resolvedSearchSource = resolveCommerceSearchSource({
    searchQuery,
    searchSource,
  });
  const monetizationRecord = trackMonetizationEvent({
    eventType: "outbound_redirect",
    productId,
    productName,
    retailer,
    category,
    price,
    destinationUrl,
    affiliateProvider: resolveAffiliateProvider(affiliateProvider),
    affiliateSource: affiliateSource ?? "none",
    affiliateClickId,
    hasAffiliateUrl,
    commissionRate,
    commissionModel: resolveCommissionModel(commissionModel),
    searchQuery,
    searchSource: resolvedSearchSource,
    trackingApplied,
  });
  const estimatedCommission =
    monetizationRecord?.estimatedCommissionValue ??
    estimateCommissionValue({ price, commissionRate });

  trackEvent(
    "outbound_redirect",
    {
      product_id: productId,
      product_name: productName,
      brand,
      retailer,
      category,
      aesthetic_vibe: engagementRecord?.vibe.join("|") || vibe?.join("|") || undefined,
      price,
      destination_url: destinationUrl,
      originating_search_query:
        engagementRecord?.searchQuery || searchQuery.trim() || undefined,
      search_source: resolvedSearchSource,
      timestamp: engagementRecord?.timestamp ?? new Date().toISOString(),
      has_affiliate_url: hasAffiliateUrl,
      affiliate_provider: affiliateProvider,
      affiliate_source: affiliateSource,
      affiliate_click_id: affiliateClickId ?? undefined,
      commission_rate: commissionRate,
      commission_model: commissionModel,
      estimated_commission_value: estimatedCommission,
      used_fallback_url: usedFallback,
      affiliate_tracking_applied: trackingApplied,
    },
    {
      dedupeKey: `outbound_redirect:${productId}:${
        affiliateClickId ?? destinationUrl
      }`,
      dedupeWindowMs: 5000,
    },
  );
};
