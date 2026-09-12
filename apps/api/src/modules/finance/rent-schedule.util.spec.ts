import { rentPeriods } from "./rent-schedule.util";

const d = (iso: string): Date => new Date(iso + "T00:00:00.000Z");

describe("rentPeriods", () => {
  it("generates one monthly period per month of a 12-month term", () => {
    const periods = rentPeriods(d("2027-01-01"), d("2028-01-01"), "MONTHLY");
    expect(periods).toHaveLength(12);
    expect(periods[0]!.periodStart.toISOString()).toBe(
      "2027-01-01T00:00:00.000Z",
    );
    expect(periods[0]!.periodEnd.toISOString()).toBe(
      "2027-02-01T00:00:00.000Z",
    );
    expect(periods[0]!.dueDate.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(periods[11]!.periodStart.toISOString()).toBe(
      "2027-12-01T00:00:00.000Z",
    );
  });

  it("generates 4 quarterly periods for a 12-month term", () => {
    const periods = rentPeriods(d("2027-01-01"), d("2028-01-01"), "QUARTERLY");
    expect(periods).toHaveLength(4);
    expect(periods.map((p) => p.periodStart.getUTCMonth())).toEqual([
      0, 3, 6, 9,
    ]);
  });

  it("generates 2 biannual and 1 annual period", () => {
    expect(
      rentPeriods(d("2027-01-01"), d("2028-01-01"), "BIANNUAL"),
    ).toHaveLength(2);
    expect(
      rentPeriods(d("2027-01-01"), d("2028-01-01"), "ANNUAL"),
    ).toHaveLength(1);
  });

  it("bills a trailing partial period in full", () => {
    // 14 months monthly → 14 charges, the last covering month 14 fully.
    const periods = rentPeriods(d("2027-01-01"), d("2028-03-01"), "MONTHLY");
    expect(periods).toHaveLength(14);
  });

  it("is deterministic — re-running yields identical periods", () => {
    const a = rentPeriods(d("2027-03-15"), d("2027-09-15"), "MONTHLY");
    const b = rentPeriods(d("2027-03-15"), d("2027-09-15"), "MONTHLY");
    expect(a.map((p) => p.periodStart.toISOString())).toEqual(
      b.map((p) => p.periodStart.toISOString()),
    );
  });

  it("honours a custom day interval", () => {
    const periods = rentPeriods(d("2027-01-01"), d("2027-03-01"), "CUSTOM", 14);
    expect(periods.length).toBeGreaterThanOrEqual(4);
    const gapDays =
      (periods[1]!.periodStart.getTime() - periods[0]!.periodStart.getTime()) /
      86_400_000;
    expect(gapDays).toBe(14);
  });

  it("returns nothing when end is not after start", () => {
    expect(rentPeriods(d("2027-05-01"), d("2027-05-01"), "MONTHLY")).toEqual(
      [],
    );
  });
});
