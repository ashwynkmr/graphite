import { describe, expect, it } from 'vitest';
import { nudgeText, reminderText } from './nudgeText';

const base = { name: 'Sam', paused: null, nudge: null, studiedToday: false, streak: 0, daysAway: 0, hour: 12 };

describe('nudgeText', () => {
  it('words each suggestion', () => {
    expect(nudgeText({ kind: 'weak', topic: 'fractions', accuracy: 0.583 })).toBe('Fractions was your weakest last time (58%). Do 20 more?');
    expect(nudgeText({ kind: 'due', count: 1 })).toBe('1 word is due today.');
    expect(nudgeText({ kind: 'due', count: 64 })).toBe('64 words are due today.');
    expect(nudgeText({ kind: 'slow', topic: 'percents' })).toBe('Percents: right but slow. Try a timed set.');
  });
});

describe('reminderText', () => {
  it('puts a paused session first, then the suggestion', () => {
    const nudge = { kind: 'due', count: 3 } as const;
    expect(reminderText({ ...base, nudge, paused: { type: 'quant', cursor: 12, total: 20 } })).toBe('You left a drill at 12 of 20. Pick it up?');
    expect(reminderText({ ...base, nudge, paused: { type: 'vocab', cursor: 4, total: 50 } })).toBe('You left a vocab session at 4 of 50. Pick it up?');
    expect(reminderText({ ...base, nudge, paused: { type: 'quant', cursor: 3, total: 125, sprint: true } })).toBe('You left a sprint with time on the clock. Pick it up?');
    expect(reminderText({ ...base, nudge })).toBe('3 words are due today.');
  });

  it('falls back to a plain line, with or without a name', () => {
    expect(reminderText(base)).toBe('Time for a session, Sam.');
    expect(reminderText({ ...base, studiedToday: true })).toBe('Good work today, Sam. Room for one more?');
    expect(reminderText({ ...base, name: null })).toBe('Time for a session.');
  });

  it('warns about a streak only at night, on a day not yet studied', () => {
    expect(reminderText({ ...base, streak: 5, hour: 21 })).toBe('Your 5-day streak ends at midnight. A quick drill saves it.');
    expect(reminderText({ ...base, streak: 5, hour: 20 })).toBe('Time for a session, Sam.');
    expect(reminderText({ ...base, streak: 5, hour: 21, studiedToday: true })).toBe('Good work today, Sam. Room for one more?');
    expect(reminderText({ ...base, streak: 1, hour: 21 })).toBe('Time for a session, Sam.');
  });

  it('welcomes someone back after days away', () => {
    expect(reminderText({ ...base, daysAway: 3 })).toBe('3 days away, Sam. A short session gets you going again.');
    expect(reminderText({ ...base, daysAway: 3, nudge: { kind: 'due', count: 64 } })).toBe('3 days away, Sam. 64 words are due today.');
    expect(reminderText({ ...base, daysAway: 1 })).toBe('Time for a session, Sam.');
  });

  it('still puts a paused session first', () => {
    expect(reminderText({ ...base, streak: 5, hour: 21, daysAway: 4, paused: { type: 'quant', cursor: 1, total: 20 } })).toBe('You left a drill at 1 of 20. Pick it up?');
  });
});
