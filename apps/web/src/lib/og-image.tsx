import { ImageResponse } from "next/og";
import { COMPANY } from "@/lib/site-config";

/**
 * Shared per-page OG image renderer (edge runtime). The root
 * `app/opengraph-image.tsx` covers every page by default; a route folder
 * that wants a distinct card adds its own `opengraph-image.tsx` calling this
 * with a page-specific headline/eyebrow — Next.js's file convention prefers
 * the nearest one up the tree automatically, no change needed on the page
 * itself.
 */
export const OG_SIZE = { width: 1200, height: 630 };

export function renderOgImage(eyebrow: string, headline: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0a1f44",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "#c9a227",
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            {COMPANY.shortName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#e8c766", textTransform: "uppercase", letterSpacing: 1 }}>
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            {headline}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#7b91bd" }}>
          {COMPANY.legalName} · Accra, Ghana
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
