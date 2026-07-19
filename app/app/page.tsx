import type { Metadata } from "next";
import HomeClient from "./home-client";
import { buildSearchMetadata } from "@/lib/seo/search-metadata";

type SearchParamValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamValue>;
type MetadataProps = {
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>;
};

const getSearchQueryFromParams = async (
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>,
) => {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  const rawQuery = resolved.q;
  const queryValue = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  return (queryValue ?? "").trim();
};

export async function generateMetadata({
  searchParams,
}: MetadataProps): Promise<Metadata> {
  const query = await getSearchQueryFromParams(searchParams);
  return buildSearchMetadata(query, {
    pageType: query ? "search" : "home",
    canonicalPath: query ? `/?q=${encodeURIComponent(query)}` : "/",
  });
}

type PageProps = {
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>;
};

export default async function Page({ searchParams }: PageProps) {
  const initialQuery = await getSearchQueryFromParams(searchParams);
  return <HomeClient initialQuery={initialQuery} initialPathname="/" />;
}
