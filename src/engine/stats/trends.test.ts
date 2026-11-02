import { describe, expect, it } from 'vitest';
import type { Topic } from '../generators/types';
import { newSchedule, type Box, type WordSchedule } from '../scheduling/leitner';
import { dailyQuant, lastDays, newWordsPerDay, studyHistory, topicStats, wordStages, type TrendAttempt } from './trends';

const TODAY = '2026-11-14';

const attempt = (topic: Topic, day: string, correct: boolean, ms = 10_000, flags: string[] = []): TrendAttempt => ({ topic, day, correct, ms, flags });
const many = (topic: Topic, day: string, right: number, wrong: number) => [...Array.from({ length: right }, () => attempt(topic, day, true)), ...Array.from({ length: wrong }, () => attempt(topic, day, false))];
const word = (id: string, box: Box, firstSeenDay: string | null = null): WordSchedule => ({ ...newSchedule(id), box, firstSeenDay });

describe('lastDays', () => {
  it('runs oldest first and ends today, across a month end', () => {
    expect(lastDays('2026-11-02', 3)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

describe('dailyQuant', () => {
  const attempts = [attempt('percents', TODAY, true, 10_000), attempt('percents', TODAY, false, 20_000), attempt('ratios', TODAY, true, 30_000), attempt('ratios', '2026-11-10', true)];

  it('gives one point a day, with a gap on days without answers', () => {
    const points = dailyQuant(attempts, TODAY);
    expect(points).toHaveLength(14);
    expect(points[13]).toEqual({ day: TODAY, answered: 3, correct: 2, accuracy: 2 / 3, avgMs: 20_000 });
    expect(points[12]).toEqual({ day: '2026-11-13', answered: 0, correct: 0, accuracy: null, avgMs: null });
  });

  it('narrows to one topic', () => {
    expect(dailyQuant(attempts, TODAY, 14, 'percents')[13]).toMatchObject({ answered: 2, accuracy: 0.5 });
  });

  it('leaves out questions never reached and anything before the window', () => {
    const points = dailyQuant([attempt('percents', TODAY, false, 0, ['not-reached']), attempt('percents', '2026-10-01', true)], TODAY);
    expect(points.every((p) => p.answered === 0)).toBe(true);
  });
});

describe('topicStats', () => {
  it('sorts weakest first and marks at most three with enough answers', () => {
    const stats = topicStats([...many('percents', TODAY, 5, 5), ...many('ratios', TODAY, 6, 4), ...many('rates', TODAY, 7, 3), ...many('money', TODAY, 8, 2), ...many('fractions', TODAY, 0, 9)], TODAY);
    expect(stats.map((s) => s.topic)).toEqual(['fractions', 'percents', 'ratios', 'rates', 'money']);
    // Fractions is lowest but has only 9 answers.
    expect(stats.filter((s) => s.weakest).map((s) => s.topic)).toEqual(['percents', 'ratios', 'rates']);
  });

  it('never calls a perfect topic weak', () => {
    expect(topicStats(many('percents', TODAY, 12, 0), TODAY)[0]!.weakest).toBe(false);
  });

  it('counts only the window', () => {
    expect(topicStats(many('percents', '2026-10-01', 12, 0), TODAY)).toEqual([]);
  });
});

describe('wordStages', () => {
  it('counts each stage, and every untouched word as new', () => {
    const states = [word('a', 1), word('b', 2), word('c', 3), word('d', 4), word('e', 5), word('f', 0)];
    expect(wordStages(states, 10)).toEqual({ new: 5, learning: 2, known: 2, retired: 1 });
  });
});

describe('newWordsPerDay', () => {
  it('counts words on the day they were first shown', () => {
    const days = newWordsPerDay([word('a', 1, TODAY), word('b', 1, TODAY), word('c', 1, '2026-11-13'), word('d', 0)], TODAY);
    expect(days[13]).toEqual({ day: TODAY, count: 2 });
    expect(days[12]).toEqual({ day: '2026-11-13', count: 1 });
  });
});

describe('studyHistory', () => {
  it('sums the window for sharing', () => {
    const h = studyHistory([...many('percents', TODAY, 8, 2), ...many('ratios', '2026-11-13', 1, 1), ...many('rates', '2026-11-01', 5, 0)], [word('a', 1, TODAY), word('b', 1, '2026-11-01')], [TODAY, TODAY, '2026-11-13', '2026-11-01'], TODAY, 7);
    expect(h).toMatchObject({ days: 7, answered: 12, correct: 9, avgMs: 10_000, newWords: 1, studyDays: 2 });
    expect(h.perDay).toEqual([0, 0, 0, 0, 0, 2, 10]);
    expect(h.weakest.map((t) => t.topic)).toEqual(['percents']);
  });

  it('holds up with nothing studied', () => {
    expect(studyHistory([], [], [], TODAY, 14)).toMatchObject({ answered: 0, avgMs: null, studyDays: 0, weakest: [] });
  });
});
