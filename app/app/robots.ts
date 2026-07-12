import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://social-mall.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Outbound redirect paths are technical hops, not SEO landing pages.
        disallow: ["/out/", "/pilot/"],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
    host: SITE_URL,
  };
}
