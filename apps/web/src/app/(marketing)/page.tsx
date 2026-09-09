import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Hero } from "./_home/hero";
import { TrustStrip } from "./_home/trust-strip";
import { Problem } from "./_home/problem";
import { Services } from "./_home/services";
import { FinalCta } from "./_home/final-cta";

export const metadata: Metadata = buildMetadata({
  title: "Property & Asset Management in Ghana",
  description:
    "NexaHaus is a technology-enabled property and asset management company for Ghana. Protect your property, improve rental performance and manage your assets with visibility, accountability and transparent reporting — wherever you are.",
  path: routes.home,
  keywords: [
    "property management Ghana",
    "property management Accra",
    "property asset management Ghana",
    "diaspora property management Ghana",
    "property managers Ghana",
  ],
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Problem />
      <Services />
      {/*
        Phase 2 adds: Diaspora flow, NexaHaus Connect dashboard, Property Rescue,
        Property Health gauge, How it works, Transparency, Why NexaHaus, Early
        Access, Founding 100, Insights teaser, FAQ.
      */}
      <FinalCta />
    </>
  );
}
