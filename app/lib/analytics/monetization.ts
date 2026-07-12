import type {
  AffiliateCommissionModel,
  AffiliateNetwork,
} from "@/lib/products/types";

const STORAGE_KEY = "socialmall.monetization.analytics.v1";
const RECENT_EVENT_LIMIT = 50;
const DUPLICATE_WINDOW_MS = 1200;

type MonetizationEventType = "outbound_redirect";
type MonetizationProvider = AffiliateNetwork | "direct" | "unknown";
type MonetizationAffiliateSource = "affiliate" | "product" | "brand" | "none";

export type CommerceSearchSource = "onsite_search" | "homepage_browse" | "unknown";

export type MonetizationEventRecord = {
  eventType: MonetizationEventType;
  productId: string;
  productName: string;
  retailer: string;
  category: string;
  price: number;
  destinationUrl: string;
  affiliateProvider: MonetizationProvider;
  affiliateSource: MonetizationAffiliateSource;
  affiliateClickId?: string;
  hasAffiliateUrl: boolean;
  commissionRate?: number;
  commissionModel?: AffiliateCommissionModel;
  estimatedCommissionValue?: number;
  searchQuery: string;
  searchSource: CommerceSearchSource;
  trackingApplied?: boolean;
  timestamp: string;
};

type ProviderAggregate = {
  provider: MonetizationProvider;
  clickCount: number;
  estimatedCommissionValue: number;
  lastClickAt: string;
};

type CategoryAggregate = {
  category: string;
  clickCount: number;
  estimatedCommissionValue: number;
  lastClickAt: string;
};

type MonetizationAnalyticsStore = {
  version: 1;
  totalMonetizableClicks: number;
  totalEstimatedCommissionValue: number;
  providerAggregates: Record<string, ProviderAggregate>;
  categoryAggregates: Record<string, CategoryAggregate>;
  recentEvents: MonetizationEventRecord[];
};

type TrackMonetizationEventInput = {
  eventType: MonetizationEventType;
  productId: string;
  productName: string;
  retailer: string;
  category: string;
  price: number;
  destinationUrl: string;
  affiliateProvider: MonetizationProvider;
  affiliateSource: MonetizationAffiliateSource;
  affiliateClickId?: string | null;
  hasAffiliateUrl: boolean;
  commissionRate?: number;
  commissionModel?: AffiliateCommissionModel;
  searchQuery?: string;
  searchSource?: CommerceSearchSource;
  trackingApplied?: boolean;
  timestamp?: number;
};

type TrackedMonetizationEvent = MonetizationEventRecord & {
  duplicate: boolean;
};

export type MonetizationSummary = {
  totalMonetizableClicks: number;
  totalEstimatedCommissionValue: number;
  topProviders: ProviderAggregate[];
  topCategories: CategoryAggregate[];
};

const defaultStore = (): MonetizationAnalyticsStore => ({
  version: 1,
  totalMonetizableClicks: 0,
  totalEstimatedCommissionValue: 0,
  providerAggregates: {},
  categoryAggregates: {},
  recentEvents: [],
});

const isBrowser = () => typeof window !== "undefined";

const hasStorage = () => {
  if (!isBrowser()) {
    return false;
  }

  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const normalizeSearchQuery = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, " ");

const toIsoString = (timestampMs: number) => new Date(timestampMs).toISOString();

const toPositiveNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const sanitizeStore = (value: unknown): MonetizationAnalyticsStore => {
  if (!value || typeof value !== "object") {
    return defaultStore();
  }

  const parsed = value as Partial<MonetizationAnalyticsStore>;
  if (parsed.version !== 1) {
    return defaultStore();
  }

  return {
    version: 1,
    totalMonetizableClicks: toPositiveNumber(parsed.totalMonetizableClicks),
    totalEstimatedCommissionValue: toPositiveNumber(parsed.totalEstimatedCommissionValue),
    providerAggregates:
      parsed.providerAggregates && typeof parsed.providerAggregates === "object"
        ? parsed.providerAggregates
        : {},
    categoryAggregates:
      parsed.categoryAggregates && typeof parsed.categoryAggregates === "object"
        ? parsed.categoryAggregates
        : {},
    recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents : [],
  };
};

let cachedStore: MonetizationAnalyticsStore | null = null;
let lastSignature = "";
let lastSignatureTimestamp = 0;

const getStore = () => {
  if (cachedStore) {
    return cachedStore;
  }

  if (!hasStorage()) {
    cachedStore = defaultStore();
    return cachedStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cachedStore = sanitizeStore(raw ? JSON.parse(raw) : null);
    return cachedStore;
  } catch {
    cachedStore = defaultStore();
    return cachedStore;
  }
};

const persistStore = (store: MonetizationAnalyticsStore) => {
  if (!hasStorage()) {
    return;
  }

  const browserWindow = globalThis.window;
  if (!browserWindow) {
    return;
  }

  const persist = () => {
    try {
      browserWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore storage write failures to preserve redirect speed.
    }
  };

  if (typeof browserWindow.requestIdleCallback === "function") {
    browserWindow.requestIdleCallback(persist);
    return;
  }

  globalThis.setTimeout(persist, 0);
};

const isDuplicateEvent = (signature: string, timestamp: number) => {
  if (
    lastSignature === signature &&
    timestamp - lastSignatureTimestamp < DUPLICATE_WINDOW_MS
  ) {
    return true;
  }

  lastSignature = signature;
  lastSignatureTimestamp = timestamp;
  return false;
};

const normalizeSearchSource = (
  searchSource?: CommerceSearchSource,
): CommerceSearchSource => {
  if (searchSource === "onsite_search" || searchSource === "homepage_browse") {
    return searchSource;
  }

  if (searchSource === "unknown") {
    return "unknown";
  }

  return "unknown";
};

export const resolveCommerceSearchSource = ({
  searchQuery,
  searchSource,
}: {
  searchQuery?: string;
  searchSource?: CommerceSearchSource;
}): CommerceSearchSource => {
  const normalizedSource = normalizeSearchSource(searchSource);
  if (normalizedSource !== "unknown") {
    return normalizedSource;
  }

  if (searchQuery?.trim()) {
    return "onsite_search";
  }

  return "homepage_browse";
};

export const estimateCommissionValue = ({
  price,
  commissionRate,
}: {
  price: number;
  commissionRate?: number;
}) => {
  if (!Number.isFinite(price) || price <= 0) {
    return undefined;
  }

  if (!Number.isFinite(commissionRate) || !commissionRate || commissionRate <= 0) {
    return undefined;
  }

  return Number((price * commissionRate).toFixed(2));
};

export const trackMonetizationEvent = ({
  eventType,
  productId,
  productName,
  retailer,
  category,
  price,
  destinationUrl,
  affiliateProvider,
  affiliateSource,
  affiliateClickId,
  hasAffiliateUrl,
  commissionRate,
  commissionModel,
  searchQuery = "",
  searchSource,
  trackingApplied,
  timestamp,
}: TrackMonetizationEventInput): TrackedMonetizationEvent | null => {
  if (!isBrowser()) {
    return null;
  }

  const trimmedProductId = productId.trim();
  const trimmedProductName = productName.trim();
  const trimmedRetailer = retailer.trim();
  const trimmedCategory = category.trim();
  const trimmedDestinationUrl = destinationUrl.trim();
  if (
    !trimmedProductId ||
    !trimmedProductName ||
    !trimmedRetailer ||
    !trimmedCategory ||
    !trimmedDestinationUrl
  ) {
    return null;
  }

  const trackedTimestamp = timestamp ?? Date.now();
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery);
  const resolvedSearchSource = resolveCommerceSearchSource({
    searchQuery: normalizedSearchQuery,
    searchSource,
  });
  const estimatedCommissionValue = estimateCommissionValue({
    price,
    commissionRate,
  });
  const signature = `${eventType}:${trimmedProductId}:${
    affiliateClickId ?? trimmedDestinationUrl
  }:${resolvedSearchSource}`;
  const duplicate = isDuplicateEvent(signature, trackedTimestamp);
  const eventRecord: MonetizationEventRecord = {
    eventType,
    productId: trimmedProductId,
    productName: trimmedProductName,
    retailer: trimmedRetailer,
    category: trimmedCategory,
    price,
    destinationUrl: trimmedDestinationUrl,
    affiliateProvider,
    affiliateSource,
    affiliateClickId: affiliateClickId ?? undefined,
    hasAffiliateUrl,
    commissionRate,
    commissionModel,
    estimatedCommissionValue,
    searchQuery: normalizedSearchQuery,
    searchSource: resolvedSearchSource,
    trackingApplied,
    timestamp: toIsoString(trackedTimestamp),
  };

  if (duplicate) {
    return {
      ...eventRecord,
      duplicate: true,
    };
  }

  const store = getStore();
  store.totalMonetizableClicks += 1;
  store.totalEstimatedCommissionValue = Number(
    (store.totalEstimatedCommissionValue + (estimatedCommissionValue ?? 0)).toFixed(2),
  );

  const providerKey = affiliateProvider || "unknown";
  const providerAggregate = store.providerAggregates[providerKey] ?? {
    provider: affiliateProvider,
    clickCount: 0,
    estimatedCommissionValue: 0,
    lastClickAt: eventRecord.timestamp,
  };
  providerAggregate.clickCount += 1;
  providerAggregate.estimatedCommissionValue = Number(
    (
      providerAggregate.estimatedCommissionValue + (estimatedCommissionValue ?? 0)
    ).toFixed(2),
  );
  providerAggregate.lastClickAt = eventRecord.timestamp;
  store.providerAggregates[providerKey] = providerAggregate;

  const categoryKey = trimmedCategory.toLowerCase();
  const categoryAggregate = store.categoryAggregates[categoryKey] ?? {
    category: trimmedCategory,
    clickCount: 0,
    estimatedCommissionValue: 0,
    lastClickAt: eventRecord.timestamp,
  };
  categoryAggregate.clickCount += 1;
  categoryAggregate.estimatedCommissionValue = Number(
    (
      categoryAggregate.estimatedCommissionValue + (estimatedCommissionValue ?? 0)
    ).toFixed(2),
  );
  categoryAggregate.lastClickAt = eventRecord.timestamp;
  store.categoryAggregates[categoryKey] = categoryAggregate;

  store.recentEvents.unshift(eventRecord);
  if (store.recentEvents.length > RECENT_EVENT_LIMIT) {
    store.recentEvents = store.recentEvents.slice(0, RECENT_EVENT_LIMIT);
  }

  persistStore(store);

  return {
    ...eventRecord,
    duplicate: false,
  };
};

export const getRecentMonetizationEvents = (limit = 10): MonetizationEventRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  const safeLimit = Math.max(0, limit);
  const store = getStore();
  return store.recentEvents.slice(0, safeLimit);
};

export const getMonetizationSummary = ({
  providerLimit = 5,
  categoryLimit = 5,
}: {
  providerLimit?: number;
  categoryLimit?: number;
} = {}): MonetizationSummary | null => {
  if (!isBrowser()) {
    return null;
  }

  const store = getStore();
  const topProviders = Object.values(store.providerAggregates)
    .sort((a, b) => {
      if (a.clickCount !== b.clickCount) {
        return b.clickCount - a.clickCount;
      }
      return b.estimatedCommissionValue - a.estimatedCommissionValue;
    })
    .slice(0, Math.max(0, providerLimit));

  const topCategories = Object.values(store.categoryAggregates)
    .sort((a, b) => {
      if (a.clickCount !== b.clickCount) {
        return b.clickCount - a.clickCount;
      }
      return b.estimatedCommissionValue - a.estimatedCommissionValue;
    })
    .slice(0, Math.max(0, categoryLimit));

  return {
    totalMonetizableClicks: store.totalMonetizableClicks,
    totalEstimatedCommissionValue: store.totalEstimatedCommissionValue,
    topProviders,
    topCategories,
  };
};
