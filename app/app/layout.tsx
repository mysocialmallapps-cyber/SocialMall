import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AnalyticsProvider } from "@/lib/analytics/provider";
import { AnalyticsScripts } from "@/lib/analytics/scripts";
import { getMetadataDefaults } from "@/lib/seo/metadata-templates";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadataDefaults = getMetadataDefaults();

export const metadata: Metadata = {
  metadataBase: new URL(metadataDefaults.siteUrl),
  title: {
    default: metadataDefaults.title,
    template: "%s",
  },
  description: metadataDefaults.description,
  openGraph: {
    type: "website",
    siteName: metadataDefaults.siteName,
    title: metadataDefaults.title,
    description: metadataDefaults.description,
    url: metadataDefaults.siteUrl,
    images: [metadataDefaults.socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: metadataDefaults.title,
    description: metadataDefaults.description,
    images: [metadataDefaults.socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AnalyticsScripts />
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
