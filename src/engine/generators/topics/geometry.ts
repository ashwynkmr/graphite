// Geometry told in words, with no diagrams. Areas with π are asked as k, so answers stay exact.
import { R } from '../../matching/rational';
import { frac, num } from '../format';
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

  t({
    id: 'ge-coordinates',
    kind: 'calc',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const x1 = rng.int(-9, 9);
      const y1 = rng.int(-9, 9);
      if (d === 1) {
        const [a, b, c] = rng.pick(TRIPLES.slice(0, 3));
        const m = rng.int(1, 3);
        const x2 = x1 + a * m;
        const y2 = y1 + b * m;
        return {
          prompt: `How far apart are the points (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)})?`,
          answer: R(c * m),
          distractors: [(a + b) * m, c * m + 1, c * m - 1, b * m, c * m + m].map((v) => R(v)),
          explain: `Across ${a * m} and up ${b * m}, so a right triangle: √(${a * m}² + ${b * m}²) = ${c * m}`,
        };
      }
      const run = rng.int(1, 9);
      const rise = rng.int(1, 9);
      if (d === 2) {
        const slope = R(rise, run);
        const x2 = x1 + run;
        const y2 = y1 + rise;
        return {
          prompt: `What is the slope of the line through (${num(x1)}, ${num(y1)}) and (${num(x2)}, ${num(y2)})?`,
          answer: slope,
          format: 'fraction',
          distractors: [R(run, rise), R(rise + 1, run), R(rise, run + 1), R(rise + 2, run + 1)],
          explain: `Rise over run: up ${rise} and across ${run}, so ${rise}/${run}${slope.d !== BigInt(run) ? ` = ${frac(slope)}` : ''}`,
        };
      }
      const m = rng.int(2, 6);
      const b = rng.int(1, 20);
      const x = rng.int(2, 9);
      const y = m * x + b;
      const x3 = x + rng.int(2, 8);
      const y3 = m * x3 + b;
      return {
        prompt: `A line passes through (${x}, ${y}) and (${x3}, ${y3}). Where does it cross the y-axis? Give the y-value.`,
        answer: R(b),
        distractors: [m, y - x, b + m, y - m].map((v) => R(v)),
        explain: `The slope is ${y3 - y} ÷ ${x3 - x} = ${m}. Walk back to x = 0: ${y} − ${x} × ${m} = ${b}`,
      };
    },
  }),

  t({
    id: 'ge-solids',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const [l, w, h] = [rng.int(3, 15), rng.int(2, 12), rng.int(2, 10)];
        return {
          prompt: `A box measures ${l} by ${w} by ${h}. What is its volume?`,
          answer: R(l * w * h),
          distractors: [2 * (l * w + w * h + l * h), l + w + h, l * w, l * w * h + l].map((v) => R(v)),
          explain: `Multiply all three: ${l} × ${w} × ${h} = ${num(l * w * h)}`,
        };
      }
      if (d === 2) {
        const s = rng.int(2, 12);
        const askArea = rng.chance(0.5);
        return {
          prompt: askArea ? `A cube has a volume of ${num(s ** 3)}. What is its surface area?` : `A cube has a surface area of ${num(6 * s * s)}. What is its volume?`,
          answer: R(askArea ? 6 * s * s : s ** 3),
          distractors: (askArea ? [s * s, 4 * s * s, 12 * s, 6 * s * s + s] : [s * s, 6 * s, s ** 3 + s, 2 * s ** 3]).map((v) => R(v)),
          explain: askArea ? `The edge is the cube root: ${s}. Six faces of ${s * s}: ${num(6 * s * s)}` : `Each face is ${num(6 * s * s)} ÷ 6 = ${s * s}, so the edge is ${s}. ${s}³ = ${num(s ** 3)}`,
        };
      }
      const r = rng.int(2, 9);
      const h = rng.int(2, 12);
      const m = rng.int(2, 3);
      const ans = m * m * r * r * h;
      return {
        prompt: `A cylinder has radius ${r} and height ${h}. Its radius is multiplied by ${m}. The new volume is kπ. What is k?`,
        answer: R(ans),
        distractors: [m * r * r * h, r * r * h, m * m * r * h, 2 * m * r * h].map((v) => R(v)),
        explain: `Volume = πr²h. The new radius is ${m * r}: ${m * r}² × ${h} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ge-sector',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const deg = rng.pick([30, 40, 45, 60, 72, 90, 120, 135, 150, 180]);
      const r = rng.int(2, 18) * 2;
      if (d === 1) {
        const ans = R(deg * 2 * r).div(R(360));
        if (!ans.isInteger()) return null;
        return {
          prompt: `A sector of a circle with radius ${r} has a ${deg}° angle. Its arc length is kπ. What is k?`,
          answer: ans,
          distractors: [R(deg * r).div(R(360)), R(2 * r), R(deg * r * r).div(R(360)), ans.add(R(2))],
          explain: `${deg}° is ${frac(R(deg, 360))} of the circle. ${frac(R(deg, 360))} × ${2 * r}π = ${num(ans)}π`,
        };
      }
      if (d === 2) {
        const ans = R(deg * r * r).div(R(360));
        if (!ans.isInteger()) return null;
        return {
          prompt: `A sector of a circle with radius ${r} has a ${deg}° angle. Its area is kπ. What is k?`,
          answer: ans,
          distractors: [R(deg * 2 * r).div(R(360)), R(r * r), ans.mul(R(2)), ans.add(R(r))],
          explain: `${deg}° is ${frac(R(deg, 360))} of the circle. ${frac(R(deg, 360))} × ${num(r * r)}π = ${num(ans)}π`,
        };
      }
      const [p, q] = rng.pick<[number, number]>([[2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [5, 6], [1, 3], [3, 7]]);
      const small = p * p * rng.int(1, 9);
      const ans = R(small * q * q).div(R(p * p));
      return {
        prompt: `Two similar triangles have sides in the ratio ${p} : ${q}. The smaller has an area of ${small}. What is the area of the larger?`,
        answer: ans,
        distractors: [R(small * q).div(R(p)), R(small + q * q - p * p), ans.mul(R(2)), R(small * q)],
        explain: `Areas scale by the square of the sides: ${small} × ${q * q}/${p * p} = ${num(ans)}`,
      };
    },
  }),
];
