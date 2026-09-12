import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = buildMetadata({
  title: "Property Owners Club",
  description:
    "A future community for property owners in Ghana and the diaspora — education, property clinics, market insights, maintenance guidance, webinars and networking.",
  path: routes.propertyOwnersClub,
});

export default function PropertyOwnersClubPage() {
  return (
    <ComingSoon
      eyebrow="Property Owners Club"
      title="A community for people who own property in Ghana."
      description="The Property Owners Club is a planned community for owners and diaspora owners: a place to learn, ask questions and compare notes. Membership details are still being worked out."
      bullets={[
        "Property education",
        "Property clinics",
        "Market insights",
        "Maintenance guidance",
        "Webinars",
        "Networking",
        "Owner reports",
      ]}
      breadcrumb={[
        { label: "Property Owners Club", href: routes.propertyOwnersClub },
      ]}
      primary={{
        label: "Join the Community",
        href: `${routes.earlyAccess}?programme=owners-club`,
      }}
    />
  );
}
