"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { resolveCommerceDestination } from "@/lib/commerce";
import { mockProducts } from "@/lib/products";
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

    const product = mockProducts.find((item) => item.id === parsedProductId);
    if (!product) {
      hasRedirectedRef.current = true;
      router.replace("/");
      return;
    }

    const resolvedDestination = resolveCommerceDestination({
      affiliateUrl: product.affiliateUrl,
      productUrl: product.productUrl,
    });
    if (!resolvedDestination.destinationUrl) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("SocialMall redirect blocked due to invalid URLs", {
          productId: product.id,
          affiliateUrl: product.affiliateUrl,
          productUrl: product.productUrl,
        });
      }
      hasRedirectedRef.current = true;
      router.replace("/");
      return;
    }

    const destinationUrl = resolvedDestination.destinationUrl;
    trackProductClick({
      productId: String(product.id),
      productName: product.name,
      brand: product.brand,
      category: product.category,
      vibe: product.vibe,
      price: product.price,
      searchQuery: searchParams.get("q") ?? "",
      destinationUrl,
      hasAffiliateUrl: resolvedDestination.source === "affiliate",
    });

    hasRedirectedRef.current = true;
    window.location.replace(destinationUrl);
  }, [params, router, searchParams]);

  return null;
}
