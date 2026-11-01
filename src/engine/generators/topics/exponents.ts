import { R, Rational } from '../../matching/rational';
import { frac, num } from '../format';
import type { Template } from '../types';
import { sup } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'exponents',
  kind: 'calc',
  ...x,
});

type Rng = Parameters<Template['generate']>[0];

/** '(2/3)' for fractions and negatives, '5' otherwise: the base as written before an exponent. */
function base(x: Rational): string {
  return x.isInteger() && !x.isNegative() ? num(x) : `(${x.isInteger() ? num(x) : frac(x)})`;
}

/** An integer as it reads inside a sum: 3, (−3). */
function term(n: number): string {
  return n < 0 ? `(−${-n})` : String(n);
}

/** A decimal as digits over a power of ten: 0.006 → [6, 1000]. */
function placeValue(x: Rational): [bigint, bigint] {
  const scale = 10n ** BigInt(x.decimalPlaces()!);
  return [(x.n * scale) / x.d, scale];
}

/** Powers of a common root, for change-of-base questions. */
const ROOTS: [number, number[]][] = [
  [2, [4, 8, 16, 32]],
  [3, [9, 27, 81]],
  [5, [25, 125]],
];

function logBase(root: number, x: number): number {
  return Math.round(Math.log(x) / Math.log(root));
}

const UNITS_CYCLES: Record<number, number[]> = {
  2: [2, 4, 8, 6],
  3: [3, 9, 7, 1],
  4: [4, 6],
  7: [7, 9, 3, 1],
  8: [8, 4, 2, 6],
  9: [9, 1],
};

function unitsDigit(b: number, e: number): number {
  const cyc = UNITS_CYCLES[b % 10]!;
  return cyc[(e - 1) % cyc.length]!;
}

function nth(k: number): string {
  return ['last', '1st', '2nd', '3rd'][k]!;
}

/** "Units digits of powers of 7 repeat 7, 9, 3, 1; 23 ÷ 4 leaves 3, so take the 3rd one: 3" */
function explainCycle(b: number, e: number): string {
  const cyc = UNITS_CYCLES[b % 10]!;
  return `powers of ${b % 10} end in ${cyc.join(', ')} (repeating); ${e} ÷ ${cyc.length} leaves ${e % cyc.length}, so the ${nth(e % cyc.length)}: ${unitsDigit(b, e)}`;
}

/** r^(p/q) for a perfect-power base: [base, value]. */
function fracPower(rng: Rng): { b: number; p: number; q: number; r: number; value: Rational } | null {
  const r = rng.pick([2, 3, 4, 5]);
  const q = rng.pick([2, 3]);
  const p = rng.int(1, 5);
  if (p % q === 0) return null;
  const value = R(r).pow(p);
  if (value.cmp(R(9999)) > 0) return null;
  return { b: r ** q, p, q, r, value };
}

export const exponents: Template[] = [
  t({
    id: 'ex-value',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const [b, k] = rng.pick<[number, number]>([[2, 9], [2, 10], [2, 11], [2, 12], [3, 5], [3, 6], [4, 4], [4, 5], [6, 3], [7, 3], [5, 4], [9, 3], [11, 3]]);
        const ans = R(b).pow(k);
        return {
          prompt: `${b}${sup(k)} = ?`,
          answer: ans,
          distractors: [R(b).pow(k - 1), R(b).pow(k + 1), R(b * k), R(k).pow(b), ans.add(R(b))],
          explain: b === 2 ? `2${sup(10)} = 1,024; ${k === 10 ? 'that\'s it' : `${k < 10 ? 'halve' : 'double'} ${Math.abs(k - 10)} time${Math.abs(k - 10) > 1 ? 's' : ''}: ${num(ans)}`}` : `${Array(k).fill(b).join(' × ')} = ${num(ans)}`,
        };
      }
      if (d === 2) {
        const kind = rng.int(0, 2);
        if (kind === 0) {
          const n = rng.int(1, 5);
          const b = rng.pick([2, 3, 4, 5]);
          const ans = R(b).pow(-n);
          if (ans.d > 999n) return null;
          return {
            prompt: `${b}${sup(-n)} = ?`,
            answer: ans,
            format: 'fraction',
            distractors: [R(-b * n), R(1, b * n), R(b).pow(-(n + 1)), R(b).pow(-(n - 1) || -1).mul(R(1, 2))],
            explain: `A negative exponent flips: ${b}${sup(-n)} = 1/${b}${sup(n)} = ${frac(ans)}`,
          };
        }
        if (kind === 1) {
          const f = rng.pick([R(2, 3), R(3, 4), R(1, 2), R(2, 5), R(3, 2), R(4, 3)]);
          const k = rng.int(2, 4);
          const ans = f.pow(k);
          return {
            prompt: `${base(f)}${sup(k)} = ?`,
            answer: ans,
            format: 'fraction',
            distractors: [f.mul(R(k)), Rational.of(f.n ** BigInt(k), f.d), Rational.of(f.n, f.d ** BigInt(k)), f.pow(k - 1)],
            explain: `Raise top and bottom: ${f.n}${sup(k)}/${f.d}${sup(k)} = ${frac(ans)}`,
          };
        }
        const b = rng.int(2, 6);
        const k = rng.int(3, 5);
        const ans = R(-b).pow(k);
        return {
          prompt: `(−${b})${sup(k)} = ?`,
          answer: ans,
          distractors: [ans.neg(), R(-b * k), R(-b).pow(k - 1), R(-b).pow(k + 1)],
          explain: `${k % 2 ? 'Odd' : 'Even'} power, so the sign is ${k % 2 ? 'negative' : 'positive'}: ${b}${sup(k)} = ${num(R(b).pow(k))}`,
        };
      }
      if (rng.chance(0.5)) {
        // 2¹⁰ − 2⁸ style: factor out the smaller power.
        const b = rng.pick([2, 3]);
        const k = rng.int(b === 2 ? 6 : 3, b === 2 ? 11 : 6);
        const j = k - rng.int(1, 3);
        const plus = rng.chance(0.5);
        const ans = R(b).pow(k).add(R(b).pow(j).mul(R(plus ? 1 : -1)));
        return {
          prompt: `${b}${sup(k)} ${plus ? '+' : '−'} ${b}${sup(j)} = ?`,
          answer: ans,
          distractors: [R(b).pow(plus ? k + j : k - j), R(b).pow(k + 1), R(b).pow(k), ans.add(R(b).pow(j).mul(R(2)))],
          explain: `Factor out ${b}${sup(j)}: ${b}${sup(j)} × (${b}${sup(k - j)} ${plus ? '+' : '−'} 1) = ${num(R(b).pow(j))} × ${num(R(b).pow(k - j).add(R(plus ? 1 : -1)))} = ${num(ans)}`,
        };
      }
      const f = rng.pick([R(2, 3), R(3, 4), R(2, 5), R(3, 5), R(1, 4), R(4, 5)]);
      const k = rng.int(2, 3);
      const ans = f.pow(-k);
      return {
        prompt: `${base(f)}${sup(-k)} = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [f.pow(k), f.mul(R(-k)), R(1).div(f.mul(R(k))), f.pow(-k + 1)],
        explain: `Flip, then raise: (${f.d}/${f.n})${sup(k)} = ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'ex-rules',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const b = rng.pick([2, 3, 5]);
        const m = rng.int(2, 6);
        const n = rng.int(2, 5);
        const p = rng.int(-4, 4);
        if (p === 0) return null;
        const ans = m * n + p;
        return {
          prompt: `(${b}${sup(m)})${sup(n)} × ${b}${sup(p)} = ${b}ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(m + n + p), R(m * n - p), R(m * n), R(m * n * p)],
          explain: `Power of a power multiplies: ${m} × ${n} = ${m * n}; then add ${term(p)}: ${num(R(ans))}`,
        };
      }
      const [root, pows] = rng.pick(ROOTS);
      const count = d === 3 ? 3 : 2;
      const bases = Array.from({ length: count }, () => rng.pick(pows));
      const exps = Array.from({ length: count }, () => rng.int(1, 5));
      const ops: ('×' | '÷')[] = d === 3 ? ['×', '÷'] : [rng.chance(0.4) ? '÷' : '×'];
      const ks = bases.map((b) => logBase(root, b));
      let ans = ks[0]! * exps[0]!;
      let naive = exps[0]!;
      ops.forEach((op, i) => {
        ans += (op === '×' ? 1 : -1) * ks[i + 1]! * exps[i + 1]!;
        naive += (op === '×' ? 1 : -1) * exps[i + 1]!;
      });
      const shown = bases.map((b, i) => `${i === 0 ? '' : ` ${ops[i - 1]} `}${b}${sup(exps[i]!)}`).join('');
      const work = ks.map((k, i) => `${i === 0 ? '' : ops[i - 1] === '×' ? ' + ' : ' − '}${k} × ${exps[i]}`).join('');
      return {
        prompt: `${shown} = ${root}ⁿ. n = ?`,
        answer: R(ans),
        distractors: [R(naive), R(ks.reduce((a, k, i) => a + k * exps[i]!, 0)), R(ans + ks[1]!), R(ans - 1)],
        explain: `Write each as a power of ${root} (${bases.map((b, i) => `${b} = ${root}${sup(ks[i]!)}`).join(', ')}): ${work} = ${num(R(ans))}`,
      };
    },
  }),

  t({
    id: 'ex-sci-product',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = rng.int(-6, 9);
      const q = rng.int(-6, 9);
      if (d === 1) {
        const a = rng.pick([2, 3, 4, 5, 6, 8]);
        const b = rng.pick([2, 3, 4, 5, 6, 8]);
        const prod = a * b;
        if (prod < 10) return null;
        const ans = p + q + 1;
        return {
          prompt: `(${a} × 10${sup(p)}) × (${b} × 10${sup(q)}) = ${num(R(prod, 10))} × 10ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(p + q), R(ans + 1), R(p + q - 1), R(p * q)],
          explain: `${a} × ${b} = ${prod} = ${num(R(prod, 10))} × 10, so add one more: ${term(p)} + ${term(q)} + 1 = ${num(R(ans))}`,
        };
      }
      if (d === 2) {
        const a = R(rng.pick([12, 15, 18, 24, 36, 48, 6, 9]), 10);
        const b = R(rng.pick([2, 3, 4, 6, 8]));
        const coef = a.div(b);
        if (!coef.isTerminating() || coef.cmp(R(1)) >= 0) return null;
        const scaled = coef.mul(R(10));
        if ((scaled.decimalPlaces() ?? 9) > 1) return null;
        const ans = p - q - 1;
        return {
          prompt: `(${num(a)} × 10${sup(p)}) ÷ (${num(b)} × 10${sup(q)}) = ${num(scaled)} × 10ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(p - q), R(p + q - 1), R(ans - 1), R(q - p)],
          explain: `${num(a)} ÷ ${num(b)} = ${num(coef)} = ${num(scaled)} × 10${sup(-1)}; exponents ${term(p)} − ${term(q)} − 1 = ${num(R(ans))}`,
        };
      }
      // (a × 10^p)(b × 10^q) ÷ (c × 10^r)
      const a = rng.pick([2, 3, 4, 5, 6, 8, 9]);
      const b = rng.pick([2, 3, 4, 5, 6, 8]);
      const c = R(rng.pick(['1.5', '2', '2.5', '3', '4', '5', '6', '7.5', '8']));
      const r = rng.int(-5, 6);
      let coef = R(a * b).div(c);
      if (!coef.isTerminating()) return null;
      let shift = 0;
      while (coef.cmp(R(10)) >= 0) {
        coef = coef.div(R(10));
        shift++;
      }
      while (coef.cmp(R(1)) < 0) {
        coef = coef.mul(R(10));
        shift--;
      }
      if ((coef.decimalPlaces() ?? 9) > 2) return null;
      const ans = p + q - r + shift;
      return {
        prompt: `(${a} × 10${sup(p)}) × (${b} × 10${sup(q)}) ÷ (${num(c)} × 10${sup(r)}) = ${num(coef)} × 10ⁿ. n = ?`,
        answer: R(ans),
        distractors: [R(p + q - r), R(p + q + r + shift), R(ans + 1), R(ans - 1)],
        explain: `${a} × ${b} ÷ ${num(c)} = ${num(R(a * b).div(c))} = ${num(coef)} × 10${sup(shift)}; exponents ${term(p)} + ${term(q)} − ${term(r)} ${shift >= 0 ? '+' : '−'} ${Math.abs(shift)} = ${num(R(ans))}`,
      };
    },
  }),

  t({
    id: 'ex-sci-notation',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const mant = R(rng.int(11, 99), 10);
      if (d === 3) {
        // Not in standard form yet: 0.042 × 10⁵ = 4.2 × 10ⁿ
        const shift = rng.pick([-3, -2, -1, 1, 2, 3]);
        const e = rng.int(-6, 7);
        const shownCoef = mant.mul(R(10).pow(shift));
        const ans = e + shift;
        return {
          prompt: `${num(shownCoef)} × 10${sup(e)} = ${num(mant)} × 10ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(e - shift), R(e), R(ans + 1), R(-ans)],
          explain: `${num(shownCoef)} = ${num(mant)} × 10${sup(shift)}, so n = ${term(e)} + ${term(shift)} = ${num(R(ans))}`,
        };
      }
      const e = d === 1 ? -rng.int(2, 6) : rng.chance(0.5) ? rng.int(4, 8) : -rng.int(3, 7);
      const value = mant.mul(R(10).pow(e));
      if (d === 2 && e < 0 && rng.chance(0.5)) {
        return {
          prompt: `${num(mant)} × 10${sup(e)} = ?`,
          answer: value,
          distractors: [value.mul(R(10)), value.div(R(10)), value.mul(R(100)), value.div(R(100))],
          explain: `Move the decimal point ${-e} places left: ${num(value)}`,
        };
      }
      return {
        prompt: `${num(value)} = ${num(mant)} × 10ⁿ. n = ?`,
        answer: R(e),
        distractors: [R(-e), R(e + 1), R(e - 1), R(e > 0 ? e + 2 : e - 2)],
        explain: e > 0 ? `The decimal point moves ${e} places left to give ${num(mant)}, so n = ${e}` : `The decimal point moves ${-e} places right to give ${num(mant)}, so n = ${num(R(e))}`,
      };
    },
  }),

  t({
    id: 'ex-fraction-power',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Two fractional powers of the same root: 8^(2/3) × 16^(−1/4) = 2² × 2⁻¹ = 2
        const r = rng.pick([2, 3]);
        const qs = r === 2 ? [2, 3, 4] : [2, 3, 4];
        const q1 = rng.pick(qs);
        const q2 = rng.pick(qs.filter((q) => q !== q1));
        const p1 = rng.int(1, 4);
        const p2 = rng.int(1, 3);
        if (p1 % q1 === 0 || p2 % q2 === 0) return null;
        const negY = rng.chance(0.6);
        const e = negY ? p1 - p2 : p1 + p2;
        const ans = R(r).pow(e);
        if (ans.n > 999n || ans.d > 999n) return null;
        const b1 = r ** q1;
        const b2 = r ** q2;
        return {
          prompt: `${b1}^(${p1}/${q1}) × ${b2}^(${negY ? '−' : ''}${p2}/${q2}) = ?`,
          answer: ans,
          format: ans.isInteger() ? 'number' : 'fraction',
          distractors: [R(r).pow(negY ? p1 + p2 : p1 - p2), R(r).pow(e + 1), R(r).pow(e - 1), R(r).pow(p1)],
          explain: `${b1}^(${p1}/${q1}) = ${r}${sup(p1)} and ${b2}^(${negY ? '−' : ''}${p2}/${q2}) = ${r}${sup(negY ? -p2 : p2)}; add exponents: ${r}${sup(e)} = ${ans.isInteger() ? num(ans) : frac(ans)}`,
        };
      }
      const fp = fracPower(rng);
      if (!fp) return null;
      const { b, p, q, r, value } = fp;
      const root = q === 2 ? '√' : '∛';
      if (d === 1) {
        return {
          prompt: `${b}^(${p}/${q}) = ?`,
          answer: value,
          distractors: [R(b * p).div(R(q)), R(r).pow(p + 1), R(r).pow(Math.max(p - 1, 1)), R(b).pow(p).div(R(q))],
          explain: `${q === 2 ? 'Square' : 'Cube'} root first: ${root}${b} = ${r}; then ${r}${sup(p)} = ${num(value)}`,
        };
      }
      const flip = rng.chance(0.5);
      const ans = flip ? value : R(1).div(value);
      return {
        prompt: flip ? `(1/${b})^(−${p}/${q}) = ?` : `${b}^(−${p}/${q}) = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [R(1).div(ans), ans.mul(R(r)), R(1).div(ans).mul(R(r)), ans.div(R(r))],
        explain: `${root}${b} = ${r}; ${r}${sup(p)} = ${num(value)}; the negative exponent flips it: ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'ex-solve',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // b^(x+k) ± b^x = V  →  b^x (b^k ± 1) = V
        const b = rng.pick([2, 3]);
        const k = rng.int(1, 2);
        const x = rng.int(1, b === 2 ? 7 : 4);
        const plus = rng.chance(0.6);
        const factor = b ** k + (plus ? 1 : -1);
        const V = factor * b ** x;
        return {
          prompt: `${b}^(x + ${k}) ${plus ? '+' : '−'} ${b}ˣ = ${num(R(V))}. x = ?`,
          answer: R(x),
          distractors: [R(b ** x), R(x + k), R(x - 1), R(x + 1)],
          explain: `Factor out ${b}ˣ: ${b}ˣ(${b}${sup(k)} ${plus ? '+' : '−'} 1) = ${b}ˣ × ${factor} = ${V}, so ${b}ˣ = ${b ** x} and x = ${x}`,
        };
      }
      const [root, pows] = rng.pick(ROOTS.slice(0, 2));
      const bl = rng.pick(pows);
      const br = rng.pick([root, ...pows].filter((p) => p !== bl));
      const kl = logBase(root, bl);
      const kr = logBase(root, br);
      const e = rng.int(2, 6);
      const shift = d === 2 && rng.chance(0.5) ? rng.int(1, 3) : 0;
      // bl^(x − shift) = br^e  →  kl(x − shift) = kr·e
      const x = R(kr * e, kl).add(R(shift));
      if (d === 1 && !x.isInteger()) return null;
      if (d === 2 && x.isInteger() && shift === 0) return null;
      const lhs = shift ? `${bl}^(x − ${shift})` : `${bl}ˣ`;
      return {
        prompt: `${lhs} = ${br}${sup(e)}. x = ?`,
        answer: x,
        format: x.isInteger() ? 'number' : 'fraction',
        distractors: [R(e), R(kl * e, kr).add(R(shift)), x.add(R(1)), R(kr * e)],
        explain: `Write both as powers of ${root}: ${shift ? `${kl}(x − ${shift})` : `${kl}x`} = ${kr} × ${e} = ${kr * e}, so x = ${x.isInteger() ? num(x) : frac(x)}`,
      };
    },
  }),

  t({
    id: 'ex-units-digit',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const b = rng.pick([2, 3, 7, 8, 4, 9]);
        const e = rng.int(10, 60);
        const ans = unitsDigit(b, e);
        const cyc = UNITS_CYCLES[b]!;
        const others = [...new Set([...cyc, 1, 3, 7, 9, 2, 4, 6, 8])].filter((x) => x !== ans);
        return {
          prompt: `What is the units digit of ${b}${sup(e)}?`,
          answer: R(ans),
          distractors: others.slice(0, 4).map((x) => R(x)),
          explain: `Units digits of ${explainCycle(b, e)}`,
        };
      }
      // Product (Medium) or two-digit bases with a product or sum (Hard)
      const pickBase = () => (d === 3 ? rng.int(1, 9) * 10 + rng.pick([2, 3, 7, 8]) : rng.pick([2, 3, 7, 8]));
      const b1 = pickBase();
      const b2 = pickBase();
      if (b1 % 10 === b2 % 10) return null;
      const e1 = rng.int(10, 60);
      const e2 = rng.int(10, 60);
      const u1 = unitsDigit(b1, e1);
      const u2 = unitsDigit(b2, e2);
      const sum = d === 3 && rng.chance(0.5);
      const ans = sum ? (u1 + u2) % 10 : (u1 * u2) % 10;
      if (ans === 0) return null;
      const wrongOp = sum ? (u1 * u2) % 10 : (u1 + u2) % 10;
      return {
        prompt: `What is the units digit of ${b1}${sup(e1)} ${sum ? '+' : '×'} ${b2}${sup(e2)}?`,
        answer: R(ans),
        distractors: [R(u1), R(u2), R(wrongOp || 5), R(((ans + 2) % 9) + 1)],
        explain: `Only units digits matter. ${b1}${sup(e1)}: ${explainCycle(b1, e1)}. ${b2}${sup(e2)}: ${explainCycle(b2, e2)}. ${u1} ${sum ? '+' : '×'} ${u2} ends in ${ans}`,
      };
    },
  }),

  t({
    id: 'ex-powers-of-ten',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const q = R(rng.int(2, 9) * rng.pick([1, 10]));
        const b = R(rng.int(2, 9), 10 ** rng.int(1, 3));
        const [bDigits, bScale] = placeValue(b);
        if (rng.chance(0.5)) {
          const a = q.mul(b);
          return {
            prompt: `${num(a)} ÷ ${num(b)} = ?`,
            answer: q,
            distractors: [q.mul(R(10)), q.div(R(10)), q.mul(R(100)), q.div(R(100))],
            explain: `Scale both by ${num(Rational.of(bScale))}: ${num(a.mul(Rational.of(bScale)))} ÷ ${bDigits} = ${num(q)}`,
          };
        }
        const c = R(rng.int(2, 9) * 100);
        const ans = b.mul(c);
        return {
          prompt: `${num(b)} × ${num(c)} = ?`,
          answer: ans,
          distractors: [ans.mul(R(10)), ans.div(R(10)), ans.mul(R(100)), ans.div(R(100))],
          explain: `${bDigits} × ${num(c)} = ${num(c.mul(Rational.of(bDigits)))}, then ÷ ${num(Rational.of(bScale))} = ${num(ans)}`,
        };
      }
      if (d === 2) {
        const a = R(rng.int(2, 9), 10 ** rng.int(2, 4));
        const m = R(rng.pick([200, 300, 400, 500, 2000, 3000, 5000]));
        const dv = R(rng.int(2, 9), 10 ** rng.int(1, 2));
        const ans = a.mul(m).div(dv);
        if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 2) return null;
        return {
          prompt: `${num(a)} × ${num(m)} ÷ ${num(dv)} = ?`,
          answer: ans,
          distractors: [ans.mul(R(10)), ans.div(R(10)), ans.mul(R(100)), ans.div(R(100))],
          explain: `${num(a)} × ${num(m)} = ${num(a.mul(m))}; ÷ ${num(dv)} = ${num(ans)}`,
        };
      }
      // (0.002)² ÷ 0.0004
      const x = R(rng.int(2, 9), 10 ** rng.int(1, 3));
      const sq = x.mul(x);
      const dv = R(rng.int(2, 9), 10 ** rng.int(2, 5));
      const ans = sq.div(dv);
      if (!ans.isTerminating() || (ans.significantDigits() ?? 9) > 3 || (ans.decimalPlaces() ?? 9) > 4) return null;
      return {
        prompt: `(${num(x)})² ÷ ${num(dv)} = ?`,
        answer: ans,
        distractors: [x.mul(R(2)).div(dv), ans.mul(R(10)), ans.div(R(10)), ans.mul(R(100))],
        explain: `(${num(x)})² = ${num(sq)}; ${num(sq)} ÷ ${num(dv)} = ${num(ans)}`,
      };
    },
  }),
];
