import {
  allocateExplicit,
  allocateOldestFirst,
  type AllocatableCharge,
} from "./allocation.util";

const charge = (id: string, amount: bigint, paid = 0n): AllocatableCharge => ({
  id,
  amountMinor: amount,
  paidMinor: paid,
});

describe("allocateOldestFirst (spec §81)", () => {
  it("GHS 8,000 against an 8,000 charge → PAID, nothing outstanding", () => {
    const res = allocateOldestFirst(800_000n, [charge("c1", 800_000n)]);
    expect(res.allocations).toEqual([
      { rentChargeId: "c1", amountMinor: 800_000n, newPaidMinor: 800_000n, newStatus: "PAID" },
    ]);
    expect(res.unallocatedMinor).toBe(0n);
  });

  it("GHS 5,000 against an 8,000 charge → PARTIALLY_PAID, 3,000 outstanding", () => {
    const res = allocateOldestFirst(500_000n, [charge("c1", 800_000n)]);
    expect(res.allocations[0]).toEqual({
      rentChargeId: "c1",
      amountMinor: 500_000n,
      newPaidMinor: 500_000n,
      newStatus: "PARTIALLY_PAID",
    });
  });

  it("a later 3,000 top-up settles the same charge", () => {
    const res = allocateOldestFirst(300_000n, [charge("c1", 800_000n, 500_000n)]);
    expect(res.allocations[0]!.newStatus).toBe("PAID");
    expect(res.unallocatedMinor).toBe(0n);
  });

  it("spreads a lump sum across the oldest charges first, never over-paying", () => {
    const res = allocateOldestFirst(1_500_000n, [
      charge("jan", 800_000n),
      charge("feb", 800_000n),
      charge("mar", 800_000n),
    ]);
    expect(res.allocations).toEqual([
      { rentChargeId: "jan", amountMinor: 800_000n, newPaidMinor: 800_000n, newStatus: "PAID" },
      { rentChargeId: "feb", amountMinor: 700_000n, newPaidMinor: 700_000n, newStatus: "PARTIALLY_PAID" },
    ]);
    expect(res.unallocatedMinor).toBe(0n);
  });

  it("an overpayment leaves a credit (unallocated) once every charge is settled", () => {
    const res = allocateOldestFirst(900_000n, [charge("c1", 800_000n)]);
    expect(res.allocations[0]!.newStatus).toBe("PAID");
    expect(res.unallocatedMinor).toBe(100_000n);
  });

  it("skips already-settled charges", () => {
    const res = allocateOldestFirst(200_000n, [
      charge("paid", 800_000n, 800_000n),
      charge("open", 800_000n),
    ]);
    expect(res.allocations).toHaveLength(1);
    expect(res.allocations[0]!.rentChargeId).toBe("open");
  });
});

describe("allocateExplicit", () => {
  it("applies the requested split", () => {
    const byId = new Map([
      ["a", charge("a", 800_000n)],
      ["b", charge("b", 800_000n)],
    ]);
    const res = allocateExplicit(
      800_000n,
      [
        { rentChargeId: "a", amountMinor: 300_000n },
        { rentChargeId: "b", amountMinor: 500_000n },
      ],
      byId,
    );
    expect(res.unallocatedMinor).toBe(0n);
    expect(res.allocations.map((x) => x.newStatus)).toEqual([
      "PARTIALLY_PAID",
      "PARTIALLY_PAID",
    ]);
  });

  it("rejects an allocation over a charge's outstanding balance", () => {
    const byId = new Map([["a", charge("a", 800_000n, 600_000n)]]);
    expect(() =>
      allocateExplicit(500_000n, [{ rentChargeId: "a", amountMinor: 300_000n }], byId),
    ).toThrow(/outstanding balance/);
  });

  it("rejects allocations exceeding the payment amount", () => {
    const byId = new Map([["a", charge("a", 800_000n)]]);
    expect(() =>
      allocateExplicit(200_000n, [{ rentChargeId: "a", amountMinor: 300_000n }], byId),
    ).toThrow(/exceed the payment/);
  });
});
