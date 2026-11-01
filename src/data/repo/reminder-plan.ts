// Works out the wake-up times from what's on this device, and what the message should say.
import { daysBetween, toDay } from '../../engine/dates';
import { planWakeTimes } from '../../engine/scheduling/reminder-plan';
import { streaks } from '../../engine/stats/progress';
import { db, type GraphiteDB } from '../db';
import { getReminderLog, getReminderTime, getSettings } from './meta';
import { getResumable } from './quant-sessions';

const REVIEW_PAUSED_MINUTES = Number(import.meta.env.VITE_PAUSED_NUDGE_MINUTES);

async function studyDays(d: GraphiteDB): Promise<string[]> {
  const rows = await d.sessions.where('status').equals('finished').toArray();
  return rows.filter((s) => s.answers.length > 0).map((s) => s.day);
}

/** A session left before its first answer isn't worth coming back to. */
async function pausedSession(now: number, d: GraphiteDB) {
  const session = await getResumable(now, d);
  return session && session.cursor > 0 ? session : null;
}

export async function currentWakeTimes(now = Date.now(), d: GraphiteDB = db): Promise<number[]> {
  const [days, paused, reminderTime, settings, log] = await Promise.all([studyDays(d), pausedSession(now, d), getReminderTime(d), getSettings(d), getReminderLog(d)]);
  return planWakeTimes({
    now,
    reminderTime,
    examDay: settings.examDay,
    lastStudiedDay: days.reduce<string | null>((latest, day) => (!latest || day > latest ? day : latest), null),
    streak: streaks(days, toDay(new Date(now))).current,
    hasPausedSession: paused !== null && paused.id !== log.nudgedSessionId,
    alreadySent: log.sentAt,
    pausedAfterMs: REVIEW_PAUSED_MINUTES > 0 ? REVIEW_PAUSED_MINUTES * 60_000 : undefined,
  });
}

export async function studySummary(now: number, d: GraphiteDB = db) {
  const today = toDay(new Date(now));
  const [days, paused] = await Promise.all([studyDays(d), pausedSession(now, d)]);
  const last = days.reduce<string | null>((latest, day) => (!latest || day > latest ? day : latest), null);
  return {
    paused: paused ? { id: paused.id, type: paused.type, cursor: paused.cursor, total: paused.items.length } : null,
    streak: streaks(days, today).current,
    studiedToday: last === today,
    daysAway: last ? daysBetween(last, today) : 0,
  };
}
