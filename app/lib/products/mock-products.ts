import type { Product } from "./types";
import { formatBrandName, generateBrandSlug, resolveBrandSlug } from "../brands";
import { buildMockAffiliateUrl, getAffiliateCommissionDefaults } from "../commerce";
import {
  productAffiliateNetworks,
  productBrandProfiles,
  productImagePool,
  productRecipes,
} from "./data";

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
      const productUrl = `https://${profile.domain}/products/${productSlug}`;
      const affiliateNetwork =
        productAffiliateNetworks[brandIndex % productAffiliateNetworks.length];
      const hasAffiliate = id % 5 !== 0;
      const affiliateUrl = hasAffiliate
        ? buildMockAffiliateUrl({
            network: affiliateNetwork,
            productUrl,
            productId: id,
            retailer: formattedRetailer,
          })
        : null;
      const affiliateCommission = affiliateUrl
        ? getAffiliateCommissionDefaults(affiliateNetwork)
        : null;
      const popularityScore = Math.max(
        62,
        Math.min(99, 74 + ((brandIndex * 9 + recipeIndex * 5) % 26)),
      );
      const inStock = id % 9 !== 0;
      const compareAtPrice =
        recipe.category === "jewellery" || recipe.category === "bag" || id % 3 !== 0
          ? undefined
          : Number(
              (
                toPrice(recipe.basePrice, profile.priceMultiplier, recipeIndex * 4) * 1.15
              ).toFixed(2),
            );

      const price = toPrice(recipe.basePrice, profile.priceMultiplier, recipeIndex * 4);
      const rating = Number(
        (4.2 + ((brandIndex * 3 + recipeIndex) % 7) * 0.1).toFixed(1),
      );
      const reviewCount = 45 + ((brandIndex * 83 + recipeIndex * 57) % 1900);
      const description = `${recipe.description} Curated by ${formattedBrandName} for ${recipe.occasion[0]} and ${recipe.occasion[1] ?? recipe.occasion[0]} looks.`;

      products.push({
        id,
        brand: formattedBrandName,
        name: productName,
        description,
        price,
        currency: "EUR",
        image,
        images: buildImageSet(image),
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
        affiliateUrl,
        affiliateNetwork: affiliateUrl ? affiliateNetwork : undefined,
        affiliateCommissionRate: affiliateCommission?.rate,
        affiliateCommissionModel: affiliateCommission?.model,
        retailer: formattedRetailer,
        inStock,
        featured: popularityScore > 92 || id % 11 === 0,
        popularityScore,
        compareAtPrice,
        shippingCountry: profile.shippingCountry,
        brandSlug: resolvedBrandSlug,
        productSlug,
        rating,
        reviewCount,
      });

      id += 1;
    });
  });

  return products;
};

export const mockProducts: Product[] = buildCatalog();
