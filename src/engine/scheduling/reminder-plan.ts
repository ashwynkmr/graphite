// When to wake the phone, from how the user is studying. Pure: the phone works this out and the
// server only ever receives the resulting times (0037). A new plan replaces the old one each time
// the app is used, so these rules describe what happens if the user does nothing further.
import { addDays, daysBetween, toDay, type Day } from '../dates';
import { mulberry32 } from '../rng';

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

/** Personal notes (0041): every 2 hours through the waking day, whatever the user has studied. */
export const NOTE_TIMES = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];
/** A note this near a study reminder would arrive on top of it, so the study reminder wins. */
const NOTE_CLEAR_MS = 30 * 60 * 1000;
/** The most wake-ups the reminder service accepts at once. Each wake-up makes a new plan. */
export const MAX_PLANNED = 32;

export interface PlannedWake {
  at: number;
  /** A study reminder, a personal note, or the nightly question about the notes. */
  kind: 'study' | 'note' | 'ask';
}

/** While a session is on screen, nothing is planned this soon. Re-planned well before it runs out. */
export const SESSION_QUIET_MS = 20 * 60 * 1000;

interface NotePlan {
  notes: number[];
  asks: number[];
}

/** The day's last slot asks whether the notes are still welcome; the others are notes. */
export function planNoteTimes(now: number, everyMs?: number): NotePlan {
  const plan: NotePlan = { notes: [], asks: [] };
  // A review build compresses the day, with every third wake-up as the question.
  if (everyMs) {
    // On a fixed grid, so re-planning after a wake-up doesn't restart the count.
    const slot = Math.floor(now / everyMs);
    for (let i = 1; i <= 9; i++) ((slot + i) % 3 === 0 ? plan.asks : plan.notes).push((slot + i) * everyMs);
    return plan;
  }
  const today = toDay(new Date(now));
  for (let i = 0; i < PLAN_DAYS; i++) {
    NOTE_TIMES.forEach((time, slot) => {
      const when = at(addDays(today, i), time);
      if (when > now) (slot === NOTE_TIMES.length - 1 ? plan.asks : plan.notes).push(when);
    });
  }
  return plan;
}

export function mergePlan(study: readonly number[], { notes, asks }: NotePlan, notesWanted: boolean): PlannedWake[] {
  const clear = notesWanted ? notes.filter((n) => !study.some((s) => Math.abs(s - n) < NOTE_CLEAR_MS)) : [];
  return [...study.map((at) => ({ at, kind: 'study' as const })), ...clear.map((at) => ({ at, kind: 'note' as const })), ...asks.map((at) => ({ at, kind: 'ask' as const }))]
    .sort((a, b) => a.at - b.at)
    .slice(0, MAX_PLANNED);
}

/** Holds everything back for now, so nothing arrives mid-session. */
export function quietFor(plan: readonly PlannedWake[], now: number, ms: number): PlannedWake[] {
  return plan.filter((wake) => wake.at > now + ms);
}

/** What the wake-up arriving now was planned for. A delayed push still matches; anything unknown counts as study. */
export function wakeKind(plan: readonly PlannedWake[], now: number): PlannedWake['kind'] {
  const LATE_MS = 35 * 60 * 1000;
  const EARLY_MS = 60 * 1000;
  let best: PlannedWake | null = null;
  for (const wake of plan) {
    if (wake.at <= now + EARLY_MS && now - wake.at <= LATE_MS && (!best || wake.at > best.at)) best = wake;
  }
  return best?.kind ?? 'study';
}

/** Which note to show for the nth time: every note once, in a fresh order, before any repeats. */
export function noteIndex(count: number, total: number): number {
  const round = Math.floor(count / total);
  const order = mulberry32(round + 1).shuffle(Array.from({ length: total }, (_, i) => i));
  return order[count % total]!;
}
