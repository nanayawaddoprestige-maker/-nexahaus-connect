import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About NexaHaus" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold text-navy-900">About NexaHaus</h1>
      <p className="mt-4 text-lg text-ink-muted">
        NexaHaus Properties &amp; Asset Management Ltd. is a technology-enabled
        property and asset management company for Ghana, with its first office
        opening in Accra in December 2027.
      </p>
      <div className="prose prose-sm mt-8 max-w-none text-ink">
        <p>
          We manage properties the way a professional asset-management institution
          would: with visibility, transparency, accountability and measurable
          performance. Owners see exactly what is happening with their property —
          status, tenants, rent, maintenance, inspections, documents and finances —
          any time, from anywhere.
        </p>
        <p>
          We are built for the way Ghanaians actually own property: owners with
          multiple properties, owners who don&rsquo;t live near them, and the
          Ghanaian diaspora who need to manage an asset from another country
          without a stream of phone calls and WhatsApp messages.
        </p>
        <p>
          NexaHaus provides property management, asset management and facilities
          management. Regulated real-estate agency activities are offered only where
          NexaHaus holds the required Ghanaian licensing and qualified personnel.
          NexaHaus does not provide legal, valuation, tax or investment advice.
        </p>
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/health-check" className="rounded-lg bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800">
          Property Health Check
        </Link>
        <Link href="/early-access" className="rounded-lg border border-line px-5 py-3 text-sm font-semibold text-navy-900 hover:bg-surface-sunken">
          Join Early Access
        </Link>
      </div>
    </div>
  );
}
