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

/** Three distinct parts 1..max with the sum in range. */
function ratio3(rng: Rng, max: number, maxSum: number): number[] | null {
  const parts = [rng.int(1, max), rng.int(1, max), rng.int(1, max)];
  const sum = parts[0]! + parts[1]! + parts[2]!;
  return new Set(parts).size === 3 && sum <= maxSum ? parts : null;
}

const GROUPS: [string, string, string][] = [
  ['boys', 'girls', 'students'],
  ['red marbles', 'blue marbles', 'marbles'],
  ['cats', 'dogs', 'animals'],
  ['fiction books', 'non-fiction books', 'books'],
  ['adults', 'children', 'people'],
  ['vans', 'cars', 'vehicles'],
];

const WHICH = ['first', 'second', 'third'];

export const ratios: Template[] = [
  t({
    id: 'ra-split',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 2) {
        const [a, b] = ratio2(rng, 11, 20);
        const k = rng.int(15, 80);
        const total = (a + b) * k;
        const larger = rng.chance(0.6);
        const mine = larger ? Math.max(a, b) : Math.min(a, b);
        const other = larger ? Math.min(a, b) : Math.max(a, b);
        const ans = R(mine * k);
        return {
          prompt: `Split ${num(total)} in the ratio ${a} : ${b}. What is the ${larger ? 'larger' : 'smaller'} share?`,
          answer: ans,
          distractors: [R(other * k), R(total).mul(R(mine, other)), R(k), ans.add(R(k)), ans.sub(R(k))],
          explain: `${a} + ${b} = ${a + b} parts; one part = ${num(total)} ÷ ${a + b} = ${k}; ${mine} × ${k} = ${num(ans)}`,
        };
      }
      const parts = ratio3(rng, by(d, 6, 0, 12), by(d, 15, 0, 30));
      if (!parts) return null;
      const sum = parts[0]! + parts[1]! + parts[2]!;
      const k = rng.int(by(d, 4, 0, 6), by(d, 30, 0, 60));
      const total = sum * k;
      if (d === 3) {
        const hi = Math.max(...parts);
        const lo = Math.min(...parts);
        const ans = R((hi - lo) * k);
        return {
          prompt: `Split ${num(total)} in the ratio ${parts.join(' : ')}. How much larger is the largest share than the smallest?`,
          answer: ans,
          distractors: [R(hi * k), R(lo * k), R(total).mul(R(hi - lo, hi)), ans.add(R(k)), R(hi - lo)],
          explain: `${sum} parts; one part = ${num(total)} ÷ ${sum} = ${k}; the gap is ${hi} − ${lo} = ${hi - lo} parts = ${num(ans)}`,
        };
      }
      const i = rng.int(0, 2);
      const ans = R(parts[i]! * k);
      return {
        prompt: `Split ${num(total)} in the ratio ${parts.join(' : ')}. What is the ${WHICH[i]} share?`,
        answer: ans,
        distractors: [R(k), R(total).mul(R(parts[i]!, parts[(i + 1) % 3]!)), R(parts[(i + 1) % 3]! * k), R(parts[(i + 2) % 3]! * k), ans.add(R(k))],
        explain: `${parts.join(' + ')} = ${sum} parts; one part = ${num(total)} ÷ ${sum} = ${k}; ${parts[i]} × ${k} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-scale',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Inverse proportion: more workers, less time.
        const [scene, unit] = rng.pick<[string, string]>([
          ['{w1} workers can build a wall in {t1} days. At the same rate, how many days would {w2} workers take?', 'days'],
          ['{w1} pumps empty a tank in {t1} hours. How many hours would {w2} pumps take?', 'hours'],
          ['{w1} machines finish an order in {t1} hours. How many hours would {w2} machines take?', 'hours'],
          ['{w1} painters paint a house in {t1} days. How many days would {w2} painters take?', 'days'],
        ]);
        const w1 = rng.int(3, 12);
        const w2 = rng.int(2, 15);
        const t1 = rng.int(4, 30);
        if (w1 === w2) return null;
        const ans = R(w1 * t1, w2);
        if ((ans.decimalPlaces() ?? 9) > 1) return null;
        return {
          prompt: fill(scene, { w1: String(w1), w2: String(w2), t1: String(t1) }),
          answer: ans,
          unit: { suffix: unit },
          distractors: [R(t1 * w2, w1), R(t1 + w1 - w2), R(t1 - (w2 - w1)), R(w1 * t1)],
          explain: `Total work = ${w1} × ${t1} = ${w1 * t1} worker-${unit}; ÷ ${w2} = ${num(ans)}`,
        };
      }
      const s = by(d, rng.pick([3, 4, 6, 8]), rng.pick([6, 8, 12, 15]), 0);
      const tt = rng.int(2, by(d, 20, 40, 0));
      const q = by(d, R(rng.int(1, 9)), R(rng.int(3, 15), 2), R(0));
      if (tt === s || q.equals(R(s))) return null;
      const ans = q.mul(R(tt, s));
      const places = ans.decimalPlaces();
      if (places === null || places > by(d, 1, 2, 0)) return null;
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
      if (d === 2) {
        const parts = ratio3(rng, 7, 21);
        if (!parts) return null;
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
      const [a, b] = ratio2(rng, 3, by(d, 15, 0, 12));
      if (d === 3) {
        // After x more of the first group join, the ratio becomes p : q. How many in the second group?
        const k = rng.int(2, 12);
        const opts: [number, number, number][] = [];
        for (let x = 1; x <= 4 * k; x++) {
          const g = gcdNum(a * k + x, b * k);
          const p = (a * k + x) / g;
          const q = (b * k) / g;
          if (p + q <= 12 && p !== a) opts.push([x, p, q]);
        }
        if (!opts.length) return null;
        const [x, p, q] = rng.pick(opts);
        const ans = R(b * k);
        return {
          prompt: `The ratio of ${g1} to ${g2} is ${a} : ${b}. After ${x} more ${g1} are added, it becomes ${p} : ${q}. How many ${g2} are there?`,
          answer: ans,
          distractors: [R(a * k), R(a * k + x), R((a + b) * k), R(b * x), ans.add(R(b))],
          explain: `Let one part be k: (${a}k + ${x}) : ${b}k = ${p} : ${q}, so ${q}(${a}k + ${x}) = ${p} × ${b}k → k = ${k}; ${g2} = ${b} × ${k} = ${num(ans)}`,
        };
      }
      const k = rng.int(3, 20);
      const known = b * k;
      const askTotal = rng.chance(0.5);
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
      const [a, b] = ratio2(rng, 3, 14);
      const m = rng.int(2, 9);
      if (d === 1) {
        const u = rng.int(2, 5);
        if (u === m) return null;
        return {
          prompt: `${a * u} : ${b * u} = ? : ${b * m}`,
          answer: R(a * m),
          distractors: [R(a * u + b * m - b * u), R(a * u), R(b * m - a * m), R(a * m + 1)],
          explain: `${a * u} : ${b * u} = ${a} : ${b}; ${b * m} ÷ ${b} = ${m}, so ? = ${a} × ${m} = ${a * m}`,
        };
      }
      if (d === 2) {
        const left = R(a * 3, 2);
        const right = R(b * 3, 2);
        const target = R(b * m);
        const ans = left.mul(target).div(right);
        if (!ans.isInteger()) return null;
        return {
          prompt: `${num(left)} : ${num(right)} = ? : ${num(target)}`,
          answer: ans,
          distractors: [left.add(target.sub(right)), right.mul(target).div(left), ans.mul(R(10)), ans.add(R(1))],
          explain: `${num(left)} : ${num(right)} = ${a} : ${b}; ${num(target)} ÷ ${b} = ${m}, so ? = ${a} × ${m} = ${num(ans)}`,
        };
      }
      // Fraction terms: 3/4 : 5/6 = ? : 20
      const p = R(rng.int(1, 5), rng.pick([2, 3, 4, 5, 6]));
      const q = R(rng.int(1, 5), rng.pick([2, 3, 4, 5, 6, 8]));
      if (p.equals(q) || p.isInteger() || q.isInteger()) return null;
      const ratio = p.div(q);
      const target = ratio.d * BigInt(rng.int(2, 8));
      const ans = ratio.mul(Rational.of(target));
      return {
        prompt: `${frac(p)} : ${frac(q)} = ? : ${target}`,
        answer: ans,
        distractors: [R(1).div(ratio).mul(Rational.of(target)), p.mul(q).mul(Rational.of(target)), ans.add(R(1)), Rational.of(target).sub(ans)],
        explain: `${frac(p)} ÷ ${frac(q)} = ${frac(ratio)}, so the ratio is ${ratio.n} : ${ratio.d}; ${target} ÷ ${ratio.d} = ${Rational.of(target).div(Rational.of(ratio.d)).toString()}, so ? = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-combine',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const p = rng.int(1, 9);
      const q = rng.int(2, 9);
      const rr = rng.int(2, 9);
      const s = rng.int(1, 9);
      if (gcdNum(p, q) !== 1 || gcdNum(rr, s) !== 1 || p === q || rr === s || rr === q) return null;
      const L = (q * rr) / gcdNum(q, rr);
      const pa = p * (L / q);
      const pc = s * (L / rr);
      if (d === 3) {
        // What fraction of a + b + c is b?
        const total = pa + L + pc;
        const ans = R(L, total);
        return {
          prompt: `a : b = ${p} : ${q} and b : c = ${rr} : ${s}. What fraction of a + b + c is b?`,
          answer: ans,
          format: 'fraction',
          distractors: [R(q, p + q), R(rr, rr + s), R(q, p + q + s), R(pa, total), R(pc, total)],
          explain: `Match b at ${L}: a : b : c = ${pa} : ${L} : ${pc}; total ${total}, so b is ${L}/${total}${frac(ans) === `${L}/${total}` ? '' : ` = ${frac(ans)}`}`,
        };
      }
      const reverse = d === 2;
      const ac = R(pa, pc);
      const ans = reverse ? R(1).div(ac) : ac;
      const raw = reverse ? `${pc}/${pa}` : `${pa}/${pc}`;
      return {
        prompt: `a : b = ${p} : ${q} and b : c = ${rr} : ${s}. What is ${reverse ? 'c/a' : 'a/c'} as a fraction?`,
        answer: ans,
        format: 'fraction',
        distractors: [reverse ? R(s, p) : R(p, s), R(1).div(ans), reverse ? R(q * s, p * rr) : R(p * s, q * rr), ans.add(R(1, ans.d))],
        explain: `Match b at ${L}: a : b : c = ${pa} : ${L} : ${pc}, so ${reverse ? 'c/a' : 'a/c'} = ${raw}${frac(ans) === raw ? '' : ` = ${frac(ans)}`}`,
      };
    },
  }),

  t({
    id: 'ra-map-scale',
    kind: 'word',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [unitSmall, unitBig, scales] = rng.pick<[string, string, number[]]>([
        ['cm', 'km', [2, 4, 5, 10, 20, 25, 50]],
        ['inch', 'miles', [4, 8, 10, 15, 20]],
      ]);
      const small = unitSmall === 'inch' ? 'inches' : unitSmall;
      const scale = R(rng.pick(scales));
      if (d === 3) {
        // Area: the scale applies to both sides.
        const w = R(rng.int(2, 12), 2);
        const h = R(rng.int(2, 12), 2);
        const ans = w.mul(scale).mul(h.mul(scale));
        if (!ans.isInteger() || ans.cmp(R(99999)) > 0) return null;
        return {
          prompt: `On a map, 1 ${unitSmall} represents ${num(scale)} ${unitBig}. A park is ${num(w)} ${small} by ${num(h)} ${small} on the map. What is its real area, in square ${unitBig}?`,
          answer: ans,
          unit: { suffix: `sq ${unitBig}` },
          distractors: [w.mul(h).mul(scale), w.add(h).mul(scale), ans.mul(R(2)), w.mul(h).mul(scale).mul(R(2))],
          explain: `Real sides: ${num(w.mul(scale))} × ${num(h.mul(scale))} = ${num(ans)} (the scale applies twice for area)`,
        };
      }
      if (d === 2) {
        const map = R(rng.int(11, 79), 10);
        const real = map.mul(scale);
        if (!real.isInteger()) return null;
        return {
          prompt: `On a map, 1 ${unitSmall} represents ${num(scale)} ${unitBig}. Two towns are ${num(real)} ${unitBig} apart. How far apart are they on the map, in ${small}?`,
          answer: map,
          unit: { suffix: small },
          distractors: [real.mul(scale), map.mul(R(10)), map.div(R(10)), map.add(R(1))],
          explain: `Real distance ÷ the scale: ${num(real)} ÷ ${num(scale)} = ${num(map)}`,
        };
      }
      const map = R(rng.int(11, 99), 10);
      const ans = map.mul(scale);
      return {
        prompt: `On a map, 1 ${unitSmall} represents ${num(scale)} ${unitBig}. How many ${unitBig} does ${num(map)} ${small} represent?`,
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
      const gap = by(d, rng.int(2, 3), rng.int(2, 4), rng.int(1, 4) * 2);
      const b = rng.int(1, 9);
      const a = b + gap;
      if (gcdNum(a, b) !== 1) return null;
      const k = rng.int(3, by(d, 20, 25, 25));
      const [name1, name2] = rng.pick([['Maya', 'Leo'], ['Priya', 'Sam'], ['Ana', 'Omar'], ['Kenji', 'Zara']]);
      if (d === 3) {
        // A transfer that evens them out.
        const x = (gap * k) / 2;
        const ans = R(a * k);
        return {
          prompt: `${name1} and ${name2} have money in the ratio ${a} : ${b}. After ${name1} gives ${name2} $${x}, they have the same amount. How much did ${name1} have at first?`,
          answer: ans,
          unit: { prefix: '$' },
          distractors: [R(b * k), R(x * 2), R((a + b) * k), R(a * k - x), R(x * a)],
          explain: `Equal after giving $${x} means the gap was $${2 * x} = ${gap} parts, so one part = $${k}; ${name1} had ${a} × ${k} = $${num(ans)}`,
        };
      }
      const diff = gap * k;
      // [past tense, base verb, noun]; a null noun means money.
      const [past, base, noun] = rng.pick<[string, string, string | null]>([
        ['saved', 'save', null],
        ['collected', 'collect', 'stamps'],
        ['read', 'read', 'pages'],
        ['ran', 'run', 'km'],
        ['picked', 'pick', 'apples'],
        ['sold', 'sell', 'tickets'],
      ]);
      const askTotal = d === 2;
      const ans = askTotal ? R((a + b) * k) : R(a * k);
      const intro = `${name1} and ${name2} ${past} ${noun ?? 'money'} in the ratio ${a} : ${b}.`;
      const more = noun ? `${name1} ${past} ${diff} more ${noun} than ${name2}.` : `${name1} ${past} $${diff} more than ${name2}.`;
      const howMuch = noun ? `How many ${noun}` : 'How much';
      return {
        prompt: `${intro} ${more} ${askTotal ? `${howMuch} did they ${base} together?` : `${howMuch} did ${name1} ${base}?`}`,
        answer: ans,
        unit: noun ? (noun === 'km' ? { suffix: 'km' } : undefined) : { prefix: '$' },
        distractors: askTotal ? [R(a * k), R(diff * (a + b)), R(b * k), ans.add(R(diff))] : [R(b * k), R(diff * a), R((a + b) * k), ans.add(R(diff))],
        explain: `The gap is ${a} − ${b} = ${gap} parts = ${diff}, so one part = ${k}; ${askTotal ? `${a + b} parts` : `${a} parts`} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ra-to-fraction',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const parts = ratio3(rng, 7, 21);
        if (!parts) return null;
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
      // As a percent; only sums that give a clean percent.
      const sum = rng.pick(d === 2 ? [4, 5, 8, 10, 16, 20, 25] : [8, 16, 20, 25, 40]);
      if (d === 2) {
        const a = rng.int(1, sum - 1);
        if (gcdNum(a, sum) !== 1) return null;
        const b = sum - a;
        const p = R(a, sum).mul(R(100));
        return {
          prompt: `The ratio of red to blue marbles is ${a} : ${b}. What percent of the marbles are red?`,
          answer: p,
          unit: { suffix: '%' },
          distractors: [R(a, b).mul(R(100)), R(b, sum).mul(R(100)), p.add(R(5)), p.sub(R(5))],
          explain: `Red is ${a} of ${sum} parts: ${a}/${sum} = ${pct(p)}`,
        };
      }
      const a = rng.int(1, sum - 2);
      const b = rng.int(1, sum - a - 1);
      const c = sum - a - b;
      if (new Set([a, b, c]).size < 3) return null;
      const notRed = R(b + c, sum).mul(R(100));
      return {
        prompt: `Red, blue and green marbles are in the ratio ${a} : ${b} : ${c}. What percent of the marbles are not red?`,
        answer: notRed,
        unit: { suffix: '%' },
        distractors: [R(a, sum).mul(R(100)), R(b + c, a).mul(R(100)), R(b, sum).mul(R(100)), R(c, sum).mul(R(100))],
        explain: `Not red = ${b} + ${c} = ${b + c} of ${sum} parts: ${pct(notRed)}`,
      };
    },
  }),
];
