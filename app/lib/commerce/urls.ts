import type { AffiliateNetwork } from "@/lib/products/types";
import {
  buildAffiliateClickId,
  defaultAffiliateProviderFallbacks,
  getAffiliateProviderAdapter,
  isAffiliateProviderConfigured,
  resolveAffiliateProviderWithFallback,
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
const SOCIALMALL_HOSTS = new Set([
  "socialmall.com",
  "www.socialmall.com",
  "social-mall.vercel.app",
]);
const UNKNOWN_RETAILER_FALLBACK = "unknown-retailer";
const UNKNOWN_RETAILER_LABEL = "Unknown Retailer";

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

export const normalizeOutboundUrl = (value?: string | null) => {
  const parsed = parseUrl(value);
  if (!parsed) {
    return null;
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  return parsed.toString();
};

const sanitizeRetailerKey = (value: string) =>
  (value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || UNKNOWN_RETAILER_FALLBACK);

const normalizeRetailerName = (value?: string | null) => {
  const trimmed = value?.trim() ?? "";
  return trimmed || UNKNOWN_RETAILER_LABEL;
};

const isBlockedInternalRedirect = (parsed: URL) => {
  const hostname = parsed.hostname.toLowerCase();
  if (!SOCIALMALL_HOSTS.has(hostname)) {
    return false;
  }

  return BLOCKED_INTERNAL_PATHS.some((path) => parsed.pathname.startsWith(path));
};

export const isValidOutboundUrl = (value?: string | null) => {
  const normalized = normalizeOutboundUrl(value);
  const parsed = parseUrl(normalized);
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
  const parsed = parseUrl(normalizeOutboundUrl(value));
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
  retailer?: string;
  searchQuery?: string;
}): ResolvedAffiliateRedirect => {
  const trackingContext: RedirectTrackingContext = {
    productId,
    retailer: normalizeRetailerName(retailer),
    searchQuery,
  };
  const resolvedProvider = resolveAffiliateProviderWithFallback({
    preferredNetwork: affiliateNetwork,
    affiliateUrl,
    fallbackNetworks: [],
  });
  const providerAdapter = getAffiliateProviderAdapter(resolvedProvider ?? undefined);
  const clickId = buildAffiliateClickId({
    network: resolvedProvider ?? "unknown",
    productId,
  });

  if (isValidOutboundUrl(affiliateUrl)) {
    const normalizedAffiliateUrl = normalizeOutboundUrl(affiliateUrl) ?? affiliateUrl ?? "";
    const destination = applyAffiliateTrackingParams({
      affiliateUrl: normalizedAffiliateUrl,
      network: resolvedProvider ?? undefined,
      context: trackingContext,
      clickId,
    });

    return {
      destinationUrl: destination,
      source: "affiliate",
      usedFallback: false,
      provider: resolvedProvider ?? "unknown",
      trackingApplied: destination !== normalizedAffiliateUrl,
      attribution: {
        clickId,
        provider: resolvedProvider ?? "unknown",
        trackingParams: providerAdapter
          ? providerAdapter.buildTrackingParams({
              productId,
              retailer: trackingContext.retailer,
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
      productUrl: normalizeOutboundUrl(productUrl) ?? "",
      context: trackingContext,
      clickId: fallbackClickId,
    });

    return {
      destinationUrl: fallbackDestination,
      source: "product",
      usedFallback: Boolean(affiliateUrl),
      provider: "direct",
      trackingApplied:
        fallbackDestination !== (normalizeOutboundUrl(productUrl) ?? productUrl),
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
    provider: resolvedProvider ?? "unknown",
    trackingApplied: false,
    attribution: {
      clickId: null,
      provider: resolvedProvider ?? "unknown",
      trackingParams: {},
      commission: providerAdapter ? providerAdapter.commission : null,
    },
  };
};

export const buildAffiliateUrl = ({
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

  const providerCandidates = Array.from(
    new Set([network, ...defaultAffiliateProviderFallbacks]),
  );

  for (const candidate of providerCandidates) {
    const providerAdapter = getAffiliateProviderAdapter(candidate);
    if (!providerAdapter || !isAffiliateProviderConfigured(candidate)) {
      continue;
    }

    const clickId = buildAffiliateClickId({ network: candidate, productId });
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
      continue;
    }

    return destination;
  }

  return null;
};
