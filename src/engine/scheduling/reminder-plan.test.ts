import { describe, expect, it } from 'vitest';
import { mergePlan, MAX_PLANNED, noteIndex, planNoteTimes, planWakeTimes, quietFor, SESSION_QUIET_MS, wakeKind, type PlanInput } from './reminder-plan';

const local = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();
const base: PlanInput = { now: local(10, 9), reminderTime: '19:00', examDay: '2026-11-24', lastStudiedDay: '2026-11-09', streak: 0, hasPausedSession: false };
const plan = (over: Partial<PlanInput> = {}) => planWakeTimes({ ...base, ...over });
const on = (times: number[], d: number) => times.filter((t) => new Date(t).getDate() === d);

describe('planWakeTimes', () => {
  it('wakes at the usual time on a day with no study yet', () => {
    expect(on(plan(), 10)).toEqual([local(10, 19)]);
  });

  it('stays quiet today once the user has studied, and picks up tomorrow', () => {
    const times = plan({ lastStudiedDay: '2026-11-10' });
    expect(on(times, 10)).toEqual([]);
    expect(on(times, 11)).toEqual([local(11, 19)]);
  });

  it('skips a usual time that has passed', () => {
    expect(on(plan({ now: local(10, 20) }), 10)).toEqual([]);
  });

  it('warns about a streak the evening it would end', () => {
    const times = plan({ streak: 5, reminderTime: '12:00' });
    expect(on(times, 10)).toEqual([local(10, 12), local(10, 21, 30)]);
  });

  it('moves the streak warning to tomorrow once today is banked', () => {
    const times = plan({ streak: 5, lastStudiedDay: '2026-11-10', reminderTime: '12:00' });
    expect(on(times, 10)).toEqual([]);
    expect(on(times, 11)).toEqual([local(11, 12), local(11, 21, 30)]);
  });

  it('does not warn about a one-day streak', () => {
    expect(on(plan({ streak: 1, reminderTime: '12:00' }), 10)).toEqual([local(10, 12)]);
  });

  it('nudges about a paused session two hours later', () => {
    const times = plan({ hasPausedSession: true, reminderTime: '19:00' });
    expect(on(times, 10)).toEqual([local(10, 11), local(10, 19)]);
  });

  it('moves a paused nudge out of the night', () => {
    expect(on(plan({ now: local(10, 21), hasPausedSession: true, lastStudiedDay: '2026-11-10' }), 11)[0]).toBe(local(11, 8, 30));
    expect(on(plan({ now: local(10, 3), hasPausedSession: true, reminderTime: '19:00' }), 10)[0]).toBe(local(10, 8, 30));
  });

  it('never sends more than 2 a day, keeping the most important', () => {
    const times = plan({ now: local(10, 14), streak: 5, hasPausedSession: true, reminderTime: '19:00' });
    expect(on(times, 10)).toEqual([local(10, 16), local(10, 21, 30)]);
  });

  it('counts reminders already sent today towards the limit', () => {
    const times = plan({ now: local(10, 12), reminderTime: '19:00', streak: 5, alreadySent: [local(10, 9), local(10, 11)] });
    expect(on(times, 10)).toEqual([]);
    expect(on(times, 11).length).toBeGreaterThan(0);
  });

  it('keeps the spacing from a reminder just sent', () => {
    expect(on(plan({ now: local(10, 18), reminderTime: '19:00', alreadySent: [local(10, 18)] }), 10)).toEqual([]);
  });

  it('ignores reminders sent on other days', () => {
    expect(on(plan({ alreadySent: [local(9, 19), local(9, 21)] }), 10)).toEqual([local(10, 19)]);
  });

  it('keeps wake-ups at least 2 hours apart', () => {
    const times = plan({ streak: 5, reminderTime: '21:00' });
    expect(on(times, 10)).toEqual([local(10, 21, 30)]);
  });

  it('eases off after 3 days away', () => {
    const days = plan({ lastStudiedDay: '2026-11-09' }).map((t) => new Date(t).getDate());
    expect(days).toEqual([10, 11, 12, 15]);
  });

  it('counts time away from today for someone who has never studied', () => {
    expect(plan({ lastStudiedDay: null }).map((t) => new Date(t).getDate())).toEqual([10, 11, 12, 13, 16]);
  });

  it('stops after the exam, including the exam day’s later plans', () => {
    expect(plan({ now: local(25, 9) })).toEqual([]);
    const times = plan({ now: local(23, 9), lastStudiedDay: '2026-11-22' });
    expect(times.map((t) => new Date(t).getDate())).toEqual([23, 24]);
  });

  it('accepts a shorter paused delay for review', () => {
    expect(plan({ hasPausedSession: true, pausedAfterMs: 120_000 })[0]).toBe(local(10, 9, 2));
  });

  it('returns times in order, all in the future', () => {
    const times = plan({ streak: 3, hasPausedSession: true });
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times.every((t) => t > base.now)).toBe(true);
  });
});

describe('personal notes', () => {
  const none = { notes: [], asks: [] };

  it('fall every 2 hours through the waking day, ending with the question', () => {
    const { notes, asks } = planNoteTimes(local(10, 8));
    expect(on(notes, 10)).toEqual([9, 11, 13, 15, 17, 19].map((h) => local(10, h)));
    expect(on(asks, 10)).toEqual([local(10, 21)]);
  });

  it('skip times already past', () => {
    const { notes, asks } = planNoteTimes(local(10, 20));
    expect(on(notes, 10)).toEqual([]);
    expect(on(asks, 10)).toEqual([local(10, 21)]);
  });

  it('in a review build, keep the same slots when re-planned', () => {
    const every = 60_000;
    const first = planNoteTimes(9 * every, every);
    const second = planNoteTimes(10 * every, every);
    expect(first.asks).toContain(12 * every);
    expect(second.asks).toContain(12 * every);
    expect(second.notes).toContain(11 * every);
  });

  it('come regardless of study, unless one would land on a study reminder', () => {
    const plan = mergePlan([local(10, 19, 10)], { notes: [local(10, 17), local(10, 19)], asks: [local(10, 21)] }, true);
    expect(plan).toEqual([
      { at: local(10, 17), kind: 'note' },
      { at: local(10, 19, 10), kind: 'study' },
      { at: local(10, 21), kind: 'ask' },
    ]);
  });

  it('stop after a no, leaving only the one nightly question', () => {
    const plan = mergePlan([], planNoteTimes(local(10, 8)), false);
    expect(plan.every((w) => w.kind === 'ask')).toBe(true);
    expect(on(plan.map((w) => w.at), 10)).toEqual([local(10, 21)]);
    expect(on(plan.map((w) => w.at), 11)).toEqual([local(11, 21)]);
  });

  it('keep the plan within what the service accepts, soonest first', () => {
    const plan = mergePlan([], planNoteTimes(local(10, 8)), true);
    expect(plan).toHaveLength(MAX_PLANNED);
    expect(plan[0]!.at).toBe(local(10, 9));
  });

  it('identifies what a wake-up was for, even if delayed', () => {
    const plan = mergePlan([local(10, 19, 10)], { ...none, notes: [local(10, 17)], asks: [local(10, 21)] }, true);
    expect(wakeKind(plan, local(10, 17))).toBe('note');
    expect(wakeKind(plan, local(10, 17, 20))).toBe('note');
    expect(wakeKind(plan, local(10, 19, 12))).toBe('study');
    expect(wakeKind(plan, local(10, 21))).toBe('ask');
    expect(wakeKind(plan, local(10, 12))).toBe('study');
    expect(wakeKind([], local(10, 12))).toBe('study');
  });

  it('hold everything back while a session is on screen', () => {
    const plan = mergePlan([local(10, 9, 15)], { notes: [local(10, 11)], asks: [] }, true);
    expect(quietFor(plan, local(10, 9), SESSION_QUIET_MS)).toEqual([{ at: local(10, 11), kind: 'note' }]);
  });

  it('show every note once before any repeats', () => {
    const shown = Array.from({ length: 100 }, (_, i) => noteIndex(i, 100));
    expect(new Set(shown).size).toBe(100);
    expect(noteIndex(100, 100)).toBeGreaterThanOrEqual(0);
    expect(Array.from({ length: 100 }, (_, i) => noteIndex(i + 100, 100))).not.toEqual(shown);
  });
});
