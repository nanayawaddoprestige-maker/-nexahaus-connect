import { ImageResponse } from "next/og";
import { COMPANY } from "@/lib/site-config";

/**
 * Default social share image, generated on the edge runtime (the supported
 * target for `next/og`). Pages that need a bespoke image pass `image` to
 * `buildMetadata`; everything else inherits this.
 */
export const runtime = "edge";
export const alt = `${COMPANY.shortName} — ${COMPANY.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          <div
            style={{
              fontSize: 62,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 940,
            }}
          >
            Property &amp; asset management for owners who expect visibility.
          </div>
          <div style={{ fontSize: 30, color: "#a7b6d3" }}>
            {COMPANY.tagline}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#7b91bd" }}>
          {COMPANY.legalName} · Accra, Ghana
        </div>
      </div>
    ),
    { ...size },
  );
}
