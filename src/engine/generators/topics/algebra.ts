import { R } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { lcmNum } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'algebra',
  kind: 'calc',
  ...x,
});

/** ' + 7' or ' − 7', for the term after another. */
function term(n: number): string {
  return n < 0 ? ` − ${num(-n)}` : ` + ${num(n)}`;
}

export const algebra: Template[] = [
  t({
    id: 'al-linear',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(3, 12);
        const x = rng.int(3, 25);
        const b = rng.int(4, 40) * (rng.chance(0.5) ? 1 : -1);
        const c = a * x + b;
        if (c <= 0) return null;
        return {
          prompt: `${a}x${term(b)} = ${c}. x = ?`,
          answer: R(x),
          distractors: [R(c + b).div(R(a)), R(c - b), R(c).div(R(a)), R(x + 1), R(x - 1)],
          explain: `${b < 0 ? 'Add' : 'Subtract'} ${Math.abs(b)} first: ${a}x = ${c - b}. Then ÷ ${a}: x = ${x}`,
        };
      }
      if (d === 2) {
        const a = rng.int(5, 14);
        const c = rng.int(2, a - 2);
        const x = rng.int(3, 24);
        const b = rng.int(3, 40) * (rng.chance(0.5) ? 1 : -1);
        const e = (a - c) * x + b;
        if (e === 0) return null;
        return {
          prompt: `${a}x${term(b)} = ${c}x${term(e)}. x = ?`,
          answer: R(x),
          distractors: [R(e + b).div(R(a - c)), R(e - b).div(R(a + c)), R(e - b), R(x + 1), R(x - 1)],
          explain: `Gather the x's on one side and the numbers on the other: ${a - c}x = ${e - b}, so x = ${x}`,
        };
      }
      const [p, q] = rng.pick<[number, number]>([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 6], [4, 6], [2, 7], [3, 8], [5, 6]]);
      const l = lcmNum(p, q);
      const x = l * rng.int(1, 9);
      const s = x / p + x / q;
      return {
        prompt: `x/${p} + x/${q} = ${s}. x = ?`,
        answer: R(x),
        distractors: [R(s * (p + q)), R(s * p), R(s * q), R(s * (p + q)).div(R(2)), R(x + l)],
        explain: `Multiply through by ${l} to clear the fractions: ${l / p}x + ${l / q}x = ${s * l}. So ${l / p + l / q}x = ${s * l}, and x = ${x}`,
      };
    },
  }),

  t({
    id: 'al-identity',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(2, 9);
        const b = rng.int(-9, -2);
        const value = a * a - a * b;
        return {
          prompt: `If a = ${a} and b = ${num(b)}, what is a² − ab?`,
          answer: R(value),
          distractors: [a * a + a * b, a * a - b, 2 * a - a * b, value + a, value - a].map((x) => R(x)),
          explain: `${a}² = ${a * a} and ab = ${a} × ${num(b)} = ${num(a * b)}. Subtracting a negative adds: ${a * a} + ${-a * b} = ${value}`,
        };
      }
      if (d === 2) {
        const x = rng.int(6, 30);
        const y = rng.int(2, x - 2);
        const s = x + y;
        const g = x - y;
        const askProduct = rng.chance(0.5);
        const ans = askProduct ? x * y : y;
        return {
          prompt: `If x + y = ${s} and x − y = ${g}, what is ${askProduct ? 'xy' : 'y'}?`,
          answer: R(ans),
          distractors: askProduct ? [s * g, x * x, y * y, ans + s, ans - g].map((v) => R(v)) : [x, s - g, g, y + 1, y - 1].map((v) => R(v)),
          explain: `Add the two equations: 2x = ${s + g}, so x = ${x}. Then y = ${s} − ${x} = ${y}${askProduct ? `, and xy = ${x * y}` : ''}`,
        };
      }
      const x = rng.int(6, 24);
      const y = rng.int(2, x - 2);
      const s = x + y;
      const g = x - y;
      const p = x * y;
      if (rng.chance(0.5)) {
        const squares = x * x - y * y;
        return {
          prompt: `If x² − y² = ${num(squares)} and x − y = ${g}, what is x + y?`,
          answer: R(s),
          distractors: [R(squares - g), R(x), R(squares).div(R(2)), R(s + g), R(s - 1)],
          explain: `x² − y² = (x + y)(x − y), so x + y = ${num(squares)} ÷ ${g} = ${s}`,
        };
      }
      const sum = s * s - 2 * p;
      return {
        prompt: `If x + y = ${s} and xy = ${p}, what is x² + y²?`,
        answer: R(sum),
        distractors: [s * s, s * s - p, s * s + 2 * p, s * s - 4 * p, sum + 2].map((v) => R(v)),
        explain: `(x + y)² = x² + 2xy + y², so x² + y² = ${s}² − 2 × ${p} = ${num(s * s)} − ${2 * p} = ${num(sum)}`,
      };
    },
  }),

  t({
    id: 'al-solve',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(2, 9);
        const b = rng.int(3, 30);
        const c = rng.int(5, 90);
        const least = Array.from({ length: 200 }, (_, i) => i - 50).find((x) => a * x - b > c);
        if (least === undefined || (c + b) % a === 0) return null;
        return {
          prompt: `What is the smallest integer x for which ${a}x − ${b} > ${c}?`,
          answer: R(least),
          distractors: [least - 1, least + 1, Math.floor((c - b) / a), least + 2, least - 2].map((x) => R(x)),
          explain: `${a}x > ${c + b}, so x > ${c + b} ÷ ${a}, which is between ${least - 1} and ${least}. The next integer up is ${least}`,
        };
      }
      if (d === 2) {
        const a = rng.int(2, 5);
        const b = rng.int(-9, 9);
        const lo = rng.int(-20, 5);
        const hi = lo + rng.int(12, 40);
        const hits = Array.from({ length: 400 }, (_, i) => i - 200).filter((x) => lo < a * x + b && a * x + b <= hi);
        const ans = hits.length;
        if (ans < 3 || !b) return null;
        const first = hits[0]!;
        const last = hits[ans - 1]!;
        return {
          prompt: `How many integers x satisfy ${num(lo)} < ${a}x${term(b)} ≤ ${num(hi)}?`,
          answer: R(ans),
          distractors: [ans + 1, ans - 1, ans + 2, hi - lo, ans - 2].map((x) => R(x)),
          explain: `Undo the ${b < 0 ? 'minus' : 'plus'} ${Math.abs(b)} and divide by ${a}. The integers that fit run from ${num(first)} to ${num(last)}, which is ${ans} of them`,
        };
      }
      const r = rng.int(3, 15);
      const s = rng.int(2, 15);
      if (r === s) return null;
      const b = s - r;
      const c = -r * s;
      return {
        prompt: `What is the positive solution of x²${term(b)}x${term(c)} = 0?`.replace(/([+−]) 1x/, '$1 x'),
        answer: R(r),
        distractors: [s, r + s, r * s, Math.abs(b), r + 1].map((x) => R(x)),
        explain: `Find two numbers that multiply to ${num(c)} and add to ${num(b)}: ${r} and ${s} with opposite signs. (x − ${r})(x + ${s}) = 0, so x = ${r}`,
      };
    },
  }),
];
