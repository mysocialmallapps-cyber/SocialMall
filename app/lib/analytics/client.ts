import type {
  AnalyticsEventName,
  AnalyticsEventParams,
  TrackEventOptions,
} from "./types";
import { getAttributionContext } from "./attribution";

type PostHogApi = {
  init?: (apiKey: string, options?: { api_host?: string }) => void;
  capture?: (eventName: string, properties?: AnalyticsEventParams) => void;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    posthog?: PostHogApi;
  }
}

const DEFAULT_DEDUPE_WINDOW_MS = 1200;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://app.posthog.com";

const recentEventMap = new Map<string, number>();
let analyticsInitialized = false;
let postHogLoadPromise: Promise<PostHogApi | null> | null = null;

const isBrowser = () => typeof window !== "undefined";

const hasGa = Boolean(GA_MEASUREMENT_ID);
const hasPostHog = Boolean(POSTHOG_KEY);

const toDedupeKey = (eventName: AnalyticsEventName, params: AnalyticsEventParams) =>
  `${eventName}:${JSON.stringify(params)}`;

const shouldSkipByDedupe = (key: string, dedupeWindowMs: number) => {
  const now = Date.now();
  const previousTimestamp = recentEventMap.get(key);
  recentEventMap.set(key, now);

  if (previousTimestamp && now - previousTimestamp < dedupeWindowMs) {
    return true;
  }

  if (recentEventMap.size > 1000) {
    for (const [eventKey, timestamp] of recentEventMap) {
      if (now - timestamp > 60_000) {
        recentEventMap.delete(eventKey);
      }
    }
  }

  return false;
};

const sanitizeParams = (params: AnalyticsEventParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as AnalyticsEventParams;

const loadPostHog = () => {
  if (!isBrowser() || !hasPostHog) {
    return Promise.resolve(null);
  }

  if (window.posthog && typeof window.posthog.capture === "function") {
    return Promise.resolve(window.posthog);
  }

  if (postHogLoadPromise) {
    return postHogLoadPromise;
  }

  postHogLoadPromise = import("posthog-js")
    .then((module) => {
      const posthog = module.default as PostHogApi;
      posthog.init?.(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
      });
      window.posthog = posthog;
      return posthog;
    })
    .catch(() => null);

  return postHogLoadPromise;
};

export const isAnalyticsEnabled = () => hasGa || hasPostHog;

export const getAnalyticsRuntimeStatus = () => ({
  ga4Enabled: hasGa,
  postHogEnabled: hasPostHog,
  anyProviderEnabled: isAnalyticsEnabled(),
});

const emitDataLayerEvent = (
  eventName: AnalyticsEventName,
  payload: AnalyticsEventParams,
) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...payload,
    });
  } catch {
    // Keep analytics observation non-blocking.
  }

  try {
    window.dispatchEvent(
      new CustomEvent("socialmall:analytics", {
        detail: {
          eventName,
          payload,
        },
      }),
    );
  } catch {
    // CustomEvent is best-effort for local QA listeners.
  }
};

export const initializeAnalytics = () => {
  if (!isBrowser() || analyticsInitialized || !isAnalyticsEnabled()) {
    return;
  }

  analyticsInitialized = true;

  try {
    if (hasGa && typeof window.gtag === "function") {
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
    }
  } catch {
    // Fail silently to keep rendering and interaction unaffected.
  }

  try {
    if (hasPostHog) {
      void loadPostHog();
    }
  } catch {
    // Fail silently; PostHog is optional for MVP.
  }
};

export const trackEvent = (
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {},
  options: TrackEventOptions = {},
) => {
  if (!isBrowser()) {
    return;
  }

  initializeAnalytics();

  const attributionContext = getAttributionContext();
  const payload = sanitizeParams({
    ...attributionContext,
    ...params,
  });
  const dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
  const dedupeKey = options.dedupeKey ?? toDedupeKey(eventName, payload);
  if (shouldSkipByDedupe(dedupeKey, dedupeWindowMs)) {
    return;
  }

  emitDataLayerEvent(eventName, payload);

  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    if (hasGa && typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    }
  } catch {
    // Never interrupt product flows due to analytics failures.
  }

  try {
    if (hasPostHog && typeof window.posthog?.capture === "function") {
      window.posthog.capture(eventName, payload);
    } else if (hasPostHog) {
      void loadPostHog().then((posthog) => {
        posthog?.capture?.(eventName, payload);
      });
    }
  } catch {
    // Never interrupt product flows due to analytics failures.
  }
};

export const trackPageView = ({
  pathname,
  search,
  title,
}: {
  pathname: string;
  search?: string;
  title?: string;
}) => {
  const normalizedSearch = search ?? "";
  const pageLocation = `${pathname}${normalizedSearch}`;
  trackEvent(
    "page_view",
    {
      page_path: pathname,
      page_location: pageLocation,
      page_title: title,
    },
    {
      dedupeKey: `page_view:${pageLocation}`,
      dedupeWindowMs: 3000,
    },
  );
};
