import { Inter, Fraunces } from "next/font/google";

/**
 * Typography (brief §3–4): Inter for UI and body, Fraunces as a restrained
 * editorial display face for large headings only. Both are self-hosted by
 * `next/font` at build time — no runtime request to Google, no layout shift.
 */
export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--font-display",
});

export const fontClass = `${sans.variable} ${display.variable}`;
