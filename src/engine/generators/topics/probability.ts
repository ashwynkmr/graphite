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

  t({
    id: 'pb-sets',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const total = rng.int(4, 20) * 5;
      const a = rng.int(Math.floor(total * 0.4), Math.floor(total * 0.8));
      const b = rng.int(Math.floor(total * 0.3), Math.floor(total * 0.7));
      if (d === 3) {
        const least = a + b - total;
        if (least <= 0) return null;
        return {
          prompt: `Of ${total} students, ${a} study French and ${b} study Spanish. What is the least number who could study both?`,
          answer: R(least),
          distractors: [Math.min(a, b), total - a, total - b, least + 1, least + 2].map((x) => R(x)),
          explain: `If as few overlap as possible, everyone studies at least one: ${a} + ${b} − ${total} = ${least}`,
        };
      }
      const both = rng.int(2, Math.max(2, Math.floor(Math.min(a, b) / 2)));
      const any = a + b - both;
      if (any >= total) return null;
      if (d === 1) {
        const ans = total - any;
        return {
          prompt: `Of ${total} students, ${a} study French, ${b} study Spanish and ${both} study both. How many study neither?`,
          answer: R(ans),
          distractors: [total - a - b > 0 ? total - a - b : ans + both + 1, ans + both, ans - 1, ans + 1, both].map((x) => R(x)),
          explain: `Those who study at least one: ${a} + ${b} − ${both} = ${any}. ${total} − ${any} = ${ans}`,
        };
      }
      const ans = R(any - both).div(R(total));
      const wrong = asProbabilities(ans, [R(any).div(R(total)), R(both).div(R(total)), R(total - any).div(R(total)), R(a).div(R(total)), ...nearFractions(ans)]);
      return {
        prompt: `Of ${total} students, ${a} study French, ${b} study Spanish and ${both} study both. One is picked at random. What is the probability they study exactly one?`,
        answer: ans,
        format: 'fraction',
        exactChoices: true,
        distractors: wrong,
        explain: `Only French: ${a - both}. Only Spanish: ${b - both}. That's ${any - both} of ${total}: ${frac(ans)}`,
      };
    },
  }),

  t({
    id: 'pb-independent',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = R(rng.int(1, 3), rng.pick([4, 5, 6, 8, 10]));
      const q = R(rng.int(1, 3), rng.pick([3, 4, 5, 7, 9]));
      const notP = R(1).sub(p);
      const notQ = R(1).sub(q);
      const both = p.mul(q);
      const neither = notP.mul(notQ);
      const one = R(1).sub(both).sub(neither);
      const [ans, ask, how] =
        d === 1
          ? [both, 'both happen', `Independent, so multiply: ${frac(p)} × ${frac(q)} = ${frac(both)}`]
          : d === 2
            ? [neither, 'neither happens', `Multiply the chances of not happening: ${frac(notP)} × ${frac(notQ)} = ${frac(neither)}`]
            : [one, 'exactly one happens', `Both ways: ${frac(p)} × ${frac(notQ)} + ${frac(notP)} × ${frac(q)} = ${frac(one)}`];
      const wrong = asProbabilities(ans, [both, neither, one, p.add(q), R(1).sub(ans), ...nearFractions(ans)]);
      return {
        prompt: `Two independent events have probabilities ${frac(p)} and ${frac(q)}. What is the probability ${ask}?`,
        answer: ans,
        format: 'fraction',
        exactChoices: true,
        distractors: wrong,
        explain: how,
      };
    },
  }),

  t({
    id: 'pb-arrange',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
      if (d === 1) {
        const n = rng.int(5, 12);
        const k = rng.int(2, 3);
        const ans = perm(n, k);
        return {
          prompt: `A code uses ${k} different letters from a set of ${n}, and order matters. How many codes are possible?`,
          answer: R(ans),
          distractors: [n ** k, choose(n, k), n * k, ans + n].map((x) => R(x)),
          explain: `${Array.from({ length: k }, (_, i) => n - i).join(' × ')} = ${num(ans)}`,
        };
      }
      if (d === 2) {
        const word = rng.pick(['LEVEL', 'TOOTH', 'BANANA', 'PEPPER', 'SEEDED', 'NOODLE', 'COFFEE', 'LITTLE', 'MISSES', 'ARRAY', 'TEETH', 'PIZZA', 'GEESE', 'CANNON']);
        const counts = new Map<string, number>();
        for (const c of word) counts.set(c, (counts.get(c) ?? 0) + 1);
        const repeats = [...counts.values()].filter((x) => x > 1);
        const below = repeats.map((x) => fact(x)).reduce((a, b) => a * b, 1);
        const ans = fact(word.length) / below;
        return {
          prompt: `How many different arrangements are there of the letters in ${word}?`,
          answer: R(ans),
          distractors: [fact(word.length), fact(word.length) / repeats[0]!, ans * 2, ans + word.length].map((x) => R(x)),
          explain: `${word.length}! = ${num(fact(word.length))}. Repeated letters can swap unseen, so divide by ${repeats.map((x) => `${x}!`).join(' × ')}: ${num(ans)}`,
        };
      }
      const n = rng.int(4, 8);
      const together = fact(n - 1) * 2;
      const apart = rng.chance(0.5);
      const ans = apart ? fact(n) - together : together;
      return {
        prompt: `${n} people sit in a row. In how many ways can they sit if two of them must ${apart ? 'not sit' : 'sit'} next to each other?`,
        answer: R(ans),
        distractors: [fact(n), fact(n - 1), apart ? together : fact(n) - together, ans + n].map((x) => R(x)),
        explain: apart ? `All ways: ${num(fact(n))}. Pair together: ${n - 1}! × 2 = ${num(together)}. ${num(fact(n))} − ${num(together)} = ${num(ans)}` : `Treat the pair as one seat: ${n - 1}! ways, × 2 for the pair's order = ${num(ans)}`,
      };
    },
  }),
];
