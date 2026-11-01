// Estimation is always multiple choice. Options are evenly spaced around the answer and the
// true value sits close to one option, so only a real estimate finds it.

import { R, Rational } from '../../matching/rational';
import { frac, num, pct } from '../format';
import type { Draft, Template } from '../types';
import { by, evenOptions, pickR, rate } from '../util';

type Rng = Parameters<Template['generate']>[0];

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'estimation',
  kind: 'calc',
  ...x,
});

/** Builds the draft from the true value; null if no clean option spacing exists. */
function estimate(rng: Rng, prompt: string, value: Rational, explain: string): Draft | null {
  const opts = evenOptions(rng, value);
  if (!opts) return null;
  return {
    prompt,
    answer: opts.answer,
    distractors: opts.distractors,
    exactChoices: true,
    mcqOnly: true,
    explain: `${explain}; the exact value is about ${num(value.round('tenth'))}, so the closest option is ${num(opts.answer)}`,
  };
}

/** A number near a round value: 49, 51, 198, 302. */
function nearRound(rng: Rng, round: number, maxOff: number): number {
  let off = 0;
  while (off === 0) off = rng.int(-maxOff, maxOff);
  return round + off;
}

/** A decimal just off a round one: 4.97, 19.8, 0.51. */
function nearDecimal(rng: Rng, whole: number, places: 1 | 2): Rational {
  const scale = 10 ** places;
  let off = 0;
  while (off === 0) off = rng.int(-3, 3);
  return R(whole * scale + off, scale);
}

/** Square root to 4 decimals, for estimation only (the answer is always an option). */
function approxSqrt(x: Rational): Rational {
  return Rational.of(BigInt(Math.round(Math.sqrt(x.toNumber()) * 10000)), 10000n);
}

export const estimation: Template[] = [
  t({
    id: 'es-product',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = nearRound(rng, rng.int(2, 9) * 100, 4);
        const b = nearRound(rng, rng.int(2, 9) * 10, 2);
        const ra = Math.round(a / 100) * 100;
        const rb = Math.round(b / 10) * 10;
        return estimate(rng, `${num(a)} × ${num(b)} is closest to`, R(a * b), `Round: ${ra} × ${rb} = ${num(ra * rb)}`);
      }
      if (d === 2) {
        const a = R(rng.int(41, 99) * 10 + rng.pick([-3, -2, 2, 3]), 100);
        const b = R(rng.int(11, 49) * 10 + rng.pick([-2, -1, 1, 2]), 10);
        const ra = a.round('whole');
        const rb = b.round('whole');
        return estimate(rng, `${num(a)} × ${num(b)} is closest to`, a.mul(b), `Round: ${num(ra)} × ${num(rb)} = ${num(ra.mul(rb))}`);
      }
      const a = nearDecimal(rng, rng.int(2, 9), 2);
      const b = nearDecimal(rng, rng.int(2, 5) * 10, 1);
      const c = nearDecimal(rng, rng.pick([1, 2, 5]), 2).div(R(10));
      const v = a.mul(b).mul(c);
      return estimate(rng, `${num(a)} × ${num(b)} × ${num(c)} is closest to`, v, `Round: ${num(a.round('whole'))} × ${num(b.round('whole'))} × ${num(c.round('tenth'))}`);
    },
  }),

  t({
    id: 'es-quotient',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const top = nearDecimal(rng, rng.int(11, 99), 1);
        const bottom = nearDecimal(rng, rng.pick([25, 50]), 1).div(R(100));
        const v = top.div(bottom);
        return estimate(rng, `${num(top)} ÷ ${num(bottom)} is closest to`, v, `Round: ${num(top.round('whole'))} ÷ ${num(bottom.round('hundredth'))}`);
      }
      const divisor = d === 1 ? nearRound(rng, rng.int(2, 9) * 10, 2) : nearRound(rng, rng.int(11, 49) * 10, 3);
      const q = d === 1 ? rng.int(11, 90) * 10 : rng.int(2, 40) * 10;
      const rd = Math.round(divisor / 10) * 10;
      const dividend = q * rd + rng.int(-30, 30);
      return estimate(rng, `${num(dividend)} ÷ ${num(divisor)} is closest to`, R(dividend, divisor), `Round: ${num(dividend)} ÷ ${rd} ≈ ${num(R(dividend, rd).round('whole'))}`);
    },
  }),

  t({
    id: 'es-percent',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const p = R(nearRound(rng, rng.pick([20, 25, 40, 50, 60, 75]), 2));
        const q = R(nearRound(rng, rng.pick([20, 25, 40, 50, 60, 75]), 2));
        const N = nearRound(rng, rng.int(11, 99) * 100, 40);
        const v = rate(p).mul(rate(q)).mul(R(N));
        return estimate(rng, `${pct(p)} of ${pct(q)} of ${num(N)} is closest to`, v, `Use friendly percents near ${pct(p)} and ${pct(q)}`);
      }
      const pr = d === 1 ? R(nearRound(rng, rng.pick([20, 25, 30, 40, 60, 75]), 2)) : R(rng.int(101, 899), 10);
      const N = d === 1 ? nearRound(rng, rng.int(2, 9) * 100, 15) : nearRound(rng, rng.int(11, 99) * 100, 40);
      return estimate(rng, `${pct(pr)} of ${num(N)} is closest to`, rate(pr).mul(R(N)), `Use a friendly percent near ${pct(pr)}`);
    },
  }),

  t({
    id: 'es-sqrt',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 2) {
        const x = pickR(rng, ['0.5', '0.3', '0.2', '0.8', '0.15', '0.6', '0.05', '0.9']);
        return estimate(rng, `√${num(x)} is closest to`, approxSqrt(x), `√${num(x)}`);
      }
      if (d === 3) {
        const a = rng.int(20, 200);
        const b = rng.int(20, 200);
        const isSq = (n: number) => Number.isInteger(Math.sqrt(n));
        if (isSq(a) || isSq(b)) return null;
        const v = approxSqrt(R(a)).add(approxSqrt(R(b)));
        return estimate(rng, `√${a} + √${b} is closest to`, v, `√${a} ≈ ${num(approxSqrt(R(a)).round('tenth'))} and √${b} ≈ ${num(approxSqrt(R(b)).round('tenth'))}`);
      }
      const r = rng.int(20, 45);
      const n = r * r + rng.int(-r + 1, r);
      return estimate(rng, `√${num(n)} is closest to`, approxSqrt(R(n)), `${r}² = ${num(r * r)}, so √${num(n)} is near ${r}`);
    },
  }),

  t({
    id: 'es-fraction-sum',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const randFrac = (dens: number[]) => {
        const den = rng.pick(dens);
        return R(rng.int(1, den - 1), den);
      };
      const two = (f: Rational) => num(Rational.of(BigInt(Math.round(f.toNumber() * 100)), 100n));
      if (d === 3) {
        // Mixed operations: 17/9 × 31/16 − 5/11
        const a = R(rng.int(10, 30), rng.pick([7, 9, 11, 13]));
        const b = R(rng.int(10, 30), rng.pick([8, 12, 16, 17]));
        const c = randFrac([7, 11, 13, 19]);
        const v = a.mul(b).sub(c);
        if (v.cmp(R(0)) <= 0) return null;
        return estimate(rng, `${frac(a)} × ${frac(b)} − ${frac(c)} is closest to`, v, `${two(a)} × ${two(b)} − ${two(c)}`);
      }
      const dens = d === 1 ? [7, 9, 11, 12, 13] : [13, 15, 17, 19, 23];
      const fs = Array.from({ length: d === 2 ? 3 : 2 }, () => randFrac(dens));
      const v = fs.reduce((a, b) => a.add(b), R(0));
      return estimate(rng, `${fs.map(frac).join(' + ')} is closest to`, v, fs.map(two).join(' + '));
    },
  }),

  t({
    id: 'es-magnitude',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = R(rng.int(11, 99), 10 ** rng.int(by(d, 1, 2, 2), by(d, 3, 4, 4)));
      const b = R(rng.int(11, 99) * 10 ** rng.int(2, by(d, 4, 5, 5)));
      const c = d === 3 ? R(rng.int(11, 99), 10 ** rng.int(2, 4)) : R(1);
      const v = a.mul(b).div(c);
      const k = Math.round(Math.log10(v.toNumber()));
      const ans = R(10).pow(k);
      // Only where the nearest power of 10 is also the nearest option on a number line.
      const ratio = v.div(ans);
      if (ratio.cmp(R('0.7')) < 0 || ratio.cmp(R(3)) > 0) return null;
      return {
        prompt: d === 3 ? `${num(a)} × ${num(b)} ÷ ${num(c)} is closest to` : `${num(a)} × ${num(b)} is closest to`,
        answer: ans,
        distractors: [k - 2, k - 1, k + 1, k + 2].map((e) => R(10).pow(e)),
        exactChoices: true,
        mcqOnly: true,
        explain: `The exact value is ${num(v.round('tenth'))}; the nearest power of 10 is ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'es-average',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Weighted, with awkward averages
        const n1 = rng.int(8, 25);
        const n2 = rng.int(8, 25);
        const a1 = R(rng.int(600, 900), 10);
        const a2 = R(rng.int(600, 900), 10);
        if (n1 === n2) return null;
        const v = a1.mul(R(n1)).add(a2.mul(R(n2))).div(R(n1 + n2));
        return estimate(rng, `${n1} students average ${num(a1)} and ${n2} students average ${num(a2)}. The overall average is closest to`, v, `The overall average sits nearer the bigger group's ${num(n1 > n2 ? a1 : a2)}`);
      }
      const n = d === 1 ? 4 : 5;
      const center = d === 1 ? rng.int(2, 9) * 100 : rng.int(11, 99) * 10;
      const spread = Math.floor(center / 3);
      const xs = Array.from({ length: n }, () => center + rng.int(-spread, spread));
      const total = xs.reduce((a, b) => a + b, 0);
      return estimate(rng, `The average of ${xs.map((x) => num(x)).join(', ')} is closest to`, R(total, n), `Sum ${num(total)} ÷ ${n}`);
    },
  }),
];
