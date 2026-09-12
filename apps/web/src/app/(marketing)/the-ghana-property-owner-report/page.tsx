import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = buildMetadata({
  title: "The Ghana Property Owner Report",
  description:
    "A forthcoming NexaHaus report on how property is owned and managed in Ghana — management challenges, rent collection, maintenance, diaspora ownership, reporting and owner expectations. Based on primary research, published once the data is in.",
  path: routes.ghanaReport,
});

export default function GhanaReportPage() {
  return (
    <ComingSoon
      eyebrow="Signature research"
      title="The Ghana Property Owner Report"
      description="We are running primary research with property owners across Greater Accra and the diaspora. The report will be published once there is real data to share — it will not contain estimates presented as findings."
      bullets={[
        "Property ownership patterns",
        "Management challenges",
        "Rent collection",
        "Maintenance",
        "Tenant management",
        "Diaspora ownership",
        "Reporting and technology expectations",
        "Property performance",
      ]}
      breadcrumb={[
        { label: "The Ghana Property Owner Report", href: routes.ghanaReport },
      ]}
      primary={{
        label: "Contribute via the Property Owner Survey",
        href: routes.propertyOwnerSurvey,
      }}
      secondary={{
        label: "Get the report on release",
        href: routes.earlyAccess,
      }}
    />
  );
}
