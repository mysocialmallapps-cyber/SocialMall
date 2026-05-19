import { trackEvent } from "./client";
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
  price,
  searchQuery,
}: {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  searchQuery: string;
}) => {
  trackEvent(
    "product_click",
    {
      product_id: productId,
      product_name: productName,
      brand,
      category,
      price,
      search_query: searchQuery.trim() || undefined,
    },
    {
      dedupeKey: `product_click:${productId}:${searchQuery.toLowerCase()}`,
    },
  );
};

export const trackOutboundRedirectEvent = ({
  productId,
  destinationUrl,
  searchQuery,
  hasAffiliateUrl,
}: {
  productId: string;
  destinationUrl: string;
  searchQuery: string;
  hasAffiliateUrl: boolean;
}) => {
  trackEvent(
    "outbound_redirect",
    {
      product_id: productId,
      destination_url: destinationUrl,
      search_query: searchQuery.trim() || undefined,
      has_affiliate_url: hasAffiliateUrl,
    },
    {
      dedupeKey: `outbound_redirect:${productId}:${destinationUrl}`,
      dedupeWindowMs: 5000,
    },
  );
};
