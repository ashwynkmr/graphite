import { R, Rational } from '../../matching/rational';
import { frac, mixed, num } from '../format';
import type { Template } from '../types';
import { by, gcdNum, lcmNum } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'fractions',
  kind: 'calc',
  ...x,
});

/** A random proper fraction n/d in lowest terms with d from the pool (n ≥ minN when possible). */
function properFrac(rng: Parameters<Template['generate']>[0], dens: number[], minN = 1): Rational | null {
  const d = rng.pick(dens);
  const tops = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => n >= minN && gcdNum(n, d) === 1);
  return tops.length ? R(rng.pick(tops), d) : null;
}

/** Smallest power of ten that d divides, as [10^m, multiplier]. */
function toPowerOfTen(d: bigint): [bigint, bigint] | null {
  let p = 10n;
  for (let m = 1; m <= 4; m++, p *= 10n) if (p % d === 0n) return [p, p / d];
  return null;
}

function explainAddSub(a: Rational, b: Rational, op: '+' | '−', ans: Rational): string {
  const L = BigInt(lcmNum(Number(a.d), Number(b.d)));
  const an = a.n * (L / a.d);
  const bn = b.n * (L / b.d);
  const top = op === '+' ? an + bn : an - bn;
  const reduced = ans.toFractionString() === `${top}/${L}` || (L === 1n);
  return `Over ${L}: ${an}/${L} ${op} ${bn}/${L} = ${top}/${L}${reduced ? '' : ` = ${frac(ans)}`}`;
}

export const fractions: Template[] = [
  t({
    id: 'fr-to-decimal',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      let f: Rational | null;
      if (d === 3 && rng.chance(0.4)) {
        const whole = rng.int(1, 4);
        const part = properFrac(rng, [8]);
        if (!part) return null;
        f = part.add(R(whole));
      } else {
        f = properFrac(rng, by(d, [2, 4, 5, 10], [8, 20, 25, 40], [16, 40, 80, 125]));
      }
      if (!f) return null;
      const pw = toPowerOfTen(f.d)!;
      const shown = f.isInteger() || f.cmp(R(1)) < 0 ? frac(f) : mixed(f);
      const inv = R(f.d, f.n);
      return {
        prompt: `${shown} as a decimal = ?`,
        answer: f,
        distractors: [f.mul(R(10)), f.div(R(10)), f.add(R(1, f.d)), f.sub(R(1, f.d)), inv],
        explain: pw[1] === 1n ? `${frac(f)} = ${num(f)}` : `${frac(f)} = ${f.n * pw[1]}/${pw[0]} = ${num(f)}`,
      };
    },
  }),

  t({
    id: 'fr-from-decimal',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      let f = properFrac(rng, by(d, [4, 5, 10, 20, 25], [8, 16, 40], [16, 80, 125]));
      if (!f) return null;
      if (d === 3 && rng.chance(0.4)) f = f.add(R(rng.int(1, 3)));
      const dec = num(f);
      const places = f.decimalPlaces()!;
      const digits = BigInt(dec.replace('.', ''));
      return {
        prompt: `${dec} as a fraction in lowest terms = ?`,
        answer: f,
        format: 'fraction',
        distractors: [Rational.of(digits, 10n ** BigInt(Math.max(places - 1, 0))), R(1).sub(f), Rational.of(f.n, f.d + 1n), Rational.of(f.n + 1n, f.d)],
        explain: `${dec} = ${digits}/${10n ** BigInt(places)} = ${frac(f)}`,
      };
    },
  }),

  t({
    id: 'fr-add',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      let a: Rational | null;
      let b: Rational | null;
      if (d === 1) {
        const den = rng.pick([3, 4, 5, 6, 8, 10, 12]);
        const other = rng.chance(0.5) ? den : rng.pick([2, 4].filter((x) => den % x === 0 && x !== den).concat(den));
        a = properFrac(rng, [den]);
        b = properFrac(rng, [other]);
      } else {
        a = properFrac(rng, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
        b = properFrac(rng, [2, 3, 4, 5, 6, 8, 9, 10, 12]);
      }
      if (!a || !b || a.d === b.d && d > 1) return null;
      if (lcmNum(Number(a.d), Number(b.d)) > by(d, 12, 36, 24)) return null;
      let pa = a;
      let pb = b;
      if (d === 3) {
        pa = a.add(R(rng.int(1, 3)));
        pb = b.add(R(rng.int(1, 3)));
      }
      const ans = pa.add(pb);
      const show = (x: Rational) => (d === 3 ? mixed(x) : frac(x));
      return {
        prompt: `${show(pa)} + ${show(pb)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [Rational.of(pa.n + pb.n, pa.d + pb.d), pa.mul(pb), ans.add(R(1, Number(ans.d))), ans.sub(R(1, Number(ans.d)))],
        explain: explainAddSub(pa, pb, '+', ans),
      };
    },
  }),

  t({
    id: 'fr-sub',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const dens = by(d, [4, 6, 8, 10, 12], [2, 3, 4, 5, 6, 8, 9, 10, 12], [3, 4, 5, 6, 8, 12]);
      let a = properFrac(rng, dens);
      let b = properFrac(rng, d === 1 && a ? [Number(a.d)] : dens);
      if (!a || !b || a.equals(b)) return null;
      if ((d === 1 || (d === 2 && rng.chance(0.75))) && a.cmp(b) < 0) [a, b] = [b, a];
      if (d === 2 && a.d === b.d) return null;
      if (lcmNum(Number(a.d), Number(b.d)) > by(d, 12, 36, 24)) return null;
      if (d === 3) {
        a = a.add(R(rng.int(1, 4)));
        b = b.add(R(rng.int(1, 4)));
      }
      const ans = a.sub(b);
      const show = (x: Rational) => (d === 3 ? mixed(x) : frac(x));
      const wrongTop = a.d !== b.d && a.d - b.d !== 0n ? Rational.of(a.n - b.n, a.d - b.d) : ans.add(R(1, Number(ans.d)));
      return {
        prompt: `${show(a)} − ${show(b)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [wrongTop, ans.neg(), ans.add(R(1, Number(ans.d))), a.add(b)],
        explain: explainAddSub(a, b, '−', ans),
      };
    },
  }),

  t({
    id: 'fr-mul',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, [2, 3, 4, 5, 6], [3, 4, 5, 6, 8, 9, 10, 12], [2, 3, 4, 5, 6, 8]);
      const a = properFrac(rng, pool);
      const b = properFrac(rng, pool);
      if (!a || !b) return null;
      let pa = a;
      let pb = b;
      if (d === 3) {
        pa = a.add(R(rng.int(1, 3)));
        pb = b.add(R(rng.int(1, 2)));
      }
      const ans = pa.mul(pb);
      // Require some cancelling at Medium and Hard, so it trains simplifying first.
      if (d > 1 && ans.d === pa.d * pb.d) return null;
      const show = (x: Rational) => (d === 3 ? mixed(x) : frac(x));
      return {
        prompt: `${show(pa)} × ${show(pb)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [pa.div(pb), Rational.of(pa.n + pb.n, pa.d + pb.d), pa.add(pb), ans.add(R(1, Number(ans.d)))],
        explain:
          d === 3
            ? `As improper fractions: ${frac(pa)} × ${frac(pb)} = ${frac(ans)}`
            : `Cancel first, then multiply: ${frac(pa)} × ${frac(pb)} = ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'fr-div',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, [2, 3, 4, 5, 8], [3, 4, 5, 6, 8, 9, 10, 12], [2, 3, 4, 5, 6]);
      const a = properFrac(rng, pool);
      const b = properFrac(rng, pool);
      if (!a || !b || a.equals(b)) return null;
      let pa = a;
      let pb = b;
      if (d === 3) {
        pa = a.add(R(rng.int(1, 4)));
        pb = b.add(R(rng.int(1, 2)));
      }
      const ans = pa.div(pb);
      if (ans.n > 99n || ans.d > 99n) return null;
      const show = (x: Rational) => (d === 3 ? mixed(x) : frac(x));
      return {
        prompt: `${show(pa)} ÷ ${show(pb)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [pa.mul(pb), R(1).div(ans), ans.add(R(1, Number(ans.d))), Rational.of(pa.n * pb.n, pa.d * pb.d + 1n)],
        explain: `Flip and multiply: ${frac(pa)} × ${pb.d}/${pb.n} = ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'fr-of-number',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const f = properFrac(rng, by(d, [3, 4, 5, 10], [6, 7, 8, 9, 11, 12], [13, 15, 16, 24, 25]), 2);
      if (!f) return null;
      const k = by(d, rng.int(2, 20), rng.int(6, 25), rng.int(8, 30));
      const N = f.d * BigInt(k);
      const ans = f.mul(Rational.of(N));
      const part = Rational.of(N / f.d);
      return {
        prompt: `${frac(f)} of ${num(Rational.of(N))} = ?`,
        answer: ans,
        distractors: [part, Rational.of(N).sub(ans), part.mul(Rational.of(f.n + 1n)), part.mul(Rational.of(f.n - 1n)), ans.mul(R(10))],
        explain: `${num(Rational.of(N))} ÷ ${f.d} = ${num(part)}; × ${f.n} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'fr-compare',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const dens = by(d, [2, 3, 4, 5, 6, 8, 10], [5, 7, 8, 9, 11, 12], [7, 9, 11, 12, 13, 14, 15, 16, 20]);
      const [lo, hi] = by(d, ['0', '1'], ['0.3', '0.9'], ['0.55', '0.75']).map((x) => R(x));
      const picked: Rational[] = [];
      for (let tries = 0; tries < 80 && picked.length < 5; tries++) {
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
      const f = properFrac(rng, by(d, [3, 4, 5, 6, 8, 10], [7, 8, 9, 11, 12], [6, 8, 9, 12, 14, 16]), d === 1 ? 1 : 2);
      if (!f) return null;
      const m = BigInt(by(d, rng.int(2, 6), rng.int(3, 9), rng.int(3, 8)));
      const N = f.n * m;
      const D = f.d * m;
      if (d === 3) {
        // Unknown denominator, with the known fraction also unreduced: 15/? = 35/56
        const k = BigInt(rng.int(2, 4));
        if (k === m) return null;
        const top = f.n * k;
        const ans = f.d * k;
        return {
          prompt: `${top}/? = ${N}/${D}`,
          answer: Rational.of(ans),
          distractors: [Rational.of(D - (N - top)), Rational.of(ans + f.d), Rational.of(ans - 1n), Rational.of(D / k)],
          explain: `${N}/${D} = ${frac(f)}, and ${top} = ${f.n} × ${k}, so ? = ${f.d} × ${k} = ${ans}`,
        };
      }
      return {
        prompt: `${frac(f)} = ?/${D}`,
        answer: Rational.of(N),
        distractors: [Rational.of(f.n + (D - f.d)), Rational.of(N + 1n), Rational.of(N - 1n), Rational.of(D - N)],
        explain: `${D} ÷ ${f.d} = ${m}, so ? = ${f.n} × ${m} = ${N}`,
      };
    },
  }),
];
