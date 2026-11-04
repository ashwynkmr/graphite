import { describe, expect, it } from 'vitest';
import type { QuantResults } from '../../engine/stats/quant-results';
import type { VocabResults } from '../../engine/stats/vocab-results';
import { lightPalette } from './cards';
import { dayText, examLine, historyShare, quantShare, shortDay, vocabShare } from './summary';

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

  it('lists every topic, weakest first', () => {
    const card = quantShare('Quant drill', quant({
      byTopic: {
        rates: { correct: 1, total: 1 },
        money: { correct: 2, total: 5 },
        ratios: { correct: 3, total: 4 },
        percents: { correct: 1, total: 2 },
        averages: { correct: 3, total: 3 },
      },
    }));
    expect(card.rows.map((r) => r.label)).toEqual(['Money', 'Percents', 'Ratios', 'Averages', 'Rates']);
    expect(card.rows[0]).toEqual({ label: 'Money', count: '2/5', share: 0.4 });
    expect(card.text).toContain('rates 1/1');
  });

  it('puts the topic with more questions first when two score the same', () => {
    const card = quantShare('Quant drill', quant({
      byTopic: { algebra: { correct: 0, total: 1 }, rates: { correct: 0, total: 3 } },
    }));
    expect(card.rows.map((r) => r.label)).toEqual(['Rates', 'Algebra']);
  });

  it('folds the strongest topics into one row when there are too many to fit, so the rows still add up', () => {
    const card = quantShare('Quant drill', quant({
      correct: 14,
      total: 24,
      byTopic: {
        rates: { correct: 4, total: 6 },
        money: { correct: 3, total: 5 },
        ratios: { correct: 2, total: 4 },
        percents: { correct: 1, total: 3 },
        averages: { correct: 1, total: 2 },
        algebra: { correct: 1, total: 1 },
        geometry: { correct: 1, total: 1 },
        fractions: { correct: 0, total: 1 },
        statistics: { correct: 1, total: 1 },
      },
    }));
    expect(card.rows).toHaveLength(7);
    expect(card.rows.slice(0, 2).map((r) => r.label)).toEqual(['Fractions', 'Percents']);
    expect(card.rows[6]).toEqual({ label: 'Other topics', count: '3/3', share: 1 });
    const added = card.rows.reduce((sum, r) => sum + Number(r.count!.split('/')[1]), 0);
    expect(added).toBe(24);
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
    expect(card.rows.map((r) => r.count)).toEqual(['30', '6', '4']);
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

describe('historyShare', () => {
  const history = { days: 7, answered: 120, correct: 96, avgMs: 22_000, newWords: 400, studyDays: 5, perDay: [10, 0, 20, 30, 0, 30, 30], weakest: [{ topic: 'fractions' as const, answered: 20, accuracy: 0.6, avgMs: 30_000, weakest: true }] };

  it('sums up the days, with one bar a day', () => {
    const card = historyShare(history);
    expect(card.kind).toBe('Last 7 days');
    expect(card.score).toEqual({ value: 120, of: 'questions' });
    expect(card.stats).toEqual([
      { label: 'Accuracy', value: '80%' },
      { label: 'New words', value: '400' },
      { label: 'Study days', value: '5 of 7' },
    ]);
    expect(card.bars?.values).toHaveLength(7);
    expect(card.rows[0]).toEqual({ label: 'Fractions', share: 0.6 });
    expect(card.text).toBe('Graphite · Last 7 days · 120 questions (80%) · avg 22s · 400 new words · 5 of 7 days studied · to work on: fractions 60%');
  });

  it('reads sensibly with no questions', () => {
    const card = historyShare({ ...history, answered: 0, correct: 0, avgMs: null, weakest: [] });
    expect(card.stats[0]!.value).toBe('—');
    expect(card.text).toBe('Graphite · Last 7 days · 0 questions · 400 new words · 5 of 7 days studied');
  });
});

describe('shortDay', () => {
  it('reads as a short date', () => {
    expect(shortDay('2026-11-03')).toBe('Nov 3');
  });
});
