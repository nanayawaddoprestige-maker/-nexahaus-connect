import { Money } from "@nexahaus/types";

export function money(minor: string | null | undefined, currency = "GHS"): string {
  if (minor == null) return "—";
  try {
    return Money.of(minor, currency).format({ locale: "en-GH" });
  } catch {
    return "—";
  }
}

export function percent(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(v)}%`;
}

export function date(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function titleCase(v: string): string {
  return v
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
