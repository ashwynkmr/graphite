import { R } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { by } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'arithmetic',
  kind: 'calc',
  ...x,
});

/** × k = × m ÷ q, for the friendly multipliers. */
const FRIENDLY: Record<number, [number, number]> = { 25: [100, 4], 125: [1000, 8], 75: [300, 4], 375: [3000, 8] };

/** Units digit of n³ → units digit of n (it's one-to-one). */
const CUBE_ROOT_UNITS: Record<number, number> = { 0: 0, 1: 1, 8: 2, 7: 3, 4: 4, 5: 5, 6: 6, 3: 7, 2: 8, 9: 9 };

export const arithmetic: Template[] = [
  t({
    id: 'ar-mul',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = by(d, rng.int(102, 999), rng.int(13, 99), rng.int(101, 999));
      const b = by(d, rng.int(3, 9), rng.int(13, 99), rng.int(12, 39));
      if (a % 10 === 0 || b % 10 === 0) return null;
      const ans = R(a * b);
      let explain: string;
      if (d === 1) {
        const at = a - (a % 10);
        explain = `${a} × ${b} = ${num(at)} × ${b} + ${a % 10} × ${b} = ${num(at * b)} + ${(a % 10) * b} = ${num(ans)}`;
      } else {
        const bt = b - (b % 10);
        explain = `${a} × ${b} = ${a} × ${bt} + ${a} × ${b % 10} = ${num(a * bt)} + ${num(a * (b % 10))} = ${num(ans)}`;
      }
      return {
        prompt: `${num(a)} × ${num(b)} = ?`,
        answer: ans,
        distractors: [ans.add(R(10)), ans.sub(R(10)), R(a * (b + 1)), R(a * (b - 1)), R((a + 1) * b)],
        explain,
      };
    },
  }),

  t({
    id: 'ar-mul-near-round',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = rng.pick(by(d, [98, 99, 101, 102, 198, 199, 201, 299], [49, 51, 99, 101, 199, 201, 98, 102], [999, 1001, 499, 501, 298, 302, 397, 403, 598, 602]));
      const b = by(d, rng.int(3, 9), rng.int(12, 48), rng.int(12, 48));
      if (b % 10 === 0) return null;
      const base = a < 100 ? Math.round(a / 10) * 10 : Math.round(a / 100) * 100;
      const diff = a - base;
      const ans = R(a * b);
      const sign = diff < 0 ? '−' : '+';
      return {
        prompt: `${num(a)} × ${num(b)} = ?`,
        answer: ans,
        distractors: [R(base * b), R(base * b + diff), R(base * b - diff * b), ans.add(R(10)), ans.sub(R(10))],
        explain: `${num(a)} × ${b} = ${num(base)} × ${b} ${sign} ${Math.abs(diff)} × ${b} = ${num(base * b)} ${sign} ${Math.abs(diff * b)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ar-mul-friendly',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const k = by(d, 25, rng.pick([125, 25]), rng.pick([125, 75, 375]));
      const n = by(
        d,
        rng.int(3, 24) * 4,
        k === 125 ? rng.int(2, 12) * 8 : rng.int(13, 39),
        k === 125 ? rng.int(13, 79) : k === 75 ? rng.int(3, 24) * 4 : rng.int(2, 8) * 8,
      );
      if (n % 10 === 0 || (d === 3 && k === 125 && n % 8 === 0)) return null;
      const [m, q] = FRIENDLY[k]!;
      const ans = R(n * k);
      return {
        prompt: `${num(n)} × ${k} = ?`,
        answer: ans,
        distractors: [ans.mul(R(10)), ans.div(R(10)), ans.add(R(k)), ans.sub(R(k)), R(n * m).div(R(q * 2))],
        explain: `× ${k} = × ${num(m)} ÷ ${q}: ${num(n * m)} ÷ ${q} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ar-div',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const b = by(d, rng.int(3, 9), rng.int(12, 48), rng.int(12, 48));
      const q = by(d, rng.int(13, 99), rng.int(12, 60), rng.int(61, 250));
      if (b % 10 === 0 || q % 10 === 0) return null;
      const a = b * q;
      const scale = a >= b * 100 ? 100 : 10;
      const chunk = Math.floor(a / (b * scale)) * b * scale;
      return {
        prompt: `${num(a)} ÷ ${b} = ?`,
        answer: R(q),
        distractors: [R(q + 1), R(q - 1), R(q * 10), R(q + 10), R(q - 10)],
        explain:
          chunk > 0 && chunk < a
            ? `${num(a)} ÷ ${b} = ${num(chunk)} ÷ ${b} + ${num(a - chunk)} ÷ ${b} = ${num(chunk / b)} + ${num((a - chunk) / b)} = ${q}`
            : `${b} × ${q} = ${num(a)}`,
      };
    },
  }),

  t({
    id: 'ar-square',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, rng.int(21, 39), rng.int(41, 99), rng.pick([91, 92, 93, 94, 95, 96, 97, 98, 99, 101, 102, 103, 104, 106, 107, 108, 109, 111, 112, 113, 115, 125, 135, 145]));
      if (n % 10 === 0) return null;
      const ans = R(n * n);
      let explain: string;
      if (n % 10 === 5) {
        const h = (n - 5) / 10;
        explain = `Ends in 5: ${h} × ${h + 1} = ${h * (h + 1)}, then append 25 → ${num(ans)}`;
      } else {
        const base = Math.round(n / 10) * 10;
        const k = n - base;
        const s = k < 0 ? '−' : '+';
        explain = `(${base} ${s} ${Math.abs(k)})² = ${num(base * base)} ${s} ${num(Math.abs(2 * base * k))} + ${k * k} = ${num(ans)}`;
      }
      return {
        prompt: `${n}² = ?`,
        answer: ans,
        distractors: [R(n * (n + 1)), R((n - 1) * (n - 1)), R((n + 1) * (n + 1)), ans.add(R(10)), ans.sub(R(100))],
        explain,
      };
    },
  }),

  t({
    id: 'ar-sqrt',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 2) {
        // √ of a decimal square: √2.25 = 1.5, √0.0049 = 0.07
        const tenths = rng.chance(0.5);
        const r = tenths ? R(rng.int(11, 25), 10) : R(rng.int(2, 9), 100);
        if (r.isInteger()) return null;
        const sq = r.mul(r);
        const sqStr = num(sq);
        return {
          prompt: `√${sqStr} = ?`,
          answer: r,
          distractors: [r.mul(R(10)), r.div(R(10)), r.add(R(tenths ? '0.1' : '0.01')), r.sub(R(tenths ? '0.1' : '0.01'))],
          explain: `${sqStr} = ${num(sq.mul(R(tenths ? 100 : 10000)))} ÷ ${tenths ? '100' : '10,000'}, so the root is ${num(r.mul(R(tenths ? 10 : 100)))} ÷ ${tenths ? 10 : 100} = ${num(r)}`,
        };
      }
      const r = d === 1 ? rng.int(16, 30) : rng.int(31, 99);
      if (d === 3 && r % 10 === 0) return null;
      const sq = r * r;
      const lo = Math.floor(r / 10) * 10;
      const twin = lo + (10 - (r % 10)); // same last digit when squared: 52² and 58² both end in 4
      return {
        prompt: `√${num(sq)} = ?`,
        answer: R(r),
        distractors: [R(twin), R(r - 1), R(r + 1), R(r + 2), R(r - 2)],
        explain:
          d === 1
            ? `${r} × ${r} = ${num(sq)}`
            : `${lo}² = ${num(lo * lo)} and ${lo + 10}² = ${num((lo + 10) ** 2)}; a square ending in ${sq % 10} has a root ending in ${r % 10} or ${(10 - (r % 10)) % 10}; ${r}² = ${num(sq)}`,
      };
    },
  }),

  t({
    id: 'ar-cube',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const n = rng.int(7, 12);
        return {
          prompt: `∛${num(n ** 3)} = ?`,
          answer: R(n),
          distractors: [R(n + 1), R(n - 1), R(n + 2), R(n * 3)],
          explain: `${n} × ${n} × ${n} = ${num(n ** 3)}`,
        };
      }
      if (d === 3) {
        const n = rng.int(13, 30);
        if (n % 10 === 0) return null;
        const c = n ** 3;
        const lo = Math.floor(n / 10) * 10;
        return {
          prompt: `∛${num(c)} = ?`,
          answer: R(n),
          distractors: [R(lo + (10 - (n % 10))), R(n + 1), R(n - 1), R(n + 10)],
          explain: `${lo}³ = ${num(lo ** 3)} < ${num(c)} < ${num((lo + 10) ** 3)} = ${lo + 10}³; it ends in ${c % 10}, so the root ends in ${CUBE_ROOT_UNITS[c % 10]}: ${n}`,
        };
      }
      if (rng.chance(0.5)) {
        const k = rng.int(2, 9);
        const r = R(k, 10);
        const ans = r.pow(3);
        return {
          prompt: `(${num(r)})³ = ?`,
          answer: ans,
          distractors: [ans.mul(R(10)), ans.div(R(10)), r.pow(2).div(R(10)), R(k * 3, 1000)],
          explain: `${k}³ = ${k ** 3}, and each factor of 0.1 adds a decimal place: ${num(ans)}`,
        };
      }
      const n = rng.int(3, 9);
      const ans = R(-(n ** 3));
      return {
        prompt: `(−${n})³ = ?`,
        answer: ans,
        distractors: [R(n ** 3), R(-(n * n)), R(-3 * n), R(-((n + 1) ** 3))],
        explain: `An odd power keeps the sign: ${n}³ = ${n ** 3}, so (−${n})³ = −${n ** 3}`,
      };
    },
  }),

  t({
    id: 'ar-add-sub',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const top = rng.pick([1000, 2000, 500]);
        const x = rng.int(top / 10 + 1, top - 11);
        if (x % 100 === 0) return null;
        const ans = top - x;
        const up = Math.ceil(x / 100) * 100;
        return {
          prompt: `${num(top)} − ${num(x)} = ?`,
          answer: R(ans),
          distractors: [R(ans + 10), R(ans - 10), R(ans + 100), R(ans - 100)],
          explain: `Count up: ${num(x)} + ${up - x} = ${num(up)}, then ${num(up)} + ${num(top - up)} = ${num(top)}; ${up - x} + ${num(top - up)} = ${num(ans)}`,
        };
      }
      if (d === 2) {
        const a = rng.int(3000, 9800);
        const b = rng.int(1100, a - 200);
        if (b % 100 === 0) return null;
        const ans = a - b;
        const bUp = Math.ceil(b / 100) * 100;
        return {
          prompt: `${num(a)} − ${num(b)} = ?`,
          answer: R(ans),
          distractors: [R(ans + 10), R(ans - 10), R(ans + 100), R(ans - 100), R(ans + 1000)],
          explain: `${num(a)} − ${num(bUp)} = ${num(a - bUp)}, then add back ${bUp - b}: ${num(ans)}`,
        };
      }
      // Decimals with mixed places: 87.45 − 23.98 + 6.5
      const a = R(rng.int(3001, 9999), 100);
      const b = R(rng.int(1001, 2999), 100);
      const c = R(rng.int(11, 99), 10);
      const ans = a.sub(b).add(c);
      const bUp = b.round('whole').cmp(b) >= 0 ? b.round('whole') : b.round('whole').add(R(1));
      return {
        prompt: `${num(a)} − ${num(b)} + ${num(c)} = ?`,
        answer: ans,
        distractors: [a.sub(b).add(c.div(R(10))), a.sub(b).sub(c), ans.add(R(1)), ans.sub(R('0.1')), ans.add(R('0.1'))],
        explain: `${num(a)} − ${num(bUp)} = ${num(a.sub(bUp))}; add back ${num(bUp.sub(b))} → ${num(a.sub(b))}; + ${num(c)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ar-order-ops',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const b = rng.int(2, 9);
        const k = rng.int(2, 9);
        const c = rng.int(2, 6);
        const e = rng.int(1, 20);
        const a = b * k;
        const ans = k * c - e;
        if (ans <= 0) return null;
        const wrong = a % (b * c) === 0 ? R(a / (b * c) - e) : R(ans + c);
        return {
          prompt: `${a} ÷ ${b} × ${c} − ${e} = ?`,
          answer: R(ans),
          distractors: [wrong, R(k * (c - e)), R(ans + 2 * e), R(ans - 1), R(k * c + e)],
          explain: `Left to right: ${a} ÷ ${b} = ${k}; ${k} × ${c} = ${k * c}; ${k * c} − ${e} = ${ans}`,
        };
      }
      if (d === 2) {
        const a = rng.int(2, 9);
        const b = rng.int(2, 9);
        const c = rng.int(2, 9);
        const ans = a * a + b * c;
        return {
          prompt: `(−${a})² − ${b} × (−${c}) = ?`,
          answer: R(ans),
          distractors: [R(a * a - b * c), R(-(a * a) + b * c), R(-(a * a) - b * c), R((a * a - b) * c)],
          explain: `(−${a})² = ${a * a}; ${b} × (−${c}) = −${b * c}; ${a * a} − (−${b * c}) = ${ans}`,
        };
      }
      // a − b × (c − e)² ÷ f
      const c = rng.int(1, 9);
      const e = rng.int(1, 9);
      if (c === e) return null;
      const k = c - e;
      const sq = k * k;
      const b = rng.int(2, 6);
      const fs = [2, 3, 4, 5, 6, 8, 9].filter((f) => (b * sq) % f === 0 && f !== sq);
      if (!fs.length) return null;
      const f = rng.pick(fs);
      const a = rng.int(10, 60);
      const ans = R(a - (b * sq) / f);
      return {
        prompt: `${a} − ${b} × (${c} − ${e})² ÷ ${f} = ?`,
        answer: ans,
        distractors: [R((a - b) * sq).div(R(f)), R(a + (b * sq) / f), R(a).sub(R(b * Math.abs(k), f)), ans.add(R(f))],
        explain: `Brackets first: (${c} − ${e})² = ${sq}; ${b} × ${sq} ÷ ${f} = ${(b * sq) / f}; ${a} − ${(b * sq) / f} = ${num(ans)}`,
      };
    },
  }),
];
