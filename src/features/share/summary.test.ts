import { describe, expect, it } from 'vitest';
import type { QuantResults } from '../../engine/stats/quant-results';
import type { VocabResults } from '../../engine/stats/vocab-results';
import { lightPalette } from './cards';
import { dayText, examLine, quantShare, vocabShare } from './summary';

const quant = (over: Partial<QuantResults> = {}): QuantResults => ({
  items: [],
  correct: 18,
  total: 20,
  accuracy: 0.9,
  totalMs: 420_000,
  avgMs: 21_000,
  byTopic: { percents: { correct: 6, total: 6 } },
  byDifficulty: {},
  byMode: {},
  ...over,
});

const vocab = (over: Partial<VocabResults> = {}): VocabResults => ({
  items: [],
  total: 0,
  correct: 0,
  flashcards: 0,
  slips: 0,
  marks: { know: 0, unsure: 0, review: 0 },
  totalMs: 200_000,
  avgMs: 5_000,
  ...over,
});

describe('quantShare', () => {
  it('writes the summary line', () => {
    expect(quantShare('Quant drill', quant()).text).toBe('Graphite · Quant drill · 18/20 (90%) · avg 21s · percents 6/6');
  });

  it('keeps the 4 topics with the most questions', () => {
    const card = quantShare('Quant drill', quant({
      byTopic: {
        rates: { correct: 1, total: 1 },
        money: { correct: 2, total: 5 },
        ratios: { correct: 3, total: 4 },
        percents: { correct: 1, total: 2 },
        averages: { correct: 3, total: 3 },
      },
    }));
    expect(card.rows.map((r) => r.label)).toEqual(['Money', 'Ratios', 'Averages', 'Percents']);
    expect(card.rows[0]).toEqual({ label: 'Money', value: '2/5', share: 0.4 });
  });

  it('copes with an empty score', () => {
    const card = quantShare('Retry', quant({ correct: 0, total: 0, byTopic: {} }));
    expect(card.stats[0]!.value).toBe('0%');
    expect(card.text).toBe('Graphite · Retry · 0/0 (0%) · avg 21s');
  });
});

describe('vocabShare', () => {
  it('scores a quiz session', () => {
    const card = vocabShare('Multiple choice', vocab({ total: 20, correct: 15 }));
    expect(card.score).toEqual({ value: 15, of: 'of 20' });
    expect(card.rows).toEqual([]);
    expect(card.text).toBe('Graphite · Multiple choice · 15/20 (75%) · avg 5s');
  });

  it('counts known cards in a flashcard session', () => {
    const card = vocabShare('Flashcards', vocab({ flashcards: 40, marks: { know: 30, unsure: 6, review: 4 } }));
    expect(card.score).toEqual({ value: 30, of: 'of 40 known' });
    expect(card.stats[0]).toEqual({ label: 'Cards', value: '40' });
    expect(card.rows.map((r) => r.value)).toEqual(['30', '6', '4']);
    expect(card.text).toBe('Graphite · Flashcards · 30 of 40 known · avg 5s');
  });

  it('shows both in a mixed session', () => {
    const card = vocabShare('Mixed practice', vocab({ total: 10, correct: 8, flashcards: 10, marks: { know: 5, unsure: 3, review: 2 } }));
    expect(card.score.value).toBe(8);
    expect(card.rows).toHaveLength(3);
    expect(card.text).toBe('Graphite · Mixed practice · 8/10 (80%) · avg 5s · flashcards 5 of 10 known');
  });
});

describe('card text', () => {
  it('words the exam line', () => {
    expect(examLine(23)).toBe('23 days to the GRE');
    expect(examLine(1)).toBe('1 day to the GRE');
    expect(examLine(0)).toBe('GRE day');
    expect(examLine(null)).toBeNull();
  });

  it('writes the date', () => {
    expect(dayText('2026-11-01')).toBe('Nov 1, 2026');
  });
});

describe('lightPalette', () => {
  it('reads the light theme from tokens.css, whatever theme the device uses', () => {
    expect(lightPalette()).toMatchObject({ paper: '#f6f1e7', graphite: '#2a2a2d', ink: '#2c4a7c' });
  });
});
