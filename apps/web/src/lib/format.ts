import { Money, type MoneyJSON } from "@nexahaus/types";

/** Format an API money object ({ minor, currency }) for display, e.g. "GHS 8,000.00". */
export function formatMoney(
  value: MoneyJSON | { minor: string; currency?: string } | null | undefined,
  currencyFallback = "GHS",
): string {
  if (!value) return "—";
  try {
    return Money.of(value.minor, value.currency ?? currencyFallback).format({
      locale: "en-GH",
    });
  } catch {
    return "—";
  }
}

/** Format a bare minor-unit string with an explicit currency. */
export function formatMinor(
  minor: string | null | undefined,
  currency = "GHS",
): string {
  if (minor == null) return "—";
  return formatMoney({ minor, currency });
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value)}%`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : DATE_FMT.format(d);
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

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
