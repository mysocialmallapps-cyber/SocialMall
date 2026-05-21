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
  shippingCountry?: string;
  brandSlug?: string;
  productSlug?: string;
  rating?: number;
  reviewCount?: number;
}
