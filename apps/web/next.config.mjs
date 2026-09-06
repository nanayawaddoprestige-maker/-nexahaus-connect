import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@nexahaus/types", "@nexahaus/validation"],
  // Self-contained server bundle for the production Docker image.
  output: "standalone",
  // Monorepo: trace files from the repo root so workspace deps are included.
  outputFileTracingRoot: repoRoot,
  // In dev, resolve @nexahaus/* to their TS source (the "development" export
  // condition) so a cold `pnpm dev` needs no prior build of packages/*.
  // `next build` omits this and picks the compiled "default" entry (dist/).
  webpack: (config, { dev }) => {
    if (dev) {
      config.resolve.conditionNames = [
        "development",
        ...(config.resolve.conditionNames ?? ["require", "node", "default"]),
      ];
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
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
