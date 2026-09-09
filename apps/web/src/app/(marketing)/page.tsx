import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Hero } from "./_home/hero";
import { TrustStrip } from "./_home/trust-strip";
import { Problem } from "./_home/problem";
import { Services } from "./_home/services";
import { DiasporaSection } from "./_home/diaspora";
import { ConnectSection } from "./_home/connect";
import { RescueSection } from "./_home/rescue";
import { HealthSection } from "./_home/health";
import { HowItWorks } from "./_home/how-it-works";
import { Transparency } from "./_home/transparency";
import { WhyNexaHaus } from "./_home/why";
import { EarlyAccess } from "./_home/early-access";
import { InsightsTeaser } from "./_home/insights-teaser";
import { HomeFaq } from "./_home/faq";
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
      <DiasporaSection />
      <ConnectSection />
      <RescueSection />
      <HealthSection />
      <HowItWorks />
      <Transparency />
      <WhyNexaHaus />
      <EarlyAccess />
      <InsightsTeaser />
      <HomeFaq />
      <FinalCta />
    </>
  );
}
