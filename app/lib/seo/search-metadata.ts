import type { Metadata } from "next";
import {
  buildSeoPhrase,
  buildTemplatedMetadata,
  toTitleCase,
  type MetadataCollectionKind,
  type MetadataPageType,
} from "./metadata-templates";

type MetadataOverrides = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  pageType?: MetadataPageType;
  collectionKind?: MetadataCollectionKind;
};

export { toTitleCase, buildSeoPhrase };

export const buildSearchMetadata = (
  query: string,
  overrides: MetadataOverrides = {},
): Metadata =>
  buildTemplatedMetadata(query, {
    title: overrides.title,
    description: overrides.description,
    canonicalPath: overrides.canonicalPath,
    pageType: overrides.pageType ?? "search",
    collectionKind: overrides.collectionKind,
  });
