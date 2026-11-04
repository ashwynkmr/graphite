import { describe, expect, it } from 'vitest';
import type { PlayableQuestion } from '../sessions/questions';
import { flagsFor, scoreQuant, statusOf, weakestFirst } from './quant-results';

const q = (over: Partial<PlayableQuestion> = {}): PlayableQuestion => ({
  id: 'x',
  topic: 'percents',
  difficulty: 2,
  kind: 'calc',
  prompt: '?',
  answer: '42',
  format: 'number',
  targetSec: 40,
  explain: 'because',
  ...over,
});

describe('statusOf', () => {
  it.each([
    ['42', 'correct'],
    ['42.0', 'correct'],
    ['41', 'wrong'],
    [null, 'skipped'],
    ['', 'skipped'],
    [undefined, 'not-reached'],
  ] as const)('%j → %s', (answer, status) => {
    expect(statusOf(q(), answer)).toBe(status);
  });

  it('applies rounding rules and equivalent fractions', () => {
    expect(statusOf(q({ answer: '3.5', rounding: 'tenth' }), '3.5')).toBe('correct');
    expect(statusOf(q({ answer: '3/8', format: 'fraction' }), '0.375')).toBe('correct');
    expect(statusOf(q({ answer: '3/8', format: 'fraction' }), '6/16')).toBe('correct');
  });
});

describe('flags', () => {
  it('slow = correct over 1.5× target; careless = wrong under 0.5× target', () => {
    expect(flagsFor('correct', 61_000, 40)).toEqual(['slow']);
    expect(flagsFor('correct', 59_000, 40)).toEqual([]);
    expect(flagsFor('wrong', 19_000, 40)).toEqual(['careless']);
    expect(flagsFor('wrong', 21_000, 40)).toEqual([]);
    expect(flagsFor('skipped', 1000, 40)).toEqual([]);
  });
});

describe('scoreQuant', () => {
  it('scores, averages and breaks down', () => {
    const r = scoreQuant([
      { question: q(), mode: 'typed', answer: '42', ms: 10_000 },
      { question: q({ topic: 'ratios', difficulty: 3 }), mode: 'mcq', answer: '40', ms: 5_000 },
      { question: q(), mode: 'mcq', answer: null, ms: 15_000 },
      { question: q(), mode: 'typed', answer: undefined, ms: 0 },
    ]);
    expect(r).toMatchObject({ correct: 1, total: 4, accuracy: 0.25, totalMs: 30_000, avgMs: 10_000 });
    expect(r.byTopic).toEqual({ percents: { correct: 1, total: 3 }, ratios: { correct: 0, total: 1 } });
    expect(r.byMode).toEqual({ typed: { correct: 1, total: 2 }, mcq: { correct: 0, total: 2 } });
    expect(r.items.map((i) => i.status)).toEqual(['correct', 'wrong', 'skipped', 'not-reached']);
    expect(r.items[1]!.flags).toEqual(['careless']);
  });
});

describe('weakestFirst', () => {
  it('puts the lowest score first, then more questions, then the label', () => {
    const rows: [string, { correct: number; total: number }][] = [
      ['Rates', { correct: 3, total: 3 }],
      ['Money', { correct: 0, total: 1 }],
      ['Algebra', { correct: 0, total: 3 }],
      ['Ratios', { correct: 1, total: 2 }],
      ['Averages', { correct: 1, total: 2 }],
    ];
    expect(weakestFirst(rows).map(([label]) => label)).toEqual(['Algebra', 'Money', 'Averages', 'Ratios', 'Rates']);
  });
});
