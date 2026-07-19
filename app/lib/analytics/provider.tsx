"use client";

import { useEffect, useRef } from "react";
import { captureAttributionFromUrl } from "./attribution";
import { initializeAnalytics, trackPageView } from "./client";

const NAVIGATION_EVENT = "socialmall:navigation";
const HISTORY_PATCH_KEY = "__socialmallHistoryPatched";

declare global {
  interface Window {
    [HISTORY_PATCH_KEY]?: boolean;
  }
}

const emitNavigationEvent = () => {
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
};

const patchHistoryNavigationEvents = () => {
  if (typeof window === "undefined" || window[HISTORY_PATCH_KEY]) {
    return;
  }

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function pushState(
    ...args: Parameters<History["pushState"]>
  ) {
    const result = originalPushState.apply(this, args);
    emitNavigationEvent();
    return result;
  };

  window.history.replaceState = function replaceState(
    ...args: Parameters<History["replaceState"]>
  ) {
    const result = originalReplaceState.apply(this, args);
    emitNavigationEvent();
    return result;
  };

  window[HISTORY_PATCH_KEY] = true;
};

export const AnalyticsProvider = () => {
  const lastTrackedUrlRef = useRef<string>("");

  useEffect(() => {
    initializeAnalytics();
    patchHistoryNavigationEvents();

    let trackTimer: number | null = null;

    const trackCurrentPage = () => {
      const { pathname, search } = window.location;
      const url = `${pathname}${search}`;
      if (lastTrackedUrlRef.current === url) {
        return;
      }

      captureAttributionFromUrl({
        pathname,
        search,
      });

      lastTrackedUrlRef.current = url;
      trackPageView({
        pathname,
        search,
        title: document.title,
      });
    };

    const scheduleTrackCurrentPage = () => {
      if (trackTimer) {
        window.clearTimeout(trackTimer);
      }

      trackTimer = window.setTimeout(trackCurrentPage, 0);
    };

    scheduleTrackCurrentPage();
    window.addEventListener("popstate", scheduleTrackCurrentPage);
    window.addEventListener(NAVIGATION_EVENT, scheduleTrackCurrentPage);

    return () => {
      if (trackTimer) {
        window.clearTimeout(trackTimer);
      }
      window.removeEventListener("popstate", scheduleTrackCurrentPage);
      window.removeEventListener(NAVIGATION_EVENT, scheduleTrackCurrentPage);
    };
  }, []);

  return null;
};
