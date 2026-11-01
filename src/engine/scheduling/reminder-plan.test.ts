import { describe, expect, it } from 'vitest';
import { planWakeTimes, type PlanInput } from './reminder-plan';

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
