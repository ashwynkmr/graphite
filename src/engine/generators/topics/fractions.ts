import { R, Rational } from '../../matching/rational';
import { frac, mixed, num } from '../format';
import type { Template } from '../types';
import { by, gcdNum, lcmNum } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'fractions',
  kind: 'calc',
  ...x,
});

type Rng = Parameters<Template['generate']>[0];

/** A random proper fraction n/d in lowest terms with d from the pool (n ≥ minN when possible). */
function properFrac(rng: Rng, dens: number[], minN = 1): Rational | null {
  const d = rng.pick(dens);
  const tops = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => n >= minN && gcdNum(n, d) === 1);
  return tops.length ? R(rng.pick(tops), d) : null;
}

/** Smallest power of ten that d divides, as [10^m, multiplier]. */
function toPowerOfTen(d: bigint): [bigint, bigint] | null {
  let p = 10n;
  for (let m = 1; m <= 5; m++, p *= 10n) if (p % d === 0n) return [p, p / d];
  return null;
}

/** "Over 24: 3/24 + 20/24 − 6/24 = 17/24" for any number of terms. */
function explainSum(terms: Rational[], ops: ('+' | '−')[], ans: Rational): string {
  const L = terms.reduce((acc, x) => BigInt(lcmNum(Number(acc), Number(x.d))), 1n);
  const tops = terms.map((x) => x.n * (L / x.d));
  const total = tops.reduce((acc, n, i) => (i === 0 ? n : ops[i - 1] === '+' ? acc + n : acc - n), 0n);
  const parts = tops.map((n, i) => `${i === 0 ? '' : ` ${ops[i - 1]} `}${n}/${L}`).join('');
  const raw = `${total}/${L}`;
  return `Over ${L}: ${parts} = ${raw}${ans.toFractionString() === raw ? '' : ` = ${frac(ans)}`}`;
}

/** Proper fraction plus a whole part, shown as a mixed number. */
function withWhole(rng: Rng, f: Rational, lo: number, hi: number): Rational {
  return f.add(R(rng.int(lo, hi)));
}

export const fractions: Template[] = [
  t({
    id: 'fr-to-decimal',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      let f: Rational | null;
      if (d > 1 && rng.chance(0.4)) {
        const part = properFrac(rng, [d === 2 ? 8 : 16]);
        if (!part) return null;
        f = withWhole(rng, part, 1, 4);
      } else {
        f = properFrac(rng, by(d, [8, 20, 25, 40], [16, 40, 80, 125], [32, 160, 250]));
      }
      if (!f) return null;
      const pw = toPowerOfTen(f.d)!;
      const shown = f.cmp(R(1)) < 0 ? frac(f) : mixed(f);
      return {
        prompt: `${shown} as a decimal = ?`,
        answer: f,
        distractors: [f.mul(R(10)), f.div(R(10)), f.add(R(1, f.d)), f.sub(R(1, f.d)), R(f.d, f.n)],
        explain: pw[1] === 1n ? `Its bottom is already a power of 10: ${frac(f)} = ${num(f)}` : `Scale the bottom up to ${pw[0]}: ${frac(f)} = ${f.n * pw[1]}/${pw[0]} = ${num(f)}`,
      };
    },
  }),

  t({
    id: 'fr-from-decimal',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      let f = properFrac(rng, by(d, [8, 16, 40], [16, 80, 125], [32, 160, 250, 400]));
      if (!f) return null;
      if (d > 1 && rng.chance(0.4)) f = withWhole(rng, f, 1, 3);
      const dec = num(f);
      const places = f.decimalPlaces()!;
      const digits = BigInt(dec.replace('.', ''));
      return {
        prompt: `${dec} as a fraction in lowest terms = ?`,
        answer: f,
        format: 'fraction',
        distractors: [Rational.of(digits, 10n ** BigInt(Math.max(places - 1, 0))), R(1).sub(f), Rational.of(f.n, f.d + 1n), Rational.of(f.n + 1n, f.d)],
        explain: `Read it over ${10n ** BigInt(places)}: ${digits}/${10n ** BigInt(places)}, which cancels to ${frac(f)}`,
      };
    },
  }),

  t({
    id: 'fr-add',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, [2, 3, 4, 5, 6, 8, 9, 10, 12], [2, 3, 4, 5, 6, 8, 9, 10, 12], [3, 4, 5, 6, 8, 9, 10, 12, 15]);
      const n = d === 3 ? 3 : 2;
      const fs = Array.from({ length: n }, () => properFrac(rng, pool));
      if (fs.some((f) => !f)) return null;
      let terms = fs as Rational[];
      if (new Set(terms.map((f) => String(f.d))).size < n) return null;
      const L = terms.reduce((acc, f) => lcmNum(acc, Number(f.d)), 1);
      if (L > by(d, 36, 24, 60)) return null;
      if (d === 2) terms = terms.map((f) => withWhole(rng, f, 1, 3));
      const ans = terms.reduce((a, b) => a.add(b), R(0));
      const show = (x: Rational) => (d === 2 ? mixed(x) : frac(x));
      const tops = terms.reduce((a, f) => a + f.n, 0n);
      const bots = terms.reduce((a, f) => a + f.d, 0n);
      return {
        prompt: `${terms.map(show).join(' + ')} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [Rational.of(tops, bots), terms[0]!.mul(terms[1]!), ans.add(R(1, ans.d)), ans.sub(R(1, ans.d)), ans.add(R(1))],
        explain: explainSum(terms, Array(n - 1).fill('+'), ans),
      };
    },
  }),

  t({
    id: 'fr-sub',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const dens = by(d, [2, 3, 4, 5, 6, 8, 9, 10, 12], [3, 4, 5, 6, 8, 12], [4, 5, 6, 8, 9, 10, 12]);
      let a = properFrac(rng, dens);
      let b = properFrac(rng, dens);
      if (!a || !b || a.equals(b) || a.d === b.d) return null;
      if (lcmNum(Number(a.d), Number(b.d)) > by(d, 36, 24, 36)) return null;
      if (d === 1 && rng.chance(0.75) && a.cmp(b) < 0) [a, b] = [b, a];
      if (d > 1) {
        // Mixed numbers; Hard forces a borrow and can go negative.
        if (d === 3 && a.cmp(b) > 0) [a, b] = [b, a];
        a = withWhole(rng, a, 1, by(d, 0, 4, 6));
        b = withWhole(rng, b, 1, by(d, 0, 4, 6));
        if (a.equals(b)) return null;
      }
      const ans = a.sub(b);
      const show = (x: Rational) => (d > 1 ? mixed(x) : frac(x));
      return {
        prompt: `${show(a)} − ${show(b)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [Rational.of(a.n - b.n, a.d - b.d), ans.neg(), ans.add(R(1)), ans.add(R(1, ans.d)), a.add(b)],
        explain: explainSum([a, b], ['−'], ans),
      };
    },
  }),

  t({
    id: 'fr-mul',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, [3, 4, 5, 6, 8, 9, 10, 12], [2, 3, 4, 5, 6, 8], [3, 4, 5, 6, 7, 8, 9, 10, 12]);
      const n = d === 3 ? 3 : 2;
      const fs = Array.from({ length: n }, () => properFrac(rng, pool));
      if (fs.some((f) => !f)) return null;
      let terms = fs as Rational[];
      if (d === 2) terms = terms.map((f, i) => withWhole(rng, f, 1, i === 0 ? 3 : 2));
      const ans = terms.reduce((a, b) => a.mul(b), R(1));
      const denProduct = terms.reduce((a, f) => a * f.d, 1n);
      // Require cancelling, so it trains simplifying first.
      if (ans.d === denProduct) return null;
      const show = (x: Rational) => (d === 2 ? mixed(x) : frac(x));
      const tops = terms.reduce((a, f) => a + f.n, 0n);
      const bots = terms.reduce((a, f) => a + f.d, 0n);
      return {
        prompt: `${terms.map(show).join(' × ')} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [terms[0]!.div(terms[1]!), Rational.of(tops, bots), terms[0]!.add(terms[1]!), ans.add(R(1, ans.d)), ans.mul(R(2))],
        explain: d === 2 ? `As improper fractions: ${terms.map(frac).join(' × ')} = ${frac(ans)}` : `Cancel first, then multiply: ${terms.map(frac).join(' × ')} = ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'fr-div',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, [3, 4, 5, 6, 8, 9, 10, 12], [2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 8, 9]);
      const a = properFrac(rng, pool);
      const b = properFrac(rng, pool);
      if (!a || !b || a.equals(b)) return null;
      if (d === 3) {
        // a ÷ b × c, left to right
        const c = properFrac(rng, pool);
        if (!c) return null;
        const ans = a.div(b).mul(c);
        if (ans.n > 99n || ans.d > 99n) return null;
        const wrong = a.div(b.mul(c));
        if (wrong.equals(ans)) return null;
        return {
          prompt: `${frac(a)} ÷ ${frac(b)} × ${frac(c)} = ?`,
          answer: ans,
          format: 'fraction',
          distractors: [wrong, a.mul(b).mul(c), R(1).div(ans), ans.add(R(1, ans.d))],
          explain: `Left to right: ${frac(a)} × ${b.d}/${b.n} = ${frac(a.div(b))}; × ${frac(c)} = ${frac(ans)}`,
        };
      }
      const pa = d === 2 ? withWhole(rng, a, 1, 4) : a;
      const pb = d === 2 ? withWhole(rng, b, 1, 2) : b;
      const ans = pa.div(pb);
      if (ans.n > 99n || ans.d > 99n) return null;
      const show = (x: Rational) => (d === 2 ? mixed(x) : frac(x));
      return {
        prompt: `${show(pa)} ÷ ${show(pb)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [pa.mul(pb), R(1).div(ans), ans.add(R(1, ans.d)), Rational.of(pa.n * pb.n, pa.d * pb.d + 1n)],
        explain: `Flip and multiply: ${frac(pa)} × ${pb.d}/${pb.n} = ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'fr-of-number',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Nested: 2/3 of 5/8 of 480
        const f1 = properFrac(rng, [3, 4, 5, 6, 7, 8, 9], 2);
        const f2 = properFrac(rng, [3, 4, 5, 6, 7, 8, 9], 2);
        if (!f1 || !f2) return null;
        const NR = Rational.of(f1.d * f2.d * BigInt(rng.int(2, 12)));
        const ans = f1.mul(f2).mul(NR);
        if (!ans.isInteger()) return null;
        return {
          prompt: `${frac(f1)} of ${frac(f2)} of ${num(NR)} = ?`,
          answer: ans,
          distractors: [f1.mul(NR), f2.mul(NR), f1.add(f2).mul(NR), NR.sub(ans), ans.mul(R(10))],
          explain: `${frac(f2)} of ${num(NR)} = ${num(f2.mul(NR))}; ${frac(f1)} of that = ${num(ans)}`,
        };
      }
      const f = properFrac(rng, by(d, [6, 7, 8, 9, 11, 12], [13, 15, 16, 24, 25], []), 2);
      if (!f) return null;
      const k = by(d, rng.int(6, 25), rng.int(8, 30), 0);
      const N = Rational.of(f.d * BigInt(k));
      const ans = f.mul(N);
      const part = N.div(Rational.of(f.d));
      return {
        prompt: `${frac(f)} of ${num(N)} = ?`,
        answer: ans,
        distractors: [part, N.sub(ans), part.mul(Rational.of(f.n + 1n)), part.mul(Rational.of(f.n - 1n)), ans.mul(R(10))],
        explain: `${num(N)} ÷ ${f.d} = ${num(part)}; × ${f.n} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'fr-compare',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const dens = by(d, [5, 7, 8, 9, 11, 12], [7, 9, 11, 12, 13, 14, 15, 16, 20], [13, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25]);
      const [lo, hi] = by(d, ['0.3', '0.9'], ['0.55', '0.75'], ['0.6', '0.7']).map((x) => R(x));
      const picked: Rational[] = [];
      for (let tries = 0; tries < 120 && picked.length < 5; tries++) {
        const f = properFrac(rng, dens);
        if (!f || f.cmp(lo!) <= 0 || f.cmp(hi!) >= 0) continue;
        if (picked.some((p) => p.equals(f))) continue;
        picked.push(f);
      }
      if (picked.length < 5) return null;
      const greatest = rng.chance(0.6);
      const sorted = [...picked].sort((x, y) => x.cmp(y));
      const ans = greatest ? sorted[4]! : sorted[0]!;
      const approx = sorted.map((x) => `${frac(x)} ≈ ${x.toNumber().toFixed(3).replace(/^0/, '')}`).join(', ');
      return {
        prompt: `Which of these fractions is ${greatest ? 'greatest' : 'least'}?`,
        answer: ans,
        format: 'fraction',
        distractors: picked.filter((p) => !p.equals(ans)),
        exactChoices: true,
        mcqOnly: true,
        explain: `Compare as decimals: ${approx}`,
      };
    },
  }),

  t({
    id: 'fr-missing',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const f = properFrac(rng, by(d, [7, 8, 9, 11, 12], [6, 8, 9, 12, 14, 16], [7, 9, 12, 14, 15, 16, 18]), 2);
      if (!f) return null;
      const m = BigInt(rng.int(3, 9));
      const N = f.n * m;
      const D = f.d * m;
      if (d === 1) {
        return {
          prompt: `${frac(f)} = ?/${D}`,
          answer: Rational.of(N),
          distractors: [Rational.of(f.n + (D - f.d)), Rational.of(N + 1n), Rational.of(N - 1n), Rational.of(D - N)],
          explain: `${D} ÷ ${f.d} = ${m}, so ? = ${f.n} × ${m} = ${N}`,
        };
      }
      // Both sides unreduced: reduce the known one, then scale.
      const k = BigInt(rng.int(2, 6));
      if (k === m) return null;
      if (d === 2) {
        const top = f.n * k;
        const ans = f.d * k;
        return {
          prompt: `${top}/? = ${N}/${D}`,
          answer: Rational.of(ans),
          distractors: [Rational.of(D - (N - top)), Rational.of(ans + f.d), Rational.of(ans - 1n), Rational.of(D / k)],
          explain: `${N}/${D} = ${frac(f)}, and ${top} = ${f.n} × ${k}, so ? = ${f.d} × ${k} = ${ans}`,
        };
      }
      const bottom = f.d * k;
      const ans = f.n * k;
      return {
        prompt: `?/${bottom} = ${N}/${D}`,
        answer: Rational.of(ans),
        distractors: [Rational.of(N + (bottom - D)), Rational.of(ans + f.n), Rational.of(ans + 1n), Rational.of(bottom - ans)],
        explain: `${N}/${D} = ${frac(f)}, and ${bottom} = ${f.d} × ${k}, so ? = ${f.n} × ${k} = ${ans}`,
      };
    },
  }),
];
