import type { Metadata } from "next";
import PilotAnalyticsClient from "./pilot-analytics-client";

export const metadata: Metadata = {
  title: "Pilot Analytics | SocialMall",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PilotAnalyticsPage() {
  return <PilotAnalyticsClient />;
}
