import { trackEvent } from "./client";
import { trackProductEngagement } from "./product-engagement";
import { trackSearchIntent } from "./search-intent";
import type { ChipEventType, SearchEventSource } from "./types";

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
  category,
  vibe,
  destinationUrl,
  searchQuery,
  hasAffiliateUrl,
  affiliateProvider,
  affiliateClickId,
  commissionRate,
  commissionModel,
  usedFallback,
  trackingApplied,
}: {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe?: string[];
  destinationUrl: string;
  searchQuery: string;
  hasAffiliateUrl: boolean;
  affiliateProvider?: string;
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

  trackEvent(
    "outbound_redirect",
    {
      product_id: productId,
      product_name: productName,
      brand,
      category,
      aesthetic_vibe: engagementRecord?.vibe.join("|") || vibe?.join("|") || undefined,
      destination_url: destinationUrl,
      originating_search_query:
        engagementRecord?.searchQuery || searchQuery.trim() || undefined,
      timestamp: engagementRecord?.timestamp ?? new Date().toISOString(),
      has_affiliate_url: hasAffiliateUrl,
      affiliate_provider: affiliateProvider,
      affiliate_click_id: affiliateClickId ?? undefined,
      commission_rate: commissionRate,
      commission_model: commissionModel,
      used_fallback_url: usedFallback,
      affiliate_tracking_applied: trackingApplied,
    },
    {
      dedupeKey: `outbound_redirect:${productId}:${destinationUrl}`,
      dedupeWindowMs: 5000,
    },
  );
};
