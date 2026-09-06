/** NexaHaus mobile design tokens — matches the web navy/gold system. */
export const theme = {
  color: {
    navy900: "#0A1F44",
    navy800: "#0f1f3d",
    navy700: "#182d54",
    navy100: "#d3dbe9",
    navy50: "#eef1f7",
    gold400: "#C9A227",
    ink: "#111827",
    inkMuted: "#4b5563",
    inkSubtle: "#6b7280",
    surface: "#ffffff",
    surfaceSunken: "#f7f8fa",
    line: "#e5e7eb",
    positive: "#0f766e",
    warning: "#b45309",
    critical: "#b91c1c",
  },
  radius: { md: 10, lg: 14, xl: 18 },
  space: (n: number) => n * 4,
  font: {
    size: { xs: 12, sm: 13, base: 15, lg: 18, xl: 22, xxl: 28 },
  },
} as const;
