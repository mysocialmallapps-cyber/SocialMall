import { trackOutboundRedirectEvent } from "@/lib/analytics";

type ProductClickTrackingInput = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  searchQuery: string;
  destinationUrl: string;
  hasAffiliateUrl: boolean;
};

export const trackProductClick = ({
  productId,
  productName,
  brand,
  category,
  price,
  searchQuery,
  destinationUrl,
  hasAffiliateUrl,
}: ProductClickTrackingInput) => {
  const trackingEvent = {
    productId,
    productName,
    brand,
    category,
    price,
    searchQuery,
    timestamp: new Date().toISOString(),
    destinationUrl,
  };

  trackOutboundRedirectEvent({
    productId,
    destinationUrl,
    searchQuery,
    hasAffiliateUrl,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("SocialMall product click", trackingEvent);
  }

  return trackingEvent;
};
