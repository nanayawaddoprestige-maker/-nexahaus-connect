import { computeManagementFee, type FeeAgreement } from "./management-fee.util";

const agreement = (over: Partial<FeeAgreement>): FeeAgreement => ({
  feeType: "PERCENT_OF_COLLECTED",
  feePercent: null,
  feeFixedMinor: null,
  feeCurrency: "GHS",
  ...over,
});

describe("computeManagementFee (spec §98 — never hardcoded)", () => {
  it("5% of GHS 24,500.00 collected = GHS 1,225.00", () => {
    expect(
      computeManagementFee(
        agreement({ feeType: "PERCENT_OF_COLLECTED", feePercent: 5 }),
        {
          collectedMinor: 2_450_000n,
          expectedMinor: 2_850_000n,
          months: 1,
        },
      ),
    ).toBe(122_500n);
  });

  it("10% of GHS 28,500.00 expected = GHS 2,850.00", () => {
    expect(
      computeManagementFee(
        agreement({ feeType: "PERCENT_OF_EXPECTED", feePercent: 10 }),
        {
          collectedMinor: 2_450_000n,
          expectedMinor: 2_850_000n,
          months: 1,
        },
      ),
    ).toBe(285_000n);
  });

  it("a fixed monthly fee multiplies by the number of months", () => {
    expect(
      computeManagementFee(
        agreement({ feeType: "FIXED_MONTHLY", feeFixedMinor: 300_000n }),
        {
          collectedMinor: 0n,
          expectedMinor: 9_999_999n,
          months: 3,
        },
      ),
    ).toBe(900_000n);
  });

  it("a custom agreement yields 0 (fee handled as an explicit adjustment)", () => {
    expect(
      computeManagementFee(agreement({ feeType: "CUSTOM" }), {
        collectedMinor: 5_000_000n,
        expectedMinor: 5_000_000n,
        months: 1,
      }),
    ).toBe(0n);
  });

  it("each call is independent of any other property's fee structure", () => {
    const a = computeManagementFee(
      agreement({ feeType: "PERCENT_OF_COLLECTED", feePercent: 8 }),
      {
        collectedMinor: 1_000_000n,
        expectedMinor: 1_000_000n,
        months: 1,
      },
    );
    const b = computeManagementFee(
      agreement({ feeType: "PERCENT_OF_COLLECTED", feePercent: 12 }),
      {
        collectedMinor: 1_000_000n,
        expectedMinor: 1_000_000n,
        months: 1,
      },
    );
    expect(a).toBe(80_000n);
    expect(b).toBe(120_000n);
  });
});
