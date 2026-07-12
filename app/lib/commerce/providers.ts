import type {
  AffiliateCommissionModel,
  AffiliateNetwork,
} from "@/lib/products/types";

const publicEnv = {
  NEXT_PUBLIC_AWIN_MERCHANT_ID:
    process.env.NEXT_PUBLIC_AWIN_MERCHANT_ID?.trim() ?? "",
  NEXT_PUBLIC_AWIN_AFFILIATE_ID:
    process.env.NEXT_PUBLIC_AWIN_AFFILIATE_ID?.trim() ?? "",
  NEXT_PUBLIC_AWIN_SCRIPT_ENABLED:
    process.env.NEXT_PUBLIC_AWIN_SCRIPT_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_AWIN_SCRIPT_SRC:
    process.env.NEXT_PUBLIC_AWIN_SCRIPT_SRC?.trim() ?? "",
  NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID:
    process.env.NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID?.trim() ?? "",
  NEXT_PUBLIC_SKIMLINKS_SCRIPT_ENABLED:
    process.env.NEXT_PUBLIC_SKIMLINKS_SCRIPT_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_SKIMLINKS_SCRIPT_SRC:
    process.env.NEXT_PUBLIC_SKIMLINKS_SCRIPT_SRC?.trim() ?? "",
  NEXT_PUBLIC_SOVRN_KEY:
    process.env.NEXT_PUBLIC_SOVRN_KEY?.trim() ?? "",
  NEXT_PUBLIC_SOVRN_SCRIPT_ENABLED:
    process.env.NEXT_PUBLIC_SOVRN_SCRIPT_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_SOVRN_SCRIPT_SRC:
    process.env.NEXT_PUBLIC_SOVRN_SCRIPT_SRC?.trim() ?? "",
  NEXT_PUBLIC_IMPACT_CAMPAIGN:
    process.env.NEXT_PUBLIC_IMPACT_CAMPAIGN?.trim() ?? "",
  NEXT_PUBLIC_IMPACT_SCRIPT_ENABLED:
    process.env.NEXT_PUBLIC_IMPACT_SCRIPT_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_IMPACT_SCRIPT_SRC:
    process.env.NEXT_PUBLIC_IMPACT_SCRIPT_SRC?.trim() ?? "",
  NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID:
    process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID?.trim() ?? "",
  NEXT_PUBLIC_RAKUTEN_MERCHANT_ID:
    process.env.NEXT_PUBLIC_RAKUTEN_MERCHANT_ID?.trim() ?? "",
  NEXT_PUBLIC_RAKUTEN_SCRIPT_ENABLED:
    process.env.NEXT_PUBLIC_RAKUTEN_SCRIPT_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_RAKUTEN_SCRIPT_SRC:
    process.env.NEXT_PUBLIC_RAKUTEN_SCRIPT_SRC?.trim() ?? "",
  NEXT_PUBLIC_SHOPIFY_COLLABS_ENABLED:
    process.env.NEXT_PUBLIC_SHOPIFY_COLLABS_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_SHOPIFY_COLLABS_SCRIPT_ENABLED:
    process.env.NEXT_PUBLIC_SHOPIFY_COLLABS_SCRIPT_ENABLED?.trim() ?? "",
  NEXT_PUBLIC_SHOPIFY_COLLABS_SCRIPT_SRC:
    process.env.NEXT_PUBLIC_SHOPIFY_COLLABS_SCRIPT_SRC?.trim() ?? "",
};

type PublicEnvKey = keyof typeof publicEnv;

export type AffiliateProviderAdapter = {
  network: AffiliateNetwork;
  deeplinkBaseUrl: string;
  deeplinkDestinationParam: string;
  staticParams: Record<string, string | number | undefined>;
  requiredEnv: PublicEnvKey[];
  enabledByFlag?: PublicEnvKey;
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
  enabledByEnv: PublicEnvKey;
};

export type AffiliateProviderStatus = {
  network: AffiliateNetwork;
  configured: boolean;
  missingEnv: string[];
  scriptEnabled: boolean;
  scriptSrcConfigured: boolean;
};

const sanitizeRetailerKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isEnabledFlag = (value: string) =>
  ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());

const createAdapter = (
  adapter: AffiliateProviderAdapter,
): AffiliateProviderAdapter => adapter;

const providerAdapters: Record<AffiliateNetwork, AffiliateProviderAdapter> = {
  awin: createAdapter({
    network: "awin",
    deeplinkBaseUrl: "https://www.awin1.com/cread.php",
    deeplinkDestinationParam: "ued",
    staticParams: {
      awinmid: publicEnv.NEXT_PUBLIC_AWIN_MERCHANT_ID,
      awinaffid: publicEnv.NEXT_PUBLIC_AWIN_AFFILIATE_ID,
    },
    requiredEnv: [
      "NEXT_PUBLIC_AWIN_MERCHANT_ID",
      "NEXT_PUBLIC_AWIN_AFFILIATE_ID",
    ],
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
      id: publicEnv.NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID,
    },
    requiredEnv: ["NEXT_PUBLIC_SKIMLINKS_PUBLISHER_ID"],
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
      key: publicEnv.NEXT_PUBLIC_SOVRN_KEY,
    },
    requiredEnv: ["NEXT_PUBLIC_SOVRN_KEY"],
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
      campaign: publicEnv.NEXT_PUBLIC_IMPACT_CAMPAIGN,
    },
    requiredEnv: ["NEXT_PUBLIC_IMPACT_CAMPAIGN"],
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
      id: publicEnv.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID,
      mid: publicEnv.NEXT_PUBLIC_RAKUTEN_MERCHANT_ID,
    },
    requiredEnv: [
      "NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID",
      "NEXT_PUBLIC_RAKUTEN_MERCHANT_ID",
    ],
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
    requiredEnv: [],
    enabledByFlag: "NEXT_PUBLIC_SHOPIFY_COLLABS_ENABLED",
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
    src: publicEnv.NEXT_PUBLIC_AWIN_SCRIPT_SRC,
    strategy: "afterInteractive",
    globalName: "AWIN",
    enabledByEnv: "NEXT_PUBLIC_AWIN_SCRIPT_ENABLED",
  },
  skimlinks: {
    network: "skimlinks",
    src: publicEnv.NEXT_PUBLIC_SKIMLINKS_SCRIPT_SRC,
    strategy: "afterInteractive",
    globalName: "skimlinks",
    enabledByEnv: "NEXT_PUBLIC_SKIMLINKS_SCRIPT_ENABLED",
  },
  sovrn: {
    network: "sovrn",
    src: publicEnv.NEXT_PUBLIC_SOVRN_SCRIPT_SRC,
    strategy: "afterInteractive",
    globalName: "vglnk",
    enabledByEnv: "NEXT_PUBLIC_SOVRN_SCRIPT_ENABLED",
  },
  impact: {
    network: "impact",
    src: publicEnv.NEXT_PUBLIC_IMPACT_SCRIPT_SRC,
    strategy: "lazyOnload",
    globalName: "impact",
    enabledByEnv: "NEXT_PUBLIC_IMPACT_SCRIPT_ENABLED",
  },
  rakuten: {
    network: "rakuten",
    src: publicEnv.NEXT_PUBLIC_RAKUTEN_SCRIPT_SRC,
    strategy: "lazyOnload",
    globalName: "Rakuten",
    enabledByEnv: "NEXT_PUBLIC_RAKUTEN_SCRIPT_ENABLED",
  },
  "shopify-collabs": {
    network: "shopify-collabs",
    src: publicEnv.NEXT_PUBLIC_SHOPIFY_COLLABS_SCRIPT_SRC,
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

export const isAffiliateProviderConfigured = (network?: AffiliateNetwork) => {
  const provider = getAffiliateProviderAdapter(network);
  if (!provider) {
    return false;
  }

  const requiredEnvPresent = provider.requiredEnv.every((key) => Boolean(publicEnv[key]));
  const flagEnabled = provider.enabledByFlag
    ? isEnabledFlag(publicEnv[provider.enabledByFlag])
    : true;

  return requiredEnvPresent && flagEnabled;
};

export const getConfiguredAffiliateNetworks = () =>
  (Object.keys(providerAdapters) as AffiliateNetwork[]).filter((network) =>
    isAffiliateProviderConfigured(network),
  );

export const getAffiliateCommissionDefaults = (network?: AffiliateNetwork) => {
  const provider = getAffiliateProviderAdapter(network);
  if (!provider) {
    return null;
  }
  return provider.commission;
};

export const getAffiliateProviderScriptConfig = (network?: AffiliateNetwork) =>
  network ? providerScriptConfigs[network] : null;

const isAffiliateScriptEnabled = (config: AffiliateProviderScriptConfig) =>
  Boolean(config.src) && isEnabledFlag(publicEnv[config.enabledByEnv]);

export const getAffiliateProviderScriptConfigs = (networks: AffiliateNetwork[]) =>
  Array.from(new Set(networks))
    .map((network) => getAffiliateProviderScriptConfig(network))
    .filter((entry): entry is AffiliateProviderScriptConfig => Boolean(entry));

export const getEnabledAffiliateProviderScriptConfigs = (
  networks: AffiliateNetwork[] = Object.keys(providerAdapters) as AffiliateNetwork[],
) =>
  getAffiliateProviderScriptConfigs(networks).filter((config) =>
    isAffiliateScriptEnabled(config),
  );

export const getAffiliateProviderStatuses = (): AffiliateProviderStatus[] =>
  (Object.keys(providerAdapters) as AffiliateNetwork[]).map((network) => {
    const adapter = providerAdapters[network];
    const scriptConfig = providerScriptConfigs[network];
    const missingEnv: string[] = adapter.requiredEnv.filter((key) => !publicEnv[key]);
    if (adapter.enabledByFlag && !isEnabledFlag(publicEnv[adapter.enabledByFlag])) {
      missingEnv.push(`${adapter.enabledByFlag}=true`);
    }

    return {
      network,
      configured: isAffiliateProviderConfigured(network),
      missingEnv,
      scriptEnabled: isAffiliateScriptEnabled(scriptConfig),
      scriptSrcConfigured: Boolean(scriptConfig.src),
    };
  });

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

  return fallbackNetworks.find((network) => isAffiliateProviderConfigured(network)) ?? null;
};

export const buildAffiliateClickId = ({
  network,
  productId,
}: {
  network: AffiliateNetwork | "direct" | "unknown";
  productId: number;
}) => `${network}-${productId}-${Date.now().toString(36)}`;
