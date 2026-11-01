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

/** '2 hours', '2.5 hours', '45 minutes', '2 hours 15 minutes'. */
function duration(hours: Rational, style: 'hours' | 'minutes' | 'hm'): string {
  if (style === 'minutes') return `${num(hours.mul(R(60)))} minutes`;
  if (style === 'hm') {
    const whole = hours.n / hours.d;
    const mins = hours.sub(Rational.of(whole)).mul(R(60));
    return `${whole} hour${whole === 1n ? '' : 's'} ${num(mins)} minutes`;
  }
  return `${num(hours)} hour${hours.equals(R(1)) ? '' : 's'}`;
}

export const rates: Template[] = [
  t({
    id: 'rt-speed',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const m = rng.pick(MOVERS);
      const v = R(speedOf(rng, m));
      const time = by(d, R(rng.int(2, 5)), R(rng.pick(['1.5', '2.5', '3.5', '0.5', '1.25', '0.75'])), R(rng.pick([20, 40, 45, 50, 75, 90]), 60));
      const dist = v.mul(time);
      if (!dist.isInteger()) return null;
      const timeText = duration(time, d === 3 ? 'minutes' : 'hours');
      const wrongTime = d === 3 ? time.mul(R(60)).div(R(100)) : time.add(R(1));
      return {
        prompt: `${m.who} covers ${num(dist)} ${m.dist} in ${timeText}. What is the ${m.noun}'s average speed?`,
        answer: v,
        unit: { suffix: m.speed },
        distractors: [dist.div(wrongTime), dist.mul(time), v.add(R(m.step)), v.sub(R(m.step))],
        explain:
          d === 3
            ? `${timeText} = ${num(time)} hours; ${num(dist)} ÷ ${num(time)} = ${num(v)}`
            : `${num(dist)} ÷ ${num(time)} = ${num(v)}`,
      };
    },
  }),

  t({
    id: 'rt-distance',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const m = rng.pick(MOVERS);
      const v = R(speedOf(rng, m));
      const time = by(d, R(rng.int(2, 6)), R(rng.int(1, 4)).add(R(rng.pick([15, 30, 45]), 60)), R(rng.pick([10, 20, 40, 45, 50, 80, 100]), 60));
      const ans = v.mul(time);
      if (!ans.isInteger()) return null;
      const style = by(d, 'hours', 'hm', 'minutes') as 'hours' | 'hm' | 'minutes';
      const timeText = duration(time, style);
      // Classic slip: reading 2 h 15 min as 2.15 hours.
      const wholeH = time.n / time.d;
      const mins = time.sub(Rational.of(wholeH)).mul(R(60));
      const slip = style === 'hm' ? v.mul(Rational.of(wholeH).add(mins.div(R(100)))) : v.mul(time.mul(R(60))).div(R(100));
      return {
        prompt: `${m.who} ${m.verb} at ${num(v)} ${m.speed} for ${timeText}. How far does the ${m.noun} go?`,
        answer: ans,
        unit: { suffix: m.dist },
        distractors: [slip, v.div(time), ans.add(v), ans.sub(v)],
        explain: `${style === 'hours' ? '' : `${timeText} = ${num(time)} h; `}${num(v)} × ${num(time)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-time',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const m = rng.pick(MOVERS);
      const v = R(speedOf(rng, m));
      const time = by(d, R(rng.int(2, 6)), R(rng.int(3, 15), 2), R(rng.pick([12, 15, 20, 24, 30, 36, 40, 45, 48, 50]), 60));
      const dist = v.mul(time);
      if (!dist.isInteger()) return null;
      const inMinutes = d === 3;
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
      if (d === 3) {
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
      // Easy: multiples of 10, so the equal-time average is whole.
      const s1 = d === 1 ? rng.int(3, 7) * 10 : rng.int(4, 14) * 5;
      const s2 = d === 1 ? rng.int(3, 7) * 10 : rng.int(4, 14) * 5;
      const h1 = d === 1 ? 2 : rng.int(1, 4);
      const h2 = d === 1 ? 2 : rng.int(1, 4);
      if (s1 === s2 || (d === 2 && h1 === h2)) return null;
      const ans = R(s1 * h1 + s2 * h2, h1 + h2);
      if ((ans.decimalPlaces() ?? 9) > (d === 1 ? 0 : 1)) return null;
      return {
        prompt: `${name} drives ${h1} hour${h1 > 1 ? 's' : ''} at ${s1} mph, then ${h2} hour${h2 > 1 ? 's' : ''} at ${s2} mph. What is the average speed for the whole drive?`,
        answer: ans,
        unit: { suffix: 'mph' },
        distractors: [R(s1 + s2, 2), R(s1 * h2 + s2 * h1, h1 + h2), ans.add(R(5)), R(s1 * h1 + s2 * h2)],
        explain:
          d === 1
            ? `Equal times, so average the speeds: (${s1} + ${s2}) ÷ 2 = ${num(ans)}`
            : `Total distance ${s1 * h1 + s2 * h2} ÷ total time ${h1 + h2} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-work',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const scene = rng.pick([
        'One pipe fills a tank in {a} hours and another fills it in {b} hours. Working together, how many {u} do they take?',
        '{n1} can paint a room in {a} hours and {n2} can paint it in {b} hours. Working together, how many {u} do they take?',
        'One printer finishes a job in {a} hours and another in {b} hours. Together, how many {u} does the job take?',
        'One pump drains a pool in {a} hours and another in {b} hours. Together, how many {u} do they take?',
        '{n1} can assemble a shelf unit in {a} hours and {n2} in {b} hours. Together, how many {u} does it take?',
      ]);
      const [a, b] = by(
        d,
        rng.pick<[number, number]>([[2, 2], [4, 4], [6, 6], [3, 6], [2, 6], [10, 10], [8, 8]]),
        rng.pick<[number, number]>([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [2, 3], [4, 6], [6, 3], [12, 4], [5, 20], [6, 30]]),
        rng.pick<[number, number]>([[2, 3], [3, 4], [4, 6], [1, 2], [2, 4], [3, 6], [5, 20], [4, 12], [6, 12]]),
      );
      const together = R(a * b, a + b);
      const minutes = d === 3;
      const ans = minutes ? together.mul(R(60)) : together;
      if (!ans.isTerminating() || (ans.decimalPlaces() ?? 9) > 1) return null;
      const [n1, n2] = rng.shuffle(NAMES).slice(0, 2);
      return {
        prompt: fill(scene, { a: String(a), b: String(b), u: minutes ? 'minutes' : 'hours', n1: n1!, n2: n2! }),
        answer: ans,
        unit: { suffix: minutes ? 'minutes' : 'hours' },
        distractors: minutes
          ? [R(a + b, 2).mul(R(60)), R(Math.min(a, b) * 30), ans.add(R(12)), together.mul(R(100))]
          : [R(a + b, 2), R(a + b), R(Math.min(a, b), 2).add(R(1)), ans.add(R(1))],
        explain: `Rates add: 1/${a} + 1/${b} = ${R(1, a).add(R(1, b)).toFractionString()} per hour, so time = ${num(together)} h${minutes ? ` = ${num(ans)} minutes` : ''}`,
      };
    },
  }),

  t({
    id: 'rt-unit-rate',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const [item, isMoney] = rng.pick<[string, boolean]>([
        ['pens', true],
        ['notebooks', true],
        ['apples', true],
        ['pages printed', false],
        ['bottles filled', false],
        ['bricks laid', false],
      ]);
      const q1 = by(d, rng.pick([2, 4, 5, 10]), rng.pick([3, 4, 6, 8, 12]), rng.pick([6, 8, 12, 15, 16]));
      const price = by(d, R(rng.int(1, 9)), R(rng.int(3, 40), 4), R(rng.int(5, 60), 8));
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
          const h = R(rng.int(3, 19), 4);
          const ans = h.mul(R(60));
          return {
            prompt: `${num(h)} hours = ? minutes`,
            answer: ans,
            unit: { suffix: 'minutes' },
            distractors: [h.mul(R(100)), ans.add(R(15)), ans.sub(R(15)), h.div(R(60)).mul(R(100)).round('whole')],
            explain: `${num(h)} × 60 = ${num(ans)}`,
          };
        }
        const km = R(rng.int(11, 99), 10);
        const ans = km.mul(R(1000));
        return {
          prompt: `${num(km)} km = ? meters`,
          answer: ans,
          unit: { suffix: 'm' },
          distractors: [km.mul(R(100)), km.mul(R(10000)), ans.add(R(100)), ans.sub(R(100))],
          explain: `1 km = 1,000 m: ${num(km)} × 1,000 = ${num(ans)}`,
        };
      }
      if (d === 2) {
        if (rng.chance(0.5)) {
          const ms = R(rng.int(2, 30));
          const ans = ms.mul(R('3.6'));
          return {
            prompt: `${num(ms)} meters per second = ? km/h`,
            answer: ans,
            unit: { suffix: 'km/h' },
            distractors: [ms.div(R('3.6')).round('tenth'), ms.mul(R(36)), ms.mul(R(60)), ans.add(R(1))],
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
      if (rng.chance(0.5)) {
        const mph = R(rng.int(1, 6) * 15);
        const ans = mph.mul(R(22, 15));
        return {
          prompt: `${num(mph)} miles per hour = ? feet per second (1 mile = 5,280 feet)`,
          answer: ans,
          unit: { suffix: 'ft/s' },
          distractors: [mph.mul(R(5280)).div(R(60)).div(R(100)).round('whole'), mph.mul(R(15, 22)).round('whole'), ans.add(R(22)), ans.mul(R(60)).div(R(100)).round('whole')],
          explain: `5,280 ÷ 3,600 = 22/15, so ${num(mph)} × 22/15 = ${num(ans)}`,
        };
      }
      const lpm = R(rng.int(3, 30), 4);
      const ans = lpm.mul(R(60));
      return {
        prompt: `${num(lpm)} liters per minute = ? liters per hour`,
        answer: ans,
        unit: { suffix: 'L/h' },
        distractors: [lpm.mul(R(100)), lpm.div(R(60)).round('hundredth'), ans.add(R(15)), ans.sub(R(15))],
        explain: `× 60 minutes: ${num(lpm)} × 60 = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'rt-meet',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
        const v1 = rng.int(6, 14) * 5;
        const v2 = v1 + rng.int(1, 6) * 5;
        const head = rng.pick([1, 2, R(1, 2), R(3, 2)]);
        const headR = head instanceof Rational ? head : R(head);
        const gap = R(v1).mul(headR);
        const ans = gap.div(R(v2 - v1));
        if ((ans.decimalPlaces() ?? 9) > 1) return null;
        return {
          prompt: `A truck leaves at ${v1} mph. ${num(headR.mul(R(60)))} minutes later, a car follows the same road at ${v2} mph. How many hours after it starts does the car catch the truck?`,
          answer: ans,
          unit: { suffix: 'hours' },
          distractors: [gap.div(R(v2 + v1)), gap.div(R(v1)), ans.add(headR), ans.add(R(1))],
          explain: `Head start ${num(gap)} miles; the car closes ${v2 - v1} mph; ${num(gap)} ÷ ${v2 - v1} = ${num(ans)}`,
        };
      }
      const v1 = rng.int(6, 18) * 5;
      const v2 = d === 1 ? v1 : rng.int(6, 18) * 5;
      if (d === 2 && v1 === v2) return null;
      const time = by(d, R(rng.int(1, 5)), R(rng.pick([1, 2, 3, '1.5', '2.5', '0.5'])), R(1));
      const D = R(v1 + v2).mul(time);
      if (!D.isInteger()) return null;
      return {
        prompt: `Two trains start ${num(D)} miles apart and travel toward each other at ${v1} mph and ${v2} mph. In how many hours do they meet?`,
        answer: time,
        unit: { suffix: 'hours' },
        distractors: [D.div(R(v1)), v1 === v2 ? time.mul(R(2)) : D.div(R(Math.abs(v2 - v1))), time.add(R(1)), time.mul(R(2)).add(R(1))],
        explain: `Closing speed ${v1} + ${v2} = ${v1 + v2} mph; ${num(D)} ÷ ${v1 + v2} = ${num(time)}`,
      };
    },
  }),
];
