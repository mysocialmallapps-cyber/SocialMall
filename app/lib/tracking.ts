type ProductClickTrackingInput = {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  searchQuery: string;
  destinationUrl: string;
};

export const trackProductClick = ({
  productId,
  productName,
  brand,
  category,
  price,
  searchQuery,
  destinationUrl,
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

  console.log("SocialMall product click", trackingEvent);
  return trackingEvent;
};
