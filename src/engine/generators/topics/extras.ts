// Templates added to the first nine topics in Phase 3. Each is marked `extra`, so it takes its own
// share of the bank and the questions already on people's phones keep their ids (0051).
import { R, Rational } from '../../matching/rational';
import { frac, money, num, pct } from '../format';
import type { Draft, Template, Topic } from '../types';
import { by, evenOptions, gcdNum, lcmNum, NAMES, sup } from '../util';

const t = (topic: Topic, x: Omit<Template, 'topic' | 'kind' | 'extra'> & { kind?: Template['kind'] }): Template => ({
  topic,
  kind: 'calc',
  extra: true,
  ...x,
});

type Rng = Parameters<Template['generate']>[0];

const half = (x: number) => R(x).div(R(2));

/** Keeps only wrong options a fraction of a whole could be. */
function properFractions(answer: Rational, xs: Rational[]): Rational[] {
  return xs.filter((x) => x.cmp(R(0)) > 0 && x.cmp(R(1)) < 0 && !x.equals(answer));
}

function estimate(rng: Rng, prompt: string, value: Rational, explain: string): Draft | null {
  const opts = evenOptions(rng, value);
  if (!opts) return null;
  return {
    prompt,
    answer: opts.answer,
    distractors: opts.distractors,
    exactChoices: true,
    mcqOnly: true,
    explain: `${explain}, and the closest option is ${num(opts.answer)}`,
  };
}

/** Redraws until the numbers come out clean, for templates where few draws do. */
function retry(generate: Template['generate']): Template['generate'] {
  return (rng, d) => {
    for (let tries = 0; tries < 60; tries++) {
      const draft = generate(rng, d);
      if (draft) return draft;
    }
    return null;
  };
}

const near = (rng: Rng, round: number, off: number) => round + (rng.chance(0.5) ? 1 : -1) * rng.int(1, off);

export const extras: Template[] = [
  t('arithmetic', {
    id: 'ar-sum-run',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const step = by(d, 1, 1, rng.pick([2, 3, 5]));
      const n = by(d, rng.int(5, 15), rng.int(11, 31), rng.int(10, 30));
      const first = step * by(d, rng.int(1, 20), rng.int(20, 60), rng.int(1, 12));
      const last = first + step * (n - 1);
      const avg = half(first + last);
      const ans = avg.mul(R(n));
      const what = step === 1 ? 'integers' : `multiples of ${step}`;
      return {
        prompt: `Sum of the ${what} from ${first} to ${last} = ?`,
        answer: ans,
        distractors: [avg.mul(R(n - 1)), avg.mul(R(n + 1)), R(first + last).mul(R(n)), ans.add(R(first))],
        explain: `Evenly spaced numbers average the two ends: ${num(avg)}. There are ${n} of them: ${n} × ${num(avg)} = ${num(ans)}`,
      };
    },
  }),

  t('arithmetic', {
    id: 'ar-factor-out',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const x = rng.int(51, 89);
        const y = 100 - x;
        const gap = x - y;
        const ans = gap * 100;
        return {
          prompt: `${x}² − ${y}² = ?`,
          answer: R(ans),
          distractors: [gap * gap, gap * 50, gap * 200, ans + 100].map((v) => R(v)),
          explain: `x² − y² = (x − y)(x + y): ${gap} × 100 = ${num(ans)}`,
        };
      }
      const a = rng.int(12, 98);
      if (d === 1) {
        const b = rng.int(11, 89);
        const c = 100 - b;
        return {
          prompt: `${a} × ${b} + ${a} × ${c} = ?`,
          answer: R(a * 100),
          distractors: [a * 10, a * 110, a * 90, b * c].map((v) => R(v)),
          explain: `Take out the ${a}: ${a} × (${b} + ${c}) = ${a} × 100 = ${num(a * 100)}`,
        };
      }
      const c = rng.int(11, 89);
      const gap = rng.pick([10, 20, 50]);
      const b = c + gap;
      return {
        prompt: `${a} × ${b} − ${a} × ${c} = ?`,
        answer: R(a * gap),
        distractors: [a * (b + c), a + gap, a * (gap + 10), a * (gap - 5)].map((v) => R(v)),
        explain: `Take out the ${a}: ${a} × (${b} − ${c}) = ${a} × ${gap} = ${num(a * gap)}`,
      };
    },
  }),

  t('fractions', {
    id: 'fr-left-over',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const name = rng.pick(NAMES);
      const x = R(1, rng.pick([3, 4, 5, 6]));
      const y = R(rng.int(1, 2), rng.pick([3, 4, 5, 7]));
      if (d === 3) {
        const left = R(1).sub(x).mul(R(1).sub(y));
        const end = rng.int(3, 15) * 10;
        const start = R(end).div(left);
        if (!start.isInteger()) return null;
        return {
          prompt: `${name} spends ${frac(x)} of a sum of money, then ${frac(y)} of what remains, and has ${money(end)} left. What was the sum?`,
          answer: start,
          unit: { prefix: '$' },
          distractors: [R(end).mul(R(3)), R(end).mul(R(2)), R(end).div(R(1).sub(y)), start.add(R(end))],
          explain: `What's left is ${frac(R(1).sub(x))} × ${frac(R(1).sub(y))} = ${frac(left)} of the sum. ${money(end)} ÷ ${frac(left)} = ${money(start)}`,
        };
      }
      const ans = d === 1 ? R(1).sub(x).sub(y) : R(1).sub(x).mul(R(1).sub(y));
      if (ans.cmp(R(0)) <= 0) return null;
      const other = d === 1 ? R(1).sub(x).mul(R(1).sub(y)) : R(1).sub(x).sub(y);
      const wrong = properFractions(ans, [other, x.add(y), x.mul(y), R(1).sub(x), R(1).sub(y), R(1).sub(x.mul(y)), ans.add(R(1, 12)), ans.add(R(1, 20))]);
      return {
        prompt: d === 1 ? `A tank loses ${frac(x)} of its full volume, then another ${frac(y)} of its full volume. What fraction of the full tank is left?` : `A tank loses ${frac(x)} of its water, then ${frac(y)} of the water that remains. What fraction of the water is left?`,
        answer: ans,
        format: 'fraction',
        exactChoices: true,
        distractors: wrong,
        explain: d === 1 ? `Both are fractions of the same whole: 1 − ${frac(x)} − ${frac(y)} = ${frac(ans)}` : `Multiply what stays each time: ${frac(R(1).sub(x))} × ${frac(R(1).sub(y))} = ${frac(ans)}`,
      };
    },
  }),

  t('fractions', {
    id: 'fr-nested',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        if (a === b) return null;
        const k = lcmNum(a, b) * rng.int(1, 4);
        const ans = k / a + k / b;
        return {
          prompt: `(1/${a} + 1/${b}) × ${k} = ?`,
          answer: R(ans),
          distractors: [k / a, k / b, k, ans + 1, a + b].map((v) => R(v)),
          explain: `Give each part the ${k}: ${k} ÷ ${a} + ${k} ÷ ${b} = ${k / a} + ${k / b} = ${ans}`,
        };
      }
      if (d === 2) {
        const p = R(rng.int(1, 4), rng.pick([3, 4, 5, 6]));
        const q = R(rng.int(1, 3), rng.pick([2, 3, 4, 8]));
        const r = R(rng.int(1, 5), rng.pick([6, 8, 9, 12]));
        const sum = p.add(q);
        const ans = sum.div(r);
        if (ans.d > 60n || ans.n > 99n || ans.isInteger()) return null;
        return {
          prompt: `(${frac(p)} + ${frac(q)}) ÷ ${frac(r)} = ?`,
          answer: ans,
          format: 'fraction',
          distractors: [sum.mul(r), p.add(q.div(r)), p.div(r).add(q), sum.div(r.add(R(1)))],
          explain: `Add first: ${frac(sum)}. Then flip and multiply: ${frac(sum)} × ${r.d}/${r.n} = ${frac(ans)}`,
        };
      }
      const a = rng.int(2, 12);
      const b = rng.int(2, 12);
      if (a === b) return null;
      const ans = R(2).div(R(1, a).add(R(1, b)));
      return {
        prompt: `2 ÷ (1/${a} + 1/${b}) = ?`,
        answer: ans,
        format: 'fraction',
        distractors: [R(a + b).div(R(2)), R(2).div(R(a + b)), R(a + b).div(R(a * b)), R(1).div(R(1, a).add(R(1, b)))],
        explain: `1/${a} + 1/${b} = ${a + b}/${a * b}. Then 2 × ${a * b}/${a + b} = ${frac(ans)}`,
      };
    },
  }),

  t('percents', {
    id: 'pct-equal',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(3, 95);
        const b = rng.pick([20, 25, 40, 50, 60, 75, 80]);
        return {
          prompt: `${a}% of ${b} = ${b}% of ?`,
          answer: R(a),
          distractors: [b, a + b, a * 2, a + 10].map((v) => R(v)),
          explain: `The two numbers can swap: ${a}% of ${b} is always ${b}% of ${a}, so ? = ${a}`,
        };
      }
      const c = rng.pick([5, 10, 15, 20, 25, 30, 40, 50]);
      const a = rng.int(2, 18) * 5;
      if (d === 2) {
        const b = rng.int(2, 30) * 20;
        const ans = R(a * b).div(R(c));
        if (!ans.isInteger() || a === c) return null;
        return {
          prompt: `${a}% of ${num(b)} = ${c}% of ?`,
          answer: ans,
          distractors: [R(b), R(c * b).div(R(a)), R(a * b).div(R(100)), ans.mul(R(2))],
          explain: `${a}% of ${num(b)} = ${num(R(a * b).div(R(100)))}. Divide by ${c}%: ${num(R(a * b).div(R(100)))} ÷ ${num(R(c).div(R(100)))} = ${num(ans)}`,
        };
      }
      const value = rng.int(2, 30) * 6;
      const ans = R(value * c).div(R(a));
      if (a === c || !ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1) return null;
      return {
        prompt: `${a}% of a number is ${value}. What is ${c}% of the same number?`,
        answer: ans,
        distractors: [R(value).mul(R(a)).div(R(c)), R(value).sub(R(a - c)), R(value).add(R(c)), ans.mul(R(2))],
        explain: `Scale the percent: ${c}% is ${c}/${a} of ${a}%, so ${value} × ${c}/${a} = ${num(ans)}`,
      };
    },
  }),

  t('percents', {
    id: 'pct-relative',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const p = rng.pick([2, 4, 5, 8, 10, 16, 20, 25, 40, 50, 80, 125, 160, 200]);
        const ans = R(10000).div(R(p));
        return {
          prompt: `A is ${p}% of B. B is what percent of A?`,
          answer: ans,
          unit: { suffix: '%' },
          distractors: [R(100 - p > 0 ? 100 - p : p - 50), R(100 + p), ans.mul(R(2)), R(p)],
          explain: `Flip the ratio: A/B = ${frac(R(p).div(R(100)))}, so B/A = ${frac(R(100).div(R(p)))}, which is ${pct(ans)}`,
        };
      }
      if (d === 2) {
        const p = rng.pick([25, 60, 100, 150, 300, 400, 900, 700, 1150, 1500]);
        const ans = R(10000).div(R(100 + p));
        return {
          prompt: `A is ${num(p)}% more than B. B is what percent of A?`,
          answer: ans,
          unit: { suffix: '%' },
          distractors: [R(100 + p), ans.add(R(10)), R(100).sub(ans).add(R(5)), ans.mul(R(2))],
          explain: `A = ${num(R(100 + p).div(R(100)))} × B, so B = A ÷ ${num(R(100 + p).div(R(100)))} = ${pct(ans)} of A`,
        };
      }
      const p = rng.pick([10, 20, 25, 50]);
      const q = rng.pick([10, 20, 30, 40, 50, 60]);
      const ans = R(100 + p).mul(R(100 + q)).div(R(100)).sub(R(100));
      return {
        prompt: `A is ${p}% more than B, and B is ${q}% more than C. A is what percent more than C?`,
        answer: ans,
        unit: { suffix: '%' },
        distractors: [R(p + q), ans.add(R(5)), R(p).mul(R(q)).div(R(100)), ans.sub(R(5))],
        explain: `Multiply, don't add: ${num(R(100 + p).div(R(100)))} × ${num(R(100 + q).div(R(100)))} = ${num(ans.add(R(100)).div(R(100)))}, so ${pct(ans)} more`,
      };
    },
  }),

  t('ratios', {
    id: 'ra-after-change',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate: retry((rng, d) => {
      const p0 = rng.int(2, 5);
      const q0 = rng.int(p0 + 1, 8);
      if (gcdNum(p0, q0) !== 1) return null;
      const m = rng.int(2, 12);
      const k = m * rng.int(1, 3);
      const a = p0 * m;
      const b = q0 * m;
      if (d === 1) {
        const later = rng.int(2, 12);
        return {
          prompt: `The ages of two sisters are in the ratio ${p0} : ${q0}. The younger is ${a}. How old will the older be in ${later} years?`,
          answer: R(b + later),
          distractors: [b, a + later, b + 2 * later, b + later + m].map((v) => R(v)),
          explain: `One part is ${a} ÷ ${p0} = ${m}, so the older is ${q0} × ${m} = ${b} now, and ${b + later} then`,
        };
      }
      if (d === 2) {
        const g = gcdNum(a + k, b);
        const [p, q] = [(a + k) / g, b / g];
        if (q > 12 || p === p0) return null;
        return {
          prompt: `Oak and pine trees are in the ratio ${p0} : ${q0}. After ${k} more oaks are planted, the ratio is ${p} : ${q}. How many pines are there?`,
          answer: R(b),
          distractors: [a, a + k, b + k, q * k].map((v) => R(v)),
          explain: `Pines stay at ${q0}x, so oaks are ${q0}x × ${p}/${q} = ${p0}x + ${k}. That gives x = ${m}, and ${q0} × ${m} = ${b}`,
        };
      }
      const g = gcdNum(a + k, b + k);
      const [p, q] = [(a + k) / g, (b + k) / g];
      if (q > 15) return null;
      return {
        prompt: `Two numbers are in the ratio ${p0} : ${q0}. If ${k} is added to each, the ratio becomes ${p} : ${q}. What is the larger number?`,
        answer: R(b),
        distractors: [a, b + k, a + k, b - k].map((v) => R(v)),
        explain: `${q}(${p0}x + ${k}) = ${p}(${q0}x + ${k}) gives x = ${m}, so the larger is ${q0} × ${m} = ${b}`,
      };
    }),
  }),

  t('ratios', {
    id: 'ra-mixture',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const v = rng.int(1, 8) * 10;
        const p = rng.pick([10, 20, 30, 40, 50, 60]);
        const water = rng.int(1, 8) * 10;
        const ans = R(v * p).div(R(v + water));
        if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1) return null;
        return {
          prompt: `${v} litres of juice is ${p}% fruit. ${water} litres of water is added. What percent fruit is it now?`,
          answer: ans,
          unit: { suffix: '%' },
          distractors: [R(p).sub(ans).add(R(5)), R(p), R(v * p).div(R(water)), ans.add(R(10))],
          explain: `The fruit stays at ${num(R(v * p).div(R(100)))} litres, now in ${v + water}: ${num(R(v * p).div(R(100)))} ÷ ${v + water} = ${pct(ans)}`,
        };
      }
      if (d === 2) {
        const a = rng.int(1, 6) * 10;
        const b = rng.int(1, 6) * 10;
        const p = rng.int(1, 6) * 5;
        const q = rng.int(7, 16) * 5;
        const ans = R(a * p + b * q).div(R(a + b));
        if (a === b || !ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1) return null;
        return {
          prompt: `${a} litres at ${p}% salt is mixed with ${b} litres at ${q}% salt. What percent salt is the mixture?`,
          answer: ans,
          unit: { suffix: '%' },
          distractors: [half(p + q), R(p + q), ans.add(R(5)), ans.sub(R(2))],
          explain: `Weight by the litres: (${a} × ${p} + ${b} × ${q}) ÷ ${a + b} = ${pct(ans)}`,
        };
      }
      const v = rng.int(2, 12) * 5;
      const [p, q] = rng.pick<[number, number]>([[40, 25], [30, 20], [50, 40], [60, 40], [45, 30], [25, 20], [80, 50], [75, 60]]);
      const add = R(v * (p - q)).div(R(q));
      if (!add.isInteger()) return null;
      return {
        prompt: `A ${v}-litre solution is ${p}% acid. How many litres of water must be added to bring it down to ${q}%?`,
        answer: add,
        unit: { suffix: 'litres' },
        distractors: [R(v * (p - q)).div(R(100)), R(v * p).div(R(q)), add.add(R(5)), R(v * q).div(R(p))],
        explain: `Acid stays at ${num(R(v * p).div(R(100)))} litres, which must be ${q}% of the new total: ${num(R(v * p).div(R(q)))} litres. Add ${num(add)}`,
      };
    },
  }),

  t('averages', {
    id: 'av-transform',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = rng.int(4, 12);
      const m = rng.int(8, 60);
      if (d === 1) {
        const k = rng.int(2, 15);
        return {
          prompt: `The mean of ${n} numbers is ${m}. If ${k} is added to each, what is the new mean?`,
          answer: R(m + k),
          distractors: [m, m + k * n, m * k, m + k + 1].map((v) => R(v)),
          explain: `Adding ${k} to every number adds ${k} to the mean: ${m} + ${k} = ${m + k}`,
        };
      }
      if (d === 2) {
        const a = rng.int(2, 6);
        const b = rng.int(2, 20);
        const ans = a * m + b;
        return {
          prompt: `The mean of ${n} numbers is ${m}. Each is multiplied by ${a}, then increased by ${b}. What is the new mean?`,
          answer: R(ans),
          distractors: [a * m, m + b, a * (m + b), ans + a].map((v) => R(v)),
          explain: `The mean takes the same steps: ${a} × ${m} + ${b} = ${ans}`,
        };
      }
      const some = rng.int(2, n - 1);
      const c = rng.int(1, 8) * 3;
      const ans = R(m).add(R(some * c).div(R(n)));
      if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 2) return null;
      return {
        prompt: `The mean of ${n} numbers is ${m}. If ${some} of them each rise by ${c}, what is the new mean?`,
        answer: ans,
        distractors: [R(m + c), R(m + some), ans.add(R(1)), ans.sub(R(1))],
        explain: `The total rises by ${some} × ${c} = ${some * c}, shared by ${n}: ${m} + ${num(R(some * c).div(R(n)))} = ${num(ans)}`,
      };
    },
  }),

  t('averages', {
    id: 'av-evenly',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const s = by(d, rng.pick([1, 2]), rng.pick([3, 4, 5, 6, 7]), rng.pick([2, 3, 4, 5, 8]));
      const n = rng.int(by(d, 7, 9, 7), by(d, 15, 25, 21));
      const first = s * rng.int(1, 20);
      const last = first + s * (n - 1);
      const mean = half(first + last);
      if (d === 3) {
        return {
          prompt: `A list of ${n} evenly spaced numbers has a mean of ${num(mean)} and a gap of ${s} between neighbours. What is the largest?`,
          answer: R(last),
          distractors: [mean.add(R(s * n)), mean.add(R(s)), mean.mul(R(2)), R(last + s)],
          explain: `The largest is ${n - 1} ÷ 2 gaps above the mean: ${num(mean)} + ${num(half(n - 1))} × ${s} = ${num(last)}`,
        };
      }
      const what = s === 1 ? 'integers' : s === 2 ? `${first % 2 ? 'odd' : 'even'} numbers` : `multiples of ${s}`;
      if (s === 2 && first % 2) return null;
      return {
        prompt: `Mean of the ${what} from ${first} to ${last} = ?`,
        answer: mean,
        distractors: [R(first + last), R(last).sub(mean).add(R(s)), mean.add(R(s)), mean.sub(R(s))],
        explain: `Evenly spaced, so the mean is halfway between the ends: (${first} + ${last}) ÷ 2 = ${num(mean)}`,
      };
    },
  }),

  t('rates', {
    id: 'rt-pipes',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate: retry((rng, d) => {
      const hours = { suffix: 'hours' };
      if (d === 1) {
        const a = rng.int(2, 12);
        const b = rng.int(a + 1, 30);
        const ans = R(a * b).div(R(b - a));
        if (!ans.isInteger()) return null;
        return {
          prompt: `A pipe fills a tank in ${a} hours, and a drain empties it in ${b} hours. With both open, how many hours does filling take?`,
          answer: ans,
          unit: hours,
          distractors: [R(a * b).div(R(a + b)), R(b - a), half(a + b), ans.add(R(2))],
          explain: `Each hour: 1/${a} − 1/${b} = ${frac(R(b - a).div(R(a * b)))} of the tank. Flip it: ${num(ans)} hours`,
        };
      }
      const a = rng.int(2, 15);
      const b = rng.int(2, 20);
      const c = rng.int(3, 30);
      if (d === 2) {
        const rate = R(1, a).add(R(1, b)).sub(R(1, c));
        if (a === b || b === c || a === c || rate.cmp(R(0)) <= 0) return null;
        const ans = R(1).div(rate);
        if (!ans.isInteger()) return null;
        return {
          prompt: `Two pipes fill a tank in ${a} and ${b} hours, and a drain empties it in ${c} hours. With all three open, how many hours does filling take?`,
          answer: ans,
          unit: hours,
          distractors: [R(1).div(R(1, a).add(R(1, b))).round('whole'), R(a + b - c > 0 ? a + b - c : a + b), ans.add(R(1)), ans.mul(R(2))],
          explain: `Each hour: 1/${a} + 1/${b} − 1/${c} = ${frac(rate)} of the tank. Flip it: ${num(ans)} hours`,
        };
      }
      if (a >= c) return null;
      const drain = R(1).div(R(1, a).sub(R(1, c)));
      if (!drain.isInteger()) return null;
      return {
        prompt: `A pipe fills a tank in ${a} hours. With a drain open too, filling takes ${c} hours. How many hours would the drain take to empty a full tank?`,
        answer: drain,
        unit: hours,
        distractors: [R(c - a), R(a * c), half(a + c), drain.add(R(2))],
        explain: `The drain's rate is the gap: 1/${a} − 1/${c} = ${frac(R(1).div(drain))} of the tank an hour, so ${num(drain)} hours`,
      };
    }),
  }),

  t('rates', {
    id: 'rt-partial',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = rng.pick([6, 8, 9, 10, 12, 15, 18, 20, 24]);
      const b = rng.pick([6, 8, 10, 12, 15, 16, 18, 20, 30]);
      const h = rng.int(1, 5);
      if (d === 1) {
        if (h >= a) return null;
        const ans = R(1).sub(R(h, a));
        const wrong = properFractions(ans, [R(h, a), R(1, h + 1), ans.add(R(1, a)), R(a - h - 1, a), R(a - h + 1, a + 1), R(h, a + h)]);
        return {
          prompt: `A painter can finish a wall in ${a} hours. What fraction of the wall is left after ${h} hours?`,
          answer: ans,
          format: 'fraction',
          exactChoices: true,
          distractors: wrong,
          explain: `Each hour does 1/${a}, so ${h}/${a} is done and ${frac(ans)} is left`,
        };
      }
      if (d === 2) {
        const ans = R(b).mul(R(1).sub(R(h, a)));
        if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1 || a === b) return null;
        return {
          prompt: `Ann can finish a job in ${a} hours and Raj in ${b}. Ann works ${h} hours, then Raj finishes it. How many hours does Raj work?`,
          answer: ans,
          unit: { suffix: 'hours' },
          distractors: [R(b - h), R(a - h), ans.add(R(1)), R(b)],
          explain: `Ann leaves 1 − ${h}/${a} = ${frac(R(1).sub(R(h, a)))} of the job. Raj takes ${b} × ${frac(R(1).sub(R(h, a)))} = ${num(ans)} hours`,
        };
      }
      if (a === b) return null;
      const left = R(1).sub(R(h, a)).sub(R(h, b));
      if (left.cmp(R(0)) <= 0) return null;
      const ans = R(a).mul(left);
      if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1) return null;
      return {
        prompt: `Ann can finish a job in ${a} hours and Raj in ${b}. They work together for ${h} hours, then Ann finishes alone. How many more hours does Ann work?`,
        answer: ans,
        unit: { suffix: 'hours' },
        distractors: [R(a - h), R(b).mul(left), ans.add(R(1)), R(a - 2 * h > 0 ? a - 2 * h : a)],
        explain: `Together they do ${h}/${a} + ${h}/${b}, leaving ${frac(left)}. Ann takes ${a} × ${frac(left)} = ${num(ans)} hours`,
      };
    },
  }),

  t('money', {
    id: 'mo-break-even',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const margin = R(rng.pick(['2', '2.5', '4', '5', '8', '10', '12.5', '15', '20', '25']));
      const units = rng.int(4, 40) * 10;
      const fixed = margin.mul(R(units));
      if (d === 1) {
        const cost = rng.int(2, 20);
        const price = R(cost).add(margin);
        return {
          prompt: `A stall pays ${money(fixed)} in rent. Each mug costs ${money(cost)} to make and sells for ${money(price)}. How many mugs must it sell to break even?`,
          answer: R(units),
          distractors: [fixed.div(price), fixed.div(R(cost)), R(units + 10), R(units - 10)],
          explain: `Each mug clears ${money(price)} − ${money(cost)} = ${money(margin)}. ${money(fixed)} ÷ ${money(margin)} = ${num(units)}`,
        };
      }
      if (d === 2) {
        const extra = margin.mul(R(rng.int(2, 20) * 10));
        const ans = fixed.add(extra).div(margin);
        return {
          prompt: `A stall has ${money(fixed)} in fixed costs and clears ${money(margin)} on each mug. How many mugs must it sell to make a ${money(extra)} profit?`,
          answer: ans,
          distractors: [R(units), extra.div(margin), ans.add(R(10)), ans.mul(R(2))],
          explain: `It must clear ${money(fixed)} + ${money(extra)} = ${money(fixed.add(extra))}. Divide by ${money(margin)}: ${num(ans)}`,
        };
      }
      const cost = rng.pick([8, 12, 16, 20, 24, 32, 40, 48]);
      const up = rng.pick([25, 50, 75]);
      const each = R(cost * up).div(R(100));
      const need = rng.int(5, 40) * 10;
      const rent = each.mul(R(need));
      return {
        prompt: `A shop marks up a ${money(cost)} item by ${up}%, and has ${money(rent)} in fixed costs. How many items must it sell to break even?`,
        answer: R(need),
        distractors: [rent.div(R(cost)), rent.div(R(cost).add(each)), R(need + 10), R(need - 10)],
        explain: `The markup clears ${up}% of ${money(cost)} = ${money(each)} an item. ${money(rent)} ÷ ${money(each)} = ${num(need)}`,
      };
    },
  }),

  t('money', {
    id: 'mo-exchange',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const rate = R(rng.pick([0.8, 0.85, 0.9, 0.75, 1.2, 1.25, 1.5, 0.6].map((x) => String(x))));
      const dollars = rng.int(2, 40) * 20;
      const euros = R(dollars).mul(rate);
      if (d === 1) {
        return {
          prompt: `$1 buys ${num(rate)} euros. How many euros does ${money(dollars)} buy?`,
          answer: euros,
          distractors: [R(dollars).div(rate), euros.add(R(20)), euros.sub(R(20)), R(dollars)],
          explain: `Multiply by the rate: ${num(dollars)} × ${num(rate)} = ${num(euros)}`,
        };
      }
      if (d === 2) {
        return {
          prompt: `$1 buys ${num(rate)} euros. How many dollars does ${num(euros)} euros buy?`,
          answer: R(dollars),
          unit: { prefix: '$' },
          distractors: [euros.mul(rate), euros, R(dollars + 20), R(dollars - 20)],
          explain: `Going back, divide by the rate: ${num(euros)} ÷ ${num(rate)} = ${num(dollars)}`,
        };
      }
      const fee = rng.pick([2, 4, 5, 10]);
      const ans = R(dollars).mul(rate).mul(R(100 - fee)).div(R(100));
      if ((ans.decimalPlaces() ?? 9) > 2) return null;
      return {
        prompt: `$1 buys ${num(rate)} euros, and the booth keeps ${fee}% of the euros as its fee. How many euros do you get for ${money(dollars)}?`,
        answer: ans,
        distractors: [euros, R(dollars).mul(R(100 - fee)).div(R(100)), R(dollars).div(rate).mul(R(100 - fee)).div(R(100)), ans.add(R(fee))],
        explain: `${num(dollars)} × ${num(rate)} = ${num(euros)} euros. Keep ${100 - fee}% of that: ${num(ans)}`,
      };
    },
  }),

  t('exponents', {
    id: 'ex-add-powers',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const b = rng.pick(by(d, [2, 3, 4, 5], [2, 3, 5], [2, 3, 4, 5, 6]));
      const a = rng.int(3, 30);
      if (d === 1) {
        const terms = Array.from({ length: b }, () => `${b}${sup(a)}`).join(' + ');
        return {
          prompt: `${terms} = ${b}ⁿ. n = ?`,
          answer: R(a + 1),
          distractors: [a, a * b, a + b, a + 2].map((v) => R(v)),
          explain: `${b} copies of ${b}${sup(a)} is ${b} × ${b}${sup(a)} = ${b}${sup(a + 1)}`,
        };
      }
      if (d === 2) {
        if (b === 2) {
          return {
            prompt: `2${sup(a + 1)} − 2${sup(a)} = 2ⁿ. n = ?`,
            answer: R(a),
            distractors: [a + 1, 1, a - 1, 2 * a + 1].map((v) => R(v)),
            explain: `Take out 2${sup(a)}: 2${sup(a)} × (2 − 1) = 2${sup(a)}`,
          };
        }
        const big = b === 3 ? 2 : 4;
        return {
          prompt: `${b}${sup(a + 1)} − ${b}${sup(a)} = ${big} × ${b}ⁿ. n = ?`,
          answer: R(a),
          distractors: [a + 1, a - 1, 1, 2 * a].map((v) => R(v)),
          explain: `Take out ${b}${sup(a)}: ${b}${sup(a)} × (${b} − 1) = ${big} × ${b}${sup(a)}`,
        };
      }
      const k = rng.int(1, 2);
      const low = a;
      const value = b ** (k + 1) + b ** k;
      return {
        prompt: `(${b}${sup(low + 1)} + ${b}${sup(low)}) ÷ ${b}${sup(low - k)} = ?`,
        answer: R(value),
        distractors: [b ** (k + 1), b ** (k + 2), b ** k * 2, value + b].map((v) => R(v)),
        explain: `Take out ${b}${sup(low)} on top: ${b}${sup(low)} × ${b + 1}. Divided by ${b}${sup(low - k)}: ${b}${sup(k)} × ${b + 1} = ${value}`,
      };
    },
  }),

  t('exponents', {
    id: 'ex-roots',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const k = rng.pick([2, 3, 5, 6, 7, 10]);
      const m = rng.int(1, 6);
      const n = rng.int(2, 9);
      if (m === n) return null;
      const x = k * m * m;
      const y = k * n * n;
      if (d === 1) {
        const ans = k * m * n;
        return {
          prompt: `√${x} × √${y} = ?`,
          answer: R(ans),
          distractors: [x + y, ans * 2, m * n, ans + k].map((v) => R(v)),
          explain: `Roots multiply together: √(${x} × ${y}) = √${num(x * y)} = ${ans}`,
        };
      }
      if (d === 2) {
        const whole = rng.int(2, 12);
        const big = k * whole * whole;
        return {
          prompt: `√${num(big)} ÷ √${k} = ?`,
          answer: R(whole),
          distractors: [whole * k, big / k, whole + 1, whole - 1].map((v) => R(v)),
          explain: `Roots divide together: √(${num(big)} ÷ ${k}) = √${num(big / k)} = ${whole}`,
        };
      }
      const ans = k * (m + n) * (m + n);
      return {
        prompt: `(√${x} + √${y})² = ?`,
        answer: R(ans),
        distractors: [x + y, ans + x, ans - y, k * (m * m + n * n + m * n)].map((v) => R(v)),
        explain: `${m === 1 ? '' : `√${x} = ${m}√${k} and `}√${y} = ${n}√${k}, so together ${m + n}√${k}. Squared: ${(m + n) * (m + n)} × ${k} = ${ans}`,
      };
    },
  }),

  t('estimation', {
    id: 'es-growth',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const from = near(rng, rng.int(2, 9) * by(d, 100, 1000, 1000), by(d, 4, 30, 30));
      const up = rng.pick(by(d, [10, 20, 25, 50, 100], [15, 25, 40, 60, 75], [12, 35, 45, 80, 120]));
      const to = Math.round((from * (100 + up)) / 100) + rng.int(-3, 3);
      const value = R(to - from).mul(R(100)).div(R(from));
      return estimate(rng, `A count grows from ${num(from)} to ${num(to)}. The percent increase is closest to`, value, `The rise is ${num(to - from)}, compared with a start of about ${num(Math.round(from / 100) * 100)}: about ${num(value.round('whole'))}%`);
    },
  }),

  t('estimation', {
    id: 'es-word',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const seats = near(rng, rng.pick([20, 30, 40, 50]), 2);
        const people = near(rng, seats * rng.int(4, 20), 8);
        return estimate(rng, `About how many ${seats}-seat buses are needed for ${num(people)} people?`, R(people).div(R(seats)), `Round the seats to ${Math.round(seats / 10) * 10} and divide: about ${num(R(people).div(R(seats)).round('whole'))}`);
      }
      if (d === 2) {
        const hours = near(rng, rng.pick([40, 50, 60, 80]), 2);
        const pay = R(near(rng, rng.pick([15, 20, 25, 30]) * 100, 8)).div(R(100));
        return estimate(rng, `A worker earns ${money(pay)} an hour for ${hours} hours a week. Over 12 weeks, the pay is closest to`, pay.mul(R(hours * 12)), `Round to ${money(pay.round('whole'))} × ${Math.round(hours / 10) * 10} × 12: about ${money(pay.mul(R(hours * 12)).round('whole'))}`);
      }
      const km = near(rng, rng.int(2, 9) * 100, 8);
      const per = near(rng, rng.pick([40, 50, 60, 80]), 2) / 10;
      const price = R(near(rng, rng.pick([120, 150, 180, 200]), 3)).div(R(100));
      return estimate(rng, `A car uses ${num(String(per))} litres per 100 km, and fuel is ${money(price)} a litre. A ${num(km)} km trip costs closest to`, R(km).div(R(100)).mul(R(String(per))).mul(price), `Litres: about ${num(Math.round(km / 100))} × ${num(Math.round(per))}. Then multiply by about ${money(price.round('tenth'))}: about ${money(R(km).div(R(100)).mul(R(String(per))).mul(price).round('whole'))}`);
    },
  }),
];
