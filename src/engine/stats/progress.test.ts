import { describe, expect, it } from 'vitest';
import { newSchedule, type WordSchedule } from '../scheduling/leitner';
import { filledStrokes, quantTotals, streaks, todayPlan, wordTotals } from './progress';

const state = (wordId: string, patch: Partial<WordSchedule>): [string, WordSchedule] => [wordId, { ...newSchedule(wordId), ...patch }];

describe('streaks', () => {
  it('is zero with no study days', () => {
    expect(streaks([], '2026-11-10')).toEqual({ current: 0, best: 0, studyDays: 0 });
  });

  it('counts back from today, ignoring repeats and order', () => {
    expect(streaks(['2026-11-10', '2026-11-08', '2026-11-09', '2026-11-10'], '2026-11-10')).toEqual({ current: 3, best: 3, studyDays: 3 });
  });

  it('stays alive through the day after the last study day, then breaks', () => {
    const days = ['2026-11-08', '2026-11-09'];
    expect(streaks(days, '2026-11-10').current).toBe(2);
    expect(streaks(days, '2026-11-11').current).toBe(0);
  });

  it('keeps the best run after a break', () => {
    expect(streaks(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-09'], '2026-11-09')).toEqual({ current: 1, best: 3, studyDays: 4 });
  });

  it('runs across a month end', () => {
    expect(streaks(['2026-10-31', '2026-11-01'], '2026-11-01').current).toBe(2);
  });
});

describe('todayPlan', () => {
  const today = '2026-11-10';
  const goals = { newWords: 200, quantQuestions: 100 };

  it('counts distinct reviews, plus what is still due, as the due total', () => {
    const states = new Map([
      state('a', { box: 2, dueDay: '2026-11-11', firstSeenDay: '2026-11-08' }),
      state('b', { box: 1, dueDay: today, firstSeenDay: '2026-11-08' }),
      state('c', { box: 3, dueDay: '2026-11-09', firstSeenDay: '2026-11-07' }),
    ]);
    const plan = todayPlan({ states, wordsAttemptedToday: ['a', 'a'], quantAnsweredToday: 40, goals, today });
    expect(plan.due).toEqual({ done: 1, goal: 3 });
    expect(plan.quant).toEqual({ done: 40, goal: 100 });
  });

  it('counts a word first seen today as new, not as a review', () => {
    const states = new Map([state('n', { box: 1, dueDay: '2026-11-11', firstSeenDay: today })]);
    const plan = todayPlan({ states, wordsAttemptedToday: ['n'], quantAnsweredToday: 0, goals, today });
    expect(plan.due).toEqual({ done: 0, goal: 0 });
    expect(plan.newWords).toEqual({ done: 1, goal: 200 });
  });
});

describe('filledStrokes', () => {
  it('fills whole strokes only, and all of them only when the goal is met', () => {
    expect(filledStrokes({ done: 0, goal: 100 }, 25)).toBe(0);
    expect(filledStrokes({ done: 40, goal: 100 }, 25)).toBe(10);
    expect(filledStrokes({ done: 99, goal: 100 }, 25)).toBe(24);
    expect(filledStrokes({ done: 100, goal: 100 }, 25)).toBe(25);
  });

  it('caps past the goal and handles an empty goal', () => {
    expect(filledStrokes({ done: 300, goal: 100 }, 25)).toBe(25);
    expect(filledStrokes({ done: 0, goal: 0 }, 25)).toBe(0);
  });
});

describe('totals', () => {
  it('leaves questions never reached out of quant totals', () => {
    const totals = quantTotals([
      { correct: true, ms: 10_000, flags: [] },
      { correct: false, ms: 20_000, flags: ['skipped'] },
      { correct: false, ms: 0, flags: ['not-reached'] },
    ]);
    expect(totals).toEqual({ answered: 2, correct: 1, averageMs: 15_000 });
  });

  it('has no average before the first answer', () => {
    expect(quantTotals([]).averageMs).toBeNull();
  });

  it('counts words seen and words known or above; a starred unseen word is neither', () => {
    const states = new Map([state('a', { seen: 1, box: 1 }), state('b', { seen: 4, box: 3 }), state('c', { seen: 6, box: 5 }), state('d', { starred: true })]);
    expect(wordTotals(states.values())).toEqual({ seen: 3, known: 2 });
  });
});
