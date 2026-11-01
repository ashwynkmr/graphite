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

export const estimation: Template[] = [
  t({
    id: 'es-product',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const a = R(rng.int(41, 99) * 10 + rng.pick([-3, -2, 2, 3]), 100);
        const b = R(rng.int(11, 49) * 10 + rng.pick([-2, -1, 1, 2]), 10);
        const v = a.mul(b);
        return estimate(rng, `${num(a)} × ${num(b)} is closest to`, v, `Round: ${num(a.round('whole'))} × ${num(b.round('whole'))} = ${num(a.round('whole').mul(b.round('whole')))}`);
      }
      const a = d === 1 ? nearRound(rng, rng.int(2, 9) * 10, 2) : nearRound(rng, rng.int(2, 9) * 100, 4);
      const b = nearRound(rng, rng.int(2, 9) * 10, 2);
      const v = R(a * b);
      const ra = d === 1 ? Math.round(a / 10) * 10 : Math.round(a / 100) * 100;
      const rb = Math.round(b / 10) * 10;
      return estimate(rng, `${num(a)} × ${num(b)} is closest to`, v, `Round: ${ra} × ${rb} = ${num(ra * rb)}`);
    },
  }),

  t({
    id: 'es-quotient',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const divisor = by(d, nearRound(rng, rng.int(2, 9) * 10, 2), nearRound(rng, rng.int(2, 9) * 10, 2), nearRound(rng, rng.int(11, 49) * 10, 3));
      const q = by(d, rng.int(3, 9) * 10, rng.int(11, 90) * 10, rng.int(2, 40) * 10);
      const dividend = q * Math.round(divisor / 10) * 10 + rng.int(-30, 30);
      const v = R(dividend, divisor);
      const rd = Math.round(divisor / 10) * 10;
      return estimate(rng, `${num(dividend)} ÷ ${num(divisor)} is closest to`, v, `Round: ${num(dividend)} ÷ ${rd} ≈ ${num(R(dividend, rd).round('whole'))}`);
    },
  }),

  t({
    id: 'es-percent',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pr = by(d, R(nearRound(rng, rng.pick([10, 20, 25, 50]), 1)), R(nearRound(rng, rng.pick([20, 25, 30, 40, 60, 75]), 2)), R(rng.int(101, 899), 10));
      const N = by(d, nearRound(rng, rng.int(2, 9) * 100, 9), nearRound(rng, rng.int(2, 9) * 100, 15), nearRound(rng, rng.int(11, 99) * 100, 40));
      const v = rate(pr).mul(R(N));
      return estimate(rng, `${pct(pr)} of ${num(N)} is closest to`, v, `Use a friendly percent near ${pct(pr)}`);
    },
  }),

  t({
    id: 'es-sqrt',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const x = pickR(rng, ['0.5', '0.3', '0.2', '0.8', '0.15', '0.6', '0.05', '0.9']);
        const v = Rational.of(BigInt(Math.round(Math.sqrt(x.toNumber()) * 10000)), 10000n);
        return estimate(rng, `√${num(x)} is closest to`, v, `√${num(x)}`);
      }
      const r = by(d, rng.int(5, 19), rng.int(20, 45), 0);
      const n = r * r + rng.int(-r + 1, r);
      const v = Rational.of(BigInt(Math.round(Math.sqrt(n) * 10000)), 10000n);
      return estimate(rng, `√${num(n)} is closest to`, v, `${r}² = ${r * r}, so √${num(n)} is near ${r}`);
    },
  }),

  t({
    id: 'es-fraction-sum',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const dens = by(d, [3, 4, 5, 6, 8], [7, 9, 11, 12, 13], [13, 15, 17, 19, 23]);
      const count = d === 3 ? 3 : 2;
      const fs = Array.from({ length: count }, () => {
        const den = rng.pick(dens);
        return R(rng.int(1, den - 1), den);
      });
      const v = fs.reduce((a, b) => a.add(b), R(0));
      return estimate(rng, `${fs.map(frac).join(' + ')} is closest to`, v, fs.map((f) => num(Rational.of(BigInt(Math.round(f.toNumber() * 100)), 100n))).join(' + '));
    },
  }),

  t({
    id: 'es-magnitude',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = R(rng.int(11, 99), 10 ** rng.int(by(d, 0, 1, 2), by(d, 1, 3, 4)));
      const b = R(rng.int(11, 99) * 10 ** rng.int(by(d, 1, 2, 2), by(d, 3, 4, 5)));
      const v = a.mul(b);
      const k = Math.round(Math.log10(v.toNumber()));
      if (Math.abs(Math.log10(v.toNumber()) - k) > 0.35) return null;
      const ans = R(10).pow(k);
      return {
        prompt: `${num(a)} × ${num(b)} is closest to`,
        answer: ans,
        distractors: [k - 2, k - 1, k + 1, k + 2].map((e) => R(10).pow(e)),
        exactChoices: true,
        mcqOnly: true,
        explain: `${num(a)} × ${num(b)} = ${num(v)}, nearest power of 10: ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'es-average',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, 3, 4, 5);
      const center = by(d, rng.int(3, 9) * 10, rng.int(2, 9) * 100, rng.int(11, 99) * 10);
      const spread = Math.floor(center / 3);
      const xs = Array.from({ length: n }, () => center + rng.int(-spread, spread));
      const v = R(xs.reduce((a, b) => a + b, 0), n);
      return estimate(rng, `The average of ${xs.map((x) => num(x)).join(', ')} is closest to`, v, `Sum ${num(xs.reduce((a, b) => a + b, 0))} ÷ ${n}`);
    },
  }),
];
