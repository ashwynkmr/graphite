import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startClock } from '../../engine/sessions/clock';
import { GraphiteDB, type SessionRow } from '../db';
import { DEFAULT_QUANT, logReminderSent, setReminderTime, updateSettings } from './meta';
import { currentWakeTimes, studySummary } from './reminder-plan';

const local = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();
const NOW = local(10, 9);
let n = 0;
let d: GraphiteDB;

beforeEach(async () => {
  d = new GraphiteDB(`plan-${++n}`);
  await d.open();
  await setReminderTime('19:00', d);
});
afterEach(() => d.delete());

function session(id: string, day: string, over: Partial<SessionRow> = {}): SessionRow {
  return { id, type: 'quant', status: 'finished', day, startedAt: NOW - 1000, finishedAt: NOW - 500, seed: 1, settings: DEFAULT_QUANT, origin: { kind: 'drill' }, items: [{ ref: { kind: 'bank', id: 'q' }, mode: 'typed' }], answers: [{ value: '1', ms: 1 }], cursor: 1, timer: startClock(1), limitMs: null, ...over };
}

const onDay = (times: number[], day: number) => times.filter((t) => new Date(t).getDate() === day);

describe('currentWakeTimes', () => {
  it('starts with the usual time today', async () => {
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([local(10, 19)]);
  });

  it('drops today once a session is finished today', async () => {
    await d.sessions.add(session('a', '2026-11-10'));
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([]);
  });

  it('ignores a session ended with no answers', async () => {
    await d.sessions.add(session('a', '2026-11-10', { answers: [], cursor: 0 }));
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([local(10, 19)]);
  });

  it('adds a nudge for a session paused partway, but not for one never started', async () => {
    await d.sessions.add(session('a', '2026-11-10', { status: 'active', cursor: 0, answers: [] }));
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([local(10, 19)]);
    await d.sessions.put(session('a', '2026-11-10', { status: 'active' }));
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([local(10, 11), local(10, 19)]);
  });

  it('nudges about a paused session once, and a different one afresh', async () => {
    await d.sessions.put(session('a', '2026-11-10', { status: 'active' }));
    await logReminderSent(NOW - 1000, 'a', d);
    expect(onDay(await currentWakeTimes(false, NOW + 3 * 3_600_000, d), 10)).toEqual([local(10, 19)]);
    await d.sessions.put(session('a', '2026-11-10', { status: 'abandoned' }));
    await d.sessions.put(session('b', '2026-11-10', { status: 'active' }));
    // One already sent today, so the new nudge takes the day's second and last place.
    expect(onDay(await currentWakeTimes(false, NOW + 3 * 3_600_000, d), 10)).toEqual([local(10, 14)]);
  });

  it('counts reminders already shown towards the daily limit', async () => {
    await logReminderSent(local(10, 8), null, d);
    await logReminderSent(local(10, 8, 30), null, d);
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([]);
  });

  it('holds wake-ups back while a session is on screen', async () => {
    await setReminderTime('09:10', d);
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([local(10, 9, 10)]);
    expect(onDay(await currentWakeTimes(true, NOW, d), 10)).toEqual([]);
  });

  it('warns about a streak at risk', async () => {
    await d.sessions.bulkAdd([session('a', '2026-11-08'), session('b', '2026-11-09')]);
    expect(onDay(await currentWakeTimes(false, NOW, d), 10)).toEqual([local(10, 19), local(10, 21, 30)]);
  });

  it('plans nothing after the exam date in settings', async () => {
    await updateSettings({ examDay: '2026-11-09' }, d);
    expect(await currentWakeTimes(false, NOW, d)).toEqual([]);
  });
});

describe('studySummary', () => {
  it('reports what the reminder needs', async () => {
    await d.sessions.bulkAdd([session('a', '2026-11-06'), session('b', '2026-11-07'), session('c', '2026-11-10', { status: 'active', cursor: 3 })]);
    expect(await studySummary(NOW, d)).toEqual({ paused: { id: 'c', type: 'quant', cursor: 3, total: 1 }, streak: 0, studiedToday: false, daysAway: 3 });
  });

  it('treats a new user as not away', async () => {
    expect(await studySummary(NOW, d)).toEqual({ paused: null, streak: 0, studiedToday: false, daysAway: 0 });
  });
});
