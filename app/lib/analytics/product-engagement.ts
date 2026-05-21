import type { AnalyticsEventName } from "./types";

const STORAGE_KEY = "socialmall.product.engagement.v1";
const RECENT_ENGAGEMENT_LIMIT = 40;
const DUPLICATE_WINDOW_MS = 1200;

type ProductEngagementEventType = Extract<
  AnalyticsEventName,
  "product_click" | "outbound_redirect"
>;

export type ProductEngagementRecord = {
  eventType: ProductEngagementEventType;
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe: string[];
  searchQuery: string;
  timestamp: string;
  destinationUrl?: string;
  hasAffiliateUrl?: boolean;
};

type ProductAggregate = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe: string[];
  clickCount: number;
  outboundRedirectCount: number;
  lastSearchQuery: string;
  lastEngagedAt: string;
};

type ProductEngagementStore = {
  version: 1;
  totalProductClicks: number;
  totalOutboundRedirects: number;
  productAggregates: Record<string, ProductAggregate>;
  recentEngagements: ProductEngagementRecord[];
};

export type TopClickedProductRecord = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe: string[];
  clickCount: number;
  outboundRedirectCount: number;
  outboundIntentRate: number;
  lastSearchQuery: string;
  lastEngagedAt: string;
};

type TrackProductEngagementInput = {
  eventType: ProductEngagementEventType;
  productId: string;
  productName: string;
  brand: string;
  category: string;
  vibe?: string[];
  searchQuery?: string;
  timestamp?: number;
  destinationUrl?: string;
  hasAffiliateUrl?: boolean;
};

type TrackedProductEngagement = ProductEngagementRecord & {
  duplicate: boolean;
};

const defaultStore = (): ProductEngagementStore => ({
  version: 1,
  totalProductClicks: 0,
  totalOutboundRedirects: 0,
  productAggregates: {},
  recentEngagements: [],
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

const normalizeVibe = (value: string[]) =>
  Array.from(
    new Set(
      value
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    ),
  );

const toIsoString = (timestampMs: number) => new Date(timestampMs).toISOString();

const sanitizeStore = (value: unknown): ProductEngagementStore => {
  if (!value || typeof value !== "object") {
    return defaultStore();
  }

  const parsed = value as Partial<ProductEngagementStore>;
  if (parsed.version !== 1) {
    return defaultStore();
  }

  return {
    version: 1,
    totalProductClicks: Number.isFinite(parsed.totalProductClicks)
      ? parsed.totalProductClicks!
      : 0,
    totalOutboundRedirects: Number.isFinite(parsed.totalOutboundRedirects)
      ? parsed.totalOutboundRedirects!
      : 0,
    productAggregates:
      parsed.productAggregates && typeof parsed.productAggregates === "object"
        ? parsed.productAggregates
        : {},
    recentEngagements: Array.isArray(parsed.recentEngagements)
      ? parsed.recentEngagements
      : [],
  };
};

let cachedStore: ProductEngagementStore | null = null;
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

const persistStore = (store: ProductEngagementStore) => {
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
      // Ignore storage write failures to preserve interaction speed.
    }
  };

  if (typeof browserWindow.requestIdleCallback === "function") {
    browserWindow.requestIdleCallback(persist);
    return;
  }

  globalThis.setTimeout(persist, 0);
};

const isDuplicateEngagement = (signature: string, timestamp: number) => {
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

export const trackProductEngagement = ({
  eventType,
  productId,
  productName,
  brand,
  category,
  vibe = [],
  searchQuery = "",
  timestamp,
  destinationUrl,
  hasAffiliateUrl,
}: TrackProductEngagementInput): TrackedProductEngagement | null => {
  if (!isBrowser()) {
    return null;
  }

  const trimmedProductId = productId.trim();
  const trimmedProductName = productName.trim();
  const trimmedBrand = brand.trim();
  const trimmedCategory = category.trim();
  if (!trimmedProductId || !trimmedProductName || !trimmedBrand || !trimmedCategory) {
    return null;
  }

  const normalizedQuery = normalizeSearchQuery(searchQuery);
  const normalizedVibe = normalizeVibe(vibe);
  const trackedTimestamp = timestamp ?? Date.now();
  const signature = `${eventType}:${trimmedProductId}:${normalizedQuery}:${
    destinationUrl ?? ""
  }`;

  const duplicate = isDuplicateEngagement(signature, trackedTimestamp);
  if (duplicate) {
    return {
      eventType,
      productId: trimmedProductId,
      productName: trimmedProductName,
      brand: trimmedBrand,
      category: trimmedCategory,
      vibe: normalizedVibe,
      searchQuery: normalizedQuery,
      timestamp: toIsoString(trackedTimestamp),
      destinationUrl,
      hasAffiliateUrl,
      duplicate: true,
    };
  }

  const store = getStore();
  const existingAggregate = store.productAggregates[trimmedProductId] ?? {
    productId: trimmedProductId,
    productName: trimmedProductName,
    brand: trimmedBrand,
    category: trimmedCategory,
    vibe: normalizedVibe,
    clickCount: 0,
    outboundRedirectCount: 0,
    lastSearchQuery: normalizedQuery,
    lastEngagedAt: toIsoString(trackedTimestamp),
  };

  existingAggregate.productName = trimmedProductName;
  existingAggregate.brand = trimmedBrand;
  existingAggregate.category = trimmedCategory;
  existingAggregate.vibe = normalizedVibe.length
    ? normalizedVibe
    : existingAggregate.vibe;
  existingAggregate.lastSearchQuery = normalizedQuery;
  existingAggregate.lastEngagedAt = toIsoString(trackedTimestamp);

  if (eventType === "product_click") {
    existingAggregate.clickCount += 1;
    store.totalProductClicks += 1;
  } else {
    existingAggregate.outboundRedirectCount += 1;
    store.totalOutboundRedirects += 1;
  }

  store.productAggregates[trimmedProductId] = existingAggregate;

  const recentRecord: ProductEngagementRecord = {
    eventType,
    productId: trimmedProductId,
    productName: trimmedProductName,
    brand: trimmedBrand,
    category: trimmedCategory,
    vibe: normalizedVibe,
    searchQuery: normalizedQuery,
    timestamp: existingAggregate.lastEngagedAt,
    destinationUrl,
    hasAffiliateUrl,
  };

  store.recentEngagements.unshift(recentRecord);
  if (store.recentEngagements.length > RECENT_ENGAGEMENT_LIMIT) {
    store.recentEngagements = store.recentEngagements.slice(
      0,
      RECENT_ENGAGEMENT_LIMIT,
    );
  }

  persistStore(store);

  return {
    ...recentRecord,
    duplicate: false,
  };
};

export const getRecentProductEngagements = (
  limit = 10,
): ProductEngagementRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  const safeLimit = Math.max(0, limit);
  const store = getStore();
  return store.recentEngagements.slice(0, safeLimit);
};

export const getTopClickedProducts = (limit = 10): TopClickedProductRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  const safeLimit = Math.max(0, limit);
  const store = getStore();
  const sorted = Object.values(store.productAggregates).sort((a, b) => {
    if (a.clickCount !== b.clickCount) {
      return b.clickCount - a.clickCount;
    }
    if (a.outboundRedirectCount !== b.outboundRedirectCount) {
      return b.outboundRedirectCount - a.outboundRedirectCount;
    }
    return b.lastEngagedAt.localeCompare(a.lastEngagedAt);
  });

  return sorted.slice(0, safeLimit).map((entry) => {
    const outboundIntentRate =
      entry.clickCount > 0
        ? entry.outboundRedirectCount / entry.clickCount
        : entry.outboundRedirectCount > 0
          ? 1
          : 0;

    return {
      productId: entry.productId,
      productName: entry.productName,
      brand: entry.brand,
      category: entry.category,
      vibe: entry.vibe,
      clickCount: entry.clickCount,
      outboundRedirectCount: entry.outboundRedirectCount,
      outboundIntentRate,
      lastSearchQuery: entry.lastSearchQuery,
      lastEngagedAt: entry.lastEngagedAt,
    };
  });
};
