export type FinancePeriod = "this_month" | "3m" | "6m" | "12m";

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Resolve a named reporting period to a half-open [start, end) UTC range.
 * `this_month` is the calendar month containing `now`; the others are the last
 * N whole months up to the end of the current month.
 */
export function periodRange(
  period: FinancePeriod,
  now: Date = new Date(),
): DateRange {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const startOfThisMonth = new Date(Date.UTC(y, m, 1));
  const startOfNextMonth = new Date(Date.UTC(y, m + 1, 1));

  switch (period) {
    case "this_month":
      return { start: startOfThisMonth, end: startOfNextMonth };
    case "3m":
      return { start: new Date(Date.UTC(y, m - 2, 1)), end: startOfNextMonth };
    case "6m":
      return { start: new Date(Date.UTC(y, m - 5, 1)), end: startOfNextMonth };
    case "12m":
      return { start: new Date(Date.UTC(y, m - 11, 1)), end: startOfNextMonth };
    default:
      return { start: startOfThisMonth, end: startOfNextMonth };
  }
}

/** Enumerate the whole months in a range as `{ label: "2027-09", start, end }`. */
export function monthsIn(
  range: DateRange,
): { label: string; start: Date; end: Date }[] {
  const out: { label: string; start: Date; end: Date }[] = [];
  let cursor = new Date(
    Date.UTC(range.start.getUTCFullYear(), range.start.getUTCMonth(), 1),
  );
  while (cursor < range.end) {
    const next = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
    );
    out.push({
      label: `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`,
      start: cursor,
      end: next,
    });
    cursor = next;
  }
  return out;
}
