import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = buildMetadata({
  title: "NexaHaus Connect",
  description:
    "NexaHaus Connect is our technology platform, being built to give property owners a secure digital view of their assets: portfolio, rent and finance, maintenance, inspections, documents, approvals, reports and Property Health.",
  path: routes.nexahausConnect,
  keywords: ["property management platform Ghana", "property technology Ghana"],
});

export default function NexaHausConnectPage() {
  return (
    <ComingSoon
      eyebrow="NexaHaus Connect"
      title="Your Property. Your Data. Your Control."
      description="NexaHaus Connect is the technology platform being built to give property owners a secure digital view of their assets — with financial updates, maintenance activity, inspection reports, documents and portfolio performance in one place. A full interactive preview is on its way."
      bullets={[
        "Portfolio dashboard",
        "Property profiles",
        "Rent & finance",
        "Maintenance tracking",
        "Inspections",
        "Documents & approvals",
        "Reports",
        "Property Health & asset performance",
      ]}
      breadcrumb={[{ label: "NexaHaus Connect", href: routes.nexahausConnect }]}
      primary={{ label: "Join Early Access", href: routes.earlyAccess }}
    />
  );
}
