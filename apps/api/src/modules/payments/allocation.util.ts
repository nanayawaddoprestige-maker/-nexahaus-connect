export interface AllocatableCharge {
  id: string;
  amountMinor: bigint;
  paidMinor: bigint;
}

export interface ChargeAllocation {
  rentChargeId: string;
  amountMinor: bigint;
  /** Charge state after applying this allocation. */
  newPaidMinor: bigint;
  newStatus: "PAID" | "PARTIALLY_PAID";
}

export interface AllocationResult {
  allocations: ChargeAllocation[];
  /** Amount left over after every charge is settled — a credit on the account. */
  unallocatedMinor: bigint;
}

/**
 * Apply `amountMinor` across `charges`, oldest first, never over-paying a charge
 * (spec §81). Charges must already be ordered oldest→newest by the caller.
 * Deterministic: integer minor units throughout, no floats.
 */
export function allocateOldestFirst(
  amountMinor: bigint,
  charges: AllocatableCharge[],
): AllocationResult {
  let remaining = amountMinor;
  const allocations: ChargeAllocation[] = [];

  for (const charge of charges) {
    if (remaining <= 0n) break;
    const outstanding = charge.amountMinor - charge.paidMinor;
    if (outstanding <= 0n) continue;
    const applied = remaining < outstanding ? remaining : outstanding;
    const newPaid = charge.paidMinor + applied;
    allocations.push({
      rentChargeId: charge.id,
      amountMinor: applied,
      newPaidMinor: newPaid,
      newStatus: newPaid >= charge.amountMinor ? "PAID" : "PARTIALLY_PAID",
    });
    remaining -= applied;
  }

  return { allocations, unallocatedMinor: remaining };
}

/**
 * Apply an explicit set of {rentChargeId, amountMinor} allocations, validating
 * that none exceeds the charge's outstanding balance and the total does not
 * exceed the payment.
 */
export function allocateExplicit(
  paymentAmountMinor: bigint,
  requested: { rentChargeId: string; amountMinor: bigint }[],
  chargeById: Map<string, AllocatableCharge>,
): AllocationResult {
  let total = 0n;
  const allocations: ChargeAllocation[] = [];
  for (const req of requested) {
    const charge = chargeById.get(req.rentChargeId);
    if (!charge) {
      throw new Error(`Unknown rent charge ${req.rentChargeId}`);
    }
    const outstanding = charge.amountMinor - charge.paidMinor;
    if (req.amountMinor <= 0n || req.amountMinor > outstanding) {
      throw new Error(
        `Allocation to charge ${req.rentChargeId} must be between 1 and its outstanding balance`,
      );
    }
    const newPaid = charge.paidMinor + req.amountMinor;
    allocations.push({
      rentChargeId: req.rentChargeId,
      amountMinor: req.amountMinor,
      newPaidMinor: newPaid,
      newStatus: newPaid >= charge.amountMinor ? "PAID" : "PARTIALLY_PAID",
    });
    total += req.amountMinor;
  }
  if (total > paymentAmountMinor) {
    throw new Error("Allocations exceed the payment amount");
  }
  return { allocations, unallocatedMinor: paymentAmountMinor - total };
}
