import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeClient from "../../home-client";
import { buildSearchMetadata } from "@/lib/seo/search-metadata";
import { getTrendBySlug, getTrendProducts, trendPages } from "@/lib/trends";

type TrendPageProps = {
  params: Promise<{ trendSlug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return trendPages.map((trend) => ({
    trendSlug: trend.slug,
  }));
}

export async function generateMetadata({
  params,
}: TrendPageProps): Promise<Metadata> {
  const { trendSlug } = await params;
  const trend = getTrendBySlug(trendSlug);

  if (!trend) {
    return buildSearchMetadata("", {
      title: "Trend Pages | SocialMall",
      description: "Discover trend-led fashion pages curated by SocialMall.",
      pageType: "collection",
      collectionKind: "trend",
      canonicalPath: "/trends",
    });
  }

  const trendProducts = getTrendProducts(trend.slug);
  const trendDescription = `${trend.description} Explore ${trendProducts.length} curated picks from independent labels.`;

  return buildSearchMetadata(trend.query, {
    title: `${trend.name} | SocialMall`,
    description: trendDescription,
    pageType: "collection",
    collectionKind: "trend",
    canonicalPath: `/trends/${trend.slug}`,
  });
}

export default async function TrendPage({ params }: TrendPageProps) {
  const { trendSlug } = await params;
  const trend = getTrendBySlug(trendSlug);

  if (!trend) {
    notFound();
  }

  return (
    <HomeClient
      initialQuery={trend.query}
      initialCollection={{
        slug: trend.slug,
        query: trend.query,
        title: `${trend.name} | SocialMall`,
        description: trend.description,
        kind: "trend",
      }}
    />
  );
}
