import { describe, expect, it } from 'vitest';
import { R } from '../matching/rational';
import { mulberry32 } from '../rng';
import { planMode, rebuildItems } from '../sessions/quant-builder';
import { A_GREATER, B_GREATER, COMPARE_CHOICES, compareDraft, EQUAL, relationOf, splitCompare, UNDETERMINED } from './compare';
import { finishDraft, finalize } from './finalize';
import { TEMPLATES } from './index';
import { oneVarTable, solveOneVar, solveTwoVar, testValues, twoVarTable } from './topics/comparison';

describe('relationOf', () => {
  it('reads what every case says together', () => {
    expect(relationOf([[R(2), R(1)], [R(5), R(1)]])).toBe(A_GREATER);
    expect(relationOf([[R(1), R(2)]])).toBe(B_GREATER);
    expect(relationOf([[R(1), R(1)], [R(3), R(3)]])).toBe(EQUAL);
    expect(relationOf([[R(2), R(1)], [R(1), R(2)]])).toBe(UNDETERMINED);
    expect(relationOf([[R(1), R(1)], [R(2), R(1)]])).toBe(UNDETERMINED);
  });
});

describe('splitCompare', () => {
  it('gets back every part, including decimals', () => {
    expect(splitCompare('x > 2. Quantity A: 2.5x. Quantity B: 0.5.')).toEqual({ given: 'x > 2.', a: '2.5x', b: '0.5' });
    expect(splitCompare('Quantity A: 3/8. Quantity B: 0.4.')).toEqual({ given: '', a: '3/8', b: '0.4' });
    expect(splitCompare('2 + 2 = ?')).toBeNull();
  });
});

describe('a finished comparison', () => {
  const rng = mulberry32(1);
  const res = finishDraft(compareDraft('', '3', '4', B_GREATER, 'Four is more than three'), { topic: 'comparison', kind: 'calc' }, 1, rng);

  it('has four answers in exam order, and is scored by its code', () => {
    expect(res.ok && res.question.choices).toEqual(COMPARE_CHOICES);
    expect(res.ok && res.question.answer).toBe('2');
  });

  it('keeps exam order when planned, retried, and in a typed drill', () => {
    const q = { choices: COMPARE_CHOICES, mcqOnly: true, format: 'compare' as const };
    for (const setting of ['typed', 'mcq', 'mix'] as const) {
      for (let seed = 1; seed < 20; seed++) {
        expect(planMode(q, setting, mulberry32(seed))).toEqual({ mode: 'mcq', choices: COMPARE_CHOICES });
      }
    }
    const item = { ref: { kind: 'bank' as const, id: 'x-e-0001' }, mode: 'mcq' as const, choices: COMPARE_CHOICES };
    for (let seed = 1; seed < 20; seed++) expect(rebuildItems([item], seed)[0]!.choices).toEqual(COMPARE_CHOICES);
  });
});

/** Random values far finer than the test values, so a lucky answer can't survive. */
function randomValues(seed: number, count: number) {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => R(rng.int(-4000, 4000), rng.pick([1, 2, 3, 4, 5, 7, 8, 10, 16, 25, 100])));
}

describe('variable questions, tried on thousands of other values', () => {
  const ks = [2, 3, 4, 5, 6, 7, 8, 9];

  it('one variable: no value contradicts the answer', () => {
    const extra = randomValues(11, 6000);
    for (const k of ks) {
      for (const level of oneVarTable(k)) {
        for (const q of level) {
          const { relation, explain } = solveOneVar(q, k);
          expect(explain.length, q.given + q.a).toBeGreaterThan(5);
          if (relation === UNDETERMINED) continue;
          for (const x of [...extra, ...testValues(k)].filter(q.fits)) {
            expect(relationOf([[q.fa(x), q.fb(x)]]), `${q.given} ${q.a} / ${q.b} at ${x.toFractionString()}`).toBe(relation);
          }
        }
      }
    }
  });

  it('two variables: no pair contradicts the answer', () => {
    const extra = randomValues(12, 700).filter((v) => v.n !== 0n);
    for (const k of ks) {
      for (const level of twoVarTable(k)) {
        for (const q of level) {
          const { relation, explain } = solveTwoVar(q, k);
          expect(explain.length, q.given + q.a).toBeGreaterThan(5);
          if (relation === UNDETERMINED) continue;
          for (const x of extra) {
            // Partners that meet a condition like x + y = 2k or xy = k² by construction.
            for (const y of [...extra.slice(0, 30), R(2 * k).sub(x), R(k * k).div(x), x.neg()]) {
              if (y.n === 0n || !q.fits(x, y)) continue;
              expect(relationOf([[q.fa(x, y), q.fb(x, y)]]), `${q.given} ${q.a} / ${q.b}`).toBe(relation);
            }
          }
        }
      }
    }
  });

  it('every question type has some value that fits', () => {
    for (const k of ks) {
      for (const q of oneVarTable(k).flat()) expect(testValues(k).some(q.fits), q.given).toBe(true);
    }
  });
});

describe('the comparison topic', () => {
  it('uses all four answers, none rarely, none a safe guess', () => {
    const counts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0 };
    let total = 0;
    for (const template of TEMPLATES.filter((t) => t.topic === 'comparison')) {
      for (const d of template.difficulties) {
        for (let seed = 1; seed <= 40; seed++) {
          const res = finalize(template, d, seed);
          if (res.ok) {
            counts[res.question.answer]!++;
            total++;
          }
        }
      }
    }
    for (const answer of COMPARE_CHOICES) {
      expect(counts[answer]! / total, `answer ${answer}: ${JSON.stringify(counts)}`).toBeGreaterThan(0.1);
      expect(counts[answer]! / total, `answer ${answer}: ${JSON.stringify(counts)}`).toBeLessThan(0.45);
    }
  });
});
