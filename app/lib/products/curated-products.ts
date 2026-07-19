import type { Product } from "./types";
import { formatBrandName, generateBrandSlug, resolveBrandSlug } from "../brands";
import {
  productBrandProfiles,
  productImagePool,
  productRecipes,
} from "./data";
import {
  verifiedProductFeedSync,
  verifiedProducts,
} from "./data/verified-products.generated";
import { getProductTrustSummary, getVerificationQueue } from "./trust";

const recipeByKey = new Map(productRecipes.map((recipe) => [recipe.key, recipe]));

const unique = (values: string[]) => Array.from(new Set(values));

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");

const buildImageSet = (baseImage: string) =>
  [1200, 1080, 900].map((width) =>
    baseImage.includes("w=")
      ? baseImage.replace(/w=\d+/g, `w=${width}`)
      : `${baseImage}&w=${width}`,
  );

const buildBrandUrl = (domain: string) => `https://${domain}`;

const toPrice = (base: number, multiplier: number, offset: number) => {
  const raw = base * multiplier + offset;
  if (raw < 120) {
    return Number((Math.round(raw) + 0.99).toFixed(2));
  }

  return Math.round(raw / 5) * 5;
};

const buildCatalog = () => {
  const products: Product[] = [];
  let id = 1;

  productBrandProfiles.forEach((profile, brandIndex) => {
    profile.recipeKeys.forEach((recipeKey, recipeIndex) => {
      const recipe = recipeByKey.get(recipeKey);
      if (!recipe) {
        return;
      }

      const formattedBrandName = formatBrandName(profile.brand);
      const formattedRetailer = formatBrandName(profile.retailer);
      const resolvedBrandSlug = resolveBrandSlug(formattedBrandName, profile.brandSlug);
      const imageIndex = (brandIndex * 7 + recipeIndex * 3) % productImagePool.length;
      const image = productImagePool[imageIndex];
      const primaryColor =
        recipe.colorOptions[(brandIndex + recipeIndex) % recipe.colorOptions.length];
      const secondaryColor =
        recipe.colorOptions[(brandIndex + recipeIndex + 1) % recipe.colorOptions.length];
      const colors = unique(
        recipe.category === "bag" || recipe.category === "footwear"
          ? [primaryColor, secondaryColor]
          : [primaryColor],
      );

      const namePrefix = toTitleCase(primaryColor);
      const productName = `${namePrefix} ${recipe.name}`;
      const productSlug = generateBrandSlug(
        `${resolvedBrandSlug}-${productName}-${recipeIndex + 1}`,
      );
      const productUrl = buildBrandUrl(profile.domain);
      const popularityScore = Math.max(
        62,
        Math.min(99, 74 + ((brandIndex * 9 + recipeIndex * 5) % 26)),
      );
      const inStock = false;
      const compareAtPrice =
        recipe.category === "jewellery" || recipe.category === "bag" || id % 3 !== 0
          ? undefined
          : Number(
              (
                toPrice(recipe.basePrice, profile.priceMultiplier, recipeIndex * 4) * 1.15
              ).toFixed(2),
            );

      const price = toPrice(recipe.basePrice, profile.priceMultiplier, recipeIndex * 4);
      const description = `${recipe.description} A SocialMall style reference for ${recipe.occasion[0]} and ${recipe.occasion[1] ?? recipe.occasion[0]} looks. Exact product page and product image pending retailer verification.`;

      products.push({
        id,
        brand: formattedBrandName,
        name: productName,
        description,
        price,
        currency: "EUR",
        image,
        images: buildImageSet(image),
        imageVerificationStatus: "illustrative",
        category: recipe.category,
        subcategory: recipe.subcategory,
        colors,
        materials: recipe.materials,
        vibe: unique([...recipe.vibe, ...profile.vibeBoost]),
        style: unique([...recipe.style, ...profile.styleBoost]),
        occasion: recipe.occasion,
        season: recipe.season,
        gender: recipe.gender,
        fit: recipe.fit,
        productUrl,
        productUrlVerificationStatus: "brand-site",
        brandUrl: productUrl,
        catalogSource: "style-inspiration",
        priceStatus: "estimated",
        sourceLabel: "SocialMall inspiration catalogue",
        sourceNote:
          "Illustrative styling reference. Exact retailer product link and brand-owned image are not verified yet.",
        affiliateUrl: null,
        affiliateNetwork: undefined,
        affiliateCommissionRate: undefined,
        affiliateCommissionModel: undefined,
        retailer: formattedRetailer,
        inStock,
        featured: popularityScore > 92 || id % 11 === 0,
        popularityScore,
        compareAtPrice,
        shippingCountry: profile.shippingCountry,
        brandSlug: resolvedBrandSlug,
        productSlug,
      });

      id += 1;
    });
  });

  return products;
};

export const curatedProducts: Product[] = [...verifiedProducts, ...buildCatalog()];

export const getProductById = (productId: number) =>
  curatedProducts.find((product) => product.id === productId) ?? null;

export const getProductCatalogStatus = () => {
  const brandCount = new Set(curatedProducts.map((product) => product.brandSlug)).size;
  const categoryCount = new Set(curatedProducts.map((product) => product.category)).size;
  const verifiedProductCount = curatedProducts.filter(
    (product) => product.catalogSource === "verified-retailer",
  ).length;
  const styleInspirationCount = curatedProducts.filter(
    (product) => product.catalogSource === "style-inspiration",
  ).length;
  const verifiedImageCount = curatedProducts.filter(
    (product) => product.imageVerificationStatus === "verified-product-image",
  ).length;
  const verifiedProductUrlCount = curatedProducts.filter(
    (product) => product.productUrlVerificationStatus === "verified-product-page",
  ).length;
  const brandDiscoveryCount = curatedProducts.filter(
    (product) => product.productUrlVerificationStatus === "brand-site",
  ).length;
  const affiliateProductCount = curatedProducts.filter(
    (product) => Boolean(product.affiliateUrl),
  ).length;
  const inStockProductCount = curatedProducts.filter((product) => product.inStock).length;
  const trustSummary = getProductTrustSummary(curatedProducts);
  const verificationQueueCount = getVerificationQueue(curatedProducts).length;

  return {
    source: verifiedProducts.length
      ? "verified-retailer-feed-plus-style-inspiration-catalog"
      : "static-style-inspiration-catalog",
    verifiedFeed: verifiedProductFeedSync,
    productCount: curatedProducts.length,
    brandCount,
    categoryCount,
    verifiedProductCount,
    styleInspirationCount,
    verifiedImageCount,
    verifiedProductUrlCount,
    brandDiscoveryCount,
    monetizationReadyProductCount: affiliateProductCount,
    affiliateProductCount,
    directProductCount: curatedProducts.length - affiliateProductCount,
    inStockProductCount,
    verificationQueueCount,
    trustScore: trustSummary.trustScore,
    needsVerificationCount: trustSummary.needsVerificationCount,
    cmsReady: true,
  };
};
