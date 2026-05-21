"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { resolveAffiliateRedirectDestination } from "@/lib/commerce";
import { getProductMonetizationMetadata, mockProducts } from "@/lib/products";
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

    const searchQuery = searchParams.get("q") ?? "";
    const monetizationMetadata = getProductMonetizationMetadata(product);
    const resolvedDestination = resolveAffiliateRedirectDestination({
      affiliateUrl: product.affiliateUrl,
      productUrl: product.productUrl,
      affiliateNetwork: product.affiliateNetwork,
      productId: product.id,
      retailer: product.retailer,
      searchQuery,
    });
    if (!resolvedDestination.destinationUrl) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("SocialMall redirect blocked due to invalid URLs", {
          productId: product.id,
          affiliateUrl: product.affiliateUrl,
          productUrl: product.productUrl,
          affiliateNetwork: product.affiliateNetwork,
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
      retailer: product.retailer,
      category: product.category,
      vibe: product.vibe,
      price: product.price,
      searchQuery,
      destinationUrl,
      hasAffiliateUrl: resolvedDestination.source === "affiliate",
      attribution: {
        provider:
          resolvedDestination.attribution.provider ?? monetizationMetadata.affiliateProvider,
        source: resolvedDestination.source,
        clickId: resolvedDestination.attribution.clickId,
        commissionRate:
          resolvedDestination.attribution.commission?.rate ??
          monetizationMetadata.commissionRate,
        commissionModel:
          resolvedDestination.attribution.commission?.model ??
          monetizationMetadata.commissionModel,
        usedFallback: resolvedDestination.usedFallback,
        trackingApplied: resolvedDestination.trackingApplied,
      },
    });

    hasRedirectedRef.current = true;
    window.location.replace(destinationUrl);
  }, [params, router, searchParams]);

  return null;
}
