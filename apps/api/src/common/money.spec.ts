import { Money, MoneyError } from "@nexahaus/types";

describe("Money", () => {
  const GHS = "GHS";

  it("adds and subtracts exactly in minor units", () => {
    const a = Money.of(800_000n, GHS); // GHS 8,000.00
    const b = Money.of(500_000n, GHS);
    expect(a.add(b).minor).toBe(1_300_000n);
    expect(a.subtract(b).minor).toBe(300_000n);
  });

  it("rejects mixed-currency arithmetic", () => {
    expect(() => Money.of(1n, "GHS").add(Money.of(1n, "USD"))).toThrow(MoneyError);
  });

  it("rejects non-integer minor units", () => {
    expect(() => Money.of(10.5, GHS)).toThrow(MoneyError);
  });

  describe("percentage (management fee, spec §98)", () => {
    it("5% of GHS 24,500.00 collected = GHS 1,225.00", () => {
      expect(Money.of(2_450_000n, GHS).percentage(5).minor).toBe(122_500n);
    });

    it("10% of GHS 28,500.00 expected = GHS 2,850.00", () => {
      expect(Money.of(2_850_000n, GHS).percentage(10).minor).toBe(285_000n);
    });

    it("rounds half-up at the boundary", () => {
      // 12.5 pesewas -> 13
      expect(Money.of(25n, GHS).percentage(50).minor).toBe(13n);
    });

    it("has no floating-point drift across 10k iterations", () => {
      let total = Money.zero(GHS);
      for (let i = 0; i < 10_000; i += 1) {
        total = total.add(Money.of(333_333n, GHS).percentage(7.5));
      }
      // 333333 * 7.5% = 24999.975 -> 25000 per iteration
      expect(total.minor).toBe(25_000n * 10_000n);
    });
  });

  describe("allocate", () => {
    it("splits preserving the total and biases remainder to earliest weights", () => {
      const parts = Money.of(1_000n, GHS).allocate([1, 1, 1]);
      expect(parts.map((p) => p.minor)).toEqual([334n, 333n, 333n]);
      expect(parts.reduce((s, p) => s + p.minor, 0n)).toBe(1_000n);
    });

    it("weights the split", () => {
      const parts = Money.of(10_000n, GHS).allocate([70, 30]);
      expect(parts.map((p) => p.minor)).toEqual([7_000n, 3_000n]);
    });

    it("throws when weights sum to zero", () => {
      expect(() => Money.of(100n, GHS).allocate([0, 0])).toThrow(MoneyError);
    });
  });

  describe("formatting", () => {
    it("formats GHS with two fraction digits", () => {
      expect(Money.of(800_000n, GHS).format()).toBe("GHS 8,000.00");
    });
  });

  describe("JSON round-trip", () => {
    it("serialises minor units as a string", () => {
      const json = Money.of(9_007_199_254_740_993n, GHS).toJSON();
      expect(json.minor).toBe("9007199254740993");
      expect(Money.fromJSON(json).minor).toBe(9_007_199_254_740_993n);
    });
  });
});
