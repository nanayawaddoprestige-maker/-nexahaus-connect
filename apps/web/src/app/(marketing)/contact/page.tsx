import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { routes } from "@/lib/routes";
import { Container, Eyebrow } from "@/components/marketing/primitives";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ContactForm } from "@/components/forms/contact-form";
import {
  CONTACT,
  WHATSAPP_LINK,
  PRE_LAUNCH_MODE,
  LAUNCH,
} from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Contact NexaHaus",
  description:
    "Talk to NexaHaus about your property in Ghana. Tell us the property, where it is and what you want solved — a member of the team will get back to you.",
  path: routes.contact,
  keywords: [
    "property managers Ghana",
    "property management company Accra",
    "contact property manager Ghana",
  ],
});

export default function ContactPage() {
  return (
    <div className="bg-surface">
      <Container className="py-10">
        <Breadcrumbs trail={[{ label: "Contact", href: routes.contact }]} />
      </Container>

      <Container className="grid gap-12 pb-20 pt-2 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h1 className="nx-display mt-3 text-display-md text-navy-900">
            Let&rsquo;s Talk About Your Property.
          </h1>
          <p className="mt-4 text-ink-muted">
            Tell us about the property and the challenges you want solved. Your
            details come straight to the NexaHaus team.
          </p>

          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-navy-900">Where we operate</dt>
              <dd className="mt-0.5 text-ink-muted">
                {CONTACT.city}, {CONTACT.country} — expanding across Ghana.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-navy-900">Status</dt>
              <dd className="mt-0.5 text-ink-muted">
                {PRE_LAUNCH_MODE
                  ? `First office opening in ${LAUNCH.city}, ${LAUNCH.label}. We are speaking with owners now.`
                  : `Operating from ${LAUNCH.city}.`}
              </dd>
            </div>
            {CONTACT.email ? (
              <div>
                <dt className="font-medium text-navy-900">Email</dt>
                <dd className="mt-0.5">
                  <a
                    className="text-navy-700 underline underline-offset-2"
                    href={`mailto:${CONTACT.email}`}
                  >
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {CONTACT.phone ? (
              <div>
                <dt className="font-medium text-navy-900">Phone</dt>
                <dd className="mt-0.5">
                  <a
                    className="text-navy-700 underline underline-offset-2"
                    href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`}
                  >
                    {CONTACT.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {WHATSAPP_LINK ? (
              <div>
                <dt className="font-medium text-navy-900">WhatsApp</dt>
                <dd className="mt-0.5">
                  <a
                    className="text-navy-700 underline underline-offset-2"
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat with NexaHaus
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <ContactForm />
        </div>
      </Container>
    </div>
  );
}
