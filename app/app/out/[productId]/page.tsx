"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { products } from "../../page";

export default function OutboundRedirectPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();

  useEffect(() => {
    const rawProductId = params?.productId;
    const parsedProductId = Number.parseInt(rawProductId ?? "", 10);

    if (!Number.isInteger(parsedProductId)) {
      router.replace("/");
      return;
    }

    const product = products.find((item) => item.id === parsedProductId);
    if (!product) {
      router.replace("/");
      return;
    }

    const destinationUrl = product.affiliateUrl ?? product.productUrl;
    console.log("SocialMall outbound click", {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      timestamp: new Date().toISOString(),
      destinationUrl,
    });

    window.location.replace(destinationUrl);
  }, [params, router]);

  return null;
}
