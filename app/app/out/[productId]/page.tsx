"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { products } from "../../home-client";
import { trackProductClick } from "@/lib/tracking";

export default function OutboundRedirectPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current) {
      return;
    }

    const rawProductId = params?.productId;
    if (!rawProductId || !/^\d+$/.test(rawProductId)) {
      hasRedirectedRef.current = true;
      router.replace("/");
      return;
    }

    const parsedProductId = Number.parseInt(rawProductId, 10);

    const product = products.find((item) => item.id === parsedProductId);
    if (!product) {
      hasRedirectedRef.current = true;
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

    hasRedirectedRef.current = true;
    window.location.replace(destinationUrl);
  }, [params, router, searchParams]);

  return null;
}
