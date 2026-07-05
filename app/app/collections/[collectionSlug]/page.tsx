import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeClient from "../../home-client";
import { getSeoCollectionBySlug, seoCollectionPages } from "@/lib/collections";
import { buildSearchMetadata } from "@/lib/seo/search-metadata";

type CollectionPageProps = {
  params: Promise<{ collectionSlug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return seoCollectionPages.map((collection) => ({
    collectionSlug: collection.slug,
  }));
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { collectionSlug } = await params;
  const collection = getSeoCollectionBySlug(collectionSlug);

  if (!collection) {
    return buildSearchMetadata("", {
      title: "Collections | SocialMall",
      description: "Discover curated SocialMall collections and long-tail fashion edits.",
      pageType: "collection",
      canonicalPath: "/collections",
    });
  }

  return buildSearchMetadata(collection.searchQuery, {
    title: collection.title,
    description: collection.description,
    pageType: "collection",
    collectionKind: collection.kind,
    canonicalPath: `/collections/${collection.slug}`,
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collectionSlug } = await params;
  const collection = getSeoCollectionBySlug(collectionSlug);

  if (!collection) {
    notFound();
  }

  return <HomeClient initialQuery={collection.searchQuery} initialCollection={collection} />;
}
