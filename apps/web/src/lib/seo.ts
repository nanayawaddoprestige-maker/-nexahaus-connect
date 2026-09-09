import type { Metadata } from "next";
import { SITE_URL, COMPANY, ALLOW_INDEXING } from "@/lib/site-config";

export interface PageSeo {
  title: string;
  description: string;
  /** Path beginning with "/", used for the canonical URL. */
  path: string;
  /**
   * Optional social image override (absolute or root-relative). When omitted,
   * the generated `opengraph-image` route (src/app/opengraph-image.tsx) is used
   * automatically for both Open Graph and Twitter.
   */
  image?: string;
  /** Per-page override; the global default is driven by ALLOW_INDEXING. */
  noindex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
}

/**
 * Build a complete, unique <head> for a marketing page: title, description,
 * canonical, Open Graph and Twitter cards. Every page passes its own values —
 * there is no shared boilerplate description.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  noindex,
  keywords,
  type = "website",
}: PageSeo): Metadata {
  const canonical = path === "/" ? SITE_URL : new URL(path, SITE_URL).toString();
  const index = ALLOW_INDEXING && !noindex;

  const meta: Metadata = {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical },
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, "max-image-preview": "large" },
    },
    openGraph: {
      type,
      siteName: COMPANY.shortName,
      title,
      description,
      url: canonical,
      locale: "en_GH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };

  if (image) {
    meta.openGraph!.images = [{ url: image, width: 1200, height: 630, alt: title }];
    meta.twitter!.images = [image];
  }

  return meta;
}

/** Title template applied by the root layout: "<page> — NexaHaus". */
export const TITLE_TEMPLATE = `%s — ${COMPANY.shortName}`;
