/**
 * Money — deterministic integer-minor-unit arithmetic.
 *
 * Rules (spec §16, §50):
 *  - Amounts are stored and computed as integer MINOR units (pesewas for GHS).
 *  - No floating point is ever used for a stored monetary amount.
 *  - Every operation is deterministic and auditable.
 *  - Mixed-currency operations throw.
 *
 * Percentages/rates are the only place a fractional multiplier appears, and the
 * result is rounded to whole minor units with half-up rounding at the boundary.
 */

export type CurrencyCode = string; // ISO-4217, e.g. "GHS"

export interface MoneyJSON {
  /** Integer minor units, serialised as a string to survive JSON safely. */
  minor: string;
  currency: CurrencyCode;
}

export class MoneyError extends Error {}

export class Money {
  /** Integer minor units. */
  readonly minor: bigint;
  readonly currency: CurrencyCode;

  private constructor(minor: bigint, currency: CurrencyCode) {
    if (currency.length !== 3) {
      throw new MoneyError(`Invalid currency code: "${currency}"`);
    }
    this.minor = minor;
    this.currency = currency;
  }

  static of(minor: bigint | number | string, currency: CurrencyCode): Money {
    let value: bigint;
    if (typeof minor === "bigint") {
      value = minor;
    } else if (typeof minor === "number") {
      if (!Number.isInteger(minor)) {
        throw new MoneyError(`Minor units must be an integer, got ${minor}`);
      }
      value = BigInt(minor);
    } else {
      if (!/^-?\d+$/.test(minor)) {
        throw new MoneyError(
          `Minor units string must be an integer, got "${minor}"`,
        );
      }
      value = BigInt(minor);
    }
    return new Money(value, currency.toUpperCase());
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(0n, currency.toUpperCase());
  }

  static fromJSON(json: MoneyJSON): Money {
    return Money.of(json.minor, json.currency);
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new MoneyError(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor + other.minor, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minor - other.minor, this.currency);
  }

  negate(): Money {
    return new Money(-this.minor, this.currency);
  }

  isZero(): boolean {
    return this.minor === 0n;
  }

  isNegative(): boolean {
    return this.minor < 0n;
  }

  isPositive(): boolean {
    return this.minor > 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minor === other.minor;
  }

  compare(other: Money): -1 | 0 | 1 {
    this.assertSameCurrency(other);
    if (this.minor < other.minor) return -1;
    if (this.minor > other.minor) return 1;
    return 0;
  }

  greaterThan(other: Money): boolean {
    return this.compare(other) === 1;
  }

  greaterThanOrEqual(other: Money): boolean {
    return this.compare(other) >= 0;
  }

  lessThan(other: Money): boolean {
    return this.compare(other) === -1;
  }

  min(other: Money): Money {
    return this.lessThan(other) ? this : other;
  }

  max(other: Money): Money {
    return this.greaterThan(other) ? this : other;
  }

  /**
   * Multiply by a whole integer (e.g. number of months). Exact, no rounding.
   */
  multiply(factor: bigint | number): Money {
    const f = typeof factor === "bigint" ? factor : BigInt(factor);
    if (typeof factor === "number" && !Number.isInteger(factor)) {
      throw new MoneyError(
        "multiply() takes an integer factor; use percentage()",
      );
    }
    return new Money(this.minor * f, this.currency);
  }

  /**
   * Apply a percentage rate (e.g. a 5% or 10% management fee). `rate` is a
   * percentage number (5 means 5%), with up to 6 fractional digits honoured.
   * Result is rounded to whole minor units, half-up on .5.
   */
  percentage(rate: number): Money {
    if (!Number.isFinite(rate)) {
      throw new MoneyError(`Invalid percentage rate: ${rate}`);
    }
    // Represent the rate as a fraction over 10^6 to keep integer math.
    const SCALE = 1_000_000n;
    const rateScaled = BigInt(Math.round(rate * 1_000_000)); // rate * 1e6
    const numerator = this.minor * rateScaled;
    const denominator = 100n * SCALE;
    return new Money(halfUpDivide(numerator, denominator), this.currency);
  }

  /**
   * Split this amount across `weights`, preserving the total exactly.
   * Remainder minor units are distributed one-by-one to the earliest weights.
   * Example: allocate(1000, [1,1,1]) -> [334, 333, 333].
   */
  allocate(weights: number[]): Money[] {
    if (weights.length === 0) {
      throw new MoneyError("allocate() requires at least one weight");
    }
    if (weights.some((w) => w < 0)) {
      throw new MoneyError("allocate() weights must be non-negative");
    }
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) {
      throw new MoneyError("allocate() weights must not sum to zero");
    }
    const totalBig = BigInt(total);
    const shares: bigint[] = [];
    let allocated = 0n;
    for (const w of weights) {
      const share = (this.minor * BigInt(w)) / totalBig; // floor
      shares.push(share);
      allocated += share;
    }
    let remainder = this.minor - allocated; // >= 0 for positive amounts
    let i = 0;
    while (remainder !== 0n && i < shares.length) {
      const step = remainder > 0n ? 1n : -1n;
      shares[i] = (shares[i] ?? 0n) + step;
      remainder -= step;
      i += 1;
    }
    return shares.map((s) => new Money(s, this.currency));
  }

  toJSON(): MoneyJSON {
    return { minor: this.minor.toString(), currency: this.currency };
  }

  toString(): string {
    return `${this.currency} ${this.minor.toString()}`;
  }

  /**
   * Human display, e.g. "GHS 8,000.00". `fractionDigits` defaults to 2.
   * Presentation only — never feed this back into arithmetic.
   */
  format(opts: { fractionDigits?: number; locale?: string } = {}): string {
    const fractionDigits = opts.fractionDigits ?? 2;
    const divisor = 10 ** fractionDigits;
    const asNumber = Number(this.minor) / divisor;
    const formatted = new Intl.NumberFormat(opts.locale ?? "en-GH", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(asNumber);
    return `${this.currency} ${formatted}`;
  }
}

/** Integer division of a/b rounded half-up (ties away from zero). */
function halfUpDivide(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new MoneyError("division by zero");
  const negative = a < 0n !== b < 0n;
  const absA = a < 0n ? -a : a;
  const absB = b < 0n ? -b : b;
  const q = absA / absB;
  const r = absA % absB;
  const rounded = r * 2n >= absB ? q + 1n : q;
  return negative ? -rounded : rounded;
}
