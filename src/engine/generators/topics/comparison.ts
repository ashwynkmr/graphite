// Quantitative Comparison. Nothing here states an answer: each one is worked out by comparing the
// two quantities, across every test value that fits the question when they contain a variable.
import { A_GREATER, B_GREATER, compareDraft, EQUAL, relationOf, UNDETERMINED } from '../compare';
import { R, Rational } from '../../matching/rational';
import { frac, num } from '../format';
import type { Draft, Template } from '../types';
import { by, gcdNum, sup } from '../util';
import { choose } from './probability';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'comparison',
  kind: 'calc',
  ...x,
});

type Rng = Parameters<Template['generate']>[0];

const PI = R('3.14159');
const OUTCOME = ['', 'A is greater', 'B is greater', 'they are equal'];

/** A question in one variable: which values fit, and the two quantities. */
export interface OneVar {
  given: string;
  fits: (x: Rational) => boolean;
  a: string;
  b: string;
  fa: (x: Rational) => Rational;
  fb: (x: Rational) => Rational;
  why: string;
}

/** A question in two variables. */
export interface TwoVar {
  given: string;
  fits: (x: Rational, y: Rational) => boolean;
  a: string;
  b: string;
  fa: (x: Rational, y: Rational) => Rational;
  fb: (x: Rational, y: Rational) => Rational;
  why: string;
}

const gt = (x: Rational, n: number | Rational) => x.cmp(n instanceof Rational ? n : R(n)) > 0;
const lt = (x: Rational, n: number | Rational) => x.cmp(n instanceof Rational ? n : R(n)) < 0;
const sq = (x: Rational) => x.mul(x);

/** The questions in x, for a whole number k. Easy, medium and hard. */
export function oneVarTable(k: number): OneVar[][] {
  const K = R(k);
  return [
    [
      { given: `x > ${k}.`, fits: (x) => gt(x, k), a: 'x²', b: `${k}x`, fa: sq, fb: (x) => K.mul(x), why: `x² is x × x, and x is more than ${k}, so x × x beats ${k} × x` },
      { given: `0 < x < ${k}.`, fits: (x) => gt(x, 0) && lt(x, k), a: 'x²', b: `${k}x`, fa: sq, fb: (x) => K.mul(x), why: `x² is x × x, and x is less than ${k}, so x × x falls short of ${k} × x` },
      { given: `x > 0.`, fits: (x) => gt(x, 0), a: `x + ${k}`, b: 'x', fa: (x) => x.add(K), fb: (x) => x, why: `Adding ${k} always makes it larger` },
      { given: `x is not 0.`, fits: (x) => x.n !== 0n, a: 'x²', b: '0', fa: sq, fb: () => R(0), why: 'A square of a number other than 0 is always positive' },
      { given: '', fits: () => true, a: `${k}x`, b: 'x', fa: (x) => K.mul(x), fb: (x) => x, why: '' },
      { given: '', fits: () => true, a: `x + ${k}`, b: `${k}`, fa: (x) => x.add(K), fb: () => K, why: '' },
      { given: `x > 0.`, fits: (x) => gt(x, 0), a: `${k}x`, b: `${k + 1}x`, fa: (x) => K.mul(x), fb: (x) => R(k + 1).mul(x), why: 'With x positive, more x’s is more' },
      { given: `x < 0.`, fits: (x) => lt(x, 0), a: `${k}x`, b: `${k + 1}x`, fa: (x) => K.mul(x), fb: (x) => R(k + 1).mul(x), why: 'With x negative, more x’s is further below 0' },
    ],
    [
      { given: 'x > 0.', fits: (x) => gt(x, 0), a: 'x²', b: `${k}x`, fa: sq, fb: (x) => K.mul(x), why: '' },
      { given: `x < 0.`, fits: (x) => lt(x, 0), a: 'x²', b: `${k}x`, fa: sq, fb: (x) => K.mul(x), why: `x² is positive and ${k}x is negative` },
      { given: 'x > 1.', fits: (x) => gt(x, 1), a: '1/x', b: 'x', fa: (x) => R(1).div(x), fb: (x) => x, why: 'For x above 1, 1/x is below 1' },
      { given: '0 < x < 1.', fits: (x) => gt(x, 0) && lt(x, 1), a: '1/x', b: 'x', fa: (x) => R(1).div(x), fb: (x) => x, why: 'For x between 0 and 1, 1/x is above 1' },
      { given: '', fits: () => true, a: `x + ${k}`, b: `x − ${k}`, fa: (x) => x.add(K), fb: (x) => x.sub(K), why: `Whatever x is, A is ${2 * k} more than B` },
      { given: 'x is not 0.', fits: (x) => x.n !== 0n, a: `${k}x`, b: `${k + 1}x`, fa: (x) => K.mul(x), fb: (x) => R(k + 1).mul(x), why: '' },
    ],
    [
      { given: 'x < −1.', fits: (x) => lt(x, -1), a: 'x³', b: 'x', fa: (x) => x.pow(3), fb: (x) => x, why: 'Cubing a number below −1 pushes it further below 0' },
      { given: '−1 < x < 0.', fits: (x) => gt(x, -1) && lt(x, 0), a: 'x³', b: 'x', fa: (x) => x.pow(3), fb: (x) => x, why: 'Cubing a number between −1 and 0 pulls it closer to 0' },
      { given: '', fits: () => true, a: 'x² + 1', b: '2x', fa: (x) => sq(x).add(R(1)), fb: (x) => R(2).mul(x), why: '' },
      { given: 'x is not 1.', fits: (x) => !x.equals(R(1)), a: 'x² + 1', b: '2x', fa: (x) => sq(x).add(R(1)), fb: (x) => R(2).mul(x), why: 'A − B = (x − 1)², which is positive unless x = 1' },
      { given: 'x > 0.', fits: (x) => gt(x, 0), a: 'x + 1/x', b: '2', fa: (x) => x.add(R(1).div(x)), fb: () => R(2), why: '' },
      { given: `x > ${k}.`, fits: (x) => gt(x, k), a: `(x − ${k})²`, b: `x − ${k}`, fa: (x) => sq(x.sub(K)), fb: (x) => x.sub(K), why: '' },
      { given: 'x is not 0.', fits: (x) => x.n !== 0n, a: `(x + ${k})²`, b: `x² + ${k * k}`, fa: (x) => sq(x.add(K)), fb: (x) => sq(x).add(R(k * k)), why: '' },
      { given: 'x > 0.', fits: (x) => gt(x, 0), a: `(x + ${k})²`, b: `x² + ${k * k}`, fa: (x) => sq(x.add(K)), fb: (x) => sq(x).add(R(k * k)), why: `Expanding A adds ${2 * k}x, which is positive` },
    ],
  ];
}

/** The questions in x and y, for a whole number k. Easy, medium and hard. */
export function twoVarTable(k: number): TwoVar[][] {
  const K = R(k);
  return [
    [
      { given: 'x > y.', fits: (x, y) => gt(x, y), a: `x + ${k}`, b: `y + ${k}`, fa: (x) => x.add(K), fb: (_, y) => y.add(K), why: 'Adding the same to both keeps the order' },
      { given: 'x > y.', fits: (x, y) => gt(x, y), a: 'x', b: `y + ${k}`, fa: (x) => x, fb: (_, y) => y.add(K), why: '' },
      { given: 'x > y.', fits: (x, y) => gt(x, y), a: 'x − y', b: `${k}`, fa: (x, y) => x.sub(y), fb: () => K, why: '' },
      { given: 'x > y.', fits: (x, y) => gt(x, y), a: `x − y`, b: `y − x`, fa: (x, y) => x.sub(y), fb: (x, y) => y.sub(x), why: 'x − y is positive, and y − x is its negative' },
      { given: 'x < 0 < y.', fits: (x, y) => lt(x, 0) && gt(y, 0), a: 'xy', b: `${k}`, fa: (x, y) => x.mul(y), fb: () => K, why: `A negative times a positive is negative, so below ${k}` },
      { given: 'x > y > 0.', fits: (x, y) => gt(x, y) && gt(y, 0), a: `${k}x`, b: `${k}y`, fa: (x) => K.mul(x), fb: (_, y) => K.mul(y), why: 'Multiplying by a positive keeps the order' },
      { given: `x + y = ${2 * k}.`, fits: (x, y) => x.add(y).equals(R(2 * k)), a: `(x + y) ÷ 2`, b: `${k}`, fa: (x, y) => x.add(y).div(R(2)), fb: () => K, why: `(x + y) ÷ 2 = ${2 * k} ÷ 2 = ${k}` },
    ],
    [
      { given: 'x > y > 0.', fits: (x, y) => gt(x, y) && gt(y, 0), a: '1/x', b: '1/y', fa: (x) => R(1).div(x), fb: (_, y) => R(1).div(y), why: 'Among positives, a larger bottom makes a smaller fraction' },
      { given: 'x > y > 0.', fits: (x, y) => gt(x, y) && gt(y, 0), a: 'x²', b: 'xy', fa: sq, fb: (x, y) => x.mul(y), why: 'Both have a positive x, and x is larger than y' },
      { given: 'x > y.', fits: (x, y) => gt(x, y), a: 'x²', b: 'y²', fa: sq, fb: (_, y) => sq(y), why: '' },
      { given: 'x < 0 < y.', fits: (x, y) => lt(x, 0) && gt(y, 0), a: `x + y`, b: '0', fa: (x, y) => x.add(y), fb: () => R(0), why: '' },
      { given: 'x < y < 0.', fits: (x, y) => lt(x, y) && lt(y, 0), a: 'x²', b: 'y²', fa: sq, fb: (_, y) => sq(y), why: 'Further below 0 means a larger square' },
      { given: `x + y = ${2 * k}, x > y.`, fits: (x, y) => x.add(y).equals(R(2 * k)) && gt(x, y), a: 'x', b: `${k}`, fa: (x) => x, fb: () => K, why: `The two average ${k}, so the larger is above ${k}` },
    ],
    [
      { given: 'x > y.', fits: (x, y) => gt(x, y), a: 'x/y', b: '1', fa: (x, y) => x.div(y), fb: () => R(1), why: '' },
      { given: 'x > y > 0.', fits: (x, y) => gt(x, y) && gt(y, 0), a: 'x/y', b: '1', fa: (x, y) => x.div(y), fb: () => R(1), why: 'The top is larger than the bottom, and both are positive' },
      { given: `x and y are positive, xy = ${k * k}.`, fits: (x, y) => gt(x, 0) && gt(y, 0) && x.mul(y).equals(R(k * k)), a: `x + y`, b: `${2 * k}`, fa: (x, y) => x.add(y), fb: () => R(2 * k), why: '' },
      { given: `x and y are positive, x + y = ${2 * k}.`, fits: (x, y) => gt(x, 0) && gt(y, 0) && x.add(y).equals(R(2 * k)), a: 'xy', b: `${k * k}`, fa: (x, y) => x.mul(y), fb: () => R(k * k), why: '' },
      { given: `x and y are different positives, x + y = ${2 * k}.`, fits: (x, y) => gt(x, 0) && gt(y, 0) && !x.equals(y) && x.add(y).equals(R(2 * k)), a: 'xy', b: `${k * k}`, fa: (x, y) => x.mul(y), fb: () => R(k * k), why: `With a fixed sum, the product is largest when they're equal at ${k}, which is ruled out` },
      { given: 'x² = y², x > 0, y < 0.', fits: (x, y) => gt(x, 0) && lt(y, 0) && sq(x).equals(sq(y)), a: 'x + y', b: '0', fa: (x, y) => x.add(y), fb: () => R(0), why: 'They are opposites, so they add to 0' },
    ],
  ];
}

/** Values to try: both signs, fractions, and the numbers around k where order often flips. */
export function testValues(k: number): Rational[] {
  const fixed = ['-100', '-10', '-3', '-2', '-1.5', '-1', '-0.75', '-0.5', '-0.25', '-0.1', '0', '0.1', '0.25', '0.5', '0.75', '1', '1.5', '2', '3', '10', '100'];
  const near = [k / 2, k - 1, k - 0.5, k, k + 0.5, k + 1, 2 * k, -k, 2 * k - 1, 2 * k + 1, 3 * k].map((v) => R(String(v)));
  return [...fixed.map((v) => R(v)), ...near];
}

/** How hard a value is to picture: whole numbers near 0 come first. */
function plainness(x: Rational): number {
  return (x.isInteger() ? 0 : 1000) + Math.abs(x.toNumber());
}

/** The two plainest tried cases that disagree, to show why it can't be determined. */
function disagreeing<V>(cases: readonly V[], score: (v: V) => number, outcome: (v: V) => number): [V, V] {
  const sorted = [...cases].sort((p, r) => score(p) - score(r));
  const first = sorted[0]!;
  return [first, sorted.find((c) => outcome(c) !== outcome(first))!];
}

const outcomeOf = (a: Rational, b: Rational) => (a.cmp(b) > 0 ? A_GREATER : a.cmp(b) < 0 ? B_GREATER : EQUAL);
const value = (x: Rational) => (x.isTerminating() ? num(x) : frac(x));

/** The answer to a one-variable question, from every test value that fits. */
export function solveOneVar(q: OneVar, k: number): { relation: number; explain: string } {
  const cases = testValues(k).filter(q.fits);
  const relation = relationOf(cases.map((x) => [q.fa(x), q.fb(x)] as const));
  if (relation !== UNDETERMINED) return { relation, explain: q.why };
  const [p, r] = disagreeing(cases, plainness, (x) => outcomeOf(q.fa(x), q.fb(x)));
  return { relation, explain: `It depends. At x = ${value(p)}, ${OUTCOME[outcomeOf(q.fa(p), q.fb(p))]}. At x = ${value(r)}, ${OUTCOME[outcomeOf(q.fa(r), q.fb(r))]}` };
}

/** The answer to a two-variable question, from every pair of test values that fits. */
export function solveTwoVar(q: TwoVar, k: number): { relation: number; explain: string } {
  const pool = testValues(k).filter((v) => v.n !== 0n);
  const cases: [Rational, Rational][] = [];
  for (const x of pool) for (const y of pool) if (q.fits(x, y)) cases.push([x, y]);
  const relation = relationOf(cases.map(([x, y]) => [q.fa(x, y), q.fb(x, y)] as const));
  if (relation !== UNDETERMINED) return { relation, explain: q.why };
  const [p, r] = disagreeing(cases, ([x, y]) => plainness(x) + plainness(y), ([x, y]) => outcomeOf(q.fa(x, y), q.fb(x, y)));
  const say = ([x, y]: [Rational, Rational]) => `x = ${value(x)} and y = ${value(y)}, ${OUTCOME[outcomeOf(q.fa(x, y), q.fb(x, y))]}`;
  return { relation, explain: `It depends. With ${say(p)}. With ${say(r)}` };
}

function fixed(given: string, aText: string, bText: string, a: Rational, b: Rational, explain: string): Draft {
  return compareDraft(given, aText, bText, relationOf([[a, b]]), explain);
}

/** A round comparison value, equal to the true one about a third of the time. */
function nearby(rng: Rng, x: Rational, step: number): Rational {
  const kind = rng.int(0, 2);
  return kind === 0 ? x : x.add(R(kind === 1 ? step : -step));
}

export const comparison: Template[] = [
  t({
    id: 'cmp-values',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        if (rng.chance(0.5)) {
          const p = rng.pick([5, 10, 15, 20, 25, 30, 35, 40, 60, 75]);
          const n = rng.int(2, 24) * 20;
          const exact = R(p * n).div(R(100));
          const other = nearby(rng, exact, rng.int(1, 3));
          return fixed('', `${p}% of ${num(n)}`, num(other), exact, other, `${p}% of ${num(n)} = ${num(exact)}, compared with ${num(other)}`);
        }
        const q = rng.pick([4, 5, 8, 10, 20, 25]);
        const top = rng.int(1, q - 1);
        const f = R(top, q);
        const other = f.add(R(rng.pick(['0', '0.05', '-0.05'])));
        if (other.cmp(R(0)) <= 0) return null;
        return fixed('', `${top}/${q}`, num(other), f, other, `${top}/${q} as a decimal is ${num(f)}, compared with ${num(other)}`);
      }
      if (d === 2) {
        if (rng.chance(0.5)) {
          const m = rng.int(15, 60);
          const g = rng.int(1, 5);
          const a = (m - g) * (m + g);
          const b = m * m - rng.pick([0, g * g, 2 * g * g]);
          return fixed('', `${m - g} × ${m + g}`, `${num(b)}`, R(a), R(b), `(${m} − ${g})(${m} + ${g}) = ${m}² − ${g}² = ${num(a)}, compared with ${num(b)}`);
        }
        const b = rng.int(3, 12);
        const e = rng.int(3, 12);
        const a = rng.int(1, b - 1);
        const c = rng.int(1, e - 1);
        if (b === e) return null;
        return fixed('', `${a}/${b}`, `${c}/${e}`, R(a, b), R(c, e), `Cross-multiply: ${a} × ${e} = ${a * e} and ${c} × ${b} = ${c * b}`);
      }
      const [x, y, m, n] = rng.pick<[number, number, number, number]>([[2, 3, 30, 20], [3, 5, 30, 20], [5, 3, 20, 30], [2, 5, 50, 20], [2, 7, 30, 10], [3, 2, 40, 60], [4, 8, 30, 20], [9, 27, 30, 20], [2, 3, 40, 30], [5, 2, 30, 70], [3, 4, 50, 40], [6, 2, 20, 50]]);
      const shared = rng.pick([1, 1, 2]);
      const [mm, nn] = [m * shared, n * shared];
      const g = gcdNum(mm, nn);
      const big = R(x).pow(mm / g);
      const other = R(y).pow(nn / g);
      return fixed('', `${x}${sup(mm)}`, `${y}${sup(nn)}`, big, other, `Rewrite both to the power ${g}: ${num(big)}${sup(g)} and ${num(other)}${sup(g)}. Then compare ${num(big)} with ${num(other)}`);
    },
  }),

  t({
    id: 'cmp-percent',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const p = rng.int(2, 18) * 5;
        const n = rng.int(2, 18) * 5;
        if (p === n) return null;
        const swap = rng.chance(0.6);
        const other = swap ? n : n + 5;
        const a = R(p * n).div(R(100));
        const b = R(other * p).div(R(100));
        return fixed('', `${p}% of ${n}`, `${other}% of ${p}`, a, b, swap ? `Percents swap: ${p}% of ${n} is always ${n}% of ${p}` : `${p}% of ${n} = ${num(a)}, and ${other}% of ${p} = ${num(b)}`);
      }
      const n = rng.int(2, 20) * 100;
      const up = rng.pick([10, 20, 25, 30, 40, 50]);
      if (d === 2) {
        const down = rng.chance(0.5) ? up : rng.pick([5, 10, 15, 20]);
        const final = R(n).mul(R(100 + up)).mul(R(100 - down)).div(R(10000));
        return fixed(`A ${num(n)}-dollar price rises ${up}%, then falls ${down}%.`, 'the final price, in dollars', num(n), final, R(n), `${num(n)} × ${num(R(100 + up).div(R(100)))} × ${num(R(100 - down).div(R(100)))} = ${num(final)}`);
      }
      const down = rng.pick([10, 20, 25, 30, 40, 50]);
      const first = R(100 + up).mul(R(100 - down));
      const second = R(100 + down).mul(R(100 - up));
      return fixed('', `a price raised ${up}%, then cut ${down}%`, `the same price raised ${down}%, then cut ${up}%`, first, second, `Compare the multipliers: ${num(R(100 + up).div(R(100)))} × ${num(R(100 - down).div(R(100)))} = ${num(first.div(R(10000)))}, and ${num(R(100 + down).div(R(100)))} × ${num(R(100 - up).div(R(100)))} = ${num(second.div(R(10000)))}`);
    },
  }),

  t({
    id: 'cmp-one-var',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const k = rng.int(2, 9);
      const rows = oneVarTable(k)[d - 1]!;
      const open = rows.filter((row) => solveOneVar(row, k).relation === UNDETERMINED);
      // About half depend on x, so "cannot be determined" gets real practice.
      const q = rng.pick(open.length && rng.chance(0.5) ? open : rows);
      const { relation, explain } = solveOneVar(q, k);
      return compareDraft(q.given, q.a, q.b, relation, explain);
    },
  }),

  t({
    id: 'cmp-two-var',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const k = rng.int(2, 9);
      const rows = twoVarTable(k)[d - 1]!;
      const open = rows.filter((row) => solveTwoVar(row, k).relation === UNDETERMINED);
      const q = rng.pick(open.length && rng.chance(0.5) ? open : rows);
      const { relation, explain } = solveTwoVar(q, k);
      return compareDraft(q.given, q.a, q.b, relation, explain);
    },
  }),

  t({
    id: 'cmp-solve',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(2, 9);
        const x = rng.int(2, 20);
        const b = rng.int(1, 30);
        const other = nearby(rng, R(x), rng.int(1, 2));
        return fixed(`${a}x + ${b} = ${a * x + b}.`, 'x', num(other), R(x), other, `${a}x = ${a * x}, so x = ${x}. Compare with ${num(other)}`);
      }
      if (d === 2) {
        const x = rng.int(4, 30);
        const y = rng.int(2, 30);
        const ask = rng.int(0, 2);
        const given = `x + y = ${x + y} and x − y = ${x - y < 0 ? `−${y - x}` : x - y}.`;
        if (ask === 0) return fixed(given, 'x', 'y', R(x), R(y), `Adding the equations: 2x = ${2 * x}, so x = ${x} and y = ${y}`);
        if (ask === 1) {
          const other = nearby(rng, R(x * y), rng.int(1, 4));
          return fixed(given, 'xy', num(other), R(x * y), other, `x = ${x} and y = ${y}, so xy = ${num(x * y)}`);
        }
        return fixed(given, '2x', `x + y + ${x - y === 0 ? 1 : Math.abs(x - y)}`, R(2 * x), R(x + y + (x - y === 0 ? 1 : Math.abs(x - y))), `x = ${x}, so 2x = ${2 * x}. B is ${x + y} + ${x - y === 0 ? 1 : Math.abs(x - y)} = ${x + y + (x - y === 0 ? 1 : Math.abs(x - y))}`);
      }
      const p = rng.int(2, 15);
      const q = rng.int(2, 15);
      if (p === q) return null;
      const kind = rng.int(0, 2);
      if (kind === 0) {
        const xs = [R(p), R(-p)];
        const ys = [R(q), R(-q)];
        const pairs = xs.flatMap((x) => ys.map((y) => [x, y] as const));
        return compareDraft(`x² = ${p * p} and y² = ${q * q}.`, 'x', 'y', relationOf(pairs), `Each could be positive or negative: x = ±${p} and y = ±${q}, so the order can go either way`);
      }
      if (kind === 1) {
        return fixed(`x² = ${p * p} and y² = ${q * q}.`, 'x²', 'y²', R(p * p), R(q * q), `Squares are given: ${num(p * p)} and ${num(q * q)}`);
      }
      const pairs = [R(p), R(-p)].map((x) => [x, R(0)] as const);
      return compareDraft(`x² = ${p * p}.`, 'x', '0', relationOf(pairs), `x could be ${p} or −${p}`);
    },
  }),

  t({
    id: 'cmp-stats',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const start = rng.int(3, 40);
        const gap = rng.int(1, 6);
        const n = rng.pick([5, 7, 9, 11, 6, 8, 10]);
        const list = Array.from({ length: n }, (_, i) => start + i * gap);
        const total = list.reduce((a, b) => a + b, 0);
        const mean = R(total).div(R(n));
        const mid = R(list[Math.floor((n - 1) / 2)]! + list[Math.floor(n / 2)]!).div(R(2));
        const askSum = rng.chance(0.5);
        if (askSum) {
          const other = nearby(rng, R(total), gap);
          return fixed(`${n} evenly spaced numbers start at ${start}, with gaps of ${gap}.`, 'their sum', num(other), R(total), other, `The mean is the middle: ${num(mid)}. Sum = ${n} × ${num(mid)} = ${num(total)}`);
        }
        return fixed(`${n} evenly spaced numbers start at ${start}, with gaps of ${gap}.`, 'their mean', 'their median', mean, mid, 'In an evenly spaced list, the mean and median are the same');
      }
      const n = by(d, 5, 6, 6);
      const set = new Set<number>();
      while (set.size < n) set.add(rng.int(2, 60));
      const list = [...set];
      const s = [...list].sort((a, b) => a - b);
      const total = list.reduce((a, b) => a + b, 0);
      const mean = R(total).div(R(n));
      const median = R(s[Math.floor((n - 1) / 2)]! + s[Math.floor(n / 2)]!).div(R(2));
      const text = list.join(', ');
      if (d === 1 && rng.chance(0.5)) {
        const range = s[n - 1]! - s[0]!;
        return fixed(`The list is ${text}.`, 'the range', num(median), R(range), median, `Range: ${s[n - 1]} − ${s[0]} = ${range}. Median: ${num(median)}`);
      }
      return fixed(`The list is ${text}.`, 'the mean', 'the median', mean, median, `Mean: ${total} ÷ ${n} = ${value(mean)}. Median: ${num(median)}`);
    },
  }),

  t({
    id: 'cmp-geometry',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const w = rng.int(2, 15);
        const l = rng.int(w + 1, 20);
        const area = l * w;
        const perimeter = 2 * (l + w);
        return fixed(`A rectangle is ${l} by ${w}.`, 'its area', 'its perimeter', R(area), R(perimeter), `Area: ${l} × ${w} = ${area}. Perimeter: 2 × (${l} + ${w}) = ${perimeter}`);
      }
      if (d === 2) {
        const a = rng.int(3, 15);
        const b = rng.int(a + 1, 20);
        const low = b - a;
        const high = a + b;
        const kind = rng.int(0, 2);
        const given = `A triangle has sides ${a}, ${b} and c.`;
        const inside = Array.from({ length: 2 * (high - low) - 1 }, (_, i) => R(low).add(R(i + 1, 2)));
        const [bText, b2] = kind === 0 ? [`${high}`, R(high)] : kind === 1 ? [`${low}`, R(low)] : [`${b}`, R(b)];
        return compareDraft(given, 'c', bText, relationOf(inside.map((c) => [c, b2] as const)), `A third side lies between ${b} − ${a} = ${low} and ${b} + ${a} = ${high}${kind === 2 ? `, which includes values either side of ${b}` : ''}`);
      }
      const s = rng.int(2, 20);
      const circle = PI.mul(R(s * s)).div(R(4));
      if (rng.chance(0.5)) {
        const left = R(s * s).sub(circle);
        return fixed(`A circle just fits inside a square of side ${s}.`, 'the square’s area left outside the circle', `${num(R(s * s).div(R(4)))}`, left, R(s * s).div(R(4)), `The circle takes π/4 of the square, about 0.79, so about 0.21 of it is left: ${num(left.round('tenth'))}`);
      }
      const r = rng.int(2, 15);
      const m = rng.int(5, 8);
      return fixed(`A circle has radius ${r}.`, 'its circumference', `${m * r}`, PI.mul(R(2 * r)), R(m * r), `2π × ${r} is about 6.28 × ${r}, compared with ${m} × ${r}`);
    },
  }),

  t({
    id: 'cmp-numbers',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const factors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((x) => n % x === 0).length;
      if (d === 1) {
        const a = rng.int(12, 100);
        const b = rng.int(12, 100);
        if (a === b) return null;
        return fixed('', `the number of positive factors of ${a}`, `the number of positive factors of ${b}`, R(factors(a)), R(factors(b)), `${a} has ${factors(a)} factors and ${b} has ${factors(b)}`);
      }
      if (d === 2) {
        const a = rng.int(50, 400);
        const m = rng.pick([6, 7, 8, 9, 11, 12]);
        const k = rng.pick([3, 4, 5, 7, 9, 10]);
        if (m === k) return null;
        return fixed('', `the remainder when ${a} is divided by ${m}`, `the remainder when ${a} is divided by ${k}`, R(a % m), R(a % k), `${a} leaves ${a % m} after dividing by ${m}, and ${a % k} after dividing by ${k}`);
      }
      const m = rng.pick([4, 6, 8, 9, 10, 12]);
      const k = rng.pick([2, 3, 4, 5]);
      if (m === k) return null;
      const multiple = m % k === 0;
      const cases = Array.from({ length: 60 }, (_, i) => i + 1).map((n) => [R(n % m), R(n % k)] as const);
      if (multiple && rng.chance(0.5)) {
        const list = Array.from({ length: 30 }, (_, i) => m * (i + 1));
        return compareDraft(`n is a positive multiple of ${m}.`, `the remainder when n is divided by ${k}`, '0', relationOf(list.map((n) => [R(n % k), R(0)] as const)), `${m} is a multiple of ${k}, so any multiple of ${m} leaves 0`);
      }
      return compareDraft('n is a positive integer.', `the remainder when n is divided by ${m}`, `the remainder when n is divided by ${k}`, relationOf(cases), `It depends on n. At n = 1 both leave 1, and at n = ${k} they differ`);
    },
  }),

  t({
    id: 'cmp-count',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = rng.int(6, 14);
      const k = rng.int(2, Math.min(4, n - 2));
      if (d === 1) {
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        const c = rng.int(2, 9);
        const e = rng.int(2, 9);
        if (a * b === c * e && rng.chance(0.5)) return null;
        return fixed('', `the outfits from ${a} shirts and ${b} hats`, `the outfits from ${c} shirts and ${e} hats`, R(a * b), R(c * e), `Multiply each: ${a} × ${b} = ${a * b}, and ${c} × ${e} = ${c * e}`);
      }
      if (d === 2) {
        const other = rng.chance(0.5) ? n - k : k + 1;
        return fixed('', `groups of ${k} from ${n} people`, `groups of ${other} from ${n} people`, R(choose(n, k)), R(choose(n, other)), other === n - k ? `Choosing ${k} to join is the same as choosing ${n - k} to leave out` : `${num(choose(n, k))} groups, compared with ${num(choose(n, other))}`);
      }
      const red = rng.int(2, 9);
      const blue = rng.int(2, 9);
      const total = red + blue;
      return fixed(`A bag holds ${red} red and ${blue} blue marbles. Two are drawn. What is the chance both are red?`, 'putting the first back', 'not putting it back', R(red * red, total * total), R(red * (red - 1), total * (total - 1)), `Putting it back keeps the same odds: ${red}/${total} × ${red}/${total}. Not putting it back lowers the second: ${red}/${total} × ${red - 1}/${total - 1}`);
    },
  }),
];
