// Geometry told in words, with no diagrams. Areas with π are asked as k, so answers stay exact.
import { R } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'geometry',
  kind: 'word',
  ...x,
});

const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

export const geometry: Template[] = [
  t({
    id: 'ge-area',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const w = rng.int(3, 24);
        const l = rng.int(w + 1, 40);
        const p = 2 * (l + w);
        return {
          prompt: `A rectangle has a perimeter of ${p} and a width of ${w}. What is its area?`,
          answer: R(l * w),
          distractors: [p * w, (p - w) * w, (p / 2) * w, (p - 2 * w) * w, l * l].map((x) => R(x)),
          explain: `Half the perimeter is length + width: ${p / 2} − ${w} = ${l}. Area = ${l} × ${w} = ${num(l * w)}`,
        };
      }
      if (d === 2) {
        const r = rng.int(3, 30);
        const fromArea = rng.chance(0.5);
        if (fromArea) {
          return {
            prompt: `A circle has an area of ${num(r * r)}π. Its circumference is kπ. What is k?`,
            answer: R(2 * r),
            distractors: [r, 4 * r, r * r, 2 * r + 2, 2 * r - 2].map((x) => R(x)),
            explain: `Area = πr², so r = √${num(r * r)} = ${r}. Circumference = 2πr = ${2 * r}π`,
          };
        }
        return {
          prompt: `A circle has a circumference of ${2 * r}π. Its area is kπ. What is k?`,
          answer: R(r * r),
          distractors: [4 * r * r, 2 * r, r * r + r, 2 * r * r, r * r - r].map((x) => R(x)),
          explain: `Circumference = 2πr, so r = ${r}. Area = πr² = ${num(r * r)}π`,
        };
      }
      const r = rng.int(1, 12) * 2;
      const [change, factor] = rng.pick<[number, string]>([[50, '1.5'], [25, '1.25'], [100, '2']]);
      if (change === 25 && r % 4) return null;
      const next = R(r).mul(R(factor));
      const ans = next.mul(next);
      return {
        prompt: `A circle has an area of ${num(r * r)}π. Its radius grows by ${change}%. The new area is kπ. What is k?`,
        answer: ans,
        distractors: [R(r * r).mul(R(factor)), next, R(r * r + change), ans.add(R(r)), ans.sub(R(r))],
        explain: `The radius goes from ${r} to ${num(next)}. Area uses the radius squared: ${num(next)}² = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ge-triangle',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [a, b, c] = rng.pick(d === 1 ? TRIPLES.slice(0, 3) : TRIPLES);
      const m = rng.int(1, d === 1 ? 6 : 5);
      const x = a * m;
      const y = b * m;
      const h = c * m;
      if (d === 1) {
        return {
          prompt: `A right triangle has legs of ${x} and ${y}. How long is the hypotenuse?`,
          answer: R(h),
          distractors: [x + y, h + m, h - m, y + m, Math.max(x, y)].map((v) => R(v)),
          explain: `${x}² + ${y}² = ${num(h * h)}, and √${num(h * h)} = ${h}. It's ${a}-${b}-${c} scaled by ${m}`,
        };
      }
      if (d === 2) {
        const area = (x * y) / 2;
        return {
          prompt: `A right triangle has a hypotenuse of ${h} and a leg of ${x}. What is its area?`,
          answer: R(area),
          distractors: [R(x * y), R(x * h).div(R(2)), R(x * h), R(area + x), R(y * h).div(R(2))],
          explain: `The other leg is ${y}, as ${a}-${b}-${c} scaled by ${m}. Area = ${x} × ${y} ÷ 2 = ${num(area)}`,
        };
      }
      const area = x * y;
      return {
        prompt: `An isosceles triangle has sides of ${h}, ${h} and ${2 * x}. What is its area?`,
        answer: R(area),
        distractors: [2 * x * h, 2 * x * y, x * h, area + h, (2 * x * h) / 2 + x].map((v) => R(v)),
        explain: `The height splits it into two right triangles with hypotenuse ${h} and leg ${x}, so the height is ${y}. Area = ${2 * x} × ${y} ÷ 2 = ${num(area)}`,
      };
    },
  }),

  t({
    id: 'ge-angles',
    kind: 'calc',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const parts = rng.pick([9, 10, 12, 15, 18, 20, 30]);
        const p = rng.int(1, Math.floor(parts / 3));
        const q = rng.int(p, Math.floor((parts - p) / 2));
        const r = parts - p - q;
        if (r <= q) return null;
        const unit = 180 / parts;
        return {
          prompt: `The angles of a triangle are in the ratio ${p} : ${q} : ${r}. What is the largest angle, in degrees?`,
          answer: R(r * unit),
          distractors: [q * unit, p * unit, r * 10, r * 12, r * unit + 10].map((x) => R(x)),
          explain: `${p} + ${q} + ${r} = ${parts} parts share 180°, so one part is ${unit}°. ${r} × ${unit} = ${r * unit}`,
        };
      }
      if (d === 2) {
        const n = rng.int(5, 20);
        const total = (n - 2) * 180;
        const askEach = rng.chance(0.5) && total % n === 0;
        const ans = askEach ? total / n : total;
        return {
          prompt: askEach ? `What is each interior angle of a regular ${n}-sided polygon, in degrees?` : `What is the sum of the interior angles of a ${n}-sided polygon, in degrees?`,
          answer: R(ans),
          distractors: askEach ? [360 / n, ans + 10, ans - 10, 180 - ans + 90, ans + 5].filter(Number.isInteger).map((x) => R(x)) : [n * 180, (n - 1) * 180, (n - 3) * 180, n * 90, 360].map((x) => R(x)),
          explain: askEach ? `The sum is (${n} − 2) × 180 = ${num(total)}. Shared by ${n} angles: ${ans}` : `Sum = (n − 2) × 180 = ${n - 2} × 180 = ${num(total)}`,
        };
      }
      if (rng.chance(0.5)) {
        const a = rng.int(2, 5);
        const b = rng.int(5, 40);
        const c = rng.int(5, 40);
        const x = (180 - b + c) / (1 + a + 1);
        if (!Number.isInteger(x) || x <= 0) return null;
        const angles = [x, a * x + b, x - c];
        if (angles.some((v) => v <= 0)) return null;
        const large = Math.max(...angles);
        return {
          prompt: `The angles of a triangle are x, ${a}x + ${b} and x − ${c} degrees. What is the largest angle, in degrees?`,
          answer: R(large),
          distractors: [x, x - c, large + b, large - b, 180 - large].map((v) => R(v)),
          explain: `They add to 180: ${a + 2}x ${b - c < 0 ? '−' : '+'} ${Math.abs(b - c)} = 180, so x = ${x}. The angles are ${angles.join(', ')}`,
        };
      }
      const n = rng.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
      const each = 180 - 360 / n;
      return {
        prompt: `Each interior angle of a regular polygon is ${each}°. How many sides does it have?`,
        answer: R(n),
        distractors: [n + 1, n - 1, n + 2, n - 2, 2 * n].map((x) => R(x)),
        explain: `Each outside angle is 180 − ${each} = ${180 - each}°, and they add to 360. 360 ÷ ${180 - each} = ${n}`,
      };
    },
  }),
];
