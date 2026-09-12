import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nexahaus/types", "@nexahaus/validation"],
  // Self-contained server bundle for the production Docker image. Vercel uses
  // its own build adapter and ignores this, so only set it off-Vercel.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  // Monorepo: trace files from the repo root so workspace deps are included.
  // (Top-level in Next 15; still under `experimental` in 14.x.)
  experimental: { outputFileTracingRoot: repoRoot },
  // In dev, resolve @nexahaus/* to their TS source (the "development" export
  // condition) so a cold `pnpm dev` needs no prior build of packages/*.
  // `next build` omits this and picks the compiled "default" entry (dist/).
  webpack: (config, { dev }) => {
    if (dev) {
      config.resolve.conditionNames = [
        "development",
        ...(config.resolve.conditionNames ?? ["require", "node", "default"]),
      ];
      // The @nexahaus/* sources use NodeNext-style ".js" specifiers that point
      // at sibling ".ts" files. When dev resolves them to source (above), teach
      // webpack to try ".ts"/".tsx" for a ".js" import. `next build` uses the
      // compiled dist/ and never hits this.
      config.resolve.extensionAlias = {
        ...(config.resolve.extensionAlias ?? {}),
        ".js": [".ts", ".tsx", ".js"],
        ".jsx": [".tsx", ".jsx"],
      };
    }
    return config;
  },
  // Same-origin proxy to the NestJS API so the HttpOnly refresh cookie works in
  // development without cross-site cookie relaxation. In production the edge/CDN
  // routes /api to the API service instead.
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
    ];
  },

  // Legacy marketing URLs → their canonical homes. Permanent (308) so search
  // engines transfer ranking signals.
  async redirects() {
    return [
      { source: "/welcome", destination: "/", permanent: true },
      { source: "/health-check", destination: "/property-health-check", permanent: true },
      { source: "/property-rescue-service", destination: "/property-rescue", permanent: true },
      { source: "/resources", destination: "/insights", permanent: false },
    ];
  },
  async headers() {
    // CSP note (Phase 7 QA): a per-request nonce + `strict-dynamic` was tried
    // first but doesn't work here — this site is almost entirely statically
    // generated (SSG, for performance/SEO), and a nonce can only be embedded
    // in HTML rendered per-request. Forcing every page dynamic just to support
    // nonces would undo that. `'unsafe-inline'` on script-src still blocks the
    // most common XSS payloads (loading an attacker's script from another
    // origin, or exfiltrating data cross-origin via connect-src/img-src),
    // which is where this policy earns its keep; everything else is strict.
    // No external scripts/styles are loaded: fonts are self-hosted by
    // `next/font` at build time (lib/fonts.ts), and the only
    // `dangerouslySetInnerHTML` usage is `type="application/ld+json"`
    // (components/marketing/jsonld.tsx, faq-accordion.tsx), which browsers
    // never execute as script. `/api/*` is same-origin from the browser's
    // perspective (proxied server-side — see the rewrite above), so
    // connect-src needs no extra host. If a real analytics provider is wired
    // up later (lib/analytics.ts's PostHog adapter is currently an inert
    // stub), its host must be added to connect-src (and script-src if it
    // loads a snippet).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
