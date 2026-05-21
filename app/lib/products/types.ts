export type ProductGender = "men" | "women" | "unisex";

export type ProductCategory =
  | "tshirt"
  | "shirt"
  | "hoodie"
  | "trousers"
  | "jeans"
  | "dress"
  | "blazer"
  | "footwear"
  | "bag"
  | "jewellery";

export type ProductCurrency = "EUR" | "USD" | "GBP";
export type AffiliateNetwork = "awin" | "impact" | "rakuten" | "shopify-collabs";
export type ProductShippingCountry = "IE" | "US" | "GB" | "FR" | "SE" | "HU";
export type ProductTagField =
  | "colors"
  | "materials"
  | "vibe"
  | "style"
  | "occasion"
  | "season"
  | "fit";
export type ProductCollectionKey =
  | "featured"
  | "quiet-luxury"
  | "streetwear"
  | "vacation"
  | "occasionwear"
  | "essentials";

export interface Product {
  id: number;
  brand: string;
  name: string;
  description: string;
  price: number;
  currency: ProductCurrency;
  image: string;
  images: string[];
  category: ProductCategory;
  subcategory: string;
  colors: string[];
  materials: string[];
  vibe: string[];
  style: string[];
  occasion: string[];
  season: string[];
  gender: ProductGender[];
  fit: string[];
  productUrl: string;
  affiliateUrl: string | null;
  affiliateNetwork?: AffiliateNetwork;
  retailer: string;
  inStock: boolean;
  featured: boolean;
  popularityScore: number;
  compareAtPrice?: number;
  shippingCountry?: ProductShippingCountry;
  brandSlug?: string;
  productSlug?: string;
  rating?: number;
  reviewCount?: number;
}

export interface RecipeSeed {
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
}

export interface BrandProfileSeed {
  brand: string;
  brandSlug: string;
  retailer: string;
  domain: string;
  priceMultiplier: number;
  vibeBoost: string[];
  styleBoost: string[];
  shippingCountry: ProductShippingCountry;
  recipeKeys: string[];
}

export type ProductFilterOptions = {
  categories?: ProductCategory[];
  genders?: ProductGender[];
  colors?: string[];
  materials?: string[];
  vibe?: string[];
  style?: string[];
  occasion?: string[];
  season?: string[];
  fit?: string[];
  maxPrice?: number;
  inStockOnly?: boolean;
};

export type ProductSortMode =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "popularity-desc"
  | "rating-desc";
