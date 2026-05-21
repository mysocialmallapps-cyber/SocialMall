import type { AffiliateNetwork } from "@/lib/products/types";
import {
  buildAffiliateClickId,
  getAffiliateProviderAdapter,
} from "./providers";

type ResolvedCommerceDestination = {
  destinationUrl: string | null;
  source: "affiliate" | "product" | "none";
  usedFallback: boolean;
};

export type ResolvedAffiliateRedirect = ResolvedCommerceDestination & {
  provider: AffiliateNetwork | "direct" | "unknown";
  trackingApplied: boolean;
  attribution: {
    clickId: string | null;
    provider: AffiliateNetwork | "direct" | "unknown";
    trackingParams: Record<string, string | number | undefined>;
    commission: {
      model: "cps" | "cpa";
      rate: number;
    } | null;
  };
};

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_INTERNAL_PATHS = ["/out/"];
const SOCIALMALL_HOSTS = new Set(["socialmall.com", "www.socialmall.com"]);

const parseUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
};

const sanitizeRetailerKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isBlockedInternalRedirect = (parsed: URL) => {
  const hostname = parsed.hostname.toLowerCase();
  if (!SOCIALMALL_HOSTS.has(hostname)) {
    return false;
  }

  return BLOCKED_INTERNAL_PATHS.some((path) => parsed.pathname.startsWith(path));
};

export const isValidOutboundUrl = (value?: string | null) => {
  const parsed = parseUrl(value);
  if (!parsed) {
    return false;
  }

  if (!SUPPORTED_PROTOCOLS.has(parsed.protocol) || !parsed.hostname) {
    return false;
  }

  return !isBlockedInternalRedirect(parsed);
};

export const appendTrackingParams = (
  value: string,
  params: Record<string, string | number | undefined>,
) => {
  const parsed = parseUrl(value);
  if (!parsed || !SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }

  Object.entries(params).forEach(([key, rawValue]) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return;
    }

    parsed.searchParams.set(key, String(rawValue));
  });

  return parsed.toString();
};

export const resolveCommerceDestination = ({
  affiliateUrl,
  productUrl,
}: {
  affiliateUrl?: string | null;
  productUrl?: string | null;
}): ResolvedCommerceDestination => {
  if (isValidOutboundUrl(affiliateUrl)) {
    return {
      destinationUrl: affiliateUrl ?? null,
      source: "affiliate",
      usedFallback: false,
    };
  }

  if (isValidOutboundUrl(productUrl)) {
    return {
      destinationUrl: productUrl ?? null,
      source: "product",
      usedFallback: Boolean(affiliateUrl),
    };
  }

  return {
    destinationUrl: null,
    source: "none",
    usedFallback: Boolean(affiliateUrl) || Boolean(productUrl),
  };
};

type RedirectTrackingContext = {
  productId: number;
  retailer: string;
  searchQuery?: string;
};

const applyAffiliateTrackingParams = ({
  affiliateUrl,
  network,
  context,
  clickId,
}: {
  affiliateUrl: string;
  network?: AffiliateNetwork;
  context: RedirectTrackingContext;
  clickId: string;
}) => {
  const providerAdapter = getAffiliateProviderAdapter(network);
  if (!network || !providerAdapter) {
    return affiliateUrl;
  }

  const trackingParams = {
    ...providerAdapter.buildTrackingParams({
      productId: context.productId,
      retailer: context.retailer,
      searchQuery: context.searchQuery,
      clickId,
    }),
    sm_click_id: clickId,
    sm_provider: network,
  };
  const tracked = appendTrackingParams(affiliateUrl, trackingParams);
  if (!tracked || !isValidOutboundUrl(tracked)) {
    return affiliateUrl;
  }

  return tracked;
};

const applyProductFallbackTrackingParams = ({
  productUrl,
  context,
  clickId,
}: {
  productUrl: string;
  context: RedirectTrackingContext;
  clickId: string;
}) => {
  const tracked = appendTrackingParams(productUrl, {
    utm_source: "socialmall",
    utm_medium: "affiliate_redirect",
    utm_campaign: "outbound_fallback",
    sm_product_id: context.productId,
    sm_retailer: sanitizeRetailerKey(context.retailer),
    sm_query: context.searchQuery?.trim() || undefined,
    sm_click_id: clickId,
  });

  if (!tracked || !isValidOutboundUrl(tracked)) {
    return productUrl;
  }

  return tracked;
};

export const resolveAffiliateRedirectDestination = ({
  affiliateUrl,
  productUrl,
  affiliateNetwork,
  productId,
  retailer,
  searchQuery,
}: {
  affiliateUrl?: string | null;
  productUrl?: string | null;
  affiliateNetwork?: AffiliateNetwork;
  productId: number;
  retailer: string;
  searchQuery?: string;
}): ResolvedAffiliateRedirect => {
  const trackingContext: RedirectTrackingContext = {
    productId,
    retailer,
    searchQuery,
  };
  const providerAdapter = getAffiliateProviderAdapter(affiliateNetwork);
  const clickId = buildAffiliateClickId({
    network: affiliateNetwork ?? "unknown",
    productId,
  });

  if (isValidOutboundUrl(affiliateUrl)) {
    const destination = applyAffiliateTrackingParams({
      affiliateUrl: affiliateUrl ?? "",
      network: affiliateNetwork,
      context: trackingContext,
      clickId,
    });

    return {
      destinationUrl: destination,
      source: "affiliate",
      usedFallback: false,
      provider: affiliateNetwork ?? "unknown",
      trackingApplied: destination !== affiliateUrl,
      attribution: {
        clickId,
        provider: affiliateNetwork ?? "unknown",
        trackingParams: providerAdapter
          ? providerAdapter.buildTrackingParams({
              productId,
              retailer,
              searchQuery,
              clickId,
            })
          : {},
        commission: providerAdapter ? providerAdapter.commission : null,
      },
    };
  }

  if (isValidOutboundUrl(productUrl)) {
    const fallbackClickId = buildAffiliateClickId({
      network: "direct",
      productId,
    });
    const fallbackDestination = applyProductFallbackTrackingParams({
      productUrl: productUrl ?? "",
      context: trackingContext,
      clickId: fallbackClickId,
    });

    return {
      destinationUrl: fallbackDestination,
      source: "product",
      usedFallback: Boolean(affiliateUrl),
      provider: "direct",
      trackingApplied: fallbackDestination !== productUrl,
      attribution: {
        clickId: fallbackClickId,
        provider: "direct",
        trackingParams: {
          utm_source: "socialmall",
          utm_medium: "affiliate_redirect",
          sm_click_id: fallbackClickId,
        },
        commission: null,
      },
    };
  }

  return {
    destinationUrl: null,
    source: "none",
    usedFallback: Boolean(affiliateUrl) || Boolean(productUrl),
    provider: affiliateNetwork ?? "unknown",
    trackingApplied: false,
    attribution: {
      clickId: null,
      provider: affiliateNetwork ?? "unknown",
      trackingParams: {},
      commission: providerAdapter ? providerAdapter.commission : null,
    },
  };
};

export const buildMockAffiliateUrl = ({
  network,
  productUrl,
  productId,
  retailer,
}: {
  network: AffiliateNetwork;
  productUrl: string;
  productId: number;
  retailer: string;
}) => {
  if (!isValidOutboundUrl(productUrl)) {
    return null;
  }

  const providerAdapter = getAffiliateProviderAdapter(network);
  if (!providerAdapter) {
    return null;
  }

  const clickId = buildAffiliateClickId({ network, productId });
  const trackingParams = providerAdapter.buildTrackingParams({
    productId,
    retailer,
    clickId,
  });

  const destination = (() => {
    if (providerAdapter.network === "shopify-collabs") {
      return appendTrackingParams(productUrl, trackingParams);
    }

    return appendTrackingParams(providerAdapter.deeplinkBaseUrl, {
      ...providerAdapter.staticParams,
      ...trackingParams,
      [providerAdapter.deeplinkDestinationParam]: productUrl,
    });
  })();

  if (!destination || !isValidOutboundUrl(destination)) {
    return null;
  }

  return destination;
};
