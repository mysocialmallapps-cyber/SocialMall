import type { AffiliateNetwork } from "@/lib/products/types";

type ResolvedCommerceDestination = {
  destinationUrl: string | null;
  source: "affiliate" | "product" | "none";
  usedFallback: boolean;
};

export type ResolvedAffiliateRedirect = ResolvedCommerceDestination & {
  provider: AffiliateNetwork | "direct" | "unknown";
  trackingApplied: boolean;
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

const affiliateProviderTrackingBuilders: Record<
  AffiliateNetwork,
  (context: RedirectTrackingContext) => Record<string, string | number | undefined>
> = {
  awin: ({ productId, searchQuery }) => ({
    clickref: `socialmall-${productId}`,
    sm_query: searchQuery?.trim() || undefined,
  }),
  skimlinks: ({ productId, searchQuery }) => ({
    sref: `socialmall-${productId}`,
    xcust: searchQuery?.trim() || undefined,
  }),
  sovrn: ({ productId, searchQuery }) => ({
    subId: `socialmall-${productId}`,
    keyword: searchQuery?.trim() || undefined,
  }),
  impact: ({ productId, searchQuery }) => ({
    subId1: `socialmall-${productId}`,
    subId2: searchQuery?.trim() || undefined,
  }),
  rakuten: ({ productId, searchQuery }) => ({
    subid: `socialmall-${productId}`,
    u1: searchQuery?.trim() || undefined,
  }),
  "shopify-collabs": ({ productId, retailer, searchQuery }) => ({
    utm_source: "socialmall",
    utm_medium: "affiliate",
    utm_campaign: "shopify-collabs",
    utm_content: `${sanitizeRetailerKey(retailer)}-${productId}`,
    sm_query: searchQuery?.trim() || undefined,
  }),
};

const applyAffiliateTrackingParams = ({
  affiliateUrl,
  network,
  context,
}: {
  affiliateUrl: string;
  network?: AffiliateNetwork;
  context: RedirectTrackingContext;
}) => {
  if (!network) {
    return affiliateUrl;
  }

  const trackingBuilder = affiliateProviderTrackingBuilders[network];
  if (!trackingBuilder) {
    return affiliateUrl;
  }

  const tracked = appendTrackingParams(affiliateUrl, trackingBuilder(context));
  if (!tracked || !isValidOutboundUrl(tracked)) {
    return affiliateUrl;
  }

  return tracked;
};

const applyProductFallbackTrackingParams = ({
  productUrl,
  context,
}: {
  productUrl: string;
  context: RedirectTrackingContext;
}) => {
  const tracked = appendTrackingParams(productUrl, {
    utm_source: "socialmall",
    utm_medium: "affiliate_redirect",
    utm_campaign: "outbound_fallback",
    sm_product_id: context.productId,
    sm_retailer: sanitizeRetailerKey(context.retailer),
    sm_query: context.searchQuery?.trim() || undefined,
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

  if (isValidOutboundUrl(affiliateUrl)) {
    const destination = applyAffiliateTrackingParams({
      affiliateUrl: affiliateUrl ?? "",
      network: affiliateNetwork,
      context: trackingContext,
    });

    return {
      destinationUrl: destination,
      source: "affiliate",
      usedFallback: false,
      provider: affiliateNetwork ?? "unknown",
      trackingApplied: destination !== affiliateUrl,
    };
  }

  if (isValidOutboundUrl(productUrl)) {
    const fallbackDestination = applyProductFallbackTrackingParams({
      productUrl: productUrl ?? "",
      context: trackingContext,
    });

    return {
      destinationUrl: fallbackDestination,
      source: "product",
      usedFallback: Boolean(affiliateUrl),
      provider: "direct",
      trackingApplied: fallbackDestination !== productUrl,
    };
  }

  return {
    destinationUrl: null,
    source: "none",
    usedFallback: Boolean(affiliateUrl) || Boolean(productUrl),
    provider: affiliateNetwork ?? "unknown",
    trackingApplied: false,
  };
};

const buildAwinUrl = ({
  productUrl,
  productId,
}: {
  productUrl: string;
  productId: number;
}) =>
  appendTrackingParams("https://www.awin1.com/cread.php", {
    awinmid: 12345,
    awinaffid: 67890,
    clickref: `socialmall-${productId}`,
    ued: productUrl,
  });

const buildImpactUrl = ({
  productUrl,
  productId,
}: {
  productUrl: string;
  productId: number;
}) =>
  appendTrackingParams("https://api.impact.com/click", {
    campaign: "socialmall-fashion",
    subId1: `socialmall-${productId}`,
    url: productUrl,
  });

const buildSkimlinksUrl = ({
  productUrl,
  productId,
}: {
  productUrl: string;
  productId: number;
}) =>
  appendTrackingParams("https://go.skimresources.com", {
    id: 12345,
    xcust: `socialmall-${productId}`,
    url: productUrl,
  });

const buildSovrnUrl = ({
  productUrl,
  productId,
}: {
  productUrl: string;
  productId: number;
}) =>
  appendTrackingParams("https://redirect.viglink.com", {
    key: "socialmall-mock",
    subId: `socialmall-${productId}`,
    u: productUrl,
  });

const buildRakutenUrl = ({
  productUrl,
  productId,
}: {
  productUrl: string;
  productId: number;
}) =>
  appendTrackingParams("https://click.linksynergy.com/deeplink", {
    id: "socialmall-mock",
    mid: 12345,
    murl: productUrl,
    subid: `socialmall-${productId}`,
  });

const buildShopifyCollabsUrl = ({
  productUrl,
  productId,
  retailer,
}: {
  productUrl: string;
  productId: number;
  retailer: string;
}) =>
  appendTrackingParams(productUrl, {
    utm_source: "socialmall",
    utm_medium: "affiliate",
    utm_campaign: "mock-catalog",
    utm_content: `${retailer.toLowerCase().replace(/\s+/g, "-")}-${productId}`,
  });

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

  switch (network) {
    case "awin":
      return buildAwinUrl({ productUrl, productId });
    case "impact":
      return buildImpactUrl({ productUrl, productId });
    case "skimlinks":
      return buildSkimlinksUrl({ productUrl, productId });
    case "sovrn":
      return buildSovrnUrl({ productUrl, productId });
    case "rakuten":
      return buildRakutenUrl({ productUrl, productId });
    case "shopify-collabs":
      return buildShopifyCollabsUrl({ productUrl, productId, retailer });
    default:
      return null;
  }
};
