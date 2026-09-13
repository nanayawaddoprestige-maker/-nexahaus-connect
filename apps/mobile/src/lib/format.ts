import { Money } from "@nexahaus/types";

export function money(
  minor: string | null | undefined,
  currency = "GHS",
): string {
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
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "no record";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "no record";
  const days = Math.round((Date.now() - d) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export function titleCase(v: string): string {
  return v
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
