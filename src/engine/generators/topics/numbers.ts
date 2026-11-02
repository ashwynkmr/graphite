import { R } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { by, gcdNum, lcmNum, sup } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'numbers',
  kind: 'calc',
  ...x,
});

/** 360 → [[2, 3], [3, 2], [5, 1]]. */
export function primeFactors(n: number): [number, number][] {
  const out: [number, number][] = [];
  let rest = n;
  for (let p = 2; p * p <= rest; p++) {
    let e = 0;
    while (rest % p === 0) {
      rest /= p;
      e++;
    }
    if (e) out.push([p, e]);
  }
  if (rest > 1) out.push([rest, 1]);
  return out;
}

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

  t({
    id: 'np-factor-count',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = rng.int(by(d, 12, 72, 120), by(d, 99, 360, 900));
      const factors = primeFactors(n);
      if (factors.length < 2) return null;
      const form = factors.map(([p, e]) => (e === 1 ? `${p}` : `${p}${sup(e)}`)).join(' × ');
      const all = factors.reduce((a, [, e]) => a * (e + 1), 1);
      if (d === 3) {
        const odd = factors.filter(([p]) => p !== 2).reduce((a, [, e]) => a * (e + 1), 1);
        if (odd === all) return null;
        return {
          prompt: `How many positive factors of ${n} are odd?`,
          answer: R(odd),
          distractors: [all, all - odd, odd + 1, odd + 2].map((x) => R(x)),
          explain: `${n} = ${form}. Odd factors ignore the 2s, so multiply one more than each other power: ${odd}`,
        };
      }
      return {
        prompt: `How many positive factors does ${n} have?`,
        answer: R(all),
        distractors: [all - 2, all + 1, all - 1, all + 2, factors.length].map((x) => R(x)),
        explain: `${n} = ${form}. Multiply one more than each power: ${factors.map(([, e]) => e + 1).join(' × ')} = ${all}`,
      };
    },
  }),

  t({
    id: 'np-primes',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(10, 70);
        const b = a + rng.int(14, 30);
        const list: number[] = [];
        for (let x = a + 1; x < b; x++) if (primeFactors(x).length === 1 && primeFactors(x)[0]![1] === 1) list.push(x);
        const ans = list.length;
        if (ans < 2) return null;
        return {
          prompt: `How many prime numbers are there between ${a} and ${b}?`,
          answer: R(ans),
          distractors: [ans + 1, ans - 1, ans + 2, ans + 3].map((x) => R(x)),
          explain: `They are ${list.join(', ')}: ${ans} in all`,
        };
      }
      const n = rng.int(30, 990);
      const factors = primeFactors(n);
      if (factors.length < 2) return null;
      const primes = factors.map(([p]) => p);
      const form = factors.map(([p, e]) => (e === 1 ? `${p}` : `${p}${sup(e)}`)).join(' × ');
      if (d === 2) {
        const ans = primes.reduce((a, b) => a + b, 0);
        return {
          prompt: `What is the sum of the different prime factors of ${n}?`,
          answer: R(ans),
          distractors: [factors.reduce((a, [p, e]) => a + p * e, 0) === ans ? ans + 2 : factors.reduce((a, [p, e]) => a + p * e, 0), Math.max(...primes), ans + 1, ans - 1, ans + 3].map((x) => R(x)),
          explain: `${n} = ${form}, so add ${primes.join(' + ')} = ${ans}`,
        };
      }
      const ans = Math.max(...primes);
      if (ans < 7) return null;
      return {
        prompt: `What is the largest prime factor of ${n}?`,
        answer: R(ans),
        distractors: [primes[0] === ans ? 2 : primes[0]!, ans + 2, ans - 2, ans + 4, ans * 2, n / ans].map((x) => R(x)),
        explain: `Divide out the small primes: ${n} = ${form}. The largest is ${ans}`,
      };
    },
  }),

  t({
    id: 'np-digits',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = rng.int(1, 9);
      const b = rng.int(1, 9);
      const c = rng.int(0, 9);
      const by9 = d === 2;
      const k = by9 ? 9 : 3;
      if (d === 3) {
        const hits: number[] = [];
        for (let x = 0; x <= 9; x++) if ((1000 * a + 100 * b + 10 * c + x) % 12 === 0) hits.push(x);
        if (!hits.length || hits[hits.length - 1]! === 0) return null;
        const ans = hits[hits.length - 1]!;
        return {
          prompt: `The 4-digit number ${a}${b}${c}d is divisible by 12. What is the largest digit d can be?`,
          answer: R(ans),
          distractors: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== ans).map((x) => R(x)),
          explain: `It must pass for 3 (digits add to a multiple of 3) and for 4 (last two digits). The largest that does both is ${ans}`,
        };
      }
      const hits: number[] = [];
      for (let x = 0; x <= 9; x++) if ((a + b + c + x) % k === 0) hits.push(x);
      const ans = hits.find((x) => x > 0);
      if (ans === undefined) return null;
      return {
        prompt: `The number ${a}d${b}${c} is divisible by ${k}. What is the smallest positive digit d can be?`,
        answer: R(ans),
        distractors: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => x !== ans).map((x) => R(x)),
        explain: `A multiple of ${k} has digits adding to a multiple of ${k}. ${a} + ${b} + ${c} = ${a + b + c}, and adding ${ans} makes ${a + b + c + ans}`,
      };
    },
  }),
];
