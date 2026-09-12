import { Money } from "@nexahaus/types";

export interface FeeAgreement {
  feeType:
    | "PERCENT_OF_COLLECTED"
    | "PERCENT_OF_EXPECTED"
    | "FIXED_MONTHLY"
    | "CUSTOM";
  feePercent: number | null;
  feeFixedMinor: bigint | null;
  feeCurrency: string;
}

export interface FeeInputs {
  collectedMinor: bigint;
  expectedMinor: bigint;
  /** Whole months in the statement period (for FIXED_MONTHLY). */
  months: number;
}

/**
 * Management fee for a statement period (spec §98 — never a hardcoded 10%).
 * Returns whole minor units; percentage rounding is half-up (Money.percentage).
 * CUSTOM agreements return 0 here — the fee is entered as an explicit
 * adjustment transaction and reviewed, never guessed.
 */
export function computeManagementFee(
  agreement: FeeAgreement,
  inputs: FeeInputs,
): bigint {
  const ccy = agreement.feeCurrency || "GHS";
  switch (agreement.feeType) {
    case "PERCENT_OF_COLLECTED":
      return Money.of(inputs.collectedMinor, ccy).percentage(
        agreement.feePercent ?? 0,
      ).minor;
    case "PERCENT_OF_EXPECTED":
      return Money.of(inputs.expectedMinor, ccy).percentage(
        agreement.feePercent ?? 0,
      ).minor;
    case "FIXED_MONTHLY":
      return (
        (agreement.feeFixedMinor ?? 0n) * BigInt(Math.max(1, inputs.months))
      );
    case "CUSTOM":
    default:
      return 0n;
  }
}
