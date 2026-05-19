export { AnalyticsProvider } from "./provider";
export { AnalyticsScripts } from "./scripts";
export { initializeAnalytics, isAnalyticsEnabled, trackEvent, trackPageView } from "./client";
export {
  getPopularSearches,
  getRecentSearches,
  trackSearchIntent,
} from "./search-intent";
export {
  trackChipClickEvent,
  trackOutboundRedirectEvent,
  trackProductClickEvent,
  trackSearchEvent,
} from "./events";
export type {
  AnalyticsEventName,
  AnalyticsEventParams,
  AnalyticsEventValue,
  ChipEventType,
  SearchEventSource,
  TrackEventOptions,
} from "./types";
export type { PopularSearchRecord, SearchTrackingRecord } from "./search-intent";
