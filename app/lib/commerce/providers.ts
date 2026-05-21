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

export const getAffiliateProviderAdapter = (network?: AffiliateNetwork) =>
  network ? providerAdapters[network] : null;

export const getAffiliateCommissionDefaults = (network?: AffiliateNetwork) => {
  const provider = getAffiliateProviderAdapter(network);
  if (!provider) {
    return null;
  }
  return provider.commission;
};

export const buildAffiliateClickId = ({
  network,
  productId,
}: {
  network: AffiliateNetwork | "direct" | "unknown";
  productId: number;
}) => `${network}-${productId}-${Date.now().toString(36)}`;
