import type { Product } from "@/lib/products";

const FALLBACK_IMAGE_SRC = "/images/product-placeholder.svg";
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_QUALITY = 80;

export const PRODUCT_GRID_IMAGE_SIZES = "(max-width: 768px) 50vw, 25vw";

const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  "cdn.shopify.com",
  "images.ctfassets.net",
]);

const hasKnownHostSuffix = (host: string) =>
  host.endsWith(".myshopify.com") ||
  host.endsWith(".cloudfront.net") ||
  host.endsWith(".imgix.net");

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isRelativePath = (value: string) => value.startsWith("/");

const isKnownOptimizedHost = (host: string) =>
  OPTIMIZED_HOSTS.has(host) || hasKnownHostSuffix(host);

export const getFallbackProductImage = () => FALLBACK_IMAGE_SRC;

export const formatProductImageUrl = (
  value: string,
  {
    width = DEFAULT_IMAGE_WIDTH,
    quality = DEFAULT_IMAGE_QUALITY,
  }: {
    width?: number;
    quality?: number;
  } = {},
) => {
  if (!value) {
    return FALLBACK_IMAGE_SRC;
  }

  if (isRelativePath(value)) {
    return value;
  }

  const url = parseUrl(value);
  if (!url) {
    return FALLBACK_IMAGE_SRC;
  }

  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));
    return url.toString();
  }

  if (url.hostname === "cdn.shopify.com" || url.hostname.endsWith(".myshopify.com")) {
    url.searchParams.set("width", String(width));
    return url.toString();
  }

  return url.toString();
};

export const getProductImageCandidates = (product: Product) => {
  const candidates = [product.image, ...product.images, FALLBACK_IMAGE_SRC]
    .map((candidate) => candidate.trim())
    .filter(Boolean);

  return Array.from(new Set(candidates));
};

export const getProductImageByIndex = (product: Product, index: number) => {
  const candidates = getProductImageCandidates(product);
  const safeIndex = Math.max(0, Math.min(index, candidates.length - 1));
  return formatProductImageUrl(candidates[safeIndex]);
};

export const shouldUseUnoptimizedImage = (value: string) => {
  if (!value || isRelativePath(value)) {
    return false;
  }

  const url = parseUrl(value);
  if (!url) {
    return false;
  }

  return !isKnownOptimizedHost(url.hostname);
};
