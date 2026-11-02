// Works out the wake-up times from what's on this device, and what the message should say.
import { daysBetween, toDay } from '../../engine/dates';
import { openNotes, type SealedNotes } from '../../content/sealed-notes';
import sealedNotes from '../../content/notes.sealed.json';
import { mergePlan, planNoteTimes, planWakeTimes, quietFor, SESSION_QUIET_MS } from '../../engine/scheduling/reminder-plan';
import { streaks } from '../../engine/stats/progress';
import { db, type GraphiteDB } from '../db';
import { getNotesOn, getProfile, getReminderLog, getReminderTime, getSettings, setReminderPlan } from './meta';
import { getResumable } from './quant-sessions';

const REVIEW_PAUSED_MINUTES = Number(import.meta.env.VITE_PAUSED_NUDGE_MINUTES);
const REVIEW_NOTE_MINUTES = Number(import.meta.env.VITE_NOTE_EVERY_MINUTES);

const opened = new Map<string, Promise<string[] | null>>();

/** The personal notes this user's name opens, or null. Slow on purpose, so remembered per name. */
export async function notesForProfile(d: GraphiteDB = db): Promise<string[] | null> {
  const name = (await getProfile(d))?.name;
  if (!name) return null;
  if (!opened.has(name)) opened.set(name, openNotes(sealedNotes as SealedNotes, name));
  return opened.get(name)!;
}

async function studyDays(d: GraphiteDB): Promise<string[]> {
  const rows = await d.sessions.where('status').equals('finished').toArray();
  return rows.filter((s) => s.answers.length > 0).map((s) => s.day);
}

/** A session left before its first answer isn't worth coming back to. */
async function pausedSession(now: number, d: GraphiteDB) {
  const session = await getResumable(now, d);
  return session && session.cursor > 0 ? session : null;
}

export async function currentWakeTimes(inSession = false, now = Date.now(), d: GraphiteDB = db): Promise<number[]> {
  const [days, paused, reminderTime, settings, log, notes, notesOn] = await Promise.all([studyDays(d), pausedSession(now, d), getReminderTime(d), getSettings(d), getReminderLog(d), notesForProfile(d), getNotesOn(d)]);
  const study = planWakeTimes({
    now,
    reminderTime,
    examDay: settings.examDay,
    lastStudiedDay: days.reduce<string | null>((latest, day) => (!latest || day > latest ? day : latest), null),
    streak: streaks(days, toDay(new Date(now))).current,
    hasPausedSession: paused !== null && paused.id !== log.nudgedSessionId,
    alreadySent: log.sentAt,
    pausedAfterMs: REVIEW_PAUSED_MINUTES > 0 ? REVIEW_PAUSED_MINUTES * 60_000 : undefined,
  });
  const noteTimes = notes ? planNoteTimes(now, REVIEW_NOTE_MINUTES > 0 ? REVIEW_NOTE_MINUTES * 60_000 : undefined) : { notes: [], asks: [] };
  const merged = mergePlan(study, noteTimes, notesOn);
  const plan = inSession ? quietFor(merged, now, SESSION_QUIET_MS) : merged;
  // The push itself is empty, so the phone remembers what each time was for.
  await setReminderPlan(plan, d);
  return plan.map((wake) => wake.at);
}

export async function studySummary(now: number, d: GraphiteDB = db) {
  const today = toDay(new Date(now));
  const [days, paused] = await Promise.all([studyDays(d), pausedSession(now, d)]);
  const last = days.reduce<string | null>((latest, day) => (!latest || day > latest ? day : latest), null);
  return {
    paused: paused ? { id: paused.id, type: paused.type, cursor: paused.cursor, total: paused.items.length, sprint: paused.type === 'quant' && paused.settings.timer === 'sprint' } : null,
    streak: streaks(days, today).current,
    studiedToday: last === today,
    daysAway: last ? daysBetween(last, today) : 0,
  };
}
