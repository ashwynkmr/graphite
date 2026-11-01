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
      const n = by(d, 5, rng.int(4, 5), rng.int(5, 6));
      const xs = Array.from({ length: n }, () => R(rng.int(by(d, 12, 105, -30), by(d, 99, 395, 60))));
      if (d === 3 && !xs.some((x) => x.isNegative())) return null;
      const total = sum(xs);
      const mean = total.div(R(n));
      const rounding = mean.isTerminating() ? undefined : ('tenth' as const);
      if ((mean.decimalPlaces() ?? 0) > 2) return null;
      const sorted = [...xs].sort((a, b) => a.cmp(b));
      const median = n % 2 ? sorted[(n - 1) / 2]! : sorted[n / 2 - 1]!.add(sorted[n / 2]!).div(R(2));
      let explain = `Sum ${num(total)} ÷ ${n} = ${num(rounding ? mean.round(rounding) : mean)}${rounding ? ' (to the nearest tenth)' : ''}`;
      if (d === 1) {
        const base = mean.round('whole').div(R(10)).round('whole').mul(R(10));
        const devs = xs.map((x) => x.sub(base));
        const devSum = sum(devs);
        const devText = devs.map((v, i) => (i === 0 ? num(v) : v.isNegative() ? ` − ${num(v.neg())}` : ` + ${num(v)}`)).join('');
        explain = `From ${num(base)}: ${devText} = ${num(devSum)}; ${num(devSum)} ÷ ${n} = ${num(devSum.div(R(n)))}, so the mean is ${num(mean)}`;
      }
      const absSum = sum(xs.map((x) => (x.isNegative() ? x.neg() : x)));
      return {
        prompt: `Mean of ${xs.map((x) => num(x)).join(', ')} = ?${rounding ? ' (to the nearest tenth)' : ''}`,
        answer: mean,
        rounding,
        distractors: [total.div(R(n - 1)), total.div(R(n + 1)), median, absSum.div(R(n)), mean.add(R(1))],
        explain,
      };
    },
  }),

  t({
    id: 'av-missing',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, rng.int(4, 7), rng.int(3, 8), rng.int(3, 8));
      const [scene, sceneTwo, lo, hi] = rng.pick<[string, string, number, number]>([
        [
          '{name} averaged {m} on {n} tests. What score on the next test would make the average {t}?',
          '{name} averaged {m} on {n} tests. What average on the next 2 tests would make the overall average {t}?',
          60,
          92,
        ],
        [
          '{name} averaged {m} points over {n} bowling games. What score in the next game would make the average {t}?',
          '{name} averaged {m} points over {n} bowling games. What average over the next 2 games would make the overall average {t}?',
          110,
          220,
        ],
        [
          'A shop averaged {m} sales a day for {n} days. How many sales tomorrow would make the average {t}?',
          'A shop averaged {m} sales a day for {n} days. What daily average over the next 2 days would make the overall average {t}?',
          20,
          80,
        ],
        [
          '{name} read an average of {m} pages a day for {n} days. How many pages tomorrow would make the average {t}?',
          '{name} read an average of {m} pages a day for {n} days. What daily average over the next 2 days would make the overall average {t}?',
          15,
          60,
        ],
      ]);
      const m = rng.int(lo, hi);
      const gap = by(d, rng.int(2, 4), rng.int(-4, 5), rng.int(1, 5));
      if (gap === 0) return null;
      const target = m + gap;
      const two = d === 3;
      if (two && (n * gap) % 2) return null;
      const ans = target + (n * gap) / (two ? 2 : 1);
      if (ans <= 0 || (scene.includes('tests') && ans > 100)) return null;
      return {
        prompt: fill(two ? sceneTwo : scene, { name: rng.pick(NAMES), m: num(m), n: String(n), t: num(target) }),
        answer: R(ans),
        distractors: two
          ? [R(target + n * gap), R(target + gap), R(target), R(2 * target + (n - 1) * gap, 2).round('whole')]
          : [R(target), R(target + gap), R(target + (n - 1) * gap), R(m + n * gap)],
        explain: two
          ? `The ${n} earlier values are ${n} × ${gap} = ${n * gap} short of ${target} in total; spread over 2: ${target} + ${(n * gap) / 2} = ${ans}`
          : `Each of the ${n} earlier values is ${Math.abs(gap)} ${gap > 0 ? 'below' : 'above'} ${target}, so the next is ${target} ${gap > 0 ? '+' : '−'} ${n} × ${Math.abs(gap)} = ${ans}`,
      };
    },
  }),

  t({
    id: 'av-weighted',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [scene, reverseScene, lo, hi] = rng.pick<[string, string, number, number]>([
        [
          '{n1} students in one section averaged {a1} on a test, and {n2} students in another averaged {a2}. What was the overall average?',
          '{n1} students in one section averaged {a1} on a test. Together with {n2} students from another section, the overall average was {m}. What did the second section average?',
          55,
          95,
        ],
        [
          '{n1} boxes average {a1} kg and {n2} more boxes average {a2} kg. What is the average weight of all the boxes?',
          '{n1} boxes average {a1} kg. With {n2} more boxes, the average of all of them is {m} kg. What do the {n2} new boxes average?',
          5,
          40,
        ],
        [
          'A runner averaged {a1} minutes on {n1} runs and {a2} minutes on {n2} other runs. What was the overall average?',
          'A runner averaged {a1} minutes on {n1} runs. Over those and {n2} more runs, the average was {m} minutes. What was the average of the {n2} new runs?',
          20,
          60,
        ],
        [
          '{n1} players averaged {a1} points and {n2} others averaged {a2} points. What was the average for all players?',
          '{n1} players averaged {a1} points. With {n2} more players, the average for all is {m}. What do the {n2} new players average?',
          4,
          30,
        ],
      ]);
      let n1 = rng.int(2, by(d, 20, 30, 20));
      let n2 = rng.int(2, by(d, 20, 30, 20));
      if (n1 === n2) return null;
      // Overall = a2 + n1 × (a1 − a2) / (n1 + n2), so pick the gap to make that whole.
      const unit = (n1 + n2) / gcdNum(n1, n1 + n2);
      const maxK = Math.floor((hi - lo) / unit);
      if (maxK < 1) return null;
      const gap = unit * rng.int(1, maxK);
      let a2 = rng.int(lo, hi - gap);
      let a1 = a2 + gap;
      if (rng.chance(0.5)) [n1, n2, a1, a2] = [n2, n1, a2, a1];
      const overall = R(n1 * a1 + n2 * a2, n1 + n2);
      if (d === 3) {
        return {
          prompt: fill(reverseScene, { n1: String(n1), n2: String(n2), a1: String(a1), m: num(overall) }),
          answer: R(a2),
          distractors: [overall.mul(R(2)).sub(R(a1)), overall, overall.add(overall.sub(R(a1)).mul(R(n1, n2)).mul(R(2))).round('whole'), R(a2 + 1)],
          explain: `Total ${n1 + n2} × ${num(overall)} = ${num(overall.mul(R(n1 + n2)))}; minus ${n1} × ${a1} = ${n1 * a1} leaves ${n2 * a2}; ÷ ${n2} = ${a2}`,
        };
      }
      return {
        prompt: fill(scene, { n1: String(n1), n2: String(n2), a1: String(a1), a2: String(a2) }),
        answer: overall,
        distractors: [R(a1 + a2, 2), R(n2 * a1 + n1 * a2, n1 + n2), overall.add(R(1)), overall.sub(R(1))],
        explain: `Total ${n1} × ${a1} + ${n2} × ${a2} = ${n1 * a1 + n2 * a2}; ÷ ${n1 + n2} = ${num(overall)}`,
      };
    },
  }),

  t({
    id: 'av-consecutive',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3 && rng.chance(0.5)) {
        // Mean of a run of multiples: 7 × 6 … 7 × 25
        const k = rng.int(3, 12);
        const a = rng.int(1, 20);
        const b = a + rng.int(8, 30);
        const mean = R(k * (a + b), 2);
        return {
          prompt: `What is the mean of all the multiples of ${k} from ${k * a} to ${k * b}?`,
          answer: mean,
          distractors: [R(k * (b - a), 2), R(a + b, 2), mean.add(R(k)), mean.sub(R(k, 2))],
          explain: `Evenly spaced, so the mean is the middle: (${k * a} + ${k * b}) ÷ 2 = ${num(mean)}`,
        };
      }
      const n = by(d, rng.pick([3, 5, 7]), rng.pick([4, 6]), rng.pick([6, 8]));
      const kind = by(d, 'consecutive', 'consecutive even', 'consecutive odd');
      const step = d === 1 ? 1 : 2;
      const first = d === 1 ? rng.int(5, 80) : d === 2 ? rng.int(5, 40) * 2 : rng.int(3, 40) * 2 + 1;
      const xs = Array.from({ length: n }, (_, i) => first + i * step);
      const S = xs.reduce((a, b) => a + b, 0);
      const askLargest = rng.chance(0.5);
      const ans = askLargest ? xs[n - 1]! : xs[0]!;
      const mid = R(S, n);
      return {
        prompt: `The sum of ${n} ${kind} integers is ${S}. What is the ${askLargest ? 'largest' : 'smallest'}?`,
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
      const n = rng.int(by(d, 4, 4, 6), by(d, 9, 9, 10));
      const m = rng.int(10, 60);
      const total = n * m;
      if (d === 1) {
        const ans = m + rng.int(1, 5) * (rng.chance(0.5) ? 1 : -1);
        const x = total - ans * (n - 1);
        if (x <= 0) return null;
        return {
          prompt: `The mean of ${n} numbers is ${m}. If the number ${x} is removed, what is the mean of the rest?`,
          answer: R(ans),
          distractors: [R(ans * (n - 1), n), R(m), R(m).sub(R(x, n)).round('whole'), R(ans + 1)],
          explain: `Total ${n} × ${m} = ${total}; minus ${x} = ${total - x}; ÷ ${n - 1} = ${ans}`,
        };
      }
      if (d === 2) {
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
      }
      // Two removed, one known
      const m2 = m + rng.int(-6, 6);
      const x = rng.int(5, 2 * m);
      const y = total - (n - 2) * m2 - x;
      if (y <= 0 || m2 === m) return null;
      return {
        prompt: `The mean of ${n} numbers is ${m}. Two of them are removed and the mean of the rest is ${m2}. One removed number was ${x}. What was the other?`,
        answer: R(y),
        distractors: [R(total - (n - 1) * m2 - x), R(2 * m - x), R(total - (n - 2) * m2), R(y + m2)],
        explain: `Total ${n} × ${m} = ${total}; the rest total ${n - 2} × ${m2} = ${(n - 2) * m2}; the two removed sum to ${total - (n - 2) * m2}; minus ${x} = ${y}`,
      };
    },
  }),

  t({
    id: 'av-new-member',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [join, leave, joinTwo, lo, hi] = rng.pick<[string, string, string, number, number]>([
        [
          'The average age of {n} people in a group is {a}. A new person joins and the average becomes {b}. How old is the new person?',
          'The average age of {n} people in a group is {a}. One person leaves and the average becomes {b}. How old was that person?',
          'The average age of {n} people in a group is {a}. Two new people join and the average becomes {b}. What is the average age of the two newcomers?',
          20,
          50,
        ],
        [
          '{n} crates average {a} kg. One more crate is loaded and the average becomes {b} kg. How heavy is the new crate, in kg?',
          '{n} crates average {a} kg. One crate is unloaded and the average becomes {b} kg. How heavy was that crate, in kg?',
          '{n} crates average {a} kg. Two more crates are loaded and the average becomes {b} kg. What do the two new crates average, in kg?',
          20,
          60,
        ],
        [
          'A team of {n} players averages {a} points. A new player joins and the average becomes {b}. How many points does the new player have?',
          'A team of {n} players averages {a} points. One player leaves and the average becomes {b}. How many points did that player have?',
          'A team of {n} players averages {a} points. Two new players join and the average becomes {b}. What do the two new players average?',
          10,
          40,
        ],
      ]);
      const n = rng.int(by(d, 4, 5, 5), by(d, 9, 10, 10));
      const a = rng.int(lo, hi);
      const shift = rng.pick(by(d, [2, 3, -1, -2], [1, 2, -1, -2], [1, 2, 3, -1, -2]));
      const b = a + shift;
      if (d === 3) {
        const twoTotal = (n + 2) * b - n * a;
        if (twoTotal % 2 || twoTotal <= 0) return null;
        const ans = twoTotal / 2;
        return {
          prompt: fill(joinTwo, { n: String(n), a: String(a), b: String(b) }),
          answer: R(ans),
          distractors: [R(twoTotal), R(b + n * shift), R(b), R(ans + shift)],
          explain: `After: ${n + 2} × ${b} = ${(n + 2) * b}; before: ${n} × ${a} = ${n * a}; the two add ${twoTotal}, so ${ans} each on average`,
        };
      }
      const isLeave = d === 2;
      const ans = isLeave ? n * a - (n - 1) * b : (n + 1) * b - n * a;
      if (ans <= 0) return null;
      return {
        prompt: fill(isLeave ? leave : join, { n: String(n), a: String(a), b: String(b) }),
        answer: R(ans),
        distractors: isLeave ? [R(a - shift), R(a - n * shift - shift), R(a), R(ans + n)] : [R(b + shift), R(b), R(b + (n - 1) * shift), R(ans + 1)],
        explain: isLeave
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
        const n = rng.int(3, 5);
        const m = rng.int(15, 60);
        const known = Array.from({ length: n - 1 }, () => rng.int(Math.max(1, m - 20), m + 20));
        const ks = known.reduce((a, b) => a + b, 0);
        const ans = n * m - ks;
        if (ans <= 0) return null;
        return {
          prompt: `The mean of ${n} numbers is ${m}. ${['', '', 'Two', 'Three', 'Four'][n - 1]} of them are ${known.join(', ')}. What is the last one?`,
          answer: R(ans),
          distractors: [R(m), R((n - 1) * m - ks + m + 1), R(ks - m * (n - 1) + m), R(ans + 1)],
          explain: `Total ${n} × ${m} = ${n * m}; minus ${ks} = ${ans}`,
        };
      }
      if (d === 2) {
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
      }
      // Overlapping means: the middle number is counted twice.
      const all = rng.int(20, 50);
      const first = all + rng.int(-8, 8);
      const last = all + rng.int(-8, 8);
      const ans = 3 * first + 3 * last - 5 * all;
      if (ans <= 0 || first === last) return null;
      return {
        prompt: `The mean of five numbers is ${all}. The mean of the first three is ${first} and the mean of the last three is ${last}. What is the middle number?`,
        answer: R(ans),
        distractors: [R(first + last, 2).round('whole'), R(all), R(3 * first + 3 * last - 6 * all), R(ans + 5)],
        explain: `First three + last three = ${3 * first} + ${3 * last} = ${3 * first + 3 * last}, which counts the middle twice; minus the total ${5 * all} = ${ans}`,
      };
    },
  }),
];
