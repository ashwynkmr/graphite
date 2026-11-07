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
  byLevel: {},
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

  it('lists quiz cards by level, adding up to the score', () => {
    const card = vocabShare('Mixed practice · Easy + Hard', vocab({ total: 10, correct: 7, flashcards: 4, marks: { know: 4, unsure: 0, review: 0 }, byLevel: { 1: { correct: 4, total: 4 }, 3: { correct: 3, total: 6 } } }));
    expect(card.rows).toEqual([
      { label: 'Easy', count: '4/4', share: 1 },
      { label: 'Hard', count: '3/6', share: 0.5 },
    ]);
    expect(card.text).toBe('Graphite · Mixed practice · Easy + Hard · 7/10 (70%) · avg 5s · easy 4/4, hard 3/6 · flashcards 4 of 4 known');
  });

  it('shows one level as one row, without repeating it in the text', () => {
    const card = vocabShare('Fill the blank · Hard', vocab({ total: 5, correct: 2, byLevel: { 3: { correct: 2, total: 5 } } }));
    expect(card.rows).toEqual([{ label: 'Hard', count: '2/5', share: 0.4 }]);
    expect(card.text).toBe('Graphite · Fill the blank · Hard · 2/5 (40%) · avg 5s');
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
  const topic = (name: 'fractions' | 'rates', accuracy: number) => ({ topic: name, answered: 20, accuracy, avgMs: 30_000, weakest: name === 'fractions' });
  const history = {
    days: 7,
    answered: 186,
    correct: 145,
    avgMs: 24_000,
    previous: { answered: 100, correct: 69, avgMs: 31_000 },
    newWords: 301,
    wordsPerDay: 43,
    studyDays: 6,
    calendar: ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map((day, i) => ({ day, studied: i !== 3 })),
    perDay: [10, 0, 20, 30, 0, 30, 30],
    weakest: [topic('fractions', 0.58)],
    best: topic('rates', 0.92),
  };
  const words = { seen: 620, known: 210, deck: 1500 };

  it('splits the report into Quant and Verbal', () => {
    const card = historyShare(history, words, 19);
    expect(card.kind).toBe('Report card · Last 7 days');
    expect(card.studied).toBe('Studied 6 of 7 days');
    expect(card.calendar.map((d) => d.letter).join('')).toBe('FSSMTWT');
    expect(card.quant.line).toBe('Up from 69% last week');
    expect(card.quant.rows).toEqual([
      { label: 'Questions', value: '186, at 24s each' },
      { label: 'Best topic', value: 'Rates, 92%' },
      { label: 'Needs work', value: 'Fractions, 58%' },
    ]);
    expect(card.verbal.rows).toEqual([
      { label: 'Learning', value: '43 a day' },
      { label: 'Needed for the GRE', value: '47 a day' },
      { label: 'Know well', value: '210 words' },
    ]);
  });

  it('works out the note from the numbers', () => {
    expect(historyShare(history, words, 19).note).toBe('More right, and faster. Fractions next, and 4 more words a day.');
    expect(historyShare({ ...history, wordsPerDay: 50 }, words, 19).note).toBe('More right, and faster. Fractions next. Words on pace.');
    expect(historyShare({ ...history, previous: { answered: 100, correct: 90, avgMs: 24_000 }, weakest: [] }, words, 19).note).toBe('Fewer right than before. 4 more words a day.');
  });

  it('writes the summary line', () => {
    expect(historyShare(history, words, 19).text).toBe('Graphite · Last 7 days · 19 days to the GRE · studied 6 of 7 days · Quant 145/186 (78%), up from 69% last week, avg 24s · best rates 92% · needs work fractions 58% · Verbal 620 of 1,500 words seen, 210 known well · learning 43 a day, needs 47');
  });

  it('says nothing about change without an earlier period', () => {
    const card = historyShare({ ...history, previous: null }, words, 19);
    expect(card.quant.line).toBe('Got right');
    expect(card.quant.previous).toBeNull();
    expect(card.note).toBe('Fractions next, and 4 more words a day.');
  });

  it('reads sensibly with no questions and too few answers', () => {
    const card = historyShare({ ...history, answered: 0, correct: 0, avgMs: null, previous: null, weakest: [], best: null, wordsPerDay: 0 }, { seen: 0, known: 0, deck: 1500 }, 19);
    expect(card.quant.accuracy).toBeNull();
    expect(card.quant.line).toBe('No questions yet');
    expect(card.quant.rows.map((r) => r.value)).toEqual(['0', 'Not enough yet', 'Not enough yet']);
    expect(card.text).toContain('Quant: no questions yet');
  });

  it('drops the pace once the exam has passed, and on exam day', () => {
    for (const daysLeft of [null, 0]) {
      const card = historyShare(history, words, daysLeft);
      expect(card.verbal.rows.map((r) => r.label)).toEqual(['Learning', 'Know well']);
      expect(card.note).toBe('More right, and faster. Fractions next.');
    }
  });

  it('says when every word has been seen', () => {
    const card = historyShare(history, { seen: 1500, known: 900, deck: 1500 }, 5);
    expect(card.verbal.rows[1]).toEqual({ label: 'Needed for the GRE', value: 'All words seen' });
  });

  it('compares 14 days without calling it last week', () => {
    expect(historyShare({ ...history, days: 14 }, words, 19).quant.line).toBe('Up from 69% before');
  });
});

describe('shortDay', () => {
  it('reads as a short date', () => {
    expect(shortDay('2026-11-03')).toBe('Nov 3');
  });
});
