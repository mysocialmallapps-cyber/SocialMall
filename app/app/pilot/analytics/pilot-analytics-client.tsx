"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getAnalyticsRuntimeStatus,
  getMonetizationSummary,
  getPopularSearches,
  getRecentMonetizationEvents,
  getRecentProductEngagements,
  getRecentSearches,
  getTopClickedProducts,
  type MonetizationEventRecord,
  type MonetizationSummary,
  type PopularSearchRecord,
  type ProductEngagementRecord,
  type SearchTrackingRecord,
  type TopClickedProductRecord,
} from "@/lib/analytics";
import { getAffiliateProviderStatuses, type AffiliateProviderStatus } from "@/lib/commerce";
import { getProductCatalogStatus } from "@/lib/products";

type ProductCatalogStatus = ReturnType<typeof getProductCatalogStatus>;
type AnalyticsRuntimeStatus = ReturnType<typeof getAnalyticsRuntimeStatus>;

type DashboardData = {
  analytics: AnalyticsRuntimeStatus;
  productCatalog: ProductCatalogStatus;
  affiliateProviders: AffiliateProviderStatus[];
  popularSearches: PopularSearchRecord[];
  recentSearches: SearchTrackingRecord[];
  topProducts: TopClickedProductRecord[];
  recentEngagements: ProductEngagementRecord[];
  monetizationSummary: MonetizationSummary | null;
  recentMonetizationEvents: MonetizationEventRecord[];
};

const storageKeys = [
  "socialmall.search.analytics.v1",
  "socialmall.product.engagement.v1",
  "socialmall.monetization.analytics.v1",
  "socialmall.attribution.first-touch.v1",
  "socialmall.attribution.session-touch.v1",
];

const loadDashboardData = (): DashboardData => ({
  analytics: getAnalyticsRuntimeStatus(),
  productCatalog: getProductCatalogStatus(),
  affiliateProviders: getAffiliateProviderStatuses(),
  popularSearches: getPopularSearches(8),
  recentSearches: getRecentSearches(8),
  topProducts: getTopClickedProducts(8),
  recentEngagements: getRecentProductEngagements(8),
  monetizationSummary: getMonetizationSummary({
    providerLimit: 6,
    categoryLimit: 6,
  }),
  recentMonetizationEvents: getRecentMonetizationEvents(8),
});

const formatBoolean = (value: boolean) => (value ? "Yes" : "No");

const formatDate = (value?: string) => {
  if (!value) {
    return "None";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const Badge = ({ active, label }: { active: boolean; label: string }) => (
  <span
    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
      active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
    }`}
  >
    {label}
  </span>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="border-t border-zinc-200 py-3">
    <dt className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
      {label}
    </dt>
    <dd className="mt-1 text-lg font-semibold text-zinc-900">{value}</dd>
  </div>
);

export default function PilotAnalyticsClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  const refresh = useCallback(() => setData(loadDashboardData()), []);

  const clearPilotData = () => {
    storageKeys.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
    refresh();
  };

  useEffect(() => {
    const refreshTimer = window.setTimeout(refresh, 0);
    const handleAnalyticsEvent = () => refresh();
    window.addEventListener("socialmall:analytics", handleAnalyticsEvent);
    window.addEventListener("focus", handleAnalyticsEvent);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("socialmall:analytics", handleAnalyticsEvent);
      window.removeEventListener("focus", handleAnalyticsEvent);
    };
  }, [refresh]);

  if (!data) {
    return null;
  }

  const monetizationSummary = data.monetizationSummary;

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              SocialMall
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Pilot analytics
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={clearPilotData}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Clear local data
            </button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <dl>
            <Stat
              label="Products"
              value={data.productCatalog.productCount}
            />
            <Stat label="Brands" value={data.productCatalog.brandCount} />
            <Stat
              label="Verified products"
              value={data.productCatalog.verifiedProductCount}
            />
          </dl>
          <dl>
            <Stat
              label="Style inspiration"
              value={data.productCatalog.styleInspirationCount}
            />
            <Stat
              label="Verified images"
              value={data.productCatalog.verifiedImageCount}
            />
            <Stat
              label="Exact product links"
              value={data.productCatalog.verifiedProductUrlCount}
            />
          </dl>
          <dl>
            <Stat
              label="Brand-site links"
              value={data.productCatalog.brandDiscoveryCount}
            />
            <Stat
              label="Affiliate-ready"
              value={data.productCatalog.affiliateProductCount}
            />
            <Stat label="CMS-ready" value={formatBoolean(data.productCatalog.cmsReady)} />
            <Stat
              label="Searches"
              value={data.recentSearches.length}
            />
          </dl>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <dl>
            <Stat
              label="Product clicks"
              value={data.recentEngagements.length}
            />
          </dl>
          <dl>
            <Stat
              label="Outbound clicks"
              value={monetizationSummary?.totalMonetizableClicks ?? 0}
            />
          </dl>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Analytics runtime
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge active={data.analytics.ga4Enabled} label="GA4" />
              <Badge active={data.analytics.postHogEnabled} label="PostHog" />
              <Badge active={data.analytics.anyProviderEnabled} label="Provider active" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Affiliate providers
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.affiliateProviders.map((provider) => (
                <Badge
                  key={provider.network}
                  active={provider.configured}
                  label={`${provider.network}${provider.scriptEnabled ? " + script" : ""}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Popular searches
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Query</th>
                    <th className="py-2 pr-4 font-medium">Count</th>
                    <th className="py-2 pr-4 font-medium">Zero</th>
                    <th className="py-2 font-medium">Last</th>
                  </tr>
                </thead>
                <tbody>
                  {data.popularSearches.map((search) => (
                    <tr key={search.normalizedQuery} className="border-b border-zinc-100">
                      <td className="py-3 pr-4 font-medium">{search.normalizedQuery}</td>
                      <td className="py-3 pr-4">{search.searchFrequency}</td>
                      <td className="py-3 pr-4">{search.zeroResultCount}</td>
                      <td className="py-3">{formatDate(search.lastSearchedAt)}</td>
                    </tr>
                  ))}
                  {!data.popularSearches.length ? (
                    <tr>
                      <td className="py-3 text-zinc-500" colSpan={4}>
                        No searches yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Top products
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Product</th>
                    <th className="py-2 pr-4 font-medium">Clicks</th>
                    <th className="py-2 pr-4 font-medium">Outbound</th>
                    <th className="py-2 font-medium">Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product) => (
                    <tr key={product.productId} className="border-b border-zinc-100">
                      <td className="py-3 pr-4">
                        <span className="block font-medium">{product.productName}</span>
                        <span className="text-xs text-zinc-500">{product.brand}</span>
                      </td>
                      <td className="py-3 pr-4">{product.clickCount}</td>
                      <td className="py-3 pr-4">{product.outboundRedirectCount}</td>
                      <td className="py-3">{formatPercent(product.outboundIntentRate)}</td>
                    </tr>
                  ))}
                  {!data.topProducts.length ? (
                    <tr>
                      <td className="py-3 text-zinc-500" colSpan={4}>
                        No product clicks yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Recent outbound redirects
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.08em] text-zinc-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Product</th>
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Tracked</th>
                  <th className="py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentMonetizationEvents.map((event) => (
                  <tr
                    key={`${event.productId}-${event.timestamp}`}
                    className="border-b border-zinc-100"
                  >
                    <td className="py-3 pr-4">
                      <span className="block font-medium">{event.productName}</span>
                      <span className="text-xs text-zinc-500">{event.retailer}</span>
                    </td>
                    <td className="py-3 pr-4">{event.affiliateProvider}</td>
                    <td className="py-3 pr-4">{event.affiliateSource}</td>
                    <td className="py-3 pr-4">{formatBoolean(Boolean(event.trackingApplied))}</td>
                    <td className="py-3">{formatDate(event.timestamp)}</td>
                  </tr>
                ))}
                {!data.recentMonetizationEvents.length ? (
                  <tr>
                    <td className="py-3 text-zinc-500" colSpan={5}>
                      No outbound redirects yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
