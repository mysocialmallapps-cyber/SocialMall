import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeClient from "../../home-client";
import {
  getSearchSeoPageBySlug,
  searchSeoPages,
} from "@/lib/seo/search-page-config";
import { buildSearchMetadata } from "@/lib/seo/search-metadata";

type SearchPageProps = {
  params: Promise<{ searchSlug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return searchSeoPages.map((page) => ({
    searchSlug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { searchSlug } = await params;
  const searchPage = getSearchSeoPageBySlug(searchSlug);

  if (!searchPage) {
    return buildSearchMetadata("", {
      title: "Fashion Search | SocialMall",
      description: "Search verified fashion product pages and curated SocialMall edits.",
      pageType: "search",
      canonicalPath: "/shop",
    });
  }

  return buildSearchMetadata(searchPage.query, {
    title: searchPage.title,
    description: searchPage.description,
    pageType: "search",
    canonicalPath: `/shop/${searchPage.slug}`,
  });
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { searchSlug } = await params;
  const searchPage = getSearchSeoPageBySlug(searchSlug);

  if (!searchPage) {
    notFound();
  }

  return (
    <HomeClient
      initialQuery={searchPage.query}
      initialPathname={`/shop/${searchPage.slug}`}
    />
  );
}
