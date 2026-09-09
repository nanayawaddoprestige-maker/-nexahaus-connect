import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { ComingSoon } from "@/components/marketing/coming-soon";

export const metadata: Metadata = buildMetadata({
  title: "The NexaHaus Founding 100",
  description:
    "Be among the first 100 property owners to join the NexaHaus journey: early access, priority onboarding, a voice in property-owner research and early product feedback.",
  path: routes.founding100,
});

export default function Founding100Page() {
  return (
    <ComingSoon
      eyebrow="The NexaHaus Founding 100"
      title="Be among the first 100 property owners to join the NexaHaus journey."
      description="The Founding 100 is a small group of owners who help shape NexaHaus before it opens. The full sign-up experience is being built; in the meantime you can register your interest through Early Access."
      bullets={[
        "Early access to NexaHaus services and NexaHaus Connect",
        "Priority onboarding when the Accra office opens",
        "Participation in property-owner research",
        "Early product feedback",
        "Access to selected property education and events",
        "Launch communications",
      ]}
      breadcrumb={[
        { label: "Early Access", href: routes.earlyAccess },
        { label: "Founding 100", href: routes.founding100 },
      ]}
      primary={{ label: "Join the Founding 100", href: `${routes.earlyAccess}?programme=founding-100` }}
    />
  );
}
