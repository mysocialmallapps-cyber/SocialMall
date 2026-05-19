"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initializeAnalytics, trackPageView } from "./client";

export const AnalyticsProvider = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrlRef = useRef<string>("");
  const search = searchParams.toString();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const searchSuffix = search ? `?${search}` : "";
    const url = `${pathname}${searchSuffix}`;
    if (lastTrackedUrlRef.current === url) {
      return;
    }

    lastTrackedUrlRef.current = url;
    trackPageView({
      pathname,
      search: searchSuffix,
      title: document.title,
    });
  }, [pathname, search]);

  return null;
};
