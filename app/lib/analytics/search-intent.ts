import type { SearchEventSource } from "./types";

const STORAGE_KEY = "socialmall.search.analytics.v1";
const RECENT_SEARCH_LIMIT = 25;
const DUPLICATE_WINDOW_MS = 1200;

type QueryAggregate = {
  normalizedQuery: string;
  count: number;
  zeroResultCount: number;
  lastSearchedAt: string;
  lastRawQuery: string;
  sourceCounts: Partial<Record<SearchEventSource, number>>;
};

type SearchAnalyticsStore = {
  version: 1;
  totalSearches: number;
  queryAggregates: Record<string, QueryAggregate>;
  recentSearches: SearchTrackingRecord[];
};

export type SearchTrackingRecord = {
  rawQuery: string;
  normalizedQuery: string;
  timestamp: string;
  source: SearchEventSource;
  resultCount: number;
  zeroResults: boolean;
  searchFrequency: number;
};

export type PopularSearchRecord = {
  normalizedQuery: string;
  searchFrequency: number;
  zeroResultCount: number;
  lastSearchedAt: string;
  topSource: SearchEventSource | "mixed";
};

type TrackSearchIntentInput = {
  rawQuery: string;
  source: SearchEventSource;
  resultCount: number;
  timestamp?: number;
};

type TrackedSearchIntent = SearchTrackingRecord & {
  duplicate: boolean;
};

const defaultStore = (): SearchAnalyticsStore => ({
  version: 1,
  totalSearches: 0,
  queryAggregates: {},
  recentSearches: [],
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

const getTopSource = (
  sourceCounts: Partial<Record<SearchEventSource, number>>,
): SearchEventSource | "mixed" => {
  const entries = Object.entries(sourceCounts) as [SearchEventSource, number][];
  if (!entries.length) {
    return "mixed";
  }

  const [topSource, topCount] = entries.sort((a, b) => b[1] - a[1])[0];
  const tiedSourceCount = entries.filter(([, count]) => count === topCount).length;
  return tiedSourceCount > 1 ? "mixed" : topSource;
};

const sanitizeStore = (value: unknown): SearchAnalyticsStore => {
  if (!value || typeof value !== "object") {
    return defaultStore();
  }

  const parsed = value as Partial<SearchAnalyticsStore>;
  if (parsed.version !== 1) {
    return defaultStore();
  }

  return {
    version: 1,
    totalSearches: Number.isFinite(parsed.totalSearches) ? parsed.totalSearches! : 0,
    queryAggregates:
      parsed.queryAggregates && typeof parsed.queryAggregates === "object"
        ? parsed.queryAggregates
        : {},
    recentSearches: Array.isArray(parsed.recentSearches) ? parsed.recentSearches : [],
  };
};

let cachedStore: SearchAnalyticsStore | null = null;
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

const persistStore = (store: SearchAnalyticsStore) => {
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
      // Ignore storage write failures (private mode, quota, etc).
    }
  };

  if (typeof browserWindow.requestIdleCallback === "function") {
    browserWindow.requestIdleCallback(persist);
    return;
  }

  globalThis.setTimeout(persist, 0);
};

const isDuplicateSearch = (signature: string, timestamp: number) => {
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

export const trackSearchIntent = ({
  rawQuery,
  source,
  resultCount,
  timestamp,
}: TrackSearchIntentInput): TrackedSearchIntent | null => {
  if (!isBrowser()) {
    return null;
  }

  const trimmedRawQuery = rawQuery.trim();
  if (!trimmedRawQuery) {
    return null;
  }

  const normalizedQuery = normalizeSearchQuery(trimmedRawQuery);
  const trackedTimestamp = timestamp ?? Date.now();
  const signature = `${normalizedQuery}:${source}:${resultCount}`;
  const duplicate = isDuplicateSearch(signature, trackedTimestamp);
  if (duplicate) {
    return {
      rawQuery: trimmedRawQuery,
      normalizedQuery,
      timestamp: toIsoString(trackedTimestamp),
      source,
      resultCount,
      zeroResults: resultCount === 0,
      searchFrequency: 0,
      duplicate: true,
    };
  }

  const store = getStore();
  const aggregate = store.queryAggregates[normalizedQuery] ?? {
    normalizedQuery,
    count: 0,
    zeroResultCount: 0,
    lastSearchedAt: toIsoString(trackedTimestamp),
    lastRawQuery: trimmedRawQuery,
    sourceCounts: {},
  };

  aggregate.count += 1;
  if (resultCount === 0) {
    aggregate.zeroResultCount += 1;
  }
  aggregate.lastSearchedAt = toIsoString(trackedTimestamp);
  aggregate.lastRawQuery = trimmedRawQuery;
  aggregate.sourceCounts[source] = (aggregate.sourceCounts[source] ?? 0) + 1;

  store.queryAggregates[normalizedQuery] = aggregate;
  store.totalSearches += 1;

  const recentRecord: SearchTrackingRecord = {
    rawQuery: trimmedRawQuery,
    normalizedQuery,
    timestamp: aggregate.lastSearchedAt,
    source,
    resultCount,
    zeroResults: resultCount === 0,
    searchFrequency: aggregate.count,
  };

  store.recentSearches.unshift(recentRecord);
  if (store.recentSearches.length > RECENT_SEARCH_LIMIT) {
    store.recentSearches = store.recentSearches.slice(0, RECENT_SEARCH_LIMIT);
  }

  persistStore(store);

  return {
    ...recentRecord,
    duplicate: false,
  };
};

export const getRecentSearches = (limit = 10): SearchTrackingRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  const safeLimit = Math.max(0, limit);
  const store = getStore();
  return store.recentSearches.slice(0, safeLimit);
};

export const getPopularSearches = (limit = 10): PopularSearchRecord[] => {
  if (!isBrowser()) {
    return [];
  }

  const safeLimit = Math.max(0, limit);
  const store = getStore();
  const sorted = Object.values(store.queryAggregates).sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }

    return b.lastSearchedAt.localeCompare(a.lastSearchedAt);
  });

  return sorted.slice(0, safeLimit).map((entry) => ({
    normalizedQuery: entry.normalizedQuery,
    searchFrequency: entry.count,
    zeroResultCount: entry.zeroResultCount,
    lastSearchedAt: entry.lastSearchedAt,
    topSource: getTopSource(entry.sourceCounts),
  }));
};
