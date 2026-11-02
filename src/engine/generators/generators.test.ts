// Property-style check: every template × difficulty × 200 seeds.
import { describe, expect, it } from 'vitest';
import { matchNumeric } from '../matching/numeric-answer';
import { R, Rational } from '../matching/rational';
import { COMPARE_CHOICES } from './compare';
import { finalize, MAX_SIG_DIGITS } from './finalize';
import { TEMPLATE_BY_ID, TEMPLATES } from './index';
import type { GeneratedQuestion } from './types';

const SEEDS = 200;
/** A template may reject some draws, but not most of them. */
const MIN_ACCEPT_RATE = 0.3;

function checkQuestion(q: GeneratedQuestion) {
  const answer = Rational.parse(q.answer);
  expect(answer, `answer "${q.answer}" parses`).not.toBeNull();
  // The stored answer is already rounded and in canonical form.
  expect(q.format === 'fraction' ? answer!.toFractionString() : answer!.toDecimalString()).toBe(q.answer);
  if (q.format === 'number') expect(answer!.significantDigits()!).toBeLessThanOrEqual(MAX_SIG_DIGITS[q.difficulty]);
  // Typing the stored answer is marked correct.
  expect(matchNumeric(q.answer, answer!, q.rounding)).toBe('correct');
  expect(q.prompt.length).toBeGreaterThan(5);
  expect(q.explain.length).toBeGreaterThan(5);
  expect(q.prompt).not.toMatch(/undefined|NaN|\{\w+\}/);
  expect(q.explain).not.toMatch(/undefined|NaN|\{\w+\}/);
  if (q.mcqOnly) expect(q.choices).toBeDefined();
  if (q.format === 'compare') {
    expect(q.choices).toEqual(COMPARE_CHOICES);
    expect(COMPARE_CHOICES).toContain(q.answer);
  } else if (q.choices) {
    expect(q.choices).toHaveLength(5);
    expect(new Set(q.choices).size).toBe(5);
    const values = q.choices.map((c) => Rational.parse(c));
    values.forEach((v, i) => expect(v, `choice "${q.choices![i]}" parses`).not.toBeNull());
    const hits = values.filter((v) => (q.rounding ? v!.round(q.rounding) : v!).equals(answer!));
    expect(hits, `exactly one choice equals the answer in "${q.prompt}"`).toHaveLength(1);
    if (answer!.cmp(R(0)) > 0) values.forEach((v) => expect(v!.cmp(R(0))).toBe(1));
  }
}

describe('templates', () => {
  it('have unique ids', () => {
    expect(TEMPLATE_BY_ID.size).toBe(TEMPLATES.length);
  });

  for (const template of TEMPLATES) {
    for (const d of template.difficulties) {
      it(`${template.id} at difficulty ${d}`, () => {
        let accepted = 0;
        for (let seed = 1; seed <= SEEDS; seed++) {
          const res = finalize(template, d, seed);
          if (!res.ok) continue;
          accepted++;
          checkQuestion(res.question);
          // Deterministic: the same seed rebuilds the same question.
          expect(finalize(template, d, seed)).toEqual(res);
        }
        expect(accepted / SEEDS).toBeGreaterThanOrEqual(MIN_ACCEPT_RATE);
      });
    }
  }
});

describe('mix support', () => {
  it('at least 70% of draws carry choices', () => {
    let withChoices = 0;
    let total = 0;
    for (const template of TEMPLATES) {
      for (const d of template.difficulties) {
        for (let seed = 1; seed <= 50; seed++) {
          const res = finalize(template, d, seed);
          if (!res.ok) continue;
          total++;
          if (res.question.choices) withChoices++;
        }
      }
    }
    expect(withChoices / total).toBeGreaterThanOrEqual(0.7);
  });
});
