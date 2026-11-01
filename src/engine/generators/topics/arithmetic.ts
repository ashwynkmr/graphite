import { R } from '../../matching/rational';
import { num } from '../format';
import type { Template } from '../types';
import { by } from '../util';

const t = (x: Omit<Template, 'topic' | 'kind'> & { kind?: Template['kind'] }): Template => ({
  topic: 'arithmetic',
  kind: 'calc',
  ...x,
});

export const arithmetic: Template[] = [
  t({
    id: 'ar-mul',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const a = by(d, rng.int(12, 99), rng.int(102, 999), rng.int(13, 99));
      const b = by(d, rng.int(3, 9), rng.int(3, 9), rng.int(13, 99));
      if (a % 10 === 0 || b % 10 === 0) return null;
      const ans = R(a * b);
      let explain: string;
      if (d === 3) {
        const bt = b - (b % 10);
        explain = `${a} × ${b} = ${a} × ${bt} + ${a} × ${b % 10} = ${num(a * bt)} + ${num(a * (b % 10))} = ${num(ans)}`;
      } else {
        const at = a - (a % 10);
        explain = `${a} × ${b} = ${num(at)} × ${b} + ${a % 10} × ${b} = ${num(at * b)} + ${(a % 10) * b} = ${num(ans)}`;
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
      const a = rng.pick(by(d, [19, 21, 29, 31, 39, 41, 49, 51, 59, 61], [98, 99, 101, 102, 198, 199, 201, 299], [49, 51, 99, 101, 199, 201, 98, 102]));
      const b = by(d, rng.int(3, 9), rng.int(3, 9), rng.int(12, 48));
      if (b % 10 === 0) return null;
      const base = a < 100 ? Math.round(a / 10) * 10 : Math.round(a / 100) * 100;
      const diff = a - base;
      const ans = R(a * b);
      const sign = diff < 0 ? '−' : '+';
      return {
        prompt: `${num(a)} × ${num(b)} = ?`,
        answer: ans,
        distractors: [R(base * b), R(base * b + diff), R(base * b - diff * b), ans.add(R(10)), ans.sub(R(10))],
        explain: `${a} × ${b} = ${num(base)} × ${b} ${sign} ${Math.abs(diff)} × ${b} = ${num(base * b)} ${sign} ${Math.abs(diff * b)} = ${num(ans)}`,
      };
    },
  }),

  t({
    id: 'ar-mul-friendly',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      // ×5 = ×10 ÷ 2, ×25 = ×100 ÷ 4, ×125 = ×1000 ÷ 8
      const k = by(d, rng.pick([5, 50]), 25, rng.pick([125, 25]));
      const n = by(d, rng.int(7, 49) * 2, rng.int(3, 24) * 4, k === 125 ? rng.int(2, 12) * 8 : rng.int(13, 39));
      if (n % 10 === 0) return null;
      const ans = R(n * k);
      const how =
        k === 5 || k === 50
          ? `× ${k} = × ${k * 2} ÷ 2: ${n} × ${k * 2} ÷ 2 = ${num(n * k * 2)} ÷ 2 = ${num(ans)}`
          : k === 25
            ? `× 25 = × 100 ÷ 4: ${num(n * 100)} ÷ 4 = ${num(ans)}`
            : `× 125 = × 1000 ÷ 8: ${num(n * 1000)} ÷ 8 = ${num(ans)}`;
      return {
        prompt: `${num(n)} × ${k} = ?`,
        answer: ans,
        distractors: [ans.mul(R(10)), ans.div(R(10)), ans.add(R(k)), ans.sub(R(k)), R(n * (k * 2))],
        explain: how,
      };
    },
  }),

  t({
    id: 'ar-div',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const b = by(d, rng.int(3, 9), rng.int(3, 9), rng.int(12, 48));
      const q = by(d, rng.int(4, 12), rng.int(13, 99), rng.int(12, 60));
      if (b % 10 === 0) return null;
      const a = b * q;
      const chunk = Math.floor(a / (b * 10)) * b * 10;
      const explain =
        chunk > 0 && chunk < a
          ? `${num(a)} ÷ ${b} = ${num(chunk)} ÷ ${b} + ${num(a - chunk)} ÷ ${b} = ${num(chunk / b)} + ${num((a - chunk) / b)} = ${q}`
          : `${b} × ${q} = ${num(a)}, so ${num(a)} ÷ ${b} = ${q}`;
      return {
        prompt: `${num(a)} ÷ ${b} = ?`,
        answer: R(q),
        distractors: [R(q + 1), R(q - 1), R(q * 10), R(q + 10), R(q - 10)],
        explain,
      };
    },
  }),

  t({
    id: 'ar-square',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      const n = by(d, rng.pick([11, 12, 13, 14, 15, 16, 17, 18, 19, 25]), rng.int(21, 39), rng.int(41, 99));
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
        explain = `(${base} ${s} ${Math.abs(k)})² = ${num(base * base)} ${s} ${Math.abs(2 * base * k)} + ${k * k} = ${num(ans)}`;
      }
      return {
        prompt: `${n}² = ?`,
        answer: ans,
        distractors: [R(n * (n + 1)), R((n - 1) * (n - 1)), R((n + 1) * (n + 1)), ans.add(R(10)), R(n * 2)],
        explain,
      };
    },
  }),

  t({
    id: 'ar-sqrt',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 3) {
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
      const r = by(d, rng.int(4, 15), rng.int(16, 30), 0);
      const sq = r * r;
      return {
        prompt: `√${num(sq)} = ?`,
        answer: R(r),
        distractors: [R(r - 1), R(r + 1), R(r + 2), R(r - 2)],
        explain: `${r} × ${r} = ${num(sq)}`,
      };
    },
  }),

  t({
    id: 'ar-cube',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const n = rng.int(2, 6);
        return {
          prompt: `${n}³ = ?`,
          answer: R(n ** 3),
          distractors: [R(n * n), R(3 * n), R((n + 1) ** 3), R((n - 1) ** 3)],
          explain: `${n} × ${n} × ${n} = ${n * n} × ${n} = ${n ** 3}`,
        };
      }
      if (d === 2) {
        const n = rng.int(7, 12);
        return {
          prompt: `∛${num(n ** 3)} = ?`,
          answer: R(n),
          distractors: [R(n + 1), R(n - 1), R(n + 2), R(n * 3)],
          explain: `${n} × ${n} × ${n} = ${num(n ** 3)}`,
        };
      }
      if (rng.chance(0.5)) {
        const k = rng.int(2, 9);
        const r = R(k, 10);
        const ans = r.pow(3);
        return {
          prompt: `(${num(r)})³ = ?`,
          answer: ans,
          distractors: [ans.mul(R(10)), ans.div(R(10)), r.mul(R(3)), r.pow(2)],
          explain: `${k}³ = ${k ** 3}, and three decimal places per factor of 0.1 gives ${num(ans)}`,
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
        const a = rng.int(21, 89);
        const b = rng.int(11, 79);
        const c = rng.int(11, 69);
        const ans = a + b - c;
        if (ans <= 0) return null;
        return {
          prompt: `${a} + ${b} − ${c} = ?`,
          answer: R(ans),
          distractors: [R(ans + 10), R(ans - 10), R(a + b + c), R(ans + 2)],
          explain: `${a} + ${b} = ${a + b}; ${a + b} − ${c} = ${ans}`,
        };
      }
      if (d === 2) {
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
    },
  }),

  t({
    id: 'ar-order-ops',
    difficulties: [1, 2, 3],
    generate(rng, d) {
      if (d === 1) {
        const a = rng.int(2, 20);
        const b = rng.int(2, 9);
        const c = rng.int(2, 9);
        const ans = a + b * c;
        return {
          prompt: `${a} + ${b} × ${c} = ?`,
          answer: R(ans),
          distractors: [R((a + b) * c), R(a + b + c), R(ans + 1), R(a * b + c)],
          explain: `Multiply first: ${b} × ${c} = ${b * c}; then ${a} + ${b * c} = ${ans}`,
        };
      }
      if (d === 2) {
        const b = rng.int(2, 9);
        const k = rng.int(2, 9);
        const c = rng.int(2, 6);
        const e = rng.int(1, 20);
        const a = b * k;
        const ans = k * c - e;
        if (ans <= 0) return null;
        const wrong = (b * c) % 1 === 0 && a % (b * c) === 0 ? R(a / (b * c) - e) : R(ans + c);
        return {
          prompt: `${a} ÷ ${b} × ${c} − ${e} = ?`,
          answer: R(ans),
          distractors: [wrong, R(k * (c - e)), R(ans + e + e), R(ans - 1), R(k * c + e)],
          explain: `Left to right: ${a} ÷ ${b} = ${k}; ${k} × ${c} = ${k * c}; ${k * c} − ${e} = ${ans}`,
        };
      }
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
    },
  }),
];
