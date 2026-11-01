import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, daysToExam, toDay } from './dates';

describe('toDay', () => {
  it('formats a local date with zero padding', () => {
    expect(toDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('daysBetween', () => {
  it.each([
    ['2026-11-01', '2026-11-24', 23],
    ['2026-11-24', '2026-11-24', 0],
    ['2026-11-25', '2026-11-24', -1],
    ['2026-10-31', '2026-11-02', 2], // crosses a DST change in many timezones
    ['2026-12-31', '2027-01-01', 1],
  ])('%s to %s is %i', (from, to, n) => {
    expect(daysBetween(from, to)).toBe(n);
  });
});

describe('daysToExam', () => {
  it('counts down and hides after the exam', () => {
    expect(daysToExam('2026-11-01', '2026-11-24')).toBe(23);
    expect(daysToExam('2026-11-24', '2026-11-24')).toBe(0);
    expect(daysToExam('2026-11-25', '2026-11-24')).toBeNull();
  });
});

describe('addDays', () => {
  it.each([
    ['2026-11-03', 1, '2026-11-04'],
    ['2026-11-28', 7, '2026-12-05'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2026-11-01', -1, '2026-10-31'],
    ['2026-10-31', 2, '2026-11-02'], // across a DST change in many timezones
    ['2028-02-28', 1, '2028-02-29'],
  ] as const)('%s + %i = %s', (day, n, out) => {
    expect(addDays(day, n)).toBe(out);
  });
});
