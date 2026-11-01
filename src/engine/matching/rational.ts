// Exact rational numbers on BigInt. Every quant answer is a Rational, so 0.1 + 0.2 is
// exactly 3/10 and answer comparison never meets a floating-point surprise.

export type Rounding = 'whole' | 'tenth' | 'hundredth';

const PLACES: Record<Rounding, number> = { whole: 0, tenth: 1, hundredth: 2 };

function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/** Strips factors of 2 and 5; a fraction terminates iff its reduced denominator is then 1. */
function stripTwosAndFives(d: bigint): bigint {
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d;
}

export class Rational {
  /** Always reduced, with a positive denominator. */
  readonly n: bigint;
  readonly d: bigint;

  private constructor(n: bigint, d: bigint) {
    this.n = n;
    this.d = d;
  }

  static of(n: bigint | number, d: bigint | number = 1n): Rational {
    let bn = typeof n === 'number' ? toBigIntStrict(n) : n;
    let bd = typeof d === 'number' ? toBigIntStrict(d) : d;
    if (bd === 0n) throw new RangeError('Rational: zero denominator');
    if (bd < 0n) {
      bn = -bn;
      bd = -bd;
    }
    const g = gcd(bn, bd) || 1n;
    return new Rational(bn / g, bd / g);
  }

  /** Parses an integer, a decimal ('-2.5', '.5', '5.') or a fraction of integers ('3/8', '-3/8'). */
  static parse(text: string): Rational | null {
    const s = text.trim();
    const frac = /^(-?)(\d+)\/(\d+)$/.exec(s);
    if (frac) {
      const d = BigInt(frac[3]!);
      if (d === 0n) return null;
      const n = BigInt(frac[2]!);
      return Rational.of(frac[1] ? -n : n, d);
    }
    const dec = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
    if (dec && (dec[2] || dec[3])) {
      const intPart = dec[2] || '0';
      const fracPart = dec[3] ?? '';
      const n = BigInt(intPart + fracPart);
      return Rational.of(dec[1] ? -n : n, 10n ** BigInt(fracPart.length));
    }
    return null;
  }

  add(o: Rational): Rational {
    return Rational.of(this.n * o.d + o.n * this.d, this.d * o.d);
  }

  sub(o: Rational): Rational {
    return Rational.of(this.n * o.d - o.n * this.d, this.d * o.d);
  }

  mul(o: Rational): Rational {
    return Rational.of(this.n * o.n, this.d * o.d);
  }

  div(o: Rational): Rational {
    if (o.n === 0n) throw new RangeError('Rational: division by zero');
    return Rational.of(this.n * o.d, this.d * o.n);
  }

  neg(): Rational {
    return new Rational(-this.n, this.d);
  }

  /** Integer powers only, including negative exponents. */
  pow(k: number): Rational {
    if (!Number.isInteger(k)) throw new RangeError('Rational: non-integer exponent');
    if (k < 0) return Rational.of(this.d, this.n).pow(-k);
    const e = BigInt(k);
    return Rational.of(this.n ** e, this.d ** e);
  }

  cmp(o: Rational): -1 | 0 | 1 {
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }

  equals(o: Rational): boolean {
    return this.n === o.n && this.d === o.d;
  }

  isInteger(): boolean {
    return this.d === 1n;
  }

  isNegative(): boolean {
    return this.n < 0n;
  }

  /** True if the decimal expansion ends (denominator has only factors 2 and 5). */
  isTerminating(): boolean {
    return stripTwosAndFives(this.d) === 1n;
  }

  /** Rounds to a decimal place, halves away from zero (3.45 → 3.5, -3.45 → -3.5). */
  round(rounding: Rounding): Rational {
    const scale = 10n ** BigInt(PLACES[rounding]);
    const scaled = abs(this.n) * scale;
    let q = scaled / this.d;
    if ((scaled % this.d) * 2n >= this.d) q += 1n;
    return Rational.of(this.n < 0n ? -q : q, scale);
  }

  /** Number of decimal places in the exact expansion, or null if it repeats. */
  decimalPlaces(): number | null {
    if (!this.isTerminating()) return null;
    let places = 0;
    let d = this.d;
    let n = abs(this.n);
    while (d !== 1n) {
      n *= 10n;
      const g = gcd(n, d);
      n /= g;
      d /= g;
      places++;
    }
    return places;
  }

  /** Significant digits of the exact decimal value (null if it repeats). 0 has 1. */
  significantDigits(): number | null {
    const s = this.toDecimalString();
    if (s === null) return null;
    const digits = s.replace('-', '').replace('.', '').replace(/^0+/, '');
    if (digits === '') return 1;
    // Trailing zeros of an integer are not significant (1200 → 2); within decimals they don't occur.
    return this.isInteger() ? digits.replace(/0+$/, '').length || 1 : digits.length;
  }

  /** Exact decimal string ('2.5', '-0.375', '1200'), or null if the expansion repeats. */
  toDecimalString(): string | null {
    const places = this.decimalPlaces();
    if (places === null) return null;
    const scaled = (abs(this.n) * 10n ** BigInt(places)) / this.d;
    let digits = scaled.toString();
    if (places > 0) {
      digits = digits.padStart(places + 1, '0');
      digits = `${digits.slice(0, -places)}.${digits.slice(-places)}`;
    }
    return (this.n < 0n ? '-' : '') + digits;
  }

  /** '3/8', '-7/2', or '5' for integers. */
  toFractionString(): string {
    return this.isInteger() ? this.n.toString() : `${this.n}/${this.d}`;
  }

  /** Canonical answer string: the exact decimal if it terminates, otherwise the fraction. */
  toString(): string {
    return this.toDecimalString() ?? this.toFractionString();
  }

  /** Approximate value for display and estimation only; never use for comparison. */
  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }
}

function toBigIntStrict(x: number): bigint {
  if (!Number.isSafeInteger(x)) throw new RangeError(`Rational: ${x} is not a safe integer`);
  return BigInt(x);
}

/** Shorthand: R(3, 8), R(45), or R('2.5'). */
export function R(n: number | bigint | string, d: number | bigint = 1n): Rational {
  if (typeof n === 'string') {
    const r = Rational.parse(n);
    if (!r) throw new RangeError(`Rational: cannot parse "${n}"`);
    return r;
  }
  return Rational.of(n, d);
}
