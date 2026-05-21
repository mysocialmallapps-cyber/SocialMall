import type {
  AffiliateCommissionModel,
  AffiliateNetwork,
} from "@/lib/products/types";

export type AffiliateProviderAdapter = {
  network: AffiliateNetwork;
  deeplinkBaseUrl: string;
  deeplinkDestinationParam: string;
  staticParams: Record<string, string | number>;
  commission: {
    model: AffiliateCommissionModel;
    rate: number;
  };
  buildTrackingParams: (context: {
    productId: number;
    retailer: string;
    searchQuery?: string;
    clickId: string;
  }) => Record<string, string | number | undefined>;
};

export type AffiliateProviderScriptConfig = {
  network: AffiliateNetwork;
  src: string;
  strategy: "beforeInteractive" | "afterInteractive" | "lazyOnload";
  globalName: string;
  enabledByEnv: string;
};

const sanitizeRetailerKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createAdapter = (
  adapter: AffiliateProviderAdapter,
): AffiliateProviderAdapter => adapter;

const providerAdapters: Record<AffiliateNetwork, AffiliateProviderAdapter> = {
  awin: createAdapter({
    network: "awin",
    deeplinkBaseUrl: "https://www.awin1.com/cread.php",
    deeplinkDestinationParam: "ued",
    staticParams: {
      awinmid: 12345,
      awinaffid: 67890,
    },
    commission: {
      model: "cps",
      rate: 0.12,
    },
    buildTrackingParams: ({ clickId, searchQuery }) => ({
      clickref: clickId,
      sm_query: searchQuery?.trim() || undefined,
    }),
  }),
  skimlinks: createAdapter({
    network: "skimlinks",
    deeplinkBaseUrl: "https://go.skimresources.com",
    deeplinkDestinationParam: "url",
    staticParams: {
      id: 12345,
    },
    commission: {
      model: "cps",
      rate: 0.09,
    },
    buildTrackingParams: ({ clickId, searchQuery }) => ({
      xcust: clickId,
      sref: searchQuery?.trim() || undefined,
    }),
  }),
  sovrn: createAdapter({
    network: "sovrn",
    deeplinkBaseUrl: "https://redirect.viglink.com",
    deeplinkDestinationParam: "u",
    staticParams: {
      key: "socialmall-mock",
    },
    commission: {
      model: "cps",
      rate: 0.08,
    },
    buildTrackingParams: ({ clickId, searchQuery }) => ({
      subId: clickId,
      keyword: searchQuery?.trim() || undefined,
    }),
  }),
  impact: createAdapter({
    network: "impact",
    deeplinkBaseUrl: "https://api.impact.com/click",
    deeplinkDestinationParam: "url",
    staticParams: {
      campaign: "socialmall-fashion",
    },
    commission: {
      model: "cps",
      rate: 0.1,
    },
    buildTrackingParams: ({ clickId, searchQuery }) => ({
      subId1: clickId,
      subId2: searchQuery?.trim() || undefined,
    }),
  }),
  rakuten: createAdapter({
    network: "rakuten",
    deeplinkBaseUrl: "https://click.linksynergy.com/deeplink",
    deeplinkDestinationParam: "murl",
    staticParams: {
      id: "socialmall-mock",
      mid: 12345,
    },
    commission: {
      model: "cps",
      rate: 0.07,
    },
    buildTrackingParams: ({ clickId, searchQuery }) => ({
      subid: clickId,
      u1: searchQuery?.trim() || undefined,
    }),
  }),
  "shopify-collabs": createAdapter({
    network: "shopify-collabs",
    deeplinkBaseUrl: "",
    deeplinkDestinationParam: "url",
    staticParams: {},
    commission: {
      model: "cps",
      rate: 0.1,
    },
    buildTrackingParams: ({ productId, retailer, searchQuery, clickId }) => ({
      utm_source: "socialmall",
      utm_medium: "affiliate",
      utm_campaign: "shopify-collabs",
      utm_content: `${sanitizeRetailerKey(retailer)}-${productId}`,
      sm_query: searchQuery?.trim() || undefined,
      sm_click_id: clickId,
    }),
  }),
};

const providerHostMatchers: Record<AffiliateNetwork, string[]> = {
  awin: ["awin1.com", "awin.com"],
  skimlinks: ["skimresources.com", "skimlinks.com"],
  sovrn: ["viglink.com", "sovrn.com"],
  impact: ["impact.com"],
  rakuten: ["linksynergy.com", "rakutenadvertising.com"],
  "shopify-collabs": ["myshopify.com", "shopify.com"],
};

const providerScriptConfigs: Record<AffiliateNetwork, AffiliateProviderScriptConfig> = {
  awin: {
    network: "awin",
    src: "https://www.dwin1.com/19038.js",
    strategy: "afterInteractive",
    globalName: "AWIN",
    enabledByEnv: "NEXT_PUBLIC_AWIN_SCRIPT_ENABLED",
  },
  skimlinks: {
    network: "skimlinks",
    src: "https://s.skimresources.com/js/000X-skimlinks.js",
    strategy: "afterInteractive",
    globalName: "skimlinks",
    enabledByEnv: "NEXT_PUBLIC_SKIMLINKS_SCRIPT_ENABLED",
  },
  sovrn: {
    network: "sovrn",
    src: "https://scripts.viglink.com/api/vglnk.js",
    strategy: "afterInteractive",
    globalName: "vglnk",
    enabledByEnv: "NEXT_PUBLIC_SOVRN_SCRIPT_ENABLED",
  },
  impact: {
    network: "impact",
    src: "https://tracking.impact.com/aff.js",
    strategy: "lazyOnload",
    globalName: "impact",
    enabledByEnv: "NEXT_PUBLIC_IMPACT_SCRIPT_ENABLED",
  },
  rakuten: {
    network: "rakuten",
    src: "https://js.rmtag.com/tracking.js",
    strategy: "lazyOnload",
    globalName: "Rakuten",
    enabledByEnv: "NEXT_PUBLIC_RAKUTEN_SCRIPT_ENABLED",
  },
  "shopify-collabs": {
    network: "shopify-collabs",
    src: "https://cdn.shopify.com/shopifycloud/collabs.js",
    strategy: "lazyOnload",
    globalName: "ShopifyCollabs",
    enabledByEnv: "NEXT_PUBLIC_SHOPIFY_COLLABS_SCRIPT_ENABLED",
  },
};

export const defaultAffiliateProviderFallbacks: AffiliateNetwork[] = [
  "skimlinks",
  "sovrn",
  "impact",
  "rakuten",
  "awin",
];

export const getAffiliateProviderAdapter = (network?: AffiliateNetwork) =>
  network ? providerAdapters[network] : null;

export const getAffiliateCommissionDefaults = (network?: AffiliateNetwork) => {
  const provider = getAffiliateProviderAdapter(network);
  if (!provider) {
    return null;
  }
  return provider.commission;
};

export const getAffiliateProviderScriptConfig = (network?: AffiliateNetwork) =>
  network ? providerScriptConfigs[network] : null;

export const getAffiliateProviderScriptConfigs = (networks: AffiliateNetwork[]) =>
  Array.from(new Set(networks))
    .map((network) => getAffiliateProviderScriptConfig(network))
    .filter((entry): entry is AffiliateProviderScriptConfig => Boolean(entry));

export const detectAffiliateProviderFromUrl = (url?: string | null) => {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const match = (Object.keys(providerHostMatchers) as AffiliateNetwork[]).find((network) =>
      providerHostMatchers[network].some(
        (domain) => host === domain || host.endsWith(`.${domain}`),
      ),
    );

    return match ?? null;
  } catch {
    return null;
  }
};

export const resolveAffiliateProviderWithFallback = ({
  preferredNetwork,
  affiliateUrl,
  fallbackNetworks = defaultAffiliateProviderFallbacks,
}: {
  preferredNetwork?: AffiliateNetwork;
  affiliateUrl?: string | null;
  fallbackNetworks?: AffiliateNetwork[];
}) => {
  if (preferredNetwork) {
    return preferredNetwork;
  }

  const detected = detectAffiliateProviderFromUrl(affiliateUrl);
  if (detected) {
    return detected;
  }

  return fallbackNetworks[0] ?? null;
};

export const buildAffiliateClickId = ({
  network,
  productId,
}: {
  network: AffiliateNetwork | "direct" | "unknown";
  productId: number;
}) => `${network}-${productId}-${Date.now().toString(36)}`;
