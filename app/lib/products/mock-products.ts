import type { Product, ProductCategory, ProductGender } from "./types";

type Recipe = {
  key: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  basePrice: number;
  colorOptions: string[];
  materials: string[];
  vibe: string[];
  style: string[];
  occasion: string[];
  season: string[];
  gender: ProductGender[];
  fit: string[];
};

type BrandProfile = {
  brand: string;
  brandSlug: string;
  retailer: string;
  domain: string;
  priceMultiplier: number;
  vibeBoost: string[];
  styleBoost: string[];
  shippingCountry: "IE" | "US" | "GB" | "FR" | "SE" | "HU";
  recipeKeys: string[];
};

const imagePool = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1456327102063-fb5054efe647?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
];

const recipes: Recipe[] = [
  {
    key: "boxy-tee",
    name: "Heavy Jersey Boxy Tee",
    category: "tshirt",
    subcategory: "boxy t-shirt",
    description: "A heavyweight jersey tee with premium hand-feel and clean boxy drape.",
    basePrice: 75,
    colorOptions: ["black", "white", "grey", "navy"],
    materials: ["cotton"],
    vibe: ["casual", "minimalist"],
    style: ["clean", "minimalist"],
    occasion: ["casual", "airport outfit"],
    season: ["summer", "spring", "autumn"],
    gender: ["unisex"],
    fit: ["relaxed"],
  },
  {
    key: "oversized-tee",
    name: "Vintage Wash Oversized Tee",
    category: "tshirt",
    subcategory: "oversized t-shirt",
    description: "A washed oversized tee designed for modern streetwear proportions.",
    basePrice: 85,
    colorOptions: ["black", "white", "green", "brown"],
    materials: ["cotton"],
    vibe: ["streetwear", "casual"],
    style: ["clean", "smart casual"],
    occasion: ["casual", "airport outfit", "gym"],
    season: ["summer", "spring", "autumn"],
    gender: ["unisex"],
    fit: ["oversized", "relaxed"],
  },
  {
    key: "poplin-shirt",
    name: "Tailored Poplin Shirt",
    category: "shirt",
    subcategory: "poplin shirt",
    description: "A crisp poplin shirt cut for refined layering and everyday tailoring.",
    basePrice: 145,
    colorOptions: ["white", "blue", "black"],
    materials: ["cotton"],
    vibe: ["quiet luxury", "minimalist"],
    style: ["clean", "smart casual", "minimalist"],
    occasion: ["office", "dinner", "formal"],
    season: ["spring", "summer", "autumn"],
    gender: ["men", "women"],
    fit: ["tailored"],
  },
  {
    key: "linen-shirt",
    name: "Relaxed Linen Camp Shirt",
    category: "shirt",
    subcategory: "linen shirt",
    description: "A breathable linen camp shirt made for vacation and warm-city dressing.",
    basePrice: 165,
    colorOptions: ["beige", "cream", "white", "black", "blue"],
    materials: ["linen"],
    vibe: ["resort", "elegant", "casual"],
    style: ["resort", "smart casual", "minimalist"],
    occasion: ["holiday", "beach club", "dinner"],
    season: ["summer", "spring"],
    gender: ["men", "women"],
    fit: ["relaxed"],
  },
  {
    key: "silk-shirt",
    name: "Fluid Silk Resort Shirt",
    category: "shirt",
    subcategory: "silk shirt",
    description: "A fluid silk shirt with a polished drape and elevated evening feel.",
    basePrice: 240,
    colorOptions: ["beige", "cream", "black", "pink"],
    materials: ["silk"],
    vibe: ["quiet luxury", "elegant", "resort"],
    style: ["resort", "classy", "minimalist"],
    occasion: ["dinner", "holiday", "party"],
    season: ["summer", "spring", "autumn"],
    gender: ["women", "men"],
    fit: ["relaxed"],
  },
  {
    key: "pleated-trouser",
    name: "Pleated Wide-Leg Trousers",
    category: "trousers",
    subcategory: "pleated trousers",
    description: "Wide-leg pleated tailoring that balances polish with relaxed volume.",
    basePrice: 210,
    colorOptions: ["black", "navy", "grey", "beige"],
    materials: ["wool", "cotton"],
    vibe: ["quiet luxury", "classy", "minimalist"],
    style: ["smart casual", "minimalist", "clean"],
    occasion: ["office", "dinner", "formal"],
    season: ["autumn", "winter", "spring"],
    gender: ["women", "men"],
    fit: ["wide leg", "tailored"],
  },
  {
    key: "wool-trouser",
    name: "Tailored Wool Trousers",
    category: "trousers",
    subcategory: "tailored trousers",
    description: "Tailored wool trousers with a clean rise and refined straight leg.",
    basePrice: 240,
    colorOptions: ["black", "grey", "brown", "navy"],
    materials: ["wool"],
    vibe: ["quiet luxury", "formal", "elegant"],
    style: ["smart casual", "classy", "minimalist"],
    occasion: ["office", "formal", "dinner"],
    season: ["autumn", "winter", "spring"],
    gender: ["men", "women"],
    fit: ["tailored", "slim fit"],
  },
  {
    key: "straight-jean",
    name: "Relaxed Straight Denim Jeans",
    category: "jeans",
    subcategory: "straight jeans",
    description: "Classic straight denim jeans with an easy relaxed seat and authentic wash.",
    basePrice: 130,
    colorOptions: ["blue", "navy", "black"],
    materials: ["denim", "cotton"],
    vibe: ["casual", "streetwear"],
    style: ["clean", "smart casual"],
    occasion: ["casual", "airport outfit"],
    season: ["autumn", "winter", "spring"],
    gender: ["unisex"],
    fit: ["relaxed"],
  },
  {
    key: "baggy-jean",
    name: "Baggy Vintage Denim Jeans",
    category: "jeans",
    subcategory: "baggy jeans",
    description: "Baggy vintage denim with volume through the leg for street-led styling.",
    basePrice: 155,
    colorOptions: ["blue", "black", "grey"],
    materials: ["denim", "cotton"],
    vibe: ["streetwear", "casual"],
    style: ["clean", "smart casual"],
    occasion: ["casual", "airport outfit"],
    season: ["autumn", "winter", "spring"],
    gender: ["unisex"],
    fit: ["baggy", "relaxed"],
  },
  {
    key: "loopback-hoodie",
    name: "Oversized Loopback Hoodie",
    category: "hoodie",
    subcategory: "pullover hoodie",
    description: "A loopback cotton hoodie with premium weight and oversized shoulder line.",
    basePrice: 170,
    colorOptions: ["black", "grey", "brown", "green"],
    materials: ["cotton", "knit"],
    vibe: ["streetwear", "casual", "minimalist"],
    style: ["clean", "smart casual"],
    occasion: ["casual", "airport outfit", "gym"],
    season: ["autumn", "winter", "spring"],
    gender: ["unisex"],
    fit: ["oversized", "relaxed"],
  },
  {
    key: "structured-blazer",
    name: "Structured Single-Breasted Blazer",
    category: "blazer",
    subcategory: "single-breasted blazer",
    description: "A structured blazer with sharp shoulders and soft waist shaping.",
    basePrice: 320,
    colorOptions: ["black", "grey", "navy", "beige"],
    materials: ["wool"],
    vibe: ["quiet luxury", "elegant", "formal"],
    style: ["classy", "smart casual", "minimalist"],
    occasion: ["office", "formal", "dinner"],
    season: ["autumn", "winter", "spring"],
    gender: ["women", "men"],
    fit: ["tailored"],
  },
  {
    key: "wool-overcoat",
    name: "Double-Breasted Wool Overcoat",
    category: "blazer",
    subcategory: "wool overcoat",
    description: "A longline double-breasted overcoat built for polished cold-weather layering.",
    basePrice: 450,
    colorOptions: ["black", "brown", "grey", "navy"],
    materials: ["wool"],
    vibe: ["quiet luxury", "elegant", "formal"],
    style: ["classy", "minimalist", "paris"],
    occasion: ["office", "formal", "dinner"],
    season: ["winter", "autumn"],
    gender: ["women", "men"],
    fit: ["tailored", "relaxed"],
  },
  {
    key: "trench-coat",
    name: "Belted Trench Coat",
    category: "blazer",
    subcategory: "trench coat",
    description: "A belted trench with soft structure and city-ready weather protection.",
    basePrice: 390,
    colorOptions: ["beige", "brown", "black", "green"],
    materials: ["cotton", "wool"],
    vibe: ["quiet luxury", "minimalist", "elegant"],
    style: ["classy", "paris", "smart casual"],
    occasion: ["office", "airport outfit", "casual"],
    season: ["autumn", "spring", "winter"],
    gender: ["women", "men"],
    fit: ["tailored", "relaxed"],
  },
  {
    key: "knit-dress",
    name: "Rib-Knit Midi Dress",
    category: "dress",
    subcategory: "knit midi dress",
    description: "A rib-knit midi dress with body-skimming lines and elevated texture.",
    basePrice: 240,
    colorOptions: ["black", "brown", "beige", "red"],
    materials: ["knit", "cotton"],
    vibe: ["elegant", "minimalist", "classy"],
    style: ["classy", "minimalist", "smart casual"],
    occasion: ["dinner", "party", "formal"],
    season: ["autumn", "winter", "spring"],
    gender: ["women"],
    fit: ["slim fit"],
  },
  {
    key: "slip-dress",
    name: "Bias-Cut Slip Dress",
    category: "dress",
    subcategory: "slip dress",
    description: "A bias-cut slip dress with fluid movement for destination evenings.",
    basePrice: 285,
    colorOptions: ["black", "cream", "pink", "red"],
    materials: ["silk"],
    vibe: ["elegant", "resort", "quiet luxury"],
    style: ["resort", "classy", "minimalist"],
    occasion: ["dinner", "party", "holiday"],
    season: ["summer", "spring", "autumn"],
    gender: ["women"],
    fit: ["relaxed"],
  },
  {
    key: "leather-shoulder-bag",
    name: "Minimal Leather Shoulder Bag",
    category: "bag",
    subcategory: "shoulder bag",
    description: "A compact leather shoulder bag with understated hardware and luxe finish.",
    basePrice: 330,
    colorOptions: ["black", "brown", "beige", "white"],
    materials: ["leather"],
    vibe: ["quiet luxury", "classy", "minimalist"],
    style: ["clean", "elegant", "minimalist"],
    occasion: ["office", "dinner", "formal"],
    season: ["autumn", "winter", "spring", "summer"],
    gender: ["women"],
    fit: ["relaxed"],
  },
  {
    key: "crossbody-bag",
    name: "Utility Crossbody Bag",
    category: "bag",
    subcategory: "crossbody bag",
    description: "A practical crossbody bag with minimalist lines for city and travel use.",
    basePrice: 190,
    colorOptions: ["black", "brown", "green", "navy"],
    materials: ["leather", "cotton"],
    vibe: ["streetwear", "casual", "minimalist"],
    style: ["clean", "smart casual", "minimalist"],
    occasion: ["airport outfit", "casual", "holiday"],
    season: ["autumn", "winter", "spring", "summer"],
    gender: ["unisex"],
    fit: ["relaxed"],
  },
  {
    key: "hoop-earrings",
    name: "Polished Hoop Earrings",
    category: "jewellery",
    subcategory: "hoop earrings",
    description: "A polished hoop earring set designed for day-to-night layering.",
    basePrice: 95,
    colorOptions: ["beige"],
    materials: ["gold"],
    vibe: ["elegant", "minimalist", "classy"],
    style: ["clean", "classy", "minimalist"],
    occasion: ["party", "dinner", "formal"],
    season: ["summer", "spring", "autumn", "winter"],
    gender: ["women"],
    fit: ["relaxed"],
  },
  {
    key: "chain-necklace",
    name: "Sterling Chain Necklace",
    category: "jewellery",
    subcategory: "chain necklace",
    description: "A clean sterling chain with subtle weight for layered styling.",
    basePrice: 110,
    colorOptions: ["grey"],
    materials: ["silver"],
    vibe: ["streetwear", "minimalist", "classy"],
    style: ["clean", "smart casual", "minimalist"],
    occasion: ["party", "dinner", "casual"],
    season: ["summer", "spring", "autumn", "winter"],
    gender: ["unisex"],
    fit: ["relaxed"],
  },
  {
    key: "court-sneaker",
    name: "Leather Court Sneakers",
    category: "footwear",
    subcategory: "sneakers",
    description: "A premium leather court sneaker with low profile and versatile styling.",
    basePrice: 250,
    colorOptions: ["white", "black", "grey"],
    materials: ["leather"],
    vibe: ["streetwear", "minimalist", "quiet luxury"],
    style: ["clean", "smart casual", "minimalist"],
    occasion: ["casual", "airport outfit", "office"],
    season: ["spring", "summer", "autumn"],
    gender: ["unisex"],
    fit: ["slim fit"],
  },
  {
    key: "suede-loafer",
    name: "Suede Penny Loafers",
    category: "footwear",
    subcategory: "loafers",
    description: "Soft suede penny loafers delivering polished comfort for smart casual outfits.",
    basePrice: 280,
    colorOptions: ["brown", "black", "beige"],
    materials: ["suede", "leather"],
    vibe: ["quiet luxury", "classy", "elegant"],
    style: ["classy", "smart casual", "minimalist"],
    occasion: ["office", "dinner", "formal"],
    season: ["autumn", "spring", "summer"],
    gender: ["men", "women"],
    fit: ["slim fit"],
  },
  {
    key: "slide-sandal",
    name: "Leather Slide Sandals",
    category: "footwear",
    subcategory: "sandals",
    description: "Smooth leather slide sandals made for resort and warm-weather city styling.",
    basePrice: 165,
    colorOptions: ["beige", "brown", "black", "cream"],
    materials: ["leather"],
    vibe: ["resort", "casual", "minimalist"],
    style: ["resort", "clean", "minimalist"],
    occasion: ["holiday", "beach club", "casual"],
    season: ["summer", "spring"],
    gender: ["women", "men"],
    fit: ["relaxed"],
  },
];

const brandProfiles: BrandProfile[] = [
  {
    brand: "COS",
    brandSlug: "cos",
    retailer: "COS",
    domain: "www.cos.com",
    priceMultiplier: 1,
    vibeBoost: ["minimalist", "casual"],
    styleBoost: ["clean", "minimalist"],
    shippingCountry: "IE",
    recipeKeys: [
      "boxy-tee",
      "poplin-shirt",
      "pleated-trouser",
      "loopback-hoodie",
      "structured-blazer",
      "trench-coat",
      "court-sneaker",
      "leather-shoulder-bag",
    ],
  },
  {
    brand: "Arket",
    brandSlug: "arket",
    retailer: "Arket",
    domain: "www.arket.com",
    priceMultiplier: 0.95,
    vibeBoost: ["minimalist", "casual"],
    styleBoost: ["clean", "smart casual"],
    shippingCountry: "IE",
    recipeKeys: [
      "oversized-tee",
      "linen-shirt",
      "wool-trouser",
      "straight-jean",
      "structured-blazer",
      "slide-sandal",
      "crossbody-bag",
      "chain-necklace",
    ],
  },
  {
    brand: "Toteme",
    brandSlug: "toteme",
    retailer: "Toteme",
    domain: "toteme.com",
    priceMultiplier: 2.6,
    vibeBoost: ["quiet luxury", "elegant"],
    styleBoost: ["minimalist", "classy"],
    shippingCountry: "IE",
    recipeKeys: [
      "poplin-shirt",
      "silk-shirt",
      "pleated-trouser",
      "structured-blazer",
      "wool-overcoat",
      "slip-dress",
      "leather-shoulder-bag",
      "suede-loafer",
    ],
  },
  {
    brand: "Jacquemus",
    brandSlug: "jacquemus",
    retailer: "Jacquemus",
    domain: "www.jacquemus.com",
    priceMultiplier: 2.3,
    vibeBoost: ["resort", "elegant"],
    styleBoost: ["resort", "smart casual"],
    shippingCountry: "FR",
    recipeKeys: [
      "linen-shirt",
      "silk-shirt",
      "pleated-trouser",
      "slip-dress",
      "knit-dress",
      "slide-sandal",
      "crossbody-bag",
      "hoop-earrings",
    ],
  },
  {
    brand: "Acne Studios",
    brandSlug: "acne-studios",
    retailer: "Acne Studios",
    domain: "www.acnestudios.com",
    priceMultiplier: 2.2,
    vibeBoost: ["streetwear", "minimalist"],
    styleBoost: ["clean", "paris"],
    shippingCountry: "SE",
    recipeKeys: [
      "oversized-tee",
      "poplin-shirt",
      "baggy-jean",
      "loopback-hoodie",
      "structured-blazer",
      "wool-overcoat",
      "court-sneaker",
      "crossbody-bag",
    ],
  },
  {
    brand: "Stussy",
    brandSlug: "stussy",
    retailer: "Stussy",
    domain: "www.stussy.com",
    priceMultiplier: 1.1,
    vibeBoost: ["streetwear", "casual"],
    styleBoost: ["clean", "smart casual"],
    shippingCountry: "US",
    recipeKeys: [
      "oversized-tee",
      "loopback-hoodie",
      "baggy-jean",
      "straight-jean",
      "structured-blazer",
      "court-sneaker",
      "crossbody-bag",
      "chain-necklace",
    ],
  },
  {
    brand: "Aimé Leon Dore",
    brandSlug: "aime-leon-dore",
    retailer: "Aimé Leon Dore",
    domain: "www.aimeleondore.com",
    priceMultiplier: 1.7,
    vibeBoost: ["streetwear", "classy"],
    styleBoost: ["smart casual", "clean"],
    shippingCountry: "US",
    recipeKeys: [
      "boxy-tee",
      "poplin-shirt",
      "wool-trouser",
      "straight-jean",
      "loopback-hoodie",
      "structured-blazer",
      "suede-loafer",
      "leather-shoulder-bag",
    ],
  },
  {
    brand: "Represent",
    brandSlug: "represent",
    retailer: "Represent",
    domain: "representclo.com",
    priceMultiplier: 1.6,
    vibeBoost: ["streetwear", "casual"],
    styleBoost: ["clean", "smart casual"],
    shippingCountry: "GB",
    recipeKeys: [
      "oversized-tee",
      "loopback-hoodie",
      "baggy-jean",
      "wool-trouser",
      "structured-blazer",
      "court-sneaker",
      "crossbody-bag",
      "chain-necklace",
    ],
  },
  {
    brand: "Fear of God Essentials",
    brandSlug: "fear-of-god-essentials",
    retailer: "Fear of God Essentials",
    domain: "fearofgod.com",
    priceMultiplier: 1.85,
    vibeBoost: ["streetwear", "minimalist"],
    styleBoost: ["clean", "smart casual"],
    shippingCountry: "US",
    recipeKeys: [
      "oversized-tee",
      "loopback-hoodie",
      "wool-trouser",
      "baggy-jean",
      "wool-overcoat",
      "court-sneaker",
      "crossbody-bag",
      "chain-necklace",
    ],
  },
  {
    brand: "Loulou Studio",
    brandSlug: "loulou-studio",
    retailer: "Loulou Studio",
    domain: "louloustudio.com",
    priceMultiplier: 2,
    vibeBoost: ["quiet luxury", "resort"],
    styleBoost: ["minimalist", "classy"],
    shippingCountry: "FR",
    recipeKeys: [
      "linen-shirt",
      "silk-shirt",
      "pleated-trouser",
      "knit-dress",
      "wool-overcoat",
      "slide-sandal",
      "leather-shoulder-bag",
      "hoop-earrings",
    ],
  },
  {
    brand: "Nanushka",
    brandSlug: "nanushka",
    retailer: "Nanushka",
    domain: "www.nanushka.com",
    priceMultiplier: 2.1,
    vibeBoost: ["resort", "elegant"],
    styleBoost: ["minimalist", "smart casual"],
    shippingCountry: "HU",
    recipeKeys: [
      "linen-shirt",
      "slip-dress",
      "knit-dress",
      "pleated-trouser",
      "trench-coat",
      "slide-sandal",
      "crossbody-bag",
      "chain-necklace",
    ],
  },
  {
    brand: "The Frankie Shop",
    brandSlug: "the-frankie-shop",
    retailer: "The Frankie Shop",
    domain: "thefrankieshop.com",
    priceMultiplier: 1.55,
    vibeBoost: ["minimalist", "quiet luxury"],
    styleBoost: ["clean", "paris"],
    shippingCountry: "US",
    recipeKeys: [
      "boxy-tee",
      "poplin-shirt",
      "pleated-trouser",
      "structured-blazer",
      "wool-overcoat",
      "trench-coat",
      "leather-shoulder-bag",
      "court-sneaker",
    ],
  },
  {
    brand: "Axel Arigato",
    brandSlug: "axel-arigato",
    retailer: "Axel Arigato",
    domain: "axelarigato.com",
    priceMultiplier: 1.8,
    vibeBoost: ["streetwear", "minimalist"],
    styleBoost: ["clean", "smart casual"],
    shippingCountry: "SE",
    recipeKeys: [
      "oversized-tee",
      "poplin-shirt",
      "wool-trouser",
      "loopback-hoodie",
      "baggy-jean",
      "court-sneaker",
      "crossbody-bag",
      "chain-necklace",
    ],
  },
];

const recipeByKey = new Map(recipes.map((recipe) => [recipe.key, recipe]));

const unique = (values: string[]) => Array.from(new Set(values));

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

  brandProfiles.forEach((profile, brandIndex) => {
    profile.recipeKeys.forEach((recipeKey, recipeIndex) => {
      const recipe = recipeByKey.get(recipeKey);
      if (!recipe) {
        return;
      }

      const imageIndex = (brandIndex * 7 + recipeIndex * 3) % imagePool.length;
      const image = imagePool[imageIndex];
      const primaryColor =
        recipe.colorOptions[(brandIndex + recipeIndex) % recipe.colorOptions.length];
      const secondaryColor =
        recipe.colorOptions[
          (brandIndex + recipeIndex + 1) % recipe.colorOptions.length
        ];
      const colors = unique(
        recipe.category === "bag" || recipe.category === "footwear"
          ? [primaryColor, secondaryColor]
          : [primaryColor],
      );

      const namePrefix = toTitleCase(primaryColor);
      const productName = `${namePrefix} ${recipe.name}`;
      const productSlug = slugify(`${profile.brandSlug}-${productName}-${recipeIndex + 1}`);
      const productUrl = `https://${profile.domain}/products/${productSlug}`;
      const hasAffiliate = id % 5 !== 0;
      const affiliateUrl = hasAffiliate
        ? `https://socialmall.com/out/${productSlug}`
        : null;
      const popularityScore = Math.max(
        62,
        Math.min(99, 74 + ((brandIndex * 9 + recipeIndex * 5) % 26)),
      );
      const inStock = id % 9 !== 0;
      const compareAtPrice =
        recipe.category === "jewellery" || recipe.category === "bag" || id % 3 !== 0
          ? undefined
          : Number((toPrice(recipe.basePrice, profile.priceMultiplier, recipeIndex * 4) * 1.15).toFixed(2));

      const price = toPrice(recipe.basePrice, profile.priceMultiplier, recipeIndex * 4);
      const rating = Number(
        (4.2 + ((brandIndex * 3 + recipeIndex) % 7) * 0.1).toFixed(1),
      );
      const reviewCount = 45 + ((brandIndex * 83 + recipeIndex * 57) % 1900);
      const description = `${recipe.description} Curated by ${profile.brand} for ${recipe.occasion[0]} and ${recipe.occasion[1] ?? recipe.occasion[0]} looks.`;

      products.push({
        id,
        brand: profile.brand,
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
        retailer: profile.retailer,
        inStock,
        featured: popularityScore > 92 || id % 11 === 0,
        popularityScore,
        compareAtPrice,
        shippingCountry: profile.shippingCountry,
        brandSlug: profile.brandSlug,
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
