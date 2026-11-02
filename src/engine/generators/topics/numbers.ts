import { R } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { by, gcdNum, lcmNum } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'numbers',
  kind: 'calc',
  ...x,
});

/** Wrong remainders a divisor k allows, nearest mistakes first. */
function wrongRemainders(r: number, k: number): number[] {
  return [k - r, r + 1, r - 1, r + 2, r - 2, r + 3, r - 3].filter((x) => x >= 1 && x < k && x !== r);
}

export const numbers: Template[] = [
  t({
    id: 'np-remainder',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const k = rng.pick(by(d, [7, 8, 9, 11, 12, 13], [7, 8, 9, 11], [7, 8, 9, 11, 13]));
      if (d === 1) {
        const n = rng.int(60, 900);
        const r = n % k;
        if (!r) return null;
        const q = Math.floor(n / k);
        return {
          prompt: `What is the remainder when ${num(n)} is divided by ${k}?`,
          answer: R(r),
          distractors: wrongRemainders(r, k).map((x) => R(x)),
          explain: `Nearest multiple below: ${k} × ${q} = ${num(k * q)}. Then ${num(n)} − ${num(k * q)} = ${r}`,
        };
      }
      if (d === 2) {
        const a = rng.int(23, 99);
        const b = rng.int(23, 99);
        const ra = a % k;
        const rb = b % k;
        const r = (ra * rb) % k;
        if (!r || !ra || !rb) return null;
        return {
          prompt: `What is the remainder when ${a} × ${b} is divided by ${k}?`,
          answer: R(r),
          distractors: wrongRemainders(r, k).map((x) => R(x)),
          explain: `Only the remainders matter: ${a} leaves ${ra} and ${b} leaves ${rb}. ${ra} × ${rb} = ${ra * rb}, which leaves ${r}`,
        };
      }
      const known = rng.int(2, k - 2);
      const m = rng.int(2, 6);
      const c = rng.int(1, 9);
      const total = m * known + c;
      const r = total % k;
      if (!r) return null;
      return {
        prompt: `When n is divided by ${k}, the remainder is ${known}. What is the remainder when ${m}n + ${c} is divided by ${k}?`,
        answer: R(r),
        distractors: wrongRemainders(r, k).map((x) => R(x)),
        explain: `Treat n as its remainder: ${m} × ${known} + ${c} = ${total}, which leaves ${r} when divided by ${k}`,
      };
    },
  }),

  t({
    id: 'np-multiples',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const upTo = (n: number, k: number) => Math.floor(n / k);
      if (d === 1) {
        const k = rng.pick([3, 4, 6, 7, 8, 9, 11, 12, 13]);
        const n = rng.int(60, 400);
        const ans = upTo(n, k);
        return {
          prompt: `How many multiples of ${k} are there from 1 to ${n}?`,
          answer: R(ans),
          distractors: [ans + 1, ans - 1, ans + 2, ans - 2].map((x) => R(x)),
          explain: `${n} ÷ ${k} = ${ans} with ${n % k} left over, so the multiples are ${k} × 1 up to ${k} × ${ans}`,
        };
      }
      if (d === 2) {
        const k = rng.pick([3, 4, 6, 7, 8, 9, 11, 12]);
        const a = rng.int(40, 250);
        const b = a + rng.int(90, 400);
        const high = upTo(b, k);
        const low = upTo(a - 1, k);
        const ans = high - low;
        return {
          prompt: `How many multiples of ${k} are there from ${a} to ${b}, inclusive?`,
          answer: R(ans),
          distractors: [Math.floor((b - a) / k), ans + 1, ans - 1, ans + 2, high].map((x) => R(x)),
          explain: `Multiples up to ${b}: ${high}. Multiples below ${a}: ${low}. ${high} − ${low} = ${ans}`,
        };
      }
      const [x, y] = rng.pick<[number, number]>([[3, 5], [4, 6], [4, 10], [6, 9], [6, 8], [5, 7], [3, 7], [4, 7], [6, 10], [8, 12]]);
      const n = rng.int(100, 600);
      const nx = upTo(n, x);
      const ny = upTo(n, y);
      const both = upTo(n, lcmNum(x, y));
      const ans = nx + ny - both;
      return {
        prompt: `How many integers from 1 to ${n} are multiples of ${x} or ${y}, or both?`,
        answer: R(ans),
        distractors: [nx + ny, nx + ny - 2 * both, ans + 1, ans - 1].map((v) => R(v)),
        explain: `${nx} multiples of ${x} plus ${ny} of ${y} counts multiples of ${lcmNum(x, y)} twice. ${nx} + ${ny} − ${both} = ${ans}`,
      };
    },
  }),

  t({
    id: 'np-gcf-lcm',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const shared = rng.int(2, 9);
        const a = shared * rng.int(2, 7);
        const b = shared * rng.int(2, 7);
        const g = gcdNum(a, b);
        if (a === b || g === a || g === b) return null;
        const l = lcmNum(a, b);
        return {
          prompt: `What is the least common multiple of ${a} and ${b}?`,
          answer: R(l),
          distractors: [a * b, l * 2, l + g, Math.max(a, b) * 2].map((x) => R(x)),
          explain: `Their greatest common factor is ${g}, so ${a} × ${b} ÷ ${g} = ${l}`,
        };
      }
      if (d === 2) {
        const g = rng.pick([6, 7, 8, 9, 12, 14, 15, 16, 18, 21, 24]);
        const m = rng.int(3, 11);
        const n = rng.int(m + 2, 15);
        if (gcdNum(m, n) !== 1) return null;
        const a = g * m;
        const b = g * n;
        return {
          prompt: `What is the greatest common factor of ${a} and ${b}?`,
          answer: R(g),
          distractors: [g * 2, b - a, g * 3, g + 1, g - 1].map((x) => R(x)),
          explain: `Any common factor also divides the difference: ${b} − ${a} = ${b - a}. The largest that fits both is ${g}: ${g} × ${m} and ${g} × ${n}`,
        };
      }
      const [a, b, c] = rng.shuffle([4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20]).slice(0, 3) as [number, number, number];
      const ab = lcmNum(a, b);
      const l = lcmNum(ab, c);
      if (l > 720 || l === a * b * c || l === ab) return null;
      return {
        prompt: `Three lights blink every ${a}, ${b} and ${c} seconds. They blink together now. In how many seconds will they next blink together?`,
        answer: R(l),
        distractors: [l * 2, ab, a * b, a + b + c, l + ab].map((x) => R(x)),
        explain: `They meet at the least common multiple. ${a} and ${b} meet every ${ab}; ${ab} and ${c} meet every ${l}`,
      };
    },
  }),
];
