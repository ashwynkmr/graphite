import { R, Rational } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { by } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'statistics',
  kind: 'calc',
  ...x,
});

export function medianOf(xs: readonly number[]): Rational {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? R(s[mid]!) : R(s[mid - 1]! + s[mid]!).div(R(2));
}

function meanOf(xs: readonly number[]): Rational {
  return R(xs.reduce((a, b) => a + b, 0)).div(R(xs.length));
}

const sorted = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);
const list = (xs: readonly number[]) => xs.map((x) => num(x)).join(', ');

function distinct(rng: { int(a: number, b: number): number }, n: number, lo: number, hi: number): number[] {
  const out = new Set<number>();
  while (out.size < n) out.add(rng.int(lo, hi));
  return [...out];
}

const SCENES = [
  { people: 'students', did: 'scored', unit: '', noun: 'score', values: [60, 70, 75, 80, 85, 90, 95] },
  { people: 'runners', did: 'took', unit: ' minutes', noun: 'time', values: [24, 26, 28, 30, 32, 34, 36] },
  { people: 'families', did: 'own', unit: ' books', noun: 'number of books', values: [10, 20, 30, 40, 50, 60, 70] },
];

export const statistics: Template[] = [
  t({
    id: 'st-median',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const xs = distinct(rng, 7, 11, 99);
        const extra = distinct(rng, 2, 11, 99);
        if (extra.some((x) => xs.includes(x))) return null;
        const before = medianOf(xs);
        const all = [...xs, ...extra];
        const after = medianOf(all);
        if (after.equals(before)) return null;
        const s = sorted(all);
        return {
          prompt: `The median of ${list(xs)} is ${num(before)}. If ${extra[0]} and ${extra[1]} are added to the list, what is the new median?`,
          answer: after,
          distractors: [before, R(s[3]!), R(s[5]!), R(extra[0]!), R(extra[1]!)],
          explain: `Sorted, the 9 numbers are ${list(s)}. The 5th is the middle: ${num(after)}`,
        };
      }
      const n = by(d, 5, 6, 6);
      const xs = distinct(rng, n, by(d, 11, 12, 12), by(d, 99, 150, 150));
      const s = sorted(xs);
      const m = medianOf(xs);
      const inPlace = n % 2 ? R(xs[(n - 1) / 2]!) : R(xs[n / 2 - 1]! + xs[n / 2]!).div(R(2));
      if (inPlace.equals(m)) return null;
      const mid = Math.floor(n / 2);
      return {
        prompt: `Median of ${list(xs)} = ?`,
        answer: m,
        distractors: [inPlace, R(s[mid]!), R(s[mid - 1]!), meanOf(xs), R(s[mid + 1]!)],
        explain:
          n % 2
            ? `Sort first: ${list(s)}. The middle one is ${num(m)}`
            : `Sort first: ${list(s)}. With an even count, average the middle two: (${s[mid - 1]} + ${s[mid]}) ÷ 2 = ${num(m)}`,
      };
    },
  }),

  t({
    id: 'st-spread',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const xs = distinct(rng, 6, 12, 120);
        const s = sorted(xs);
        const range = s[5]! - s[0]!;
        return {
          prompt: `Range of ${list(xs)} = ?`,
          answer: R(range),
          distractors: [R(s[5]! - s[1]!), R(s[4]! - s[0]!), R(Math.abs(xs[5]! - xs[0]!)), R(s[5]!)],
          explain: `Largest minus smallest: ${s[5]} − ${s[0]} = ${range}`,
        };
      }
      if (d === 2) {
        const low = distinct(rng, 4, 12, 60);
        const sumLow = low.reduce((a, b) => a + b, 0);
        // The fifth number pulls the mean up, and makes the total divide by 5.
        const high = rng.int(70, 120);
        const xs = rng.shuffle([...low, high + ((5 - ((sumLow + high) % 5)) % 5)]);
        const total = xs.reduce((a, b) => a + b, 0);
        const mean = R(total / 5);
        const median = medianOf(xs);
        const gap = mean.sub(median);
        if (gap.cmp(R(1)) < 0) return null;
        return {
          prompt: `By how much does the mean of ${list(xs)} exceed the median?`,
          answer: gap,
          distractors: [gap.add(R(1)), gap.sub(R(1)), gap.add(R(5)), gap.mul(R(2)), gap.add(R(2))],
          explain: `Sum ${total} ÷ 5 gives a mean of ${num(mean)}. Sorted, the median is ${num(median)}. ${num(mean)} − ${num(median)} = ${num(gap)}`,
        };
      }
      const mean = rng.int(14, 40);
      const median = rng.int(mean - 6, mean + 2);
      const total = 5 * mean;
      const largest = total - 1 - 2 - median - (median + 1);
      if (largest <= median + 1) return null;
      return {
        prompt: `Five different positive integers have a mean of ${mean} and a median of ${median}. What is the greatest possible value of the largest integer?`,
        answer: R(largest),
        distractors: [R(total - median), R(total - 2 * median), R(total - 1 - 1 - median - median), R(largest - 1), R(largest + 1)],
        explain: `The total is 5 × ${mean} = ${total}. Make the others as small as they can be: 1, 2, ${median} and ${median + 1}. ${total} − ${3 + median + median + 1} = ${largest}`,
      };
    },
  }),

  t({
    id: 'st-frequency',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const scene = rng.pick(SCENES);
      const kinds = by(d, 3, 4, 4);
      const values = sorted(rng.shuffle(scene.values).slice(0, kinds));
      const counts = values.map(() => rng.int(by(d, 2, 2, 1), by(d, 7, 8, 7)));
      // Hard totals 10 or 20, so the mean is a clean decimal.
      if (d === 3) counts[kinds - 1] = rng.pick([10, 20]) - counts.slice(0, -1).reduce((a, b) => a + b, 0);
      if (counts[kinds - 1]! < 1) return null;
      const n = counts.reduce((a, b) => a + b, 0);
      if (d === 1 && n % 2 === 0) return null;
      if (d === 2 && n % 2) return null;
      const all = values.flatMap((v, i) => Array.from({ length: counts[i]! }, () => v));
      const median = medianOf(all);
      const mean = meanOf(all);
      const parts = values.map((v, i) => `${counts[i]} ${scene.did} ${v}${i === 0 ? scene.unit : ''}`);
      const stem = `Of ${n} ${scene.people}, ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`;
      const middle = n % 2 ? `position ${(n + 1) / 2}` : `positions ${n / 2} and ${n / 2 + 1}`;
      if (d === 3) {
        const signedGap = mean.sub(median);
        const gap = signedGap.isNegative() ? signedGap.neg() : signedGap;
        if (gap.n === 0n || !gap.isTerminating() || (gap.decimalPlaces() ?? 9) > 1) return null;
        return {
          prompt: `${stem} By how much do the mean and median ${scene.noun} differ?`,
          answer: gap,
          distractors: [gap.add(R(1)), gap.mul(R(2)), gap.add(R(2)), gap.add(R(5)), gap.add(R(10))],
          explain: `Mean: ${values.map((v, i) => `${counts[i]} × ${v}`).join(' + ')}, all ÷ ${n} = ${num(mean)}. The median sits at ${middle}: ${num(median)}. The gap is ${num(gap)}`,
        };
      }
      return {
        prompt: `${stem} What is the median ${scene.noun}?`,
        answer: median,
        distractors: [...values.map((v) => R(v)), mean.round('whole'), median.add(R(5))],
        explain: `Count along in order to ${middle}: the running totals are ${counts.map((_, i) => counts.slice(0, i + 1).reduce((a, b) => a + b, 0)).join(', ')}. That lands on ${num(median)}`,
      };
    },
  }),
];
