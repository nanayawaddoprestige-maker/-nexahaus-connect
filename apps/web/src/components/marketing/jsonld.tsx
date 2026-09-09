import { SITE_URL, COMPANY, CONTACT, SOCIAL, LAUNCH } from "@/lib/site-config";

/**
 * Structured data (brief §19). Only facts we can stand behind are emitted:
 * no address (none is public yet), no aggregateRating, no founding date claims.
 * `foundingDate` reflects the planned launch and is clearly a future date.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Controlled, static input — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const sameAs = Object.values(SOCIAL).filter(Boolean);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: COMPANY.legalName,
        alternateName: COMPANY.shortName,
        url: SITE_URL,
        slogan: COMPANY.tagline,
        description: COMPANY.description,
        logo: `${SITE_URL}/icon.svg`,
        foundingDate: LAUNCH.date,
        areaServed: { "@type": "Country", name: "Ghana" },
        address: {
          "@type": "PostalAddress",
          addressLocality: CONTACT.city,
          addressCountry: "GH",
        },
        ...(sameAs.length ? { sameAs } : {}),
        ...(CONTACT.email
          ? {
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: CONTACT.email,
                areaServed: "GH",
                availableLanguage: ["en"],
              },
            }
          : {}),
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: COMPANY.shortName,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-GH",
      }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        serviceType: name,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: { "@type": "Country", name: "Ghana" },
        url: new URL(path, SITE_URL).toString(),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  trail,
}: {
  /** Ordered [label, path] pairs from Home to the current page. */
  trail: [string, string][];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map(([name, path], i) => ({
          "@type": "ListItem",
          position: i + 1,
          name,
          item: new URL(path, SITE_URL).toString(),
        })),
      }}
    />
  );
}

export function ArticleJsonLd({
  headline,
  description,
  path,
  datePublished,
  dateModified,
  author,
  image,
}: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        datePublished,
        dateModified: dateModified ?? datePublished,
        author: { "@type": "Organization", name: author },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: new URL(path, SITE_URL).toString(),
        ...(image ? { image: new URL(image, SITE_URL).toString() } : {}),
      }}
    />
  );
}
