import type { AffiliateNetwork } from "@/lib/products/types";

type ResolvedCommerceDestination = {
  destinationUrl: string | null;
  source: "affiliate" | "product" | "none";
  usedFallback: boolean;
};

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

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

export const isValidOutboundUrl = (value?: string | null) => {
  const parsed = parseUrl(value);
  if (!parsed) {
    return false;
  }

  return SUPPORTED_PROTOCOLS.has(parsed.protocol) && Boolean(parsed.hostname);
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
    case "rakuten":
      return buildRakutenUrl({ productUrl, productId });
    case "shopify-collabs":
      return buildShopifyCollabsUrl({ productUrl, productId, retailer });
    default:
      return null;
  }
};
