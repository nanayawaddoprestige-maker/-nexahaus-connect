import type { MetadataRoute } from "next";
import { SITE_URL, ALLOW_INDEXING } from "@/lib/site-config";

/**
 * Marketing pages are indexable; the client portal, admin/CRM and API are never
 * indexed. Set NEXT_PUBLIC_ALLOW_INDEXING=false on staging to block everything.
 */
export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/login",
          "/accept-invite",
          "/forgot-password",
          "/reset-password",
          "/dashboard",
          "/properties",
          "/finance",
          "/maintenance",
          "/inspections",
          "/documents",
          "/approvals",
          "/reports",
          "/messages",
          "/notifications",
          "/property-health",
          "/tenant/",
          "/vendor/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
