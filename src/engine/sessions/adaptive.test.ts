import { describe, expect, it } from 'vitest';
import { levelsFor, nextLevel, START_LEVEL, type AdaptiveAnswer } from './adaptive';

const fast: AdaptiveAnswer = { correct: true, underTarget: true };
const slow: AdaptiveAnswer = { correct: true, underTarget: false };
const wrong: AdaptiveAnswer = { correct: false, underTarget: false };
const times = (a: AdaptiveAnswer, n: number) => Array<AdaptiveAnswer>(n).fill(a);

describe('nextLevel', () => {
  it('moves up after 8 of the last 10 are correct and under target', () => {
    expect(nextLevel(2, [...times(fast, 8), ...times(wrong, 2)])).toBe(3);
    expect(nextLevel(2, times(fast, 8))).toBe(3);
  });

  it('stays put at 7 of 10, or when correct answers are too slow', () => {
    expect(nextLevel(2, [...times(fast, 7), ...times(wrong, 3)])).toBe(2);
    expect(nextLevel(2, [...times(fast, 7), ...times(slow, 3)])).toBe(2);
    expect(nextLevel(2, times(slow, 10))).toBe(2);
  });

  it('moves down after 5 or more of the last 10 are wrong, but not at 4', () => {
    expect(nextLevel(2, [...times(fast, 5), ...times(wrong, 5)])).toBe(1);
    expect(nextLevel(2, times(wrong, 5))).toBe(1);
    expect(nextLevel(2, [...times(fast, 6), ...times(wrong, 4)])).toBe(2);
  });

  it('looks only at the last 10', () => {
    expect(nextLevel(2, [...times(wrong, 20), ...times(fast, 10)])).toBe(3);
    expect(nextLevel(2, [...times(wrong, 5), ...times(slow, 10)])).toBe(2);
  });

  it('stops at Easy and Hard', () => {
    expect(nextLevel(3, times(fast, 10))).toBe(3);
    expect(nextLevel(1, times(wrong, 10))).toBe(1);
  });

  it('holds with too few answers to tell', () => {
    expect(nextLevel(2, [])).toBe(2);
    expect(nextLevel(2, times(fast, 7))).toBe(2);
    expect(nextLevel(2, times(wrong, 4))).toBe(2);
  });
});

describe('levelsFor', () => {
  it('uses each topic’s level, and starts a new topic at Medium', () => {
    expect(levelsFor(['percents', 'ratios'], { percents: { level: 3, sinceAttemptId: 9 } })).toEqual({ percents: 3, ratios: START_LEVEL });
  });
});
