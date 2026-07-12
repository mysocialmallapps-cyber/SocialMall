"use client";

import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { resolveAffiliateRedirectDestination } from "@/lib/commerce";
import { getProductById, getProductMonetizationMetadata } from "@/lib/products";
import { trackProductClick } from "@/lib/tracking";

export default function OutboundRedirectPage() {
  const params = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    const redirectToHomepage = () => {
      hasRedirectedRef.current = true;
      window.location.replace("/");
    };

    if (hasRedirectedRef.current) {
      return;
    }

    const rawProductId = params?.productId;
    if (!rawProductId || !/^\d+$/.test(rawProductId)) {
      redirectToHomepage();
      return;
    }

    const parsedProductId = Number.parseInt(rawProductId, 10);

    const product = getProductById(parsedProductId);
    if (!product) {
      redirectToHomepage();
      return;
    }

    const searchQuery = searchParams.get("q") ?? "";
    const normalizedRetailer =
      product.retailer.trim() || product.brand.trim() || "Unknown Retailer";
    const monetizationMetadata = getProductMonetizationMetadata(product);
    const resolvedDestination = resolveAffiliateRedirectDestination({
      affiliateUrl: product.affiliateUrl,
      productUrl: product.productUrl,
      affiliateNetwork: product.affiliateNetwork,
      productUrlVerificationStatus: product.productUrlVerificationStatus,
      productId: product.id,
      retailer: normalizedRetailer,
      searchQuery,
    });
    if (!resolvedDestination.destinationUrl) {
      trackProductClick({
        productId: String(product.id),
        productName: product.name,
        brand: product.brand,
        retailer: normalizedRetailer,
        category: product.category,
        vibe: product.vibe,
        price: product.price,
        searchQuery,
        destinationUrl: "/",
        hasAffiliateUrl: false,
        attribution: {
          provider: "unknown",
          source: "none",
          clickId: resolvedDestination.attribution.clickId,
          commissionRate: monetizationMetadata.commissionRate,
          commissionModel: monetizationMetadata.commissionModel,
          usedFallback: true,
          trackingApplied: false,
        },
      });

      if (process.env.NODE_ENV !== "production") {
        console.warn("SocialMall redirect blocked due to invalid URLs", {
          productId: product.id,
          affiliateUrl: product.affiliateUrl,
          productUrl: product.productUrl,
          affiliateNetwork: product.affiliateNetwork,
        });
      }
      redirectToHomepage();
      return;
    }

    const destinationUrl = resolvedDestination.destinationUrl;
    trackProductClick({
      productId: String(product.id),
      productName: product.name,
      brand: product.brand,
      retailer: normalizedRetailer,
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
  }, [params, searchParams]);

  return null;
}
