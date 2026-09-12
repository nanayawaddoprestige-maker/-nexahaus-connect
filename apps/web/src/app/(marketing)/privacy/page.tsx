import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How NexaHaus Properties & Asset Management Ltd. collects, uses and protects personal data submitted through this website.",
  path: routes.privacy,
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 text-sm leading-relaxed text-ink">
      <h1 className="text-3xl font-semibold text-navy-900">Privacy Policy</h1>
      <p className="mt-2 text-xs text-ink-subtle">
        Summary — a full policy will be published before launch.
      </p>
      <div className="mt-6 space-y-4">
        <p>
          <strong className="text-navy-900">Who we are.</strong> NexaHaus
          Properties &amp; Asset Management Ltd., Accra, Ghana.
        </p>
        <p>
          <strong className="text-navy-900">What we collect.</strong> The
          contact details and property information you provide through our forms
          (Property Health Check, Early Access, surveys), and, for clients, the
          data needed to manage your property.
        </p>
        <p>
          <strong className="text-navy-900">Why.</strong> To respond to your
          enquiry, provide our services, and — only where you have agreed — to
          contact you about NexaHaus. Marketing consent is recorded with the
          exact wording you were shown, and you can withdraw it at any time.
        </p>
        <p>
          <strong className="text-navy-900">Your rights.</strong> You may
          request access to, correction of, or deletion of your personal data,
          subject to records we are legally required to keep. Contact us to make
          a request.
        </p>
        <p>
          <strong className="text-navy-900">Retention.</strong> Financial and
          tenancy records are kept for the periods required by Ghanaian law;
          other personal data is kept only as long as needed for the purpose it
          was collected.
        </p>
        <p>
          <strong className="text-navy-900">Security.</strong> Access controls,
          encryption in transit, audit logging and least-privilege access.
          Documents are stored privately and are never exposed through public
          links.
        </p>
        <p>
          This platform is designed to support compliance with Ghana&rsquo;s
          Data Protection Act, 2012 (Act 843).
        </p>
      </div>
    </div>
  );
}
