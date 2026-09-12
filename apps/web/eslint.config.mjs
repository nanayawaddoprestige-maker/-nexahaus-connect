import { FlatCompat } from "@eslint/eslintrc";
import nextConfig from "@nexahaus/eslint-config/next";

/**
 * `eslint-config-next@14` only ships a legacy (.eslintrc-style) shareable
 * config — it predates flat config and its peerDependency caps at ESLint 8
 * (docs/TECHNICAL_ARCHITECTURE.md §8 / docs/WEBSITE_IMPLEMENTATION_PLAN.md
 * "Known blockers"). `next lint` itself (bundled with next@14.2.13) also
 * still calls ESLint with legacy CLIEngine-only options and fails outright
 * under ESLint 9 ("Unknown options: useEslintrc, extensions, ..."), so the
 * `lint` script calls the `eslint` CLI directly instead. FlatCompat bridges
 * the legacy `next/core-web-vitals` config into this flat config — the
 * Next-documented approach for this exact combination.
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...compat.extends("next/core-web-vitals"),
  ...nextConfig,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    // Root-level plain JS build config: not part of tsconfig.json's include
    // set, so the type-aware parser can't resolve them to a TS "project".
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "eslint.config.mjs",
      "next.config.mjs",
      "postcss.config.mjs",
    ],
  },
];
