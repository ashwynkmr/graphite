import { R, Rational } from '../../matching/rational';
import { frac, num } from '../format';
import type { Template } from '../types';
import { by, sup } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'exponents',
  kind: 'calc',
  ...x,
});

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
  const places = x.decimalPlaces()!;
  const scale = 10n ** BigInt(places);
  return [(x.n * scale) / x.d, scale];
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
  const cyc = UNITS_CYCLES[b]!;
  return cyc[(e - 1) % cyc.length]!;
}

export const exponents: Template[] = [
  t({
    id: 'ex-value',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
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
            distractors: [R(b).pow(n), R(-b * n), R(1, b * n), R(b).pow(-(n + 1))],
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
      const [b, k] = rng.pick<[number, number]>(
        by(
          d,
          [[2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [3, 2], [3, 3], [3, 4], [5, 2], [5, 3], [4, 3], [10, 4]],
          [[2, 9], [2, 10], [2, 11], [2, 12], [3, 5], [3, 6], [4, 4], [4, 5], [6, 3], [7, 3], [5, 4], [9, 3], [11, 3]],
          [],
        ),
      );
      const ans = R(b).pow(k);
      return {
        prompt: `${b}${sup(k)} = ?`,
        answer: ans,
        distractors: [R(b * k), R(b).pow(k - 1), R(b).pow(k + 1), R(k).pow(b)],
        explain: b === 2 && k > 5 ? `2${sup(5)} = 32; double ${k - 5} more time${k - 5 > 1 ? 's' : ''}: ${num(ans)}` : `${Array(k).fill(b).join(' × ')} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ex-rules',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const b = rng.pick([2, 3, 5, 7, 10]);
        const m = rng.int(2, 9);
        const n = rng.int(2, 9);
        const div = rng.chance(0.4) && m > n;
        const ans = div ? m - n : m + n;
        return {
          prompt: `${b}${sup(m)} ${div ? '÷' : '×'} ${b}${sup(n)} = ${b}ⁿ. n = ?`,
          answer: R(ans),
          distractors: [div ? R(m, n).round('whole') : R(m * n), R(div ? m + n : m - n), R(ans + 1), R(ans - 1)],
          explain: div ? `Dividing subtracts exponents: ${m} − ${n} = ${ans}` : `Multiplying adds exponents: ${m} + ${n} = ${ans}`,
        };
      }
      if (d === 2) {
        const b = rng.pick([2, 3, 5]);
        const m = rng.int(2, 6);
        const n = rng.int(2, 5);
        const p = rng.int(-4, 4);
        if (p === 0) return null;
        const ans = m * n + p;
        return {
          prompt: `(${b}${sup(m)})${sup(n)} × ${b}${sup(p)} = ${b}ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(m + n + p), R(m * n - p), R(m * n * p), R(m * n)],
          explain: `Power of a power multiplies: ${m} × ${n} = ${m * n}; then add ${p}: ${ans}`,
        };
      }
      // Change of base: 4³ × 8² = 2ⁿ
      const [root, pows] = rng.pick<[number, number[]]>([
        [2, [4, 8, 16, 32]],
        [3, [9, 27, 81]],
        [5, [25, 125]],
      ]);
      const b1 = rng.pick(pows);
      const b2 = rng.pick(pows);
      const e1 = rng.int(2, 5);
      const e2 = rng.int(1, 4);
      const k1 = Math.round(Math.log(b1) / Math.log(root));
      const k2 = Math.round(Math.log(b2) / Math.log(root));
      const div = rng.chance(0.4);
      const ans = div ? k1 * e1 - k2 * e2 : k1 * e1 + k2 * e2;
      return {
        prompt: `${b1}${sup(e1)} ${div ? '÷' : '×'} ${b2}${sup(e2)} = ${root}ⁿ. n = ?`,
        answer: R(ans),
        distractors: [R(div ? e1 - e2 : e1 + e2), R(div ? k1 * e1 + k2 * e2 : k1 * e1 - k2 * e2), R(ans + k2), R(k1 + k2)],
        explain: `${b1} = ${root}${sup(k1)} and ${b2} = ${root}${sup(k2)}: ${k1} × ${e1} ${div ? '−' : '+'} ${k2} × ${e2} = ${num(R(ans))}`,
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
        const a = rng.int(1, 4);
        const b = rng.int(2, 4);
        if (a * b >= 10) return null;
        const ans = p + q;
        return {
          prompt: `(${a} × 10${sup(p)}) × (${b} × 10${sup(q)}) = ${a * b} × 10ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(p * q), R(ans + 1), R(ans - 1), R(p - q)],
          explain: `Multiply coefficients (${a} × ${b} = ${a * b}) and add exponents: ${term(p)} + ${term(q)} = ${num(R(ans))}`,
        };
      }
      if (d === 2) {
        const a = rng.pick([2, 3, 4, 5, 6, 8]);
        const b = rng.pick([2, 3, 4, 5, 6, 8]);
        const prod = a * b;
        if (prod < 10) return null;
        const coef = R(prod, 10);
        const ans = p + q + 1;
        return {
          prompt: `(${a} × 10${sup(p)}) × (${b} × 10${sup(q)}) = ${num(coef)} × 10ⁿ. n = ?`,
          answer: R(ans),
          distractors: [R(p + q), R(ans + 1), R(p * q), R(p + q - 1)],
          explain: `${a} × ${b} = ${prod} = ${num(coef)} × 10, so add one more: ${term(p)} + ${term(q)} + 1 = ${num(R(ans))}`,
        };
      }
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
    },
  }),

  t({
    id: 'ex-sci-notation',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const mant = R(rng.int(11, 99), 10);
      const e = by(d, rng.int(2, 7), -rng.int(2, 6), rng.chance(0.5) ? rng.int(4, 8) : -rng.int(3, 7));
      const value = mant.mul(R(10).pow(e));
      if (d === 3 && rng.chance(0.5)) {
        // Standard form back to a number.
        if (e > 0) return null;
        return {
          prompt: `${num(mant)} × 10${sup(e)} = ?`,
          answer: value,
          distractors: [value.mul(R(10)), value.div(R(10)), mant.mul(R(10).pow(-e)), value.mul(R(100))],
          explain: `Move the decimal point ${-e} places left: ${num(value)}`,
        };
      }
      return {
        prompt: `${num(value)} = ${num(mant)} × 10ⁿ. n = ?`,
        answer: R(e),
        distractors: [R(-e), R(e + 1), R(e - 1), R(e > 0 ? e + 2 : e - 2)],
        explain: e > 0 ? `The decimal point moves ${e} places left to give ${num(mant)}, so n = ${e}` : `The decimal point moves ${-e} places right to give ${num(mant)}, so n = ${e}`,
      };
    },
  }),

  t({
    id: 'ex-fraction-power',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const b = rng.pick([2, 3, 5]);
        const k = rng.pick([2, 4, 6]);
        if (b === 5 && k === 6) return null;
        const ans = R(b).pow(k / 2);
        return {
          prompt: `√(${b}${sup(k)}) = ?`,
          answer: ans,
          distractors: [R(b).pow(k), R(b * k / 2), R(b).pow(k / 2 + 1), R(b).pow(k - 2)],
          explain: `Square root halves the exponent: ${b}${sup(k / 2)} = ${num(ans)}`,
        };
      }
      const r = rng.pick([2, 3, 4, 5]);
      const q = rng.pick([2, 3]);
      const p = rng.int(1, 5);
      if (p % q === 0) return null;
      const b = r ** q;
      const value = R(r).pow(p);
      if (value.cmp(R(9999)) > 0) return null;
      if (d === 2) {
        return {
          prompt: `${b}^(${p}/${q}) = ?`,
          answer: value,
          distractors: [R(b * p).div(R(q)), R(r).pow(p + 1), R(r).pow(Math.max(p - 1, 0)), R(b).pow(p)],
          explain: `${q === 2 ? 'Square' : 'Cube'} root first: ${q === 2 ? '√' : '∛'}${b} = ${r}; then ${r}${sup(p)} = ${num(value)}`,
        };
      }
      // Negative exponent: (1/8)^(−2/3) = 4, or 8^(−2/3) = 1/4
      const flip = rng.chance(0.5);
      const ans = flip ? value : R(1).div(value);
      return {
        prompt: flip ? `(1/${b})^(−${p}/${q}) = ?` : `${b}^(−${p}/${q}) = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [R(1).div(ans), ans.mul(R(r)), R(1).div(ans).mul(R(r)), R(-p * b, q)],
        explain: `${q === 2 ? '√' : '∛'}${b} = ${r}; ${r}${sup(p)} = ${num(value)}; the negative exponent flips it: ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'ex-solve',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const b = rng.pick([2, 3, 5, 10]);
        const x = rng.int(2, b === 2 ? 9 : b === 10 ? 6 : 5);
        const v = R(b).pow(x);
        return {
          prompt: `${b}ˣ = ${num(v)}. x = ?`,
          answer: R(x),
          distractors: [R(x + 1), R(x - 1), v.div(R(b)), R(x * 2)],
          explain: `${b}${sup(x)} = ${num(v)}`,
        };
      }
      const [root, pows] = rng.pick<[number, number[]]>([
        [2, [4, 8, 16, 32]],
        [3, [9, 27, 81]],
      ]);
      const bl = rng.pick(pows);
      const br = rng.pick([root, ...pows].filter((p) => p !== bl));
      const kl = Math.round(Math.log(bl) / Math.log(root));
      const kr = Math.round(Math.log(br) / Math.log(root));
      const e = rng.int(1, 6);
      const shift = d === 3 && rng.chance(0.5) ? rng.int(1, 3) : 0;
      // bl^(x − shift) = br^e  →  kl(x − shift) = kr·e
      const x = R(kr * e, kl).add(R(shift));
      if (d === 2 && !x.isInteger()) return null;
      if (d === 3 && x.isInteger() && shift === 0) return null;
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
      const b = rng.pick([2, 3, 7, 8, 4, 9]);
      if (d === 3) {
        const b2 = rng.pick([2, 3, 7, 8].filter((x) => x !== b));
        const e1 = rng.int(10, 60);
        const e2 = rng.int(10, 60);
        const u1 = unitsDigit(b, e1);
        const u2 = unitsDigit(b2, e2);
        const ans = (u1 * u2) % 10;
        if (ans === 0) return null;
        return {
          prompt: `What is the units digit of ${b}${sup(e1)} × ${b2}${sup(e2)}?`,
          answer: R(ans),
          distractors: [R(u1), R(u2), R((u1 + u2) % 10 || 5), R(((ans + 2) % 9) + 1)],
          explain: `Units digits: ${b}${sup(e1)} ends in ${u1}, ${b2}${sup(e2)} ends in ${u2}; ${u1} × ${u2} = ${u1 * u2}, so ${ans}`,
        };
      }
      const e = by(d, rng.int(5, 9), rng.int(10, 60), 0);
      const cyc = UNITS_CYCLES[b]!;
      const ans = unitsDigit(b, e);
      const others = [...new Set([...cyc, ...[1, 3, 7, 9, 2, 4, 6, 8]])].filter((x) => x !== ans);
      const rem = e % cyc.length;
      return {
        prompt: `What is the units digit of ${b}${sup(e)}?`,
        answer: R(ans),
        distractors: others.slice(0, 4).map((x) => R(x)),
        explain: `Units digits of powers of ${b} repeat ${cyc.join(', ')}; ${e} ÷ ${cyc.length} leaves ${rem}, so take the ${rem === 0 ? 'last' : ['1st', '2nd', '3rd'][rem - 1]} one: ${ans}`,
      };
    },
  }),

  t({
    id: 'ex-powers-of-ten',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const x = R(rng.int(11, 999), 10 ** rng.int(1, 2));
        const k = rng.int(1, 3);
        const p = R(10).pow(k);
        const mul = rng.chance(0.5);
        const ans = mul ? x.mul(p) : x.div(p);
        if ((ans.decimalPlaces() ?? 9) > 4) return null;
        return {
          prompt: `${num(x)} ${mul ? '×' : '÷'} ${num(p)} = ?`,
          answer: ans,
          distractors: [ans.mul(R(10)), ans.div(R(10)), mul ? x.div(p) : x.mul(p), ans.mul(R(100))],
          explain: `Move the decimal point ${k} place${k > 1 ? 's' : ''} ${mul ? 'right' : 'left'}: ${num(ans)}`,
        };
      }
      if (d === 2) {
        const q = R(rng.int(2, 9) * rng.pick([1, 10]));
        const b = R(rng.int(2, 9), 10 ** rng.int(1, 3));
        const a = q.mul(b);
        const div = rng.chance(0.5);
        if (div) {
          return {
            prompt: `${num(a)} ÷ ${num(b)} = ?`,
            answer: q,
            distractors: [q.mul(R(10)), q.div(R(10)), q.mul(R(100)), a.mul(b)],
            explain: `Scale both by ${num(Rational.of(placeValue(b)[1]))}: ${num(a.mul(Rational.of(placeValue(b)[1])))} ÷ ${placeValue(b)[0]} = ${num(q)}`,
          };
        }
        const c = R(rng.int(2, 9) * 100);
        const ans = b.mul(c);
        return {
          prompt: `${num(b)} × ${num(c)} = ?`,
          answer: ans,
          distractors: [ans.mul(R(10)), ans.div(R(10)), ans.mul(R(100)), ans.div(R(100))],
          explain: `${placeValue(b)[0]} × ${num(c)} = ${num(c.mul(Rational.of(placeValue(b)[0])))}, then ÷ ${num(Rational.of(placeValue(b)[1]))} = ${num(ans)}`,
        };
      }
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
    },
  }),
];
