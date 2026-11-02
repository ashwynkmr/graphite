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

  t({
    id: 'st-quartile',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, 8, 8, 12);
      const xs = distinct(rng, n, 10, 120);
      const s = sorted(xs);
      const lower = medianOf(s.slice(0, n / 2));
      const upper = medianOf(s.slice(n / 2));
      if (d === 1) {
        return {
          prompt: `What is the first quartile of ${list(xs)}?`,
          answer: lower,
          distractors: [medianOf(s), upper, R(s[1]!), R(s[2]!), lower.add(R(1))],
          explain: `Sorted: ${list(s)}. The first quartile is the median of the lower half: ${num(lower)}`,
        };
      }
      const iqr = upper.sub(lower);
      return {
        prompt: `What is the interquartile range of ${list(xs)}?`,
        answer: iqr,
        distractors: [R(s[n - 1]! - s[0]!), upper, lower, iqr.add(R(2)), iqr.sub(R(2))],
        explain: `Sorted: ${list(s)}. Medians of the two halves are ${num(lower)} and ${num(upper)}. The gap is ${num(iqr)}`,
      };
    },
  }),

  t({
    id: 'st-shift',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const sd = rng.int(2, 12);
      const range = rng.int(9, 40);
      const a = rng.int(2, 6);
      const b = rng.int(2, 30);
      if (d === 1) {
        return {
          prompt: `A list has a range of ${range}. If ${b} is added to every number, what is the new range?`,
          answer: R(range),
          distractors: [range + b, range + 2 * b, range * 2, range + 1].map((x) => R(x)),
          explain: `Adding the same number moves the whole list, so the spread stays at ${range}`,
        };
      }
      if (d === 2) {
        const ans = a * sd;
        return {
          prompt: `A list has a standard deviation of ${sd}. If every number is multiplied by ${a}, what is the new standard deviation?`,
          answer: R(ans),
          distractors: [sd, sd + a, a * a * sd, ans + 1].map((x) => R(x)),
          explain: `Multiplying stretches the spread by the same factor: ${a} × ${sd} = ${ans}`,
        };
      }
      const mean = rng.int(10, 50);
      const ans = a * sd;
      const askMean = rng.chance(0.5);
      return {
        prompt: `A list has a mean of ${mean} and a standard deviation of ${sd}. Each number is multiplied by ${a}, then increased by ${b}. What is the new ${askMean ? 'mean' : 'standard deviation'}?`,
        answer: R(askMean ? a * mean + b : ans),
        distractors: (askMean ? [a * mean, mean + b, a * (mean + b), a * mean + b + a] : [ans + b, sd + b, sd, a * a * sd]).map((x) => R(x)),
        explain: askMean ? `The mean takes both steps: ${a} × ${mean} + ${b} = ${a * mean + b}` : `Only the multiplying changes the spread; adding ${b} moves it. ${a} × ${sd} = ${ans}`,
      };
    },
  }),

  t({
    id: 'st-weighted',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [w1, w2] = rng.pick<[number, number]>([[40, 60], [30, 70], [25, 75], [20, 80], [50, 50], [60, 40]]);
      const x = rng.int(12, 19) * 5;
      if (d === 1) {
        const y = rng.int(12, 19) * 5;
        const ans = R(w1 * x + w2 * y).div(R(100));
        if (x === y || w1 === w2) return null;
        return {
          prompt: `Coursework counts ${w1}% and the final ${w2}%. A student gets ${x} and ${y}. What is the overall grade?`,
          answer: ans,
          distractors: [R(x + y).div(R(2)), R(w2 * x + w1 * y).div(R(100)), ans.add(R(1)), ans.sub(R(1))],
          explain: `${w1}% of ${x} is ${num(R(w1 * x).div(R(100)))} and ${w2}% of ${y} is ${num(R(w2 * y).div(R(100)))}. Together: ${num(ans)}`,
        };
      }
      if (d === 2) {
        const want = rng.int(13, 18) * 5;
        const need = R(want * 100 - w1 * x).div(R(w2));
        if (!need.isTerminating() || (need.decimalPlaces() ?? 9) > 1 || need.cmp(R(100)) > 0 || need.cmp(R(0)) <= 0) return null;
        return {
          prompt: `Coursework counts ${w1}% and the final ${w2}%. A student has ${x} in coursework and wants ${want} overall. What final score is needed?`,
          answer: need,
          distractors: [R(2 * want - x), R(want), need.add(R(5)), need.sub(R(5))],
          explain: `${want} − ${w1}% of ${x} = ${num(R(want * 100 - w1 * x).div(R(100)))} must come from the ${w2}%: that ÷ ${num(R(w2).div(R(100)))} = ${num(need)}`,
        };
      }
      const y = rng.int(12, 19) * 5;
      const final = rng.int(13, 19) * 5;
      const ans = R(20 * x + 30 * y + 50 * final).div(R(100));
      const drop = ans.sub(R(10));
      const need = drop.mul(R(100)).sub(R(20 * x + 30 * y)).div(R(50));
      if (need.cmp(R(0)) <= 0 || !need.isTerminating() || (need.decimalPlaces() ?? 9) > 1) return null;
      return {
        prompt: `Quizzes count 20%, a project 30% and the final 50%. A student has ${x} and ${y}, and wants ${num(drop)} overall. What final score is needed?`,
        answer: need,
        distractors: [drop, need.add(R(10)), need.sub(R(10)), R(x + y).div(R(2))],
        explain: `Quizzes and project give ${num(R(20 * x + 30 * y).div(R(100)))}. The rest, ${num(drop.sub(R(20 * x + 30 * y).div(R(100))))}, ÷ 0.5 = ${num(need)}`,
      };
    },
  }),
];
