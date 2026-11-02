import { R, Rational } from '../../matching/rational';
import { frac, num } from '../format';
import type { Template } from '../types';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'probability',
  kind: 'word',
  ...x,
});

export function choose(n: number, k: number): number {
  let out = 1;
  for (let i = 1; i <= k; i++) out = (out * (n - k + i)) / i;
  return Math.round(out);
}

function perm(n: number, k: number): number {
  let out = 1;
  for (let i = 0; i < k; i++) out *= n - i;
  return out;
}

/** Keeps only wrong options a probability could be: above 0, below 1. */
function asProbabilities(answer: Rational, xs: Rational[]): Rational[] {
  return xs.filter((x) => x.cmp(R(0)) > 0 && x.cmp(R(1)) < 0 && !x.equals(answer));
}

/** Near misses over nearby denominators, to fill out the options. */
function nearFractions(a: Rational): Rational[] {
  const n = a.n;
  const d = a.d;
  return [
    [n + 1n, d],
    [n, d + 1n],
    [n + 1n, d + 1n],
    [n, d + 2n],
    [n + 2n, d + 1n],
    [n > 1n ? n - 1n : n + 3n, d],
  ].map(([x, y]) => Rational.of(x!, y!));
}

const COLORS: [string, string][] = [['red', 'blue'], ['green', 'white'], ['black', 'yellow']];

export const probability: Template[] = [
  t({
    id: 'pb-count',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(3, 9);
        const b = rng.int(3, 9);
        const c = rng.int(2, 7);
        const ans = a * b * c;
        return {
          prompt: `A menu has ${a} starters, ${b} mains and ${c} desserts. How many different meals of one of each are possible?`,
          answer: R(ans),
          distractors: [a + b + c, a * b, a * c + b, b * c + a, ans + a].map((x) => R(x)),
          explain: `One choice from each group multiplies: ${a} × ${b} × ${c} = ${ans}`,
        };
      }
      if (d === 2) {
        const n = rng.int(5, 14);
        const k = rng.int(2, 4);
        if (rng.chance(0.5)) {
          const ans = choose(n, k);
          return {
            prompt: `How many different groups of ${k} can be chosen from ${n} people?`,
            answer: R(ans),
            distractors: [perm(n, k), n * k, choose(n, k - 1), choose(n + 1, k), ans + n].map((x) => R(x)),
            explain: `Order doesn't matter, so divide: (${Array.from({ length: k }, (_, i) => n - i).join(' × ')}) ÷ (${Array.from({ length: k }, (_, i) => k - i).join(' × ')}) = ${num(ans)}`,
          };
        }
        const ans = perm(n, k);
        const roles = ['a chair', 'a deputy', 'a treasurer', 'a secretary'].slice(0, k);
        return {
          prompt: `From ${n} people, how many ways can ${roles.slice(0, -1).join(', ')} and ${roles[k - 1]} be chosen, if nobody holds two roles?`,
          answer: R(ans),
          distractors: [choose(n, k), n ** k, n * k, ans + n, perm(n, k - 1)].map((x) => R(x)),
          explain: `Each role has one person fewer to choose from, and order matters: ${Array.from({ length: k }, (_, i) => n - i).join(' × ')} = ${num(ans)}`,
        };
      }
      const a = rng.int(4, 9);
      const b = rng.int(4, 9);
      const x = rng.int(2, 3);
      const y = rng.int(1, 3);
      const left = choose(a, x);
      const right = choose(b, y);
      const ans = left * right;
      return {
        prompt: `A team of ${x} adults and ${y} ${y === 1 ? 'child' : 'children'} is chosen from ${a} adults and ${b} children. How many different teams are possible?`,
        answer: R(ans),
        distractors: [left + right, choose(a + b, x + y), perm(a, x) * perm(b, y), a * x * b * y, ans + left].map((v) => R(v)),
        explain: `Choose each group, then multiply: ${left} ways for the adults × ${right} for the children = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'pb-bag',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [first, second] = rng.pick(COLORS);
      if (d === 1) {
        const a = rng.int(3, 15);
        const b = rng.int(3, 15);
        const c = rng.int(2, 12);
        const total = a + b + c;
        const not = rng.chance(0.5);
        const ans = R(not ? total - a : a).div(R(total));
        const wrong = asProbabilities(ans, [R(a).div(R(total)), R(total - a).div(R(total)), R(a).div(R(b + c)), R(b).div(R(total)), R(c).div(R(total)), ...nearFractions(ans)]);
        return {
          prompt: `A bag holds ${a} ${first}, ${b} ${second} and ${c} grey marbles. One is drawn at random. What is the probability it is ${not ? `not ${first}` : first}?`,
          answer: ans,
          format: 'fraction',
          exactChoices: true,
          distractors: wrong,
          explain: not ? `${b} + ${c} = ${b + c} of the ${total} marbles aren't ${first}: ${frac(ans)}` : `${a} of the ${total} marbles are ${first}: ${frac(ans)}`,
        };
      }
      const a = rng.int(3, 10);
      const b = rng.int(3, 10);
      const total = a + b;
      const both = R(a * (a - 1)).div(R(total * (total - 1)));
      const none = R(b * (b - 1)).div(R(total * (total - 1)));
      const withReturn = R(a * a).div(R(total * total));
      if (d === 2) {
        const wrong = asProbabilities(both, [withReturn, R(a * 2).div(R(total)), R(a).div(R(total)), R(a * (a - 1)).div(R(total * total)), none, ...nearFractions(both)]);
        return {
          prompt: `A bag holds ${a} ${first} and ${b} ${second} marbles. Two are drawn without putting back. What is the probability both are ${first}?`,
          answer: both,
          format: 'fraction',
          exactChoices: true,
          distractors: wrong,
          explain: `One fewer marble each time: ${a}/${total} × ${a - 1}/${total - 1} = ${frac(both)}`,
        };
      }
      const ans = R(1).sub(none);
      const wrong = asProbabilities(ans, [both, R(1).sub(R(b * b).div(R(total * total))), none, R(a).div(R(total)), R(1).sub(both), ...nearFractions(ans)]);
      return {
        prompt: `A bag holds ${a} ${first} and ${b} ${second} marbles. Two are drawn without putting back. What is the probability at least one is ${first}?`,
        answer: ans,
        format: 'fraction',
        exactChoices: true,
        distractors: wrong,
        explain: `"At least one" is 1 minus "none": 1 − (${b}/${total} × ${b - 1}/${total - 1}) = ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'pb-outcomes',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const n = rng.int(10, 60);
        const k = rng.pick([3, 4, 5, 6, 7, 8]);
        const hits = Math.floor(n / k);
        const ans = R(hits).div(R(n));
        const wrong = asProbabilities(ans, [R(1).div(R(k)), R(hits + 1).div(R(n)), R(n - hits).div(R(n)), R(hits).div(R(n - hits)), ...nearFractions(ans)]);
        return {
          prompt: `A card is drawn from ${n} cards numbered 1 to ${n}. What is the probability its number is a multiple of ${k}?`,
          answer: ans,
          format: 'fraction',
          exactChoices: true,
          distractors: wrong,
          explain: `${n} ÷ ${k} gives ${hits} multiples among ${n} cards: ${frac(ans)}`,
        };
      }
      if (d === 2) {
        if (rng.chance(0.5)) {
          const target = rng.int(4, 10);
          const atLeast = rng.chance(0.5);
          let hits = 0;
          for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (atLeast ? x + y >= target : x + y === target) hits++;
          const ans = R(hits).div(R(36));
          const wrong = asProbabilities(ans, [R(hits).div(R(12)), R(hits + 1).div(R(36)), R(hits - 1).div(R(36)), R(36 - hits).div(R(36)), ...nearFractions(ans)]);
          return {
            prompt: `Two fair dice are rolled. What is the probability the sum is ${atLeast ? `at least ${target}` : `exactly ${target}`}?`,
            answer: ans,
            format: 'fraction',
            exactChoices: true,
            distractors: wrong,
            explain: `Of the 36 outcomes, ${hits} give ${atLeast ? `a sum of ${target} or more` : `a sum of ${target}`}: ${frac(ans)}`,
          };
        }
        const n = rng.int(3, 6);
        const k = rng.int(1, n - 1);
        const ways = choose(n, k);
        const all = 2 ** n;
        const ans = R(ways).div(R(all));
        const wrong = asProbabilities(ans, [R(1).div(R(all)), R(k).div(R(n)), R(ways).div(R(2 * n)), R(ways + 1).div(R(all)), ...nearFractions(ans)]);
        return {
          prompt: `A fair coin is tossed ${n} times. What is the probability of exactly ${k} ${k === 1 ? 'head' : 'heads'}?`,
          answer: ans,
          format: 'fraction',
          exactChoices: true,
          distractors: wrong,
          explain: `${all} outcomes in all, and ${ways} ways to place ${k} ${k === 1 ? 'head' : 'heads'}: ${ways}/${all} = ${frac(ans)}`,
        };
      }
      const n = rng.int(6, 40);
      const evens = Math.floor(n / 2);
      const odds = n - evens;
      const same = choose(evens, 2) + choose(odds, 2);
      const pairs = choose(n, 2);
      const wantEven = rng.chance(0.5);
      const hits = wantEven ? same : pairs - same;
      const ans = R(hits).div(R(pairs));
      const wrong = asProbabilities(ans, [R(1).div(R(2)), R(pairs - hits).div(R(pairs)), R(hits).div(R(n * n)), R(evens).div(R(n)), ...nearFractions(ans)]);
      return {
        prompt: `Two different numbers are picked at random from the integers 1 to ${n}. What is the probability their sum is ${wantEven ? 'even' : 'odd'}?`,
        answer: ans,
        format: 'fraction',
        exactChoices: true,
        distractors: wrong,
        explain: `There are ${evens} even and ${odds} odd numbers, so ${num(pairs)} pairs. An even sum needs two alike: ${choose(evens, 2)} + ${choose(odds, 2)} = ${same}. ${wantEven ? `${same}/${num(pairs)}` : `${num(pairs)} − ${same} = ${hits} odd, so ${hits}/${num(pairs)}`} = ${frac(ans)}`,
      };
    },
  }),
];
