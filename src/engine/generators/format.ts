// Number formatting for prompts and explanations. Stored answers stay canonical
// ('1200', '3/8'); these helpers are only for the text a learner reads.

import { R, Rational } from '../matching/rational';

const MINUS = '−';

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 12000 → '12,000'; 2.5 → '2.5'; -3 → '−3'. Repeating values print as fractions. */
export function num(x: Rational | number | string): string {
  const r = x instanceof Rational ? x : R(x);
  const dec = r.toDecimalString();
  if (dec === null) return frac(r);
  const neg = dec.startsWith('-');
  const [int, fracPart] = dec.replace('-', '').split('.');
  const body = groupThousands(int!) + (fracPart ? `.${fracPart}` : '');
  return (neg ? MINUS : '') + body;
}

/** '3/8', '−7/2', '5'. */
export function frac(x: Rational): string {
  const s = x.toFractionString();
  return s.startsWith('-') ? MINUS + s.slice(1) : s;
}

/** Mixed number for improper fractions: 11/4 → '2 3/4'. */
export function mixed(x: Rational): string {
  if (x.isInteger()) return num(x);
  const neg = x.isNegative();
  const n = neg ? -x.n : x.n;
  const whole = n / x.d;
  const rest = n % x.d;
  const body = whole === 0n ? `${rest}/${x.d}` : `${whole} ${rest}/${x.d}`;
  return (neg ? MINUS : '') + body;
}

/** '$240', '$12.50'. */
export function money(x: Rational | number | string): string {
  const r = x instanceof Rational ? x : R(x);
  if (r.isInteger()) return `$${num(r)}`;
  const cents = r.round('hundredth');
  const dec = cents.toDecimalString()!;
  const [int, f = ''] = dec.split('.');
  return `$${groupThousands(int!)}.${f.padEnd(2, '0')}`;
}

export function pct(x: Rational | number | string): string {
  return `${num(x)}%`;
}

/** Signed number for explanations: +3, −4. */
export function signed(x: Rational): string {
  return x.isNegative() ? num(x) : `+${num(x)}`;
}

export function plural(n: Rational | number, one: string, many: string): string {
  const v = n instanceof Rational ? n : R(n);
  return v.equals(R(1)) ? one : many;
}
