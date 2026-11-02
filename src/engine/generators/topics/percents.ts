import { R, Rational } from '../../matching/rational';
import { an, frac, num, pct } from '../format';
import type { Difficulty, Template } from '../types';
import { by, fill, pickR, rate } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'percents',
  kind: 'calc',
  ...x,
});

const PCT_UNIT = { suffix: '%' };

type Rng = Parameters<Template['generate']>[0];

/** Percent pools by difficulty, set by how awkward the number is, not the concept. */
const POOL: Record<Difficulty, string[]> = {
  1: ['5', '12.5', '15', '35', '45', '60'],
  2: ['17.5', '22.5', '37.5', '62.5', '87.5', '2.5'],
  3: ['7.5', '27.5', '32.5', '42.5', '57.5', '112.5', '16', '24', '36'],
};

/** How to take p% in your head, as fraction shortcuts or sums of easy parts. */
const SHORTCUTS: Record<string, { frac: [number, number] } | { parts: [string, 1 | -1][] }> = {
  '10': { frac: [1, 10] },
  '20': { parts: [['10', 1], ['10', 1]] },
  '25': { frac: [1, 4] },
  '50': { frac: [1, 2] },
  '75': { frac: [3, 4] },
  '12.5': { frac: [1, 8] },
  '15': { parts: [['10', 1], ['5', 1]] },
  '35': { parts: [['25', 1], ['10', 1]] },
  '45': { parts: [['50', 1], ['5', -1]] },
  '60': { parts: [['50', 1], ['10', 1]] },
  '17.5': { parts: [['10', 1], ['5', 1], ['2.5', 1]] },
  '22.5': { parts: [['20', 1], ['2.5', 1]] },
  '37.5': { frac: [3, 8] },
  '62.5': { frac: [5, 8] },
  '87.5': { frac: [7, 8] },
  '2.5': { frac: [1, 40] },
  '7.5': { parts: [['5', 1], ['2.5', 1]] },
  '27.5': { parts: [['25', 1], ['2.5', 1]] },
  '32.5': { parts: [['25', 1], ['5', 1], ['2.5', 1]] },
  '42.5': { parts: [['50', 1], ['5', -1], ['2.5', -1]] },
  '57.5': { parts: [['50', 1], ['5', 1], ['2.5', 1]] },
  '112.5': { frac: [9, 8] },
  '16': { parts: [['10', 1], ['5', 1], ['1', 1]] },
  '24': { parts: [['25', 1], ['1', -1]] },
  '36': { parts: [['25', 1], ['10', 1], ['1', 1]] },
};

/** One-line shortcut for p% of N. */
export function explainPctOf(p: Rational, N: Rational): string {
  const key = p.toString();
  const ans = rate(p).mul(N);
  if (key === '5') return `5% = half of 10%: ${num(N.div(R(10)))} ÷ 2 = ${num(ans)}`;
  const s = SHORTCUTS[key];
  if (!s) return `${pct(p)} of ${num(N)} = ${num(rate(p))} × ${num(N)} = ${num(ans)}`;
  if ('frac' in s) {
    const [a, b] = s.frac;
    if (b === 10) return `10%: move the decimal point one place: ${num(ans)}`;
    return a === 1 ? `${pct(p)} = 1/${b}: ${num(N)} ÷ ${b} = ${num(ans)}` : `${pct(p)} = ${a}/${b}: ${num(N)} ÷ ${b} × ${a} = ${num(ans)}`;
  }
  const sign = (i: number) => (i === 0 ? '' : s.parts[i]![1] > 0 ? ' + ' : ' − ');
  const names = s.parts.map(([q], i) => `${sign(i)}${q}%`).join('');
  const vals = s.parts.map(([q], i) => `${sign(i)}${num(rate(R(q)).mul(N))}`).join('');
  return `${pct(p)} = ${names}: ${vals} = ${num(ans)}`;
}

/** N that makes p% of N a whole number (mostly), scaled by difficulty. */
function friendlyBase(rng: Rng, d: Difficulty): Rational {
  return R(by(d, rng.int(1, 20) * 40, rng.int(2, 40) * 40, rng.int(2, 30) * 80));
}

export const percents: Template[] = [
  t({
    id: 'pct-of',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = pickR(rng, POOL[d]);
      const N = d === 1 ? R(rng.int(4, 60) * 8) : friendlyBase(rng, d);
      const ans = rate(p).mul(N);
      return {
        prompt: `${pct(p)} of ${num(N)} = ?`,
        answer: ans,
        distractors: [ans.mul(R(10)), ans.div(R(10)), rate(p.add(R(5))).mul(N), N.sub(ans), rate(p.sub(R('2.5'))).mul(N)],
        explain: explainPctOf(p, N),
      };
    },
  }),

  t({
    id: 'pct-what-percent',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = pickR(rng, by(d, ['5', '15', '35', '40', '12.5', '64'], ['37.5', '62.5', '17.5', '140', '225', '2.5'], ['7.5', '32.5', '112.5', '175', '87.5', '42.5', '0.5']));
      const y = friendlyBase(rng, d);
      const x = rate(p).mul(y);
      if (!x.isInteger()) return null;
      return {
        prompt: `${num(x)} is what percent of ${num(y)}?`,
        answer: p,
        unit: PCT_UNIT,
        distractors: [y.div(x).mul(R(100)), R(100).sub(p), p.mul(R(10)), p.add(R(5)), p.sub(R(5))],
        explain: `Part ÷ whole: ${num(x)}/${num(y)} = ${frac(x.div(y))} = ${pct(p)}`,
      };
    },
  }),

  t({
    id: 'pct-change',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = pickR(rng, by(d, ['15', '12.5', '35', '40', '5'], ['37.5', '17.5', '62.5', '22.5'], ['7.5', '27.5', '32.5', '42.5', '57.5', '112.5']));
      const a = R(by(d, rng.int(1, 15) * 40, rng.int(2, 15) * 40, rng.int(1, 12) * 80));
      const up = rng.chance(0.5);
      if (!up && p.cmp(R(100)) >= 0) return null;
      const b = a.mul(R(1).add(up ? rate(p) : rate(p).neg()));
      const change = up ? b.sub(a) : a.sub(b);
      return {
        prompt: `A value ${up ? 'rises' : 'falls'} from ${num(a)} to ${num(b)}. Percent ${up ? 'increase' : 'decrease'}?`,
        answer: p,
        unit: PCT_UNIT,
        distractors: [change.div(b).mul(R(100)), b.div(a).mul(R(100)), change, p.add(R(5)), p.sub(R(5))],
        explain: `Change ÷ original: ${num(change)} ÷ ${num(a)} = ${pct(p)}`,
      };
    },
  }),

  t({
    id: 'pct-successive',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, ['10', '15', '20', '25', '30'], ['10', '20', '25', '40'], ['12.5', '15', '17.5', '30', '35', '40']);
      const count = d > 1 && rng.chance(0.5) ? 3 : 2;
      const changes = Array.from({ length: count }, () => pickR(rng, pool).mul(R(rng.chance(0.5) ? 1 : -1)));
      const factor = changes.reduce((acc, c) => acc.mul(R(1).add(rate(c))), R(1));
      const net = factor.sub(R(1)).mul(R(100));
      if (net.equals(R(0))) return null;
      const sum = changes.reduce((acc, c) => acc.add(c), R(0));
      if (sum.equals(net)) return null;
      const words = changes.map((c, i) => `${i === 0 ? '' : ', then '}${c.isNegative() ? 'falls' : 'rises'} ${pct(c.isNegative() ? c.neg() : c)}`).join('');
      const factors = changes.map((c) => num(R(1).add(rate(c)))).join(' × ');
      return {
        prompt: `A price ${words}. Net percent change? (Use − for a decrease.)`,
        answer: net,
        unit: PCT_UNIT,
        distractors: [sum, net.neg(), factor.mul(R(100)), sum.neg(), net.add(R(1))],
        explain: `Multiply the factors: ${factors} = ${num(factor)}, a change of ${net.isNegative() ? '' : '+'}${num(net)}%`,
      };
    },
  }),

  t({
    id: 'pct-reverse',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Two changes, then reverse both.
        const p = pickR(rng, ['10', '20', '25', '40', '50', '12.5']);
        const q = pickR(rng, ['10', '20', '25', '40', '50', '12.5']);
        const orig = R(rng.int(2, 30) * 80);
        const f1 = R(1).add(rate(p));
        const f2 = R(1).sub(rate(q));
        const now = orig.mul(f1).mul(f2);
        if (!now.isInteger() || now.equals(orig)) return null;
        return {
          prompt: `A value rises ${pct(p)}, then falls ${pct(q)}, ending at ${num(now)}. What was the original value?`,
          answer: orig,
          distractors: [now.mul(R(1).sub(rate(p))).mul(R(1).add(rate(q))), now.div(R(1).add(rate(p.sub(q)))), now.mul(R(1).sub(rate(p.sub(q)))), now.sub(p).add(q)],
          explain: `Original × ${num(f1)} × ${num(f2)} = ${num(now)}, so original = ${num(now)} ÷ ${num(f1.mul(f2))} = ${num(orig)}`,
        };
      }
      const p = pickR(rng, by(d, ['15', '12.5', '30', '40', '5'], ['37.5', '17.5', '2.5', '62.5'], []));
      const orig = friendlyBase(rng, d);
      const up = rng.chance(0.5);
      const factor = R(1).add(up ? rate(p) : rate(p).neg());
      const now = orig.mul(factor);
      if (!now.isInteger()) return null;
      const opp = R(1).add(up ? rate(p).neg() : rate(p));
      return {
        prompt: `After ${an(pct(p))} ${pct(p)} ${up ? 'increase' : 'decrease'}, a value is ${num(now)}. What was the original value?`,
        answer: orig,
        distractors: [now.mul(opp), now.mul(factor), up ? now.sub(p) : now.add(p), orig.add(R(by(d, 20, 40, 80)))],
        explain: `Original × ${num(factor)} = ${num(now)}, so original = ${num(now)} ÷ ${num(factor)} = ${num(orig)}`,
      };
    },
  }),

  t({
    id: 'pct-word-share',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      // A share of a whole can't exceed 100%.
      const p = pickR(rng, POOL[d].filter((x) => Number(x) < 100));
      const N = friendlyBase(rng, d);
      const ans = rate(p).mul(N);
      if (!ans.isInteger()) return null;
      const scene = rng.pick([
        'In a school of {N} students, {p} walk to school. How many students walk?',
        'A survey of {N} people found {p} prefer tea. How many prefer tea?',
        '{p} of the {N} seats in a theater are sold. How many seats are sold?',
        'A farm has {N} animals, and {p} of them are sheep. How many are sheep?',
        'A shop sold {N} items last month, and {p} were returned. How many were returned?',
        'Of {N} emails in an inbox, {p} are spam. How many are spam?',
        'A library has {N} books, and {p} are fiction. How many are fiction?',
        'A factory made {N} parts, and {p} failed inspection. How many parts failed?',
      ]);
      return {
        prompt: fill(scene, { N: num(N), p: pct(p) }),
        answer: ans,
        distractors: [N.sub(ans), ans.mul(R(10)), ans.div(R(10)), rate(p.add(R(5))).mul(N), rate(p.sub(R('2.5'))).mul(N)],
        explain: explainPctOf(p, N),
      };
    },
  }),

  t({
    id: 'pct-fraction',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = pickR(rng, by(d, ['12.5', '37.5', '62.5', '87.5', '35', '45', '15', '5'], ['6.25', '2.5', '120', '175', '0.5', '18.75', '31.25'], ['0.25', '137.5', '7.5', '43.75', '56.25', '3.125', '112.5', '68.75']));
      const f = rate(p);
      if (rng.chance(0.5)) {
        return {
          prompt: `${pct(p)} as a fraction in lowest terms = ?`,
          answer: f,
          format: 'fraction',
          distractors: [p.div(R(10)), R(1).sub(f), Rational.of(f.n, f.d + 1n), Rational.of(f.n + 1n, f.d), f.mul(R(10))],
          explain: `Percent means over 100: ${num(p)}/100, which cancels to ${frac(f)}`,
        };
      }
      return {
        prompt: `${frac(f)} as a percent = ?`,
        answer: p,
        unit: PCT_UNIT,
        distractors: [p.mul(R(10)), p.div(R(10)), R(100).sub(p), p.add(R(5))],
        explain: `${frac(f)} = ${f.n} ÷ ${f.d} = ${num(f)} = ${pct(p)}`,
      };
    },
  }),

  t({
    id: 'pct-word-change',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = pickR(rng, by(d, ['15', '12.5', '35', '5', '40'], ['17.5', '37.5', '22.5', '2.5'], ['7.5', '27.5', '32.5', '42.5', '57.5']));
      const up = rng.chance(0.5);
      const [scene, base] = rng.pick<[string, number]>([
        ["A town's population {verb} from {a} to {b}. What was the percent {dir}?", 1000],
        ['A channel {verb} from {a} to {b} subscribers. What was the percent {dir}?', 100],
        ['Monthly rent {verb} from ${a} to ${b}. What was the percent {dir}?', 10],
        ["A store's daily customers {verb} from {a} to {b}. What was the percent {dir}?", 10],
        ['A ticket price {verb} from ${a} to ${b}. What was the percent {dir}?', 1],
        ['Yearly rainfall {verb} from {a} mm to {b} mm. What was the percent {dir}?', 10],
      ]);
      const a = R(rng.int(1, 12) * by(d, 40, 40, 80) * base);
      const b = a.mul(R(1).add(up ? rate(p) : rate(p).neg()));
      if (!b.isInteger()) return null;
      const change = up ? b.sub(a) : a.sub(b);
      return {
        prompt: fill(scene, { verb: up ? 'rose' : 'fell', dir: up ? 'increase' : 'decrease', a: num(a), b: num(b) }),
        answer: p,
        unit: PCT_UNIT,
        distractors: [change.div(b).mul(R(100)), b.div(a).mul(R(100)), p.add(R(5)), p.sub(R(5)), p.mul(R(2))],
        explain: `Change ÷ original: ${num(change)} ÷ ${num(a)} = ${pct(p)}`,
      };
    },
  }),

  t({
    id: 'pct-of-pct',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const pool = by(d, ['10', '20', '25', '40', '50', '75'], ['12.5', '15', '35', '60', '5'], ['12.5', '37.5', '62.5', '17.5', '150', '2.5']);
      const p = pickR(rng, pool);
      const q = pickR(rng, pool);
      const N = R(by(d, rng.int(1, 20) * 80, rng.int(1, 10) * 400, rng.int(1, 10) * 1600));
      const both = rate(p).mul(rate(q));
      const ans = both.mul(N);
      return {
        prompt: `${pct(p)} of ${pct(q)} of ${num(N)} = ?`,
        answer: ans,
        distractors: [rate(p.add(q)).mul(N), ans.mul(R(10)), ans.div(R(10)), rate(p).mul(N), rate(q).mul(N)],
        explain: `Multiply the rates: ${num(rate(p))} × ${num(rate(q))} = ${num(both)}; ${num(both)} × ${num(N)} = ${num(ans)}`,
      };
    },
  }),
];
