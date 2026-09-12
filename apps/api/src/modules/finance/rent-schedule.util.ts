import type { LeaseFrequency } from "@nexahaus/types";

export interface RentPeriod {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
}

const MONTHS_BY_FREQUENCY: Record<Exclude<LeaseFrequency, "CUSTOM">, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  BIANNUAL: 6,
  ANNUAL: 12,
};

/**
 * Generate the billing periods for a lease term. `rentMinor` on a lease is the
 * amount due PER PERIOD at the stated frequency (a quarterly lease's rent is the
 * quarterly figure). Periods are half-open [start, end); the due date is the
 * period start. A trailing partial period is still billed in full — proration is
 * a later adjustment, not silent.
 *
 * Deterministic: same inputs → same periods, so re-running generation is safe
 * (callers upsert on (leaseId, periodStart)).
 */
export function rentPeriods(
  startDate: Date,
  endDate: Date,
  frequency: LeaseFrequency,
  customFrequencyDays?: number | null,
): RentPeriod[] {
  const periods: RentPeriod[] = [];
  if (endDate <= startDate) return periods;

  if (frequency === "CUSTOM") {
    const days = customFrequencyDays ?? 30;
    let cursor = new Date(startDate);
    let guard = 0;
    while (cursor < endDate && guard < 2000) {
      const next = new Date(cursor);
      next.setUTCDate(next.getUTCDate() + days);
      periods.push({
        periodStart: new Date(cursor),
        periodEnd: new Date(next),
        dueDate: new Date(cursor),
      });
      cursor = next;
      guard += 1;
    }
    return periods;
  }

  const step = MONTHS_BY_FREQUENCY[frequency];
  let cursor = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );
  let guard = 0;
  while (cursor < endDate && guard < 600) {
    const next = new Date(cursor);
    next.setUTCMonth(next.getUTCMonth() + step);
    periods.push({
      periodStart: new Date(cursor),
      periodEnd: new Date(next),
      dueDate: new Date(cursor),
    });
    cursor = next;
    guard += 1;
  }
  return periods;
}
