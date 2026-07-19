export type AnalyticsEventName =
  | "page_view"
  | "search"
  | "product_click"
  | "outbound_redirect"
  | "chip_click"
  | "share_click"
  | "trust_filter_change";

export type AnalyticsEventValue = string | number | boolean | null | undefined;

export type AnalyticsEventParams = Record<string, AnalyticsEventValue>;

export type TrackEventOptions = {
  dedupeKey?: string;
  dedupeWindowMs?: number;
};

export type SearchEventSource =
  | "hero_submit"
  | "hero_chip"
  | "refine_submit"
  | "internal_chip"
  | "trust_empty_state";

export type ChipEventType =
  | "hero_suggestion"
  | "related_search"
  | "trending_aesthetic"
  | "similar_vibe"
  | "related_collection"
  | "contextual_link"
  | "related_trend";
