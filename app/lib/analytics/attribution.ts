import type { AnalyticsEventParams } from "./types";

const FIRST_TOUCH_STORAGE_KEY = "socialmall.attribution.first-touch.v1";
const SESSION_TOUCH_STORAGE_KEY = "socialmall.attribution.session-touch.v1";

type AttributionTouch = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingPage: string;
  timestamp: string;
};

type PartialAttributionTouch = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

let cachedFirstTouch: AttributionTouch | null = null;
let cachedSessionTouch: AttributionTouch | null = null;
let hasLoadedFirstTouch = false;
let hasLoadedSessionTouch = false;

const isBrowser = () => typeof window !== "undefined";

const readStorage = (storage: Storage, key: string) => {
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AttributionTouch>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.utmSource !== "string" ||
      typeof parsed.utmMedium !== "string" ||
      typeof parsed.utmCampaign !== "string" ||
      typeof parsed.landingPage !== "string" ||
      typeof parsed.timestamp !== "string"
    ) {
      return null;
    }

    return {
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
      landingPage: parsed.landingPage,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
};

const writeStorage = (storage: Storage, key: string, value: AttributionTouch) => {
  const persist = () => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write failures to keep analytics non-blocking.
    }
  };

  if (isBrowser() && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(persist);
    return;
  }

  globalThis.setTimeout(persist, 0);
};

const normalizeUtmValue = (value: string | null) =>
  value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

const loadFirstTouch = () => {
  if (!isBrowser()) {
    return null;
  }

  if (hasLoadedFirstTouch) {
    return cachedFirstTouch;
  }

  hasLoadedFirstTouch = true;
  cachedFirstTouch = readStorage(window.localStorage, FIRST_TOUCH_STORAGE_KEY);
  return cachedFirstTouch;
};

const loadSessionTouch = () => {
  if (!isBrowser()) {
    return null;
  }

  if (hasLoadedSessionTouch) {
    return cachedSessionTouch;
  }

  hasLoadedSessionTouch = true;
  cachedSessionTouch = readStorage(window.sessionStorage, SESSION_TOUCH_STORAGE_KEY);
  return cachedSessionTouch;
};

export const parseAttributionParams = (search: string): PartialAttributionTouch | null => {
  const searchValue = search.startsWith("?") ? search.slice(1) : search;
  if (!searchValue) {
    return null;
  }

  const params = new URLSearchParams(searchValue);
  const utmSource = normalizeUtmValue(params.get("utm_source"));
  const utmMedium = normalizeUtmValue(params.get("utm_medium"));
  const utmCampaign = normalizeUtmValue(params.get("utm_campaign"));

  if (!utmSource && !utmMedium && !utmCampaign) {
    return null;
  }

  return {
    utmSource,
    utmMedium,
    utmCampaign,
  };
};

export const captureAttributionFromUrl = ({
  pathname,
  search,
}: {
  pathname: string;
  search: string;
}) => {
  if (!isBrowser()) {
    return;
  }

  const parsedParams = parseAttributionParams(search);
  if (!parsedParams) {
    return;
  }

  const timestamp = new Date().toISOString();
  const landingPage = `${pathname}${search}`;
  const nextTouch: AttributionTouch = {
    utmSource: parsedParams.utmSource ?? "(direct)",
    utmMedium: parsedParams.utmMedium ?? "(none)",
    utmCampaign: parsedParams.utmCampaign ?? "(not-set)",
    landingPage,
    timestamp,
  };

  cachedSessionTouch = nextTouch;
  hasLoadedSessionTouch = true;
  writeStorage(window.sessionStorage, SESSION_TOUCH_STORAGE_KEY, nextTouch);

  if (!loadFirstTouch()) {
    cachedFirstTouch = nextTouch;
    hasLoadedFirstTouch = true;
    writeStorage(window.localStorage, FIRST_TOUCH_STORAGE_KEY, nextTouch);
  }
};

export const getAttributionContext = (): AnalyticsEventParams => {
  if (!isBrowser()) {
    return {};
  }

  const firstTouch = loadFirstTouch();
  const sessionTouch = loadSessionTouch();

  return {
    utm_source: sessionTouch?.utmSource,
    utm_medium: sessionTouch?.utmMedium,
    utm_campaign: sessionTouch?.utmCampaign,
    landing_page: sessionTouch?.landingPage,
    session_source: sessionTouch?.utmSource,
    first_touch_source: firstTouch?.utmSource,
    first_touch_medium: firstTouch?.utmMedium,
    first_touch_campaign: firstTouch?.utmCampaign,
    first_touch_landing_page: firstTouch?.landingPage,
    first_touch_timestamp: firstTouch?.timestamp,
  };
};
