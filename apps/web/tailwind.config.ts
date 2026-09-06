import type { Config } from "tailwindcss";

/**
 * NexaHaus design tokens — premium, corporate, trustworthy.
 * Navy/dark-blue foundation with restrained gold accents. Generous whitespace,
 * strong type hierarchy, accessible contrast. No decorative gradients.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f7",
          100: "#d3dbe9",
          200: "#a7b6d3",
          300: "#7b91bd",
          400: "#4f6ca7",
          500: "#2f4d86",
          600: "#1f3a6b",
          700: "#182d54",
          800: "#0f1f3d",
          900: "#0a1f44",
          950: "#06132b",
        },
        gold: {
          50: "#faf6ea",
          100: "#f2e7c4",
          200: "#e6d08c",
          300: "#d9ba55",
          400: "#c9a227",
          500: "#a9871d",
          600: "#856a16",
          700: "#614d10",
          800: "#3d310a",
          900: "#1f1905",
        },
        ink: {
          DEFAULT: "#111827",
          muted: "#4b5563",
          subtle: "#6b7280",
        },
        surface: {
          DEFAULT: "#ffffff",
          sunken: "#f7f8fa",
          raised: "#ffffff",
        },
        line: "#e5e7eb",
        positive: "#0f766e",
        warning: "#b45309",
        critical: "#b91c1c",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(10, 31, 68, 0.04), 0 4px 16px rgba(10, 31, 68, 0.06)",
        raised: "0 8px 30px rgba(10, 31, 68, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
