import { R, Rational } from '../../matching/rational';
import { money, num } from '../format';
import type { Template } from '../types';
import { by, fill, NAMES } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'rates',
  kind: 'word',
  ...x,
});

interface Mover {
  who: string;
  noun: string;
  verb: string;
  dist: string; // plural distance unit
  speed: string; // speed unit
  lo: number;
  hi: number;
  step: number;
}

const MOVERS: Mover[] = [
  { who: 'A car', noun: 'car', verb: 'drives', dist: 'miles', speed: 'mph', lo: 30, hi: 75, step: 5 },
  { who: 'A train', noun: 'train', verb: 'travels', dist: 'km', speed: 'km/h', lo: 60, hi: 150, step: 10 },
  { who: 'A cyclist', noun: 'cyclist', verb: 'rides', dist: 'miles', speed: 'mph', lo: 8, hi: 20, step: 1 },
  { who: 'A runner', noun: 'runner', verb: 'runs', dist: 'km', speed: 'km/h', lo: 8, hi: 15, step: 1 },
  { who: 'A plane', noun: 'plane', verb: 'flies', dist: 'km', speed: 'km/h', lo: 300, hi: 900, step: 50 },
  { who: 'A boat', noun: 'boat', verb: 'sails', dist: 'miles', speed: 'mph', lo: 10, hi: 40, step: 2 },
];

type Rng = Parameters<Template['generate']>[0];

function speedOf(rng: Rng, m: Mover): number {
  return m.lo + m.step * rng.int(0, Math.floor((m.hi - m.lo) / m.step));
}

/** A speed in the mover's range that covers a whole distance in `hours`, avoiding `not`. */
function speedFor(rng: Rng, m: Mover, hours: Rational, not?: Rational): Rational | null {
  const options: Rational[] = [];
  for (let v = m.lo; v <= m.hi; v += m.step) {
    const r = R(v);
    if (r.mul(hours).isInteger() && !(not && r.equals(not))) options.push(r);
  }
  return options.length ? rng.pick(options) : null;
}

/** '2 hours', '2.5 hours', '45 minutes', '2 hours 15 minutes'. */
function duration(hours: Rational, style: 'hours' | 'minutes' | 'hm'): string {
  if (style === 'minutes') return `${num(hours.mul(R(60)))} minutes`;
  if (style === 'hm') {
    const whole = hours.n / hours.d;
    const mins = hours.sub(Rational.of(whole)).mul(R(60));
    if (whole === 0n) return `${num(mins)} minutes`;
    return `${whole} hour${whole === 1n ? '' : 's'}${mins.n === 0n ? '' : ` ${num(mins)} minutes`}`;
  }
  return `${num(hours)} hour${hours.equals(R(1)) ? '' : 's'}`;
}

export const rates: Template[] = [
  t({
    id: 'rt-speed',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // km in minutes → meters per second
        const v = R(rng.pick(['2', '2.5', '3', '3.5', '4', '4.5', '5', '6', '7.5', '8', '10', '12.5', '15']));
        const minutes = rng.int(2, 20);
        const meters = v.mul(R(minutes * 60));
        const km = meters.div(R(1000));
        if ((km.decimalPlaces() ?? 9) > 2) return null;
        return {
          prompt: `A cyclist covers ${num(km)} km in ${minutes} minutes. What is the cyclist's speed in meters per second?`,
          answer: v,
          unit: { suffix: 'm/s' },
          distractors: [km.div(R(minutes)).mul(R(60)), v.mul(R('3.6')), v.mul(R(10)), km.mul(R(1000)).div(R(minutes)).div(R(10)), v.add(R(1))],
          explain: `${num(km)} km = ${num(meters)} m; ${minutes} min = ${minutes * 60} s; ${num(meters)} ÷ ${minutes * 60} = ${num(v)}`,
        };
      }
      const m = rng.pick(MOVERS);
      const v = R(speedOf(rng, m));
      const time = d === 1 ? R(rng.pick(['1.5', '2.5', '3.5', '0.5', '1.25', '0.75'])) : R(rng.pick([20, 40, 45, 50, 75, 90]), 60);
      const dist = v.mul(time);
      if (!dist.isInteger()) return null;
      const timeText = duration(time, d === 2 ? 'minutes' : 'hours');
      const wrongTime = d === 2 ? time.mul(R(60)).div(R(100)) : time.add(R(1));
      return {
        prompt: `${m.who} covers ${num(dist)} ${m.dist} in ${timeText}. What is the ${m.noun}'s average speed?`,
        answer: v,
        unit: { suffix: m.speed },
        distractors: [dist.div(wrongTime), dist.mul(time), v.add(R(m.step)), v.sub(R(m.step))],
        explain: d === 2 ? `${timeText} = ${num(time)} hours; ${num(dist)} ÷ ${num(time)} = ${num(v)}` : `${num(dist)} ÷ ${num(time)} = ${num(v)}`,
      };
    },
  }),

  t({
    id: 'rt-distance',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const m = rng.pick(MOVERS);
      if (d === 3) {
        // Two legs at different speeds
        const t1 = R(rng.int(1, 3)).add(R(rng.pick([0, 20, 30, 40]), 60));
        const t2 = R(rng.pick([20, 30, 40, 45, 90]), 60);
        const v1 = speedFor(rng, m, t1);
        const v2 = v1 && speedFor(rng, m, t2, v1);
        if (!v1 || !v2) return null;
        const d1 = v1.mul(t1);
        const d2 = v2.mul(t2);
        const ans = d1.add(d2);
        const slipT1 = Rational.of(t1.n / t1.d).add(t1.sub(Rational.of(t1.n / t1.d)).mul(R(60)).div(R(100)));
        return {
          prompt: `${m.who} ${m.verb} ${duration(t1, 'hm')} at ${num(v1)} ${m.speed}, then ${duration(t2, 'hm')} at ${num(v2)} ${m.speed}. How far does it go in total?`,
          answer: ans,
          unit: { suffix: m.dist },
          distractors: [v1.add(v2).div(R(2)).mul(t1.add(t2)), v1.mul(slipT1).add(v2.mul(t2.mul(R(60)).div(R(100)))), d1, ans.add(v2)],
          explain: `${num(v1)} × ${num(t1)} = ${num(d1)}; ${num(v2)} × ${num(t2)} = ${num(d2)}; total ${num(ans)}`,
        };
      }
      const v = R(speedOf(rng, m));
      const time = d === 1 ? R(rng.int(1, 4)).add(R(rng.pick([15, 30, 45]), 60)) : R(rng.pick([10, 20, 40, 45, 50, 80, 100]), 60);
      const ans = v.mul(time);
      if (!ans.isInteger()) return null;
      const style = d === 1 ? 'hm' : 'minutes';
      const timeText = duration(time, style);
      // Classic slip: reading 2 h 15 min as 2.15 hours, or 45 minutes as 0.45 hours.
      const wholeH = time.n / time.d;
      const mins = time.sub(Rational.of(wholeH)).mul(R(60));
      const slip = d === 1 ? v.mul(Rational.of(wholeH).add(mins.div(R(100)))) : v.mul(time.mul(R(60))).div(R(100));
      return {
        prompt: `${m.who} ${m.verb} at ${num(v)} ${m.speed} for ${timeText}. How far does the ${m.noun} go?`,
        answer: ans,
        unit: { suffix: m.dist },
        distractors: [slip, v.div(time), ans.add(v), ans.sub(v)],
        explain: `${timeText} = ${num(time)} h; ${num(v)} × ${num(time)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-time',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const m = rng.pick(MOVERS);
      if (d === 3) {
        // Total minutes for two legs
        const t1 = R(rng.pick([10, 12, 15, 20, 24, 30, 36, 40, 45]), 60);
        const t2 = R(rng.pick([10, 12, 15, 20, 24, 30, 36, 40, 45]), 60);
        const v1 = speedFor(rng, m, t1);
        const v2 = v1 && speedFor(rng, m, t2, v1);
        if (!v1 || !v2) return null;
        const d1 = v1.mul(t1);
        const d2 = v2.mul(t2);
        const ans = t1.add(t2).mul(R(60));
        return {
          prompt: `${m.who} goes ${num(d1)} ${m.dist} at ${num(v1)} ${m.speed}, then ${num(d2)} ${m.dist} at ${num(v2)} ${m.speed}. How many minutes does the whole trip take?`,
          answer: ans,
          unit: { suffix: 'minutes' },
          distractors: [d1.add(d2).div(v1.add(v2).div(R(2))).mul(R(60)), t1.add(t2).mul(R(100)), t1.mul(R(60)), ans.add(R(10))],
          explain: `${num(d1)} ÷ ${num(v1)} = ${num(t1.mul(R(60)))} min; ${num(d2)} ÷ ${num(v2)} = ${num(t2.mul(R(60)))} min; total ${num(ans)}`,
        };
      }
      const v = R(speedOf(rng, m));
      const time = d === 1 ? R(rng.int(3, 15), 2) : R(rng.pick([12, 15, 20, 24, 30, 36, 40, 45, 48, 50]), 60);
      const dist = v.mul(time);
      if (!dist.isInteger()) return null;
      const inMinutes = d === 2;
      const ans = inMinutes ? time.mul(R(60)) : time;
      return {
        prompt: `How many ${inMinutes ? 'minutes' : 'hours'} does it take to go ${num(dist)} ${m.dist} at ${num(v)} ${m.speed}?`,
        answer: ans,
        unit: { suffix: inMinutes ? 'minutes' : 'hours' },
        distractors: inMinutes ? [time.mul(R(100)), v.div(dist).mul(R(60)), ans.add(R(5)), ans.sub(R(5))] : [v.div(dist), dist.mul(v).div(R(100)), ans.add(R(1)), ans.add(R('0.5'))],
        explain: inMinutes ? `${num(dist)} ÷ ${num(v)} = ${num(time)} h = ${num(ans)} minutes` : `${num(dist)} ÷ ${num(v)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-average-speed',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const name = rng.pick(NAMES);
      if (d === 2) {
        const [a, b] = rng.pick<[number, number]>([
          [30, 60], [40, 60], [60, 90], [20, 30], [45, 90], [40, 120], [50, 75], [36, 45], [24, 40], [60, 40], [30, 20], [48, 72],
        ]);
        const ans = R(2 * a * b, a + b);
        const scene = rng.pick([
          '{name} drives to a town at {a} mph and drives back the same way at {b} mph. What is the average speed for the round trip?',
          '{name} cycles to work at {a} km/h and home along the same route at {b} km/h. What is the average speed for the whole trip?',
          'A ferry crosses a lake at {a} km/h and returns at {b} km/h. What is its average speed for the round trip?',
        ]);
        return {
          prompt: fill(scene, { name, a: String(a), b: String(b) }),
          answer: ans,
          unit: { suffix: scene.includes('mph') ? 'mph' : 'km/h' },
          distractors: [R(a + b, 2), R(a + b, 2).add(R(2)), ans.sub(R(2)), R(Math.max(a, b))],
          explain: `Same distance each way, so use 2ab ÷ (a + b): 2 × ${a} × ${b} ÷ ${a + b} = ${num(ans)}`,
        };
      }
      const s1 = rng.int(4, 14) * 5;
      const s2 = rng.int(4, 14) * 5;
      const h1 = rng.int(1, 4);
      const h2 = rng.int(1, 4);
      if (s1 === s2 || h1 === h2) return null;
      const ans = R(s1 * h1 + s2 * h2, h1 + h2);
      if ((ans.decimalPlaces() ?? 9) > 1 || ans.equals(R(s1 + s2, 2))) return null;
      if (d === 3) {
        // Distances given, so the times must be worked out first.
        return {
          prompt: `${name} drives ${s1 * h1} miles at ${s1} mph, then ${s2 * h2} miles at ${s2} mph. What is the average speed for the whole drive?`,
          answer: ans,
          unit: { suffix: 'mph' },
          distractors: [R(s1 + s2, 2), R(s1 * h2 + s2 * h1, h1 + h2), R(s1 * h1 + s2 * h2, 2), ans.add(R(5))],
          explain: `Times: ${s1 * h1} ÷ ${s1} = ${h1} h and ${s2 * h2} ÷ ${s2} = ${h2} h; ${s1 * h1 + s2 * h2} miles ÷ ${h1 + h2} h = ${num(ans)}`,
        };
      }
      return {
        prompt: `${name} drives ${h1} hour${h1 > 1 ? 's' : ''} at ${s1} mph, then ${h2} hour${h2 > 1 ? 's' : ''} at ${s2} mph. What is the average speed for the whole drive?`,
        answer: ans,
        unit: { suffix: 'mph' },
        distractors: [R(s1 + s2, 2), R(s1 * h2 + s2 * h1, h1 + h2), ans.add(R(5)), ans.sub(R(5))],
        explain: `Total distance ${s1 * h1 + s2 * h2} ÷ total time ${h1 + h2} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-work',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [n1, n2] = rng.shuffle(NAMES).slice(0, 2) as [string, string];
      if (d === 3) {
        // Reverse: A alone and together are known; find B alone.
        const [a, b] = rng.pick<[number, number]>([[6, 12], [10, 15], [3, 6], [4, 12], [12, 24], [20, 30], [5, 20], [6, 30], [8, 24], [9, 18], [6, 3], [12, 4], [15, 10]]);
        const together = R(a * b, a + b);
        const scene = rng.pick([
          '{n1} can paint a room alone in {a} hours. Working with {n2}, it takes {t} hours. How many hours would {n2} take alone?',
          'One pipe fills a tank in {a} hours. With a second pipe also open, it fills in {t} hours. How many hours would the second pipe take alone?',
          'One printer finishes a job in {a} hours. With a second printer helping, it takes {t} hours. How many hours would the second printer take alone?',
        ]);
        return {
          prompt: fill(scene, { n1, n2, a: String(a), t: num(together) }),
          answer: R(b),
          unit: { suffix: 'hours' },
          distractors: [R(a).sub(together), together.mul(R(2)), R(a).mul(together).div(R(a).add(together)), R(a)],
          explain: `1/${num(together)} − 1/${a} = ${R(1).div(together).sub(R(1, a)).toFractionString()} per hour, so alone it takes ${b} hours`,
        };
      }
      const scene = rng.pick([
        'One pipe fills a tank in {a} hours and another fills it in {b} hours. Working together, how many {u} do they take?',
        '{n1} can paint a room in {a} hours and {n2} can paint it in {b} hours. Working together, how many {u} do they take?',
        'One printer finishes a job in {a} hours and another in {b} hours. Together, how many {u} does the job take?',
        'One pump drains a pool in {a} hours and another in {b} hours. Together, how many {u} do they take?',
        '{n1} can assemble a shelf unit in {a} hours and {n2} in {b} hours. Together, how many {u} does it take?',
      ]);
      const [a, b] = by(
        d,
        rng.pick<[number, number]>([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [2, 3], [4, 6], [6, 3], [12, 4], [5, 20], [6, 30]]),
        rng.pick<[number, number]>([[2, 3], [3, 4], [4, 6], [1, 2], [2, 4], [3, 6], [5, 20], [4, 12], [6, 12]]),
        [0, 0],
      );
      const together = R(a * b, a + b);
      const minutes = d === 2;
      const ans = minutes ? together.mul(R(60)) : together;
      if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1) return null;
      return {
        prompt: fill(scene, { a: String(a), b: String(b), u: minutes ? 'minutes' : 'hours', n1, n2 }),
        answer: ans,
        unit: { suffix: minutes ? 'minutes' : 'hours' },
        distractors: minutes
          ? [R(a + b, 2).mul(R(60)), R(Math.min(a, b) * 30), together.mul(R(100)), ans.add(R(12))]
          : [R(a + b, 2), R(a + b), R(Math.min(a, b), 2), ans.add(R(1))],
        explain: `Rates add: 1/${a} + 1/${b} = ${R(1, a).add(R(1, b)).toFractionString()} per hour, so time = ${num(together)} h${minutes ? ` = ${num(ans)} minutes` : ''}`,
      };
    },
  }),

  t({
    id: 'rt-unit-rate',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        // Rate per minute, answer in hours.
        const [noun, verb] = rng.pick<[string, string]>([
          ['pages', 'prints'],
          ['bottles', 'fills'],
          ['labels', 'prints'],
          ['parts', 'stamps'],
        ]);
        const perMin = rng.int(4, 40);
        const batch = rng.int(2, 6);
        const minutes = rng.int(2, 24) * 15;
        const total = perMin * minutes;
        const ans = R(minutes, 60);
        return {
          prompt: `A machine ${verb} ${perMin * batch} ${noun} in ${batch} minutes. How many hours does it take to make ${num(total)} ${noun}?`,
          answer: ans,
          unit: { suffix: 'hours' },
          distractors: [R(minutes), R(total, perMin * batch), ans.mul(R(60)).div(R(100)), ans.add(R(1))],
          explain: `${perMin * batch} ÷ ${batch} = ${perMin} per minute; ${num(total)} ÷ ${perMin} = ${minutes} minutes = ${num(ans)} hours`,
        };
      }
      const [item, isMoney] = rng.pick<[string, boolean]>([
        ['pens', true],
        ['notebooks', true],
        ['apples', true],
        ['pages printed', false],
        ['bottles filled', false],
        ['bricks laid', false],
      ]);
      const q1 = by(d, rng.pick([3, 4, 6, 8, 12]), rng.pick([6, 8, 12, 15, 16]), 0);
      const price = by(d, R(rng.int(3, 40), 4), R(rng.int(5, 60), 8), R(0));
      const total1 = price.mul(R(q1));
      const q2 = rng.int(2, 30);
      if (q2 === q1) return null;
      const ans = price.mul(R(q2));
      if (isMoney && ((ans.decimalPlaces() ?? 9) > 2 || (total1.decimalPlaces() ?? 9) > 2)) return null;
      if (!isMoney && !ans.isInteger()) return null;
      const noun = item.split(' ')[0]!;
      return {
        prompt: isMoney
          ? `If ${q1} ${item} cost ${money(total1)}, how much do ${q2} ${item} cost?`
          : `A machine produces ${num(total1)} ${noun} in ${q1} minutes. At that rate, how many in ${q2} minutes?`,
        answer: ans,
        unit: isMoney ? { prefix: '$' } : { suffix: noun },
        distractors: [total1.mul(R(q1, q2)), total1.add(R(q2 - q1)), price.mul(R(q2 + 1)), ans.mul(R(10))],
        explain: isMoney
          ? `Unit price: ${money(total1)} ÷ ${q1} = ${money(price)}; × ${q2} = ${money(ans)}`
          : `Per minute: ${num(total1)} ÷ ${q1} = ${num(price)}; × ${q2} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-convert',
    kind: 'calc',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        if (rng.chance(0.5)) {
          const ms = R(rng.int(2, 30));
          const ans = ms.mul(R('3.6'));
          return {
            prompt: `${num(ms)} meters per second = ? km/h`,
            answer: ans,
            unit: { suffix: 'km/h' },
            distractors: [ms.div(R('3.6')).round('tenth'), ms.mul(R(36)), ms.mul(R(60)).div(R(10)), ans.add(R(1))],
            explain: `× 3,600 s per hour ÷ 1,000 m per km = × 3.6: ${num(ms)} × 3.6 = ${num(ans)}`,
          };
        }
        const kmh = R(rng.int(1, 30) * 18);
        const ans = kmh.div(R('3.6'));
        return {
          prompt: `${num(kmh)} km/h = ? meters per second`,
          answer: ans,
          unit: { suffix: 'm/s' },
          distractors: [kmh.mul(R('3.6')), kmh.div(R(60)).round('tenth'), ans.add(R(5)), ans.div(R(10))],
          explain: `÷ 3.6: ${num(kmh)} ÷ 3.6 = ${num(ans)}`,
        };
      }
      if (d === 2) {
        if (rng.chance(0.5)) {
          const mph = R(rng.int(1, 6) * 15);
          const ans = mph.mul(R(22, 15));
          return {
            prompt: `${num(mph)} miles per hour = ? feet per second (1 mile = 5,280 feet)`,
            answer: ans,
            unit: { suffix: 'ft/s' },
            distractors: [mph.mul(R(15, 22)).round('whole'), mph.mul(R(5280)).div(R(60)).div(R(100)).round('whole'), ans.add(R(22)), ans.mul(R(60)).div(R(100)).round('whole')],
            explain: `5,280 ÷ 3,600 = 22/15, so ${num(mph)} × 22/15 = ${num(ans)}`,
          };
        }
        const lpm = R(rng.int(3, 30), 4);
        const ans = lpm.mul(R(60));
        return {
          prompt: `${num(lpm)} liters per minute = ? liters per hour`,
          answer: ans,
          unit: { suffix: 'L/h' },
          distractors: [lpm.mul(R(100)), lpm.mul(R(6)), ans.add(R(15)), ans.sub(R(15))],
          explain: `× 60 minutes: ${num(lpm)} × 60 = ${num(ans)}`,
        };
      }
      const kind = rng.int(0, 2);
      if (kind === 0) {
        const lps = R(rng.int(1, 20), 4);
        const ans = lps.mul(R('3.6'));
        return {
          prompt: `${num(lps)} liters per second = ? cubic meters per hour (1 m³ = 1,000 L)`,
          answer: ans,
          unit: { suffix: 'm³/h' },
          distractors: [lps.mul(R(36)), lps.mul(R(60)).div(R(1000)), lps.div(R('3.6')).round('hundredth'), ans.add(R(1))],
          explain: `× 3,600 s per hour ÷ 1,000 L per m³ = × 3.6: ${num(lps)} × 3.6 = ${num(ans)}`,
        };
      }
      if (kind === 1) {
        const kmh = R(rng.int(1, 30) * 3);
        const ans = kmh.mul(R(50, 3));
        return {
          prompt: `${num(kmh)} km/h = ? meters per minute`,
          answer: ans,
          unit: { suffix: 'm/min' },
          distractors: [kmh.mul(R(1000)).div(R(3600)).round('tenth'), kmh.mul(R(60)), kmh.mul(R(100)).div(R(6)).mul(R(10)), ans.add(R(50))],
          explain: `× 1,000 m ÷ 60 min: ${num(kmh)} × 1,000 ÷ 60 = ${num(ans)}`,
        };
      }
      const cms = R(rng.int(2, 50));
      const ans = cms.mul(R(36));
      return {
        prompt: `${num(cms)} cm per second = ? meters per hour`,
        answer: ans,
        unit: { suffix: 'm/h' },
        distractors: [cms.mul(R(360)), cms.mul(R('3.6')), cms.mul(R(60)).div(R(100)).mul(R(10)), ans.add(R(36))],
        explain: `× 3,600 s ÷ 100 cm per m = × 36: ${num(cms)} × 36 = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-meet',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d > 1) {
        // Catch-up: B starts later and faster.
        const v1 = rng.int(6, 14) * 5;
        const v2 = v1 + rng.int(1, 6) * 5;
        const headR = rng.pick([R(1), R(2), R(1, 2), R(3, 2)]);
        const gap = R(v1).mul(headR);
        const catchT = gap.div(R(v2 - v1));
        if ((catchT.decimalPlaces() ?? 9) > 1) return null;
        if (d === 3) {
          const ans = catchT.mul(R(v2));
          return {
            prompt: `A truck leaves at ${v1} mph. ${num(headR.mul(R(60)))} minutes later, a car follows the same road at ${v2} mph. How many miles from the start does the car catch the truck?`,
            answer: ans,
            unit: { suffix: 'miles' },
            distractors: [catchT.mul(R(v1)), gap, catchT.add(headR).mul(R(v2)), catchT],
            explain: `Head start ${num(gap)} miles; the car closes ${v2 - v1} mph, so it takes ${num(catchT)} h; ${num(catchT)} × ${v2} = ${num(ans)} miles`,
          };
        }
        return {
          prompt: `A truck leaves at ${v1} mph. ${num(headR.mul(R(60)))} minutes later, a car follows the same road at ${v2} mph. How many hours after it starts does the car catch the truck?`,
          answer: catchT,
          unit: { suffix: 'hours' },
          distractors: [gap.div(R(v2 + v1)), gap.div(R(v1)), catchT.add(headR), catchT.add(R(1))],
          explain: `Head start ${num(gap)} miles; the car closes ${v2 - v1} mph; ${num(gap)} ÷ ${v2 - v1} = ${num(catchT)}`,
        };
      }
      const v1 = rng.int(6, 18) * 5;
      const v2 = rng.int(6, 18) * 5;
      if (v1 === v2) return null;
      const time = R(rng.pick([1, 2, 3, '1.5', '2.5', '0.5']));
      const D = R(v1 + v2).mul(time);
      if (!D.isInteger()) return null;
      return {
        prompt: `Two trains start ${num(D)} miles apart and travel toward each other at ${v1} mph and ${v2} mph. In how many hours do they meet?`,
        answer: time,
        unit: { suffix: 'hours' },
        distractors: [D.div(R(Math.abs(v2 - v1))), D.div(R(v1)), D.div(R(v2)), time.add(R(1))],
        explain: `Closing speed ${v1} + ${v2} = ${v1 + v2} mph; ${num(D)} ÷ ${v1 + v2} = ${num(time)}`,
      };
    },
  }),
];
