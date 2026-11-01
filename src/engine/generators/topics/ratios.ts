import { R, Rational } from '../../matching/rational';
import { frac, num, pct } from '../format';
import type { Template } from '../types';
import { by, fill, gcdNum } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'ratios',
  kind: 'calc',
  ...x,
});

type Rng = Parameters<Template['generate']>[0];

/** A two-part ratio a:b in lowest terms with a ≠ b, both ≥ minPart, and a + b in [minSum, maxSum]. */
function ratio2(rng: Rng, minSum: number, maxSum: number, minPart = 2): [number, number] {
  const pairs: [number, number][] = [];
  for (let a = minPart; a < maxSum; a++) {
    for (let b = minPart; a + b <= maxSum; b++) {
      if (a !== b && a + b >= minSum && gcdNum(a, b) === 1) pairs.push([a, b]);
    }
  }
  return rng.pick(pairs);
}

const GROUPS: [string, string, string][] = [
  ['boys', 'girls', 'students'],
  ['red marbles', 'blue marbles', 'marbles'],
  ['cats', 'dogs', 'animals'],
  ['fiction books', 'non-fiction books', 'books'],
  ['adults', 'children', 'people'],
  ['vans', 'cars', 'vehicles'],
];

export const ratios: Template[] = [
  t({
    id: 'ra-split',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 2) {
        // Three-part split
        const parts = [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)];
        const sum = parts[0]! + parts[1]! + parts[2]!;
        if (new Set(parts).size < 3 || sum > 15) return null;
        const k = rng.int(4, 30);
        const total = sum * k;
        const i = rng.int(0, 2);
        const ans = R(parts[i]! * k);
        const which = ['first', 'second', 'third'][i]!;
        return {
          prompt: `Split ${num(total)} in the ratio ${parts.join(' : ')}. What is the ${which} share?`,
          answer: ans,
          distractors: [R(k), R(total).mul(R(parts[i]!, parts[(i + 1) % 3]!)), R(parts[(i + 1) % 3]! * k), R(parts[(i + 2) % 3]! * k), ans.add(R(k))],
          explain: `${parts.join(' + ')} = ${sum} parts; one part = ${num(total)} ÷ ${sum} = ${k}; ${parts[i]} × ${k} = ${num(ans)}`,
        };
      }
      const r = by(d, ratio2(rng, 3, 10), null, ratio2(rng, 11, 20));
      if (!r) return null;
      const [a, b] = r;
      const k = by(d, rng.int(2, 20), 0, rng.int(15, 80));
      const total = (a + b) * k;
      const larger = rng.chance(0.6);
      const mine = larger ? Math.max(a, b) : Math.min(a, b);
      const other = larger ? Math.min(a, b) : Math.max(a, b);
      const ans = R(mine * k);
      return {
        prompt: `Split ${num(total)} in the ratio ${a} : ${b}. What is the ${larger ? 'larger' : 'smaller'} share?`,
        answer: ans,
        distractors: [R(other * k), R(k), R(total).mul(R(mine, other)), ans.add(R(k)), ans.sub(R(k))],
        explain: `${a} + ${b} = ${a + b} parts; one part = ${num(total)} ÷ ${a + b} = ${k}; ${mine} × ${k} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-scale',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const s = by(d, rng.pick([2, 4, 5]), rng.pick([3, 4, 6, 8]), rng.pick([6, 8, 12, 15]));
      const tt = by(d, s * rng.int(2, 5), rng.int(2, 20), rng.int(2, 40));
      const q = by(d, R(rng.int(1, 6)), R(rng.int(1, 9)), R(rng.int(3, 15), 2));
      if (tt === s || q.equals(R(s))) return null;
      const ans = q.mul(R(tt, s));
      const places = ans.decimalPlaces();
      if (places === null || places > by(d, 0, 1, 2)) return null;
      const [scene, unit] = rng.pick<[string, string]>([
        ['A recipe uses {q} cups of flour for {s} servings. How many cups for {t} servings?', 'cups'],
        ['{q} liters of paint cover {s} square meters. How many liters cover {t} square meters?', 'liters'],
        ['{q} kg of rice feeds {s} people. How many kg feeds {t} people?', 'kg'],
        ['A gardener uses {q} bags of soil for {s} planters. How many bags for {t} planters?', 'bags'],
        ['A machine fills {q} boxes in {s} minutes. How many boxes in {t} minutes?', 'boxes'],
        ['{q} cups of sugar make {s} dozen cookies. How many cups make {t} dozen?', 'cups'],
      ]);
      return {
        prompt: fill(scene, { q: num(q), s: String(s), t: String(tt) }),
        answer: ans,
        unit: { suffix: unit },
        distractors: [q.mul(R(s, tt)), q.add(R(tt - s)), q.mul(R(tt)), ans.add(q)],
        explain: `Per unit: ${num(q)} ÷ ${s} = ${num(q.div(R(s)))}; × ${tt} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-part-whole',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [g1, g2, all] = rng.pick(GROUPS);
      if (d === 3) {
        const parts = [rng.int(1, 7), rng.int(1, 7), rng.int(1, 7)];
        if (new Set(parts).size < 3) return null;
        const sum = parts[0]! + parts[1]! + parts[2]!;
        const k = rng.int(3, 15);
        const known = parts[1]! * k;
        const ans = R(sum * k);
        return {
          prompt: `Small, medium and large boxes are in the ratio ${parts.join(' : ')}. There are ${known} medium boxes. How many boxes in all?`,
          answer: ans,
          distractors: [R(known + parts[0]! + parts[2]!), R((parts[0]! + parts[2]!) * k), R(known * sum), ans.add(R(k))],
          explain: `${known} ÷ ${parts[1]} = ${k} per part; ${sum} parts × ${k} = ${num(ans)}`,
        };
      }
      const r = ratio2(rng, 3, by(d, 9, 15, 15));
      if (!r) return null;
      const [a, b] = r;
      const k = by(d, rng.int(2, 12), rng.int(3, 20), 0);
      const known = b * k;
      const askTotal = d === 1 || rng.chance(0.5);
      const ans = askTotal ? R((a + b) * k) : R(a * k);
      return {
        prompt: `The ratio of ${g1} to ${g2} is ${a} : ${b}. There are ${known} ${g2}. How many ${askTotal ? `${all} are there in all` : `${g1} are there`}?`,
        answer: ans,
        distractors: askTotal
          ? [R(a * k), R(known + a), R(known).mul(R(a + b, a)), ans.add(R(k))]
          : [R((a + b) * k), R(known).mul(R(b, a)), R(known - b + a), ans.add(R(k))],
        explain: `${known} ÷ ${b} = ${k} per part; ${askTotal ? `${a + b} parts × ${k}` : `${a} × ${k}`} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-missing',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const r = ratio2(rng, 3, by(d, 10, 14, 14));
      if (!r) return null;
      const [a, b] = r;
      const m = rng.int(2, by(d, 6, 9, 9));
      if (d === 1) {
        return {
          prompt: `${a} : ${b} = ? : ${b * m}`,
          answer: R(a * m),
          distractors: [R(a + b * m - b), R(b * m * b).div(R(a)), R(a * m + 1), R(a * m - 1)],
          explain: `${b * m} ÷ ${b} = ${m}, so ? = ${a} × ${m} = ${a * m}`,
        };
      }
      if (d === 2) {
        // Unreduced left side: reduce, then scale.
        const u = rng.int(2, 5);
        if (u === m) return null;
        return {
          prompt: `${a * u} : ${b * u} = ? : ${b * m}`,
          answer: R(a * m),
          distractors: [R(a * u + b * m - b * u), R(a * m + 1), R(a * u), R(b * m - a * m)],
          explain: `${a * u} : ${b * u} = ${a} : ${b}; ${b * m} ÷ ${b} = ${m}, so ? = ${a} × ${m} = ${a * m}`,
        };
      }
      // Decimals: 4.5 : 6 = ? : 20
      const left = R(a * 3, 2);
      const right = R(b * 3, 2);
      const target = R(b * m);
      const ans = left.mul(target).div(right);
      if (!ans.isInteger()) return null;
      return {
        prompt: `${num(left)} : ${num(right)} = ? : ${num(target)}`,
        answer: ans,
        distractors: [left.add(target.sub(right)), right.mul(target).div(left), ans.add(R(1)), ans.mul(R(10))],
        explain: `${num(left)} : ${num(right)} = ${a} : ${b}; ${num(target)} ÷ ${b} = ${m}, so ? = ${a} × ${m} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-combine',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = rng.int(1, 9);
      const q = rng.int(2, 9);
      const rr = d === 1 ? q : rng.int(2, 9);
      const s = rng.int(1, 9);
      if (gcdNum(p, q) !== 1 || gcdNum(rr, s) !== 1 || p === q || rr === s) return null;
      if (d === 2 && rr === q) return null;
      if (d === 3 && rr === q) return null;
      const ac = R(p * rr, q * s);
      const reverse = d === 3;
      const ans = reverse ? R(1).div(ac) : ac;
      const L = q * rr / gcdNum(q, rr);
      const pa = p * (L / q);
      const pc = s * (L / rr);
      return {
        prompt: `a : b = ${p} : ${q} and b : c = ${rr} : ${s}. What is ${reverse ? 'c/a' : 'a/c'} as a fraction?`,
        answer: ans,
        format: 'fraction',
        distractors: [reverse ? R(s, p) : R(p, s), R(1).div(ans), reverse ? R(q * s, p * rr).mul(R(1)) : R(p * s, q * rr), ans.add(R(1, ans.d))],
        explain: `Match b at ${L}: a : b : c = ${pa} : ${L} : ${pc}, so ${reverse ? 'c/a' : 'a/c'} = ${reverse ? `${pc}/${pa}` : `${pa}/${pc}`}${frac(ans) === (reverse ? `${pc}/${pa}` : `${pa}/${pc}`) ? '' : ` = ${frac(ans)}`}`,
      };
    },
  }),

  t({
    id: 'ra-map-scale',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [unitSmall, unitBig, scales] = rng.pick<[string, string, number[]]>(
        d === 3
          ? [
              ['cm', 'km', [5, 10, 20, 25, 50]],
              ['inch', 'miles', [4, 8, 10, 15, 20]],
            ]
          : [
              ['cm', 'km', [5, 10, 20, 25, 50]],
              ['inch', 'miles', [4, 8, 10, 15, 20]],
              ['cm', 'km', [2, 4, 40, 100]],
            ],
      );
      const scale = R(rng.pick(scales));
      if (d === 3) {
        // Reverse: real distance to map distance.
        const map = R(rng.int(11, 79), 10);
        const real = map.mul(scale);
        if (!real.isInteger()) return null;
        return {
          prompt: `On a map, 1 ${unitSmall} represents ${num(scale)} ${unitBig}. Two towns are ${num(real)} ${unitBig} apart. How far apart are they on the map, in ${unitSmall === 'inch' ? 'inches' : unitSmall}?`,
          answer: map,
          unit: { suffix: unitSmall === 'inch' ? 'inches' : unitSmall },
          distractors: [real.mul(scale), map.mul(R(10)), map.div(R(10)), map.add(R(1))],
          explain: `${num(real)} ÷ ${num(scale)} = ${num(map)}`,
        };
      }
      const map = d === 1 ? R(rng.int(2, 12)) : R(rng.int(11, 99), 10);
      const ans = map.mul(scale);
      return {
        prompt: `On a map, 1 ${unitSmall} represents ${num(scale)} ${unitBig}. How many ${unitBig} does ${num(map)} ${unitSmall === 'inch' ? (map.equals(R(1)) ? 'inch' : 'inches') : unitSmall} represent?`,
        answer: ans,
        unit: { suffix: unitBig },
        distractors: [ans.mul(R(10)), ans.div(R(10)), map.add(scale), scale.div(map)],
        explain: `${num(map)} × ${num(scale)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-difference',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const gap = by(d, 1, rng.int(2, 3), rng.int(2, 4));
      const b = rng.int(1, 9);
      const a = b + gap;
      if (gcdNum(a, b) !== 1) return null;
      const k = rng.int(by(d, 2, 3, 4), by(d, 12, 20, 25));
      const diff = gap * k;
      const [name1, name2] = rng.pick([['Maya', 'Leo'], ['Priya', 'Sam'], ['Ana', 'Omar'], ['Kenji', 'Zara']]);
      // [past tense, base verb, noun]; a null noun means money.
      const [past, base, noun] = rng.pick<[string, string, string | null]>([
        ['saved', 'save', null],
        ['collected', 'collect', 'stamps'],
        ['read', 'read', 'pages'],
        ['ran', 'run', 'km'],
        ['picked', 'pick', 'apples'],
        ['sold', 'sell', 'tickets'],
      ]);
      const askTotal = d === 3;
      const ans = askTotal ? R((a + b) * k) : R(a * k);
      const intro = `${name1} and ${name2} ${past} ${noun ?? 'money'} in the ratio ${a} : ${b}.`;
      const more = noun ? `${name1} ${past} ${diff} more ${noun} than ${name2}.` : `${name1} ${past} $${diff} more than ${name2}.`;
      const howMuch = noun ? `How many ${noun}` : 'How much';
      const ask = askTotal ? `${howMuch} did they ${base} together?` : `${howMuch} did ${name1} ${base}?`;
      return {
        prompt: `${intro} ${more} ${ask}`,
        answer: ans,
        unit: noun ? (noun === 'km' ? { suffix: 'km' } : undefined) : { prefix: '$' },
        distractors: askTotal ? [R(a * k), R(diff * (a + b)), R(b * k), ans.add(R(diff))] : [R(b * k), R(diff * a), R((a + b) * k), ans.add(R(diff))],
        explain: `The gap is ${a} − ${b} = ${gap} part${gap > 1 ? 's' : ''} = ${diff}, so one part = ${k}; ${askTotal ? `${a + b} parts` : `${a} parts`} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-to-fraction',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 2) {
        const parts = [rng.int(1, 7), rng.int(1, 7), rng.int(1, 7)];
        if (new Set(parts).size < 3) return null;
        const sum = parts[0]! + parts[1]! + parts[2]!;
        const i = rng.int(0, 2);
        const ans = R(parts[i]!, sum);
        const color = ['red', 'blue', 'green'][i]!;
        return {
          prompt: `Red, blue and green marbles are in the ratio ${parts.join(' : ')}. What fraction of the marbles are ${color}?`,
          answer: ans,
          format: 'fraction',
          distractors: [R(parts[i]!, parts[(i + 1) % 3]!), R(parts[i]!, sum - parts[i]!), R(parts[(i + 1) % 3]!, sum), R(parts[i]!, sum + 1)],
          explain: `${parts.join(' + ')} = ${sum} parts; ${color} is ${parts[i]} of them: ${frac(ans)}`,
        };
      }
      let a: number;
      let b: number;
      if (d === 3) {
        // Sums that give a clean percent.
        const sum = rng.pick([4, 5, 8, 10, 16, 20, 25]);
        a = rng.int(1, sum - 1);
        b = sum - a;
        if (gcdNum(a, sum) !== 1) return null;
      } else {
        [a, b] = ratio2(rng, 3, 10, 1);
      }
      const f = R(a, a + b);
      if (d === 3) {
        const p = f.mul(R(100));
        return {
          prompt: `The ratio of red to blue marbles is ${a} : ${b}. What percent of the marbles are red?`,
          answer: p,
          unit: { suffix: '%' },
          distractors: [R(a, b).mul(R(100)), R(b, a + b).mul(R(100)), p.add(R(5)), p.sub(R(5))],
          explain: `Red is ${a} of ${a + b} parts: ${a}/${a + b} = ${pct(p)}`,
        };
      }
      return {
        prompt: `The ratio of red to blue marbles is ${a} : ${b}. What fraction of the marbles are red?`,
        answer: f,
        format: 'fraction',
        distractors: [R(a, b), R(b, a + b), R(a, a + b + 1), Rational.of(BigInt(a + 1), BigInt(a + b))],
        explain: `Red is ${a} of ${a} + ${b} = ${a + b} parts: ${frac(f)}`,
      };
    },
  }),
];
