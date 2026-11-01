import { R, Rational } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { by, fill, gcdNum, NAMES } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'averages',
  kind: 'calc',
  ...x,
});

function sum(xs: Rational[]): Rational {
  return xs.reduce((a, b) => a.add(b), R(0));
}

export const averages: Template[] = [
  t({
    id: 'av-mean',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, rng.int(3, 4), 5, rng.int(4, 5));
      const xs = Array.from({ length: n }, () => R(rng.int(by(d, 10, 12, 105), by(d, 60, 99, 395))));
      if (d === 1) {
        // Nudge the last value so the mean is whole.
        const rem = Number(sum(xs).n % BigInt(n));
        if (rem) xs[n - 1] = xs[n - 1]!.add(R(n - rem));
      }
      const total = sum(xs);
      const mean = total.div(R(n));
      if ((mean.decimalPlaces() ?? 9) > 2) return null;
      const sorted = [...xs].sort((a, b) => a.cmp(b));
      const median = n % 2 ? sorted[(n - 1) / 2]! : sorted[n / 2 - 1]!.add(sorted[n / 2]!).div(R(2));
      let explain = `Sum ${num(total)} ÷ ${n} = ${num(mean)}`;
      if (d < 3) {
        const base = mean.round('whole').div(R(10)).round('whole').mul(R(10));
        const devs = xs.map((x) => x.sub(base));
        const devSum = sum(devs);
        const devText = devs.map((v, i) => (i === 0 ? num(v) : v.isNegative() ? ` − ${num(v.neg())}` : ` + ${num(v)}`)).join('');
        explain = `From ${num(base)}: ${devText} = ${num(devSum)}; ${num(devSum)} ÷ ${n} = ${num(devSum.div(R(n)))}, so the mean is ${num(mean)}`;
      }
      return {
        prompt: `Mean of ${xs.map((x) => num(x)).join(', ')} = ?${mean.isTerminating() ? '' : ' (to the nearest tenth)'}`,
        answer: mean,
        rounding: mean.isTerminating() ? undefined : 'tenth',
        distractors: [total.div(R(n - 1)), total.div(R(n + 1)), median, mean.add(R(1))],
        explain,
      };
    },
  }),

  t({
    id: 'av-missing',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, rng.int(2, 4), rng.int(4, 7), rng.int(3, 8));
      const [scene, lo, hi, step] = rng.pick<[string, number, number, number]>([
        ['{name} averaged {m} on {n} tests. What score on the next test would make the average {t}?', 60, 92, 1],
        ['{name} averaged {m} points over {n} bowling games. What score in the next game would make the average {t}?', 110, 220, 1],
        ['{name} ran an average of {m} km a day for {n} days. How many km tomorrow would make the average {t}?', 3, 12, 1],
        ['A shop averaged {m} sales a day for {n} days. How many sales tomorrow would make the average {t}?', 20, 80, 1],
        ['{name} read an average of {m} pages a day for {n} days. How many pages tomorrow would make the average {t}?', 15, 60, 1],
        ['A café served an average of {m} customers a day for {n} days. How many tomorrow would make the average {t}?', 40, 120, 1],
      ]);
      const m = rng.int(lo, hi) * step;
      const gap = by(d, rng.int(1, 3), rng.int(2, 4), rng.int(-4, 5));
      if (gap === 0) return null;
      const target = m + gap;
      const ans = target + n * gap;
      if (ans <= 0 || (scene.includes('tests') && ans > 100)) return null;
      return {
        prompt: fill(scene, { name: rng.pick(NAMES), m: num(m), n: String(n), t: num(target) }),
        answer: R(ans),
        distractors: [R(target), R(target + gap), R(target + (n - 1) * gap), R(m + n * gap)],
        explain: `Each of the ${n} earlier values is ${Math.abs(gap)} ${gap > 0 ? 'below' : 'above'} ${target}, so the next is ${target} ${gap > 0 ? '+' : '−'} ${n} × ${Math.abs(gap)} = ${ans}`,
      };
    },
  }),

  t({
    id: 'av-weighted',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [scene, lo, hi] = rng.pick<[string, number, number]>([
        ['{n1} students in one section averaged {a1} on a test, and {n2} students in another averaged {a2}. What was the overall average?', 55, 95],
        ['One shop sold an average of {a1} items on {n1} days and {a2} items on {n2} other days. What was the overall daily average?', 20, 90],
        ['{n1} boxes average {a1} kg and {n2} more boxes average {a2} kg. What is the average weight of all the boxes?', 5, 40],
        ['A runner averaged {a1} minutes on {n1} runs and {a2} minutes on {n2} other runs. What was the overall average?', 20, 60],
        ['{n1} players averaged {a1} points and {n2} others averaged {a2} points. What was the average for all players?', 4, 30],
      ]);
      let n1 = by(d, rng.int(2, 10), rng.int(2, 20), rng.int(3, 30));
      let n2 = d === 1 ? n1 : rng.int(2, by(d, 10, 20, 30));
      if (d > 1 && n1 === n2) return null;
      // Overall = a2 + n1 × (a1 − a2) / (n1 + n2), so pick the gap to make that whole.
      const unit = (n1 + n2) / gcdNum(n1, n1 + n2);
      const maxK = Math.floor((hi - lo) / unit);
      if (maxK < 1) return null;
      const gap = unit * rng.int(1, maxK);
      let a2 = rng.int(lo, hi - gap);
      let a1 = a2 + gap;
      if (d === 1 && gap % 2) return null;
      if (rng.chance(0.5)) [n1, n2, a1, a2] = [n2, n1, a2, a1];
      const ans = R(n1 * a1 + n2 * a2, n1 + n2);
      return {
        prompt: fill(scene, { n1: String(n1), n2: String(n2), a1: String(a1), a2: String(a2) }),
        answer: ans,
        distractors: [R(a1 + a2, 2), R(n2 * a1 + n1 * a2, n1 + n2), ans.add(R(1)), ans.sub(R(1))],
        explain:
          d === 1
            ? `Equal group sizes, so average the averages: (${a1} + ${a2}) ÷ 2 = ${num(ans)}`
            : `Total ${n1} × ${a1} + ${n2} × ${a2} = ${n1 * a1 + n2 * a2}; ÷ ${n1 + n2} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'av-consecutive',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(1, 60);
        const b = a + rng.int(4, 40);
        const mean = R(a + b, 2);
        return {
          prompt: `Mean of all the integers from ${a} to ${b} = ?`,
          answer: mean,
          distractors: [mean.add(R(1)), mean.sub(R(1)), R(b - a, 2), R(a + b)],
          explain: `Evenly spaced, so the mean is the middle: (${a} + ${b}) ÷ 2 = ${num(mean)}`,
        };
      }
      const n = by(d, 0, rng.pick([3, 5, 7]), rng.pick([4, 6]));
      const even = d === 3;
      const step = even ? 2 : 1;
      const first = even ? rng.int(5, 40) * 2 : rng.int(5, 80);
      const xs = Array.from({ length: n }, (_, i) => first + i * step);
      const S = xs.reduce((a, b) => a + b, 0);
      const askLargest = rng.chance(0.5);
      const ans = askLargest ? xs[n - 1]! : xs[0]!;
      const mid = R(S, n);
      return {
        prompt: `The sum of ${n} consecutive ${even ? 'even ' : ''}integers is ${S}. What is the ${askLargest ? 'largest' : 'smallest'}?`,
        answer: R(ans),
        distractors: [mid.round('whole'), R(ans + step), R(ans - step), R(askLargest ? xs[0]! : xs[n - 1]!)],
        explain: `Middle = ${S} ÷ ${n} = ${num(mid)}; the ${askLargest ? 'largest' : 'smallest'} is ${((n - 1) / 2) * step} ${askLargest ? 'above' : 'below'} it: ${ans}`,
      };
    },
  }),

  t({
    id: 'av-add-remove',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = rng.int(4, 9);
      const m = rng.int(10, 60);
      const total = n * m;
      if (d === 1) {
        // A number is added.
        const newMean = m + rng.int(1, 4) * (rng.chance(0.5) ? 1 : -1);
        const x = newMean * (n + 1) - total;
        if (x <= 0) return null;
        return {
          prompt: `The mean of ${n} numbers is ${m}. One more number is added and the mean becomes ${newMean}. What number was added?`,
          answer: R(x),
          distractors: [R(newMean), R(newMean - m), R(newMean * n - total + newMean - m), R(x + 1)],
          explain: `New total ${n + 1} × ${newMean} = ${newMean * (n + 1)}; old total ${n} × ${m} = ${total}; difference ${x}`,
        };
      }
      if (d === 2) {
        // A number is removed.
        const ans = m + rng.int(1, 5) * (rng.chance(0.5) ? 1 : -1);
        const left = ans * (n - 1);
        const x = total - left;
        if (x <= 0) return null;
        return {
          prompt: `The mean of ${n} numbers is ${m}. If the number ${x} is removed, what is the mean of the rest?`,
          answer: R(ans),
          distractors: [R(left, n), R(m), R(m).sub(R(x, n)).round('whole'), R(ans + 1)],
          explain: `Total ${n} × ${m} = ${total}; minus ${x} = ${left}; ÷ ${n - 1} = ${ans}`,
        };
      }
      // A value is replaced.
      const x = rng.int(5, 90);
      const k = rng.int(-6, 6);
      const y = x + n * k + (rng.chance(0.4) && n % 2 === 0 ? n / 2 : 0);
      const change = R(y - x, n);
      if (x === y || y < 1) return null;
      const ans = R(m).add(change);
      return {
        prompt: `The mean of ${n} numbers is ${m}. One value, ${x}, is replaced by ${y}. What is the new mean?`,
        answer: ans,
        distractors: [R(m + y - x), R(m).sub(change), R(m), R(total - x + y, n - 1)],
        explain: `The total changes by ${y} − ${x} = ${num(R(y - x))}, so the mean changes by ${num(R(y - x))} ÷ ${n} = ${num(change)}: ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'av-new-member',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [scene, sceneLeave, lo, hi] = rng.pick<[string, string, number, number]>([
        [
          'The average age of {n} people in a group is {a}. A new person joins and the average becomes {b}. How old is the new person?',
          'The average age of {n} people in a group is {a}. One person leaves and the average becomes {b}. How old was that person?',
          20,
          50,
        ],
        [
          '{n} crates average {a} kg. One more crate is loaded and the average becomes {b} kg. How heavy is the new crate, in kg?',
          '{n} crates average {a} kg. One crate is unloaded and the average becomes {b} kg. How heavy was that crate, in kg?',
          20,
          60,
        ],
        [
          'A team of {n} players averages {a} points. A new player joins and the average becomes {b}. How many points does the new player have?',
          'A team of {n} players averages {a} points. One player leaves and the average becomes {b}. How many points did that player have?',
          10,
          40,
        ],
        [
          '{n} plants average {a} cm tall. One more plant is added and the average becomes {b} cm. How tall is the new plant, in cm?',
          '{n} plants average {a} cm tall. One plant is removed and the average becomes {b} cm. How tall was that plant, in cm?',
          15,
          60,
        ],
      ]);
      const n = by(d, rng.int(3, 6), rng.int(4, 9), rng.int(5, 10));
      const a = rng.int(lo, hi);
      const shift = by(d, 1, rng.pick([2, 3, -1, -2]), rng.pick([1, 2, -1, -2]));
      const b = a + shift;
      const leave = d === 3;
      const ans = leave ? n * a - (n - 1) * b : (n + 1) * b - n * a;
      if (ans <= 0) return null;
      return {
        prompt: fill(leave ? sceneLeave : scene, { n: String(n), a: String(a), b: String(b) }),
        answer: R(ans),
        distractors: leave
          ? [R(a - shift), R(a - n * shift - shift), R(a), R(ans + n)]
          : [R(b + shift), R(b), R(b + (n - 1) * shift), R(ans + 1)],
        explain: leave
          ? `Before: ${n} × ${a} = ${n * a}; after: ${n - 1} × ${b} = ${(n - 1) * b}; difference ${ans}`
          : `After: ${n + 1} × ${b} = ${(n + 1) * b}; before: ${n} × ${a} = ${n * a}; difference ${ans}`,
      };
    },
  }),

  t({
    id: 'av-sum-from-mean',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const n = rng.int(3, 8);
        const m = R(rng.int(21, 199), 2);
        const ans = m.mul(R(n));
        if (!ans.isInteger()) return null;
        return {
          prompt: `The mean of ${n} numbers is ${num(m)}. What is their sum?`,
          answer: ans,
          distractors: [m.mul(R(n - 1)), m.mul(R(n + 1)), ans.div(R(2)), ans.add(R(n))],
          explain: `Sum = mean × count = ${num(m)} × ${n} = ${num(ans)}`,
        };
      }
      if (d === 2) {
        const n = rng.int(3, 5);
        const m = rng.int(15, 60);
        const known = Array.from({ length: n - 1 }, () => rng.int(Math.max(1, m - 20), m + 20));
        const ks = known.reduce((a, b) => a + b, 0);
        const ans = n * m - ks;
        if (ans <= 0) return null;
        return {
          prompt: `The mean of ${n} numbers is ${m}. ${n - 1 === 2 ? 'Two' : n - 1 === 3 ? 'Three' : 'Four'} of them are ${known.join(', ')}. What is the last one?`,
          answer: R(ans),
          distractors: [R(m), R((n - 1) * m - ks + m + 1), R(ks - m * (n - 1) + m), R(ans + 1)],
          explain: `Total ${n} × ${m} = ${n * m}; minus ${ks} = ${ans}`,
        };
      }
      const all = rng.int(20, 60);
      const two = rng.int(Math.max(5, all - 15), all + 15);
      const ans = 3 * all - 2 * two;
      if (ans <= 0 || two === all) return null;
      return {
        prompt: `The mean of a, b and c is ${all}. The mean of a and b is ${two}. What is c?`,
        answer: R(ans),
        distractors: [R(all), R(3 * all - two), R(2 * all - two), R(ans + 2)],
        explain: `a + b + c = ${3 * all}; a + b = ${2 * two}; c = ${3 * all} − ${2 * two} = ${ans}`,
      };
    },
  }),
];
