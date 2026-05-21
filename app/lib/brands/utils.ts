const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

const stripDiacritics = (value: string) =>
  value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

const BRAND_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const formatBrandName = (value: string) => normalizeWhitespace(value);

export const generateBrandSlug = (value: string) =>
  stripDiacritics(formatBrandName(value))
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isValidBrandSlug = (value: string) =>
  BRAND_SLUG_PATTERN.test(value.trim());

export const resolveBrandSlug = (brandName: string, existingSlug?: string) => {
  const candidate = existingSlug ? generateBrandSlug(existingSlug) : "";
  if (candidate && isValidBrandSlug(candidate)) {
    return candidate;
  }

  return generateBrandSlug(brandName);
};

export const getNormalizedBrandIdentifier = (
  brandName: string,
  existingSlug?: string,
) => `brand:${resolveBrandSlug(brandName, existingSlug)}`;

export const getBrandAttribution = ({
  brandName,
  retailerName,
  existingSlug,
}: {
  brandName: string;
  retailerName?: string;
  existingSlug?: string;
}) => {
  const displayName = formatBrandName(brandName);
  const normalizedRetailer = retailerName ? formatBrandName(retailerName) : "";
  const sourceLabel =
    normalizedRetailer && normalizedRetailer !== displayName
      ? normalizedRetailer
      : null;
  const brandSlug = resolveBrandSlug(displayName, existingSlug);

  return {
    displayName,
    sourceLabel,
    brandSlug,
    normalizedBrandId: getNormalizedBrandIdentifier(displayName, brandSlug),
  };
};

export const getBrandSearchTerms = ({
  brandName,
  retailerName,
  brandSlug,
}: {
  brandName: string;
  retailerName?: string;
  brandSlug?: string;
}) => {
  const brand = formatBrandName(brandName);
  const retailer = retailerName ? formatBrandName(retailerName) : "";
  const resolvedSlug = resolveBrandSlug(brand, brandSlug);
  const slugWords = resolvedSlug.split("-").filter((entry) => entry.length > 2);

  return Array.from(
    new Set([
      brand.toLowerCase(),
      stripDiacritics(brand).toLowerCase(),
      retailer.toLowerCase(),
      stripDiacritics(retailer).toLowerCase(),
      resolvedSlug,
      ...slugWords,
    ]).values(),
  ).filter((term) => term.length > 0);
};
