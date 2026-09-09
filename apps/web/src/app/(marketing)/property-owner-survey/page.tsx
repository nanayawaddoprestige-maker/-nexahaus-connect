import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = buildMetadata({
  title: "Property Owner Survey",
  description:
    "Help shape professional property management in Ghana. A short survey about how you own and manage property, the challenges you face, and what you would want from a professional partner.",
  path: routes.propertyOwnerSurvey,
});

export default function PropertyOwnerSurveyPage() {
  return (
    <ComingSoon
      eyebrow="Property Owner Survey"
      title="NexaHaus is being built with property owners, not just for them."
      description="We are speaking with owners now to understand the real challenges of owning and managing property in Ghana. The full multi-step survey is being finalised — join Early Access and we will send it to you first."
      bullets={[
        "About you and where you are based",
        "Your properties and where they are",
        "Your current management approach and challenges",
        "What you would value most from a professional partner",
        "Privacy and consent controls throughout",
      ]}
      breadcrumb={[{ label: "Property Owner Survey", href: routes.propertyOwnerSurvey }]}
      primary={{ label: "Join Early Access", href: routes.earlyAccess }}
      secondary={{ label: "Check your Property Health", href: routes.propertyHealthCheck }}
    />
  );
}
