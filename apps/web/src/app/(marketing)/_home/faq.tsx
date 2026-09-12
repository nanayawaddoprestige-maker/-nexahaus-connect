import Link from "next/link";
import { Section, SectionHeader } from "@/components/marketing/primitives";
import { FaqAccordion, FaqJsonLd } from "@/components/marketing/faq-accordion";
import { routes } from "@/lib/routes";
import { faqs } from "@/content/faq";

export function HomeFaq() {
  return (
    <Section id="faq">
      <FaqJsonLd items={faqs} />
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeader eyebrow="FAQ" title="Questions owners ask." />
          <p className="mt-4 text-sm text-ink-muted">
            Can&rsquo;t see your question?{" "}
            <Link
              href={routes.contact}
              className="font-medium text-navy-700 underline underline-offset-2"
            >
              Ask us directly
            </Link>
            .
          </p>
        </div>
        <FaqAccordion items={faqs} />
      </div>
    </Section>
  );
}
