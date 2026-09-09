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
        display: [
          "var(--font-display)",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      fontSize: {
        // Editorial display scale — fluid, clamped for small screens.
        "display-2xl": ["clamp(2.75rem, 1.9rem + 4.2vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(2.25rem, 1.7rem + 2.7vw, 3.5rem)", { lineHeight: "1.07", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(1.875rem, 1.5rem + 1.9vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.5rem, 1.3rem + 1vw, 2rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      maxWidth: {
        content: "1200px",
        prose: "68ch",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(10, 31, 68, 0.04), 0 4px 16px rgba(10, 31, 68, 0.06)",
        raised: "0 8px 30px rgba(10, 31, 68, 0.10)",
        glow: "0 0 0 1px rgba(201, 162, 39, 0.35), 0 8px 30px rgba(10, 31, 68, 0.12)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
