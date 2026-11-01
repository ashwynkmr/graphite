// When to wake the phone, from how the user is studying. Pure: the phone works this out and the
// server only ever receives the resulting times (0037). A new plan replaces the old one each time
// the app is used, so these rules describe what happens if the user does nothing further.
import { addDays, daysBetween, toDay, type Day } from '../dates';

/** How far ahead a plan reaches. Each wake-up makes a new plan, so this only limits a dead phone. */
export const PLAN_DAYS = 7;
export const MAX_PER_DAY = 2;
export const MIN_GAP_MS = 2 * 60 * 60 * 1000;
export const PAUSED_AFTER_MS = 2 * 60 * 60 * 1000;
/** A paused session is abandoned at 24 hours, so a later nudge would point at nothing. */
const PAUSED_EXPIRES_MS = 24 * 60 * 60 * 1000;
export const STREAK_CHECK = '21:30';
/** A streak this short isn't worth an extra interruption. */
export const STREAK_MIN = 2;
/** Daily until this many days away, then every third day: nagging doesn't bring anyone back. */
export const DAILY_UNTIL_DAYS_AWAY = 3;
export const EASED_EVERY_DAYS = 3;
const QUIET_START_HOUR = 22;
const QUIET_END = '08:30';

export interface PlanInput {
  now: number;
  /** The user's usual study time, 'HH:MM', local. */
  reminderTime: string;
  examDay: Day;
  /** Last day with a finished session; null if none yet. */
  lastStudiedDay: Day | null;
  streak: number;
  /** A session left partway that hasn't had its one nudge yet. */
  hasPausedSession: boolean;
  /** Wake-ups already shown, so the daily limit and spacing hold across plans. */
  alreadySent?: readonly number[];
  /** Overridable so a reviewer needn't wait two hours. */
  pausedAfterMs?: number;
}

function at(day: Day, time: string): number {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y!, m! - 1, d!, h!, min!).getTime();
}

/** Moves a time out of the night, to the next morning. */
function outOfQuietHours(ms: number): number {
  const date = new Date(ms);
  const day = toDay(date);
  if (date.getHours() >= QUIET_START_HOUR) return at(addDays(day, 1), QUIET_END);
  return ms < at(day, QUIET_END) ? at(day, QUIET_END) : ms;
}

/** Wake-up times in order. Empty after the exam. */
export function planWakeTimes(input: PlanInput): number[] {
  const { now, reminderTime, examDay, lastStudiedDay, streak } = input;
  const today = toDay(new Date(now));
  if (today > examDay) return [];
  const studiedToday = lastStudiedDay === today;

  // Most important first: each is kept only if its day still has room.
  const wanted: number[] = [];

  // Tonight, or tomorrow night once today is banked: the streak ends at that midnight.
  if (streak >= STREAK_MIN) wanted.push(at(studiedToday ? addDays(today, 1) : today, STREAK_CHECK));

  if (input.hasPausedSession) {
    const when = outOfQuietHours(now + (input.pausedAfterMs ?? PAUSED_AFTER_MS));
    if (when < now + PAUSED_EXPIRES_MS) wanted.push(when);
  }

  const start = lastStudiedDay ?? today;
  for (let i = 0; i < PLAN_DAYS; i++) {
    const day = addDays(today, i);
    if (day > examDay) break;
    if (i === 0 && studiedToday) continue;
    const away = daysBetween(start, day);
    if (away <= DAILY_UNTIL_DAYS_AWAY || away % EASED_EVERY_DAYS === 0) wanted.push(at(day, reminderTime));
  }

  const sent = input.alreadySent ?? [];
  const kept: number[] = [];
  for (const when of wanted) {
    if (when <= now || toDay(new Date(when)) > examDay) continue;
    const taken = [...sent, ...kept];
    const sameDay = taken.filter((k) => toDay(new Date(k)) === toDay(new Date(when)));
    if (sameDay.length >= MAX_PER_DAY) continue;
    if (taken.some((k) => Math.abs(k - when) < MIN_GAP_MS)) continue;
    kept.push(when);
  }
  return kept.sort((a, b) => a - b);
}
