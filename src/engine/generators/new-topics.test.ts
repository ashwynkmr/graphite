// The new topics' answers, worked out a second way from the question's own words: brute force
// where the template uses a shortcut, so a wrong shortcut can't pass by agreeing with itself.
import { describe, expect, it } from 'vitest';
import { R, Rational } from '../matching/rational';
import { finalize } from './finalize';
import { TEMPLATE_BY_ID } from './index';
import type { Difficulty, GeneratedQuestion } from './types';

function draws(id: string, d: Difficulty, count = 200): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];
  for (let seed = 1; seed <= count; seed++) {
    const res = finalize(TEMPLATE_BY_ID.get(id)!, d, seed);
    if (res.ok) out.push(res.question);
  }
  expect(out.length).toBeGreaterThan(0);
  return out;
}

const numbersIn = (s: string) => (s.replace(/,/g, '').replace(/−/g, '-').match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

const answerOf = (q: GeneratedQuestion) => Rational.parse(q.answer)!;

describe('number properties', () => {
  it('remainders match real division', () => {
    for (const q of draws('np-remainder', 1)) {
      const [n, k] = numbersIn(q.prompt) as [number, number];
      expect(Number(q.answer)).toBe(n % k);
    }
    for (const q of draws('np-remainder', 2)) {
      const [a, b, k] = numbersIn(q.prompt) as [number, number, number];
      expect(Number(q.answer)).toBe((a * b) % k);
    }
  });

  it('a hard remainder holds for any n that fits', () => {
    for (const q of draws('np-remainder', 3)) {
      const [k, r, m, c] = numbersIn(q.prompt) as [number, number, number, number];
      for (const n of [r, r + k, r + 7 * k]) expect(Number(q.answer)).toBe((m * n + c) % k);
    }
  });

  it('counts of multiples match a count one by one', () => {
    const count = (a: number, b: number, hit: (x: number) => boolean) => {
      let n = 0;
      for (let x = a; x <= b; x++) if (hit(x)) n++;
      return n;
    };
    for (const q of draws('np-multiples', 2)) {
      const [k, a, b] = numbersIn(q.prompt) as [number, number, number];
      expect(Number(q.answer)).toBe(count(a, b, (x) => x % k === 0));
    }
    for (const q of draws('np-multiples', 3)) {
      const [, n, x, y] = numbersIn(q.prompt) as [number, number, number, number];
      expect(Number(q.answer)).toBe(count(1, n, (v) => v % x === 0 || v % y === 0));
    }
  });

  it('three lights next meet at the first time all divide', () => {
    for (const q of draws('np-gcf-lcm', 3)) {
      const [a, b, c] = numbersIn(q.prompt) as [number, number, number];
      let t = 1;
      while (t % a || t % b || t % c) t++;
      expect(Number(q.answer)).toBe(t);
    }
  });
});

describe('statistics', () => {
  it('the greatest possible largest number survives a search of every list', () => {
    for (const q of draws('st-spread', 3, 60)) {
      const [mean, median] = numbersIn(q.prompt.replace('Five', '')) as [number, number];
      const total = 5 * mean;
      let best = 0;
      for (let a = 1; a < median; a++) {
        for (let b = a + 1; b < median; b++) {
          for (let d = median + 1; d < total; d++) {
            const e = total - a - b - median - d;
            if (e > d) best = Math.max(best, e);
          }
        }
      }
      expect(Number(q.answer)).toBe(best);
    }
  });
});

describe('counting and probability', () => {
  it('every option is a possible probability, and fractions never fall back to whole numbers', () => {
    for (const id of ['pb-bag', 'pb-outcomes']) {
      for (const d of [1, 2, 3] as Difficulty[]) {
        for (const q of draws(id, d)) {
          expect(q.format).toBe('fraction');
          for (const c of q.choices!) {
            const v = Rational.parse(c)!;
            expect(v.cmp(R(0))).toBe(1);
            expect(v.cmp(R(1))).toBe(-1);
          }
        }
      }
    }
  });

  it('two-draw probabilities match listing every pair of marbles', () => {
    const list = (a: number, b: number, hit: (x: boolean, y: boolean) => boolean) => {
      const bag = [...Array<boolean>(a).fill(true), ...Array<boolean>(b).fill(false)];
      let hits = 0;
      let all = 0;
      bag.forEach((x, i) => {
        bag.forEach((y, j) => {
          if (i === j) return;
          all++;
          if (hit(x, y)) hits++;
        });
      });
      return R(hits).div(R(all));
    };
    for (const q of draws('pb-bag', 2)) {
      const [a, b] = numbersIn(q.prompt) as [number, number];
      expect(answerOf(q).equals(list(a, b, (x, y) => x && y))).toBe(true);
    }
    for (const q of draws('pb-bag', 3)) {
      const [a, b] = numbersIn(q.prompt) as [number, number];
      expect(answerOf(q).equals(list(a, b, (x, y) => x || y))).toBe(true);
    }
  });

  it('sums of two different numbers match listing every pair', () => {
    for (const q of draws('pb-outcomes', 3)) {
      const n = numbersIn(q.prompt).at(-1)!;
      const even = q.prompt.endsWith('even?');
      let hits = 0;
      let all = 0;
      for (let x = 1; x <= n; x++) {
        for (let y = x + 1; y <= n; y++) {
          all++;
          if ((x + y) % 2 === (even ? 0 : 1)) hits++;
        }
      }
      expect(answerOf(q).equals(R(hits).div(R(all)))).toBe(true);
    }
  });

  it('committee counts match listing every team', () => {
    const combos = (n: number, k: number): number => {
      let count = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        let bits = 0;
        for (let i = 0; i < n; i++) if (mask & (1 << i)) bits++;
        if (bits === k) count++;
      }
      return count;
    };
    for (const q of draws('pb-count', 3)) {
      const [x, y, a, b] = numbersIn(q.prompt) as [number, number, number, number];
      expect(Number(q.answer)).toBe(combos(a, x) * combos(b, y));
    }
  });
});

describe('algebra', () => {
  it('the answer solves the equation it came from', () => {
    for (const q of draws('al-linear', 3)) {
      const [p, q2, s] = numbersIn(q.prompt) as [number, number, number];
      const x = answerOf(q);
      expect(x.div(R(p)).add(x.div(R(q2))).equals(R(s))).toBe(true);
    }
    for (const q of draws('al-solve', 3)) {
      const [, b, c] = q.prompt.match(/x² ([+−] \d*)x ([+−] \d+)/)!;
      const toNum = (s: string) => (s.startsWith('−') ? -1 : 1) * Number(s.slice(2) || 1);
      const x = Number(q.answer);
      expect(x * x + toNum(b!) * x + toNum(c!)).toBe(0);
      expect(x).toBeGreaterThan(0);
    }
  });

  it('counts of integers match trying each one', () => {
    for (const q of draws('al-solve', 2)) {
      const m = q.prompt.match(/satisfy (−?\d+) < (\d+)x ([+−]) (\d+) ≤ (−?\d+)/)!;
      const lo = Number(m[1]!.replace('−', '-'));
      const a = Number(m[2]);
      const b = (m[3] === '−' ? -1 : 1) * Number(m[4]);
      const hi = Number(m[5]!.replace('−', '-'));
      let n = 0;
      for (let x = -500; x <= 500; x++) if (lo < a * x + b && a * x + b <= hi) n++;
      expect(Number(q.answer)).toBe(n);
    }
  });
});

describe('geometry', () => {
  it('a right triangle obeys the squares of its sides', () => {
    for (const q of draws('ge-triangle', 1)) {
      const [x, y] = numbersIn(q.prompt) as [number, number];
      const h = Number(q.answer);
      expect(x * x + y * y).toBe(h * h);
    }
  });

  it('an isosceles area matches its height', () => {
    for (const q of draws('ge-triangle', 3)) {
      const [side, , base] = numbersIn(q.prompt) as [number, number, number];
      const height = Math.sqrt(side * side - (base / 2) ** 2);
      expect(Number(q.answer)).toBe((base * height) / 2);
    }
  });

  it('a triangle’s three angles add to 180', () => {
    for (const q of draws('ge-angles', 3).filter((x) => x.prompt.includes('x, '))) {
      const m = q.prompt.match(/x, (\d+)x \+ (\d+) and x − (\d+)/)!;
      const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const x = (180 - b + c) / (a + 2);
      const angles = [x, a * x + b, x - c];
      expect(angles.reduce((s, v) => s + v, 0)).toBe(180);
      expect(Number(q.answer)).toBe(Math.max(...angles));
    }
  });
});

describe('later templates, worked a second way', () => {
  const divisors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x === 0);
  const isPrime = (n: number) => divisors(n).length === 2;

  it('factor counts match listing the factors', () => {
    for (const d of [1, 2] as Difficulty[]) {
      for (const q of draws('np-factor-count', d)) expect(Number(q.answer)).toBe(divisors(numbersIn(q.prompt)[0]!).length);
    }
    for (const q of draws('np-factor-count', 3)) expect(Number(q.answer)).toBe(divisors(numbersIn(q.prompt)[0]!).filter((x) => x % 2).length);
  });

  it('prime questions match testing each number', () => {
    for (const q of draws('np-primes', 1)) {
      const [a, b] = numbersIn(q.prompt) as [number, number];
      let n = 0;
      for (let x = a + 1; x < b; x++) if (isPrime(x)) n++;
      expect(Number(q.answer)).toBe(n);
    }
    for (const q of draws('np-primes', 3)) expect(Number(q.answer)).toBe(Math.max(...divisors(numbersIn(q.prompt)[0]!).filter(isPrime)));
  });

  it('the missing digit is the right one by trying every digit', () => {
    for (const q of draws('np-digits', 3)) {
      const stem = q.prompt.match(/number (\d{3})d/)![1]!;
      const fits = Array.from({ length: 10 }, (_, i) => i).filter((x) => Number(`${stem}${x}`) % 12 === 0);
      expect(Number(q.answer)).toBe(Math.max(...fits));
    }
    for (const d of [1, 2] as Difficulty[]) {
      for (const q of draws('np-digits', d)) {
        const m = q.prompt.match(/number (\d)d(\d\d) is divisible by (\d)/)!;
        const fits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => Number(`${m[1]}${x}${m[2]}`) % Number(m[3]) === 0);
        expect(Number(q.answer)).toBe(fits[0]);
      }
    }
  });

  it('counts of arrangements match listing them', () => {
    const arrangements = (letters: string[]): Set<string> => {
      if (letters.length <= 1) return new Set([letters.join('')]);
      const out = new Set<string>();
      letters.forEach((c, i) => {
        for (const rest of arrangements(letters.filter((_, j) => j !== i))) out.add(c + rest);
      });
      return out;
    };
    for (const q of draws('pb-arrange', 2)) {
      const word = q.prompt.match(/letters in ([A-Z]+)/)![1]!;
      expect(Number(q.answer)).toBe(arrangements([...word]).size);
    }
    for (const q of draws('pb-arrange', 3).filter((x) => numbersIn(x.prompt)[0]! <= 6)) {
      const people = 'ABCDEF'.slice(0, numbersIn(q.prompt)[0]!);
      const all = [...arrangements([...people])];
      const near = (s: string) => Math.abs(s.indexOf('A') - s.indexOf('B')) === 1;
      expect(Number(q.answer)).toBe(all.filter((s) => (q.prompt.includes('not sit') ? !near(s) : near(s))).length);
    }
  });

  it('two groups match a head count by the sets themselves', () => {
    for (const q of draws('pb-sets', 1)) {
      const [total, a, b, both] = numbersIn(q.prompt) as [number, number, number, number];
      const french = new Set(Array.from({ length: a }, (_, i) => i));
      const spanish = new Set(Array.from({ length: b }, (_, i) => a - both + i));
      let neither = 0;
      for (let i = 0; i < total; i++) if (!french.has(i) && !spanish.has(i)) neither++;
      expect(Number(q.answer)).toBe(neither);
    }
  });

  it('pipes and shared jobs finish exactly on time', () => {
    for (const q of draws('rt-pipes', 2, 60)) {
      const [a, b, c] = numbersIn(q.prompt) as [number, number, number];
      expect(answerOf(q).mul(R(1, a).add(R(1, b)).sub(R(1, c))).equals(R(1))).toBe(true);
    }
    for (const q of draws('rt-partial', 3)) {
      const [a, b, h] = numbersIn(q.prompt) as [number, number, number];
      expect(R(h, a).add(R(h, b)).add(answerOf(q).div(R(a))).equals(R(1))).toBe(true);
    }
  });

  it('a ratio after a change comes out as stated', () => {
    for (const q of draws('ra-after-change', 3, 60)) {
      const [p0, q0, k, p, q2] = numbersIn(q.prompt) as [number, number, number, number, number];
      const larger = answerOf(q);
      const smaller = larger.mul(R(p0, q0));
      expect(smaller.add(R(k)).div(larger.add(R(k))).equals(R(p, q2))).toBe(true);
    }
  });

  it('tickets add up to the stated takings', () => {
    for (const q of draws('al-word', 3)) {
      const [adult, child, tickets, total] = numbersIn(q.prompt) as [number, number, number, number];
      const adults = Number(q.answer);
      expect(adult * adults + child * (tickets - adults)).toBe(total);
    }
  });
});
