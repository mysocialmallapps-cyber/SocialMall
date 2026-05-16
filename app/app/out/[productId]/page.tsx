"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { products } from "../../page";
import { trackProductClick } from "@/lib/tracking";

export default function OutboundRedirectPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    trackProductClick({
      productId: String(product.id),
      productName: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      searchQuery: searchParams.get("q") ?? "",
      destinationUrl,
    });

    window.location.replace(destinationUrl);
  }, [params, router, searchParams]);

  return null;
}
