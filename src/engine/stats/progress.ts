// Streaks, totals and today's plan, computed on demand from attempts (no stored rollups in Phase 1).
import { addDays, type Day } from '../dates';
import { isDue, type WordSchedule } from '../scheduling/leitner';
import { introducedOn } from '../sessions/vocab-builder';

export interface Streaks {
  current: number;
  best: number;
  studyDays: number;
}

/**
 * `days` are the days with a finished session, in any order. The current streak survives until the
 * end of the day after the last study day, so it doesn't read 0 every morning before the first session.
 */
export function streaks(days: readonly Day[], today: Day): Streaks {
  const set = new Set(days);
  let best = 0;
  for (const day of set) {
    if (set.has(addDays(day, -1))) continue;
    let run = 1;
    while (set.has(addDays(day, run))) run++;
    best = Math.max(best, run);
  }
  let current = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  return { current, best, studyDays: set.size };
}

export interface GoalRow {
  done: number;
  goal: number;
}

export interface TodayPlan {
  /** Due words: reviewed today, out of reviewed plus still due. */
  due: GoalRow;
  newWords: GoalRow;
  quant: GoalRow;
}

export function todayPlan(args: {
  states: ReadonlyMap<string, WordSchedule>;
  /** Word ids attempted today, repeats allowed. */
  wordsAttemptedToday: readonly string[];
  quantAnsweredToday: number;
  goals: { newWords: number; quantQuestions: number };
  today: Day;
}): TodayPlan {
  const { states, today } = args;
  // A word first seen today is a new word, not a review.
  const reviewed = new Set(args.wordsAttemptedToday.filter((id) => states.get(id)?.firstSeenDay !== today)).size;
  let stillDue = 0;
  for (const s of states.values()) if (isDue(s, today)) stillDue++;
  return {
    due: { done: reviewed, goal: reviewed + stillDue },
    newWords: { done: introducedOn(states, today), goal: args.goals.newWords },
    quant: { done: args.quantAnsweredToday, goal: args.goals.quantQuestions },
  };
}

/** How many of a gate tally's strokes to fill: whole strokes only, and only a met goal fills them all. */
export function filledStrokes(row: GoalRow, strokes: number): number {
  if (row.goal <= 0) return 0;
  return Math.min(strokes, Math.floor((row.done / row.goal) * strokes));
}

export interface QuantTotals {
  answered: number;
  correct: number;
  /** Average time per answer in ms; null before the first answer. */
  averageMs: number | null;
}

/** Questions never reached took no time and weren't answered, so they don't count here. */
export function quantTotals(attempts: readonly { correct: boolean; ms: number; flags: readonly string[] }[]): QuantTotals {
  const answered = attempts.filter((a) => !a.flags.includes('not-reached'));
  return {
    answered: answered.length,
    correct: answered.filter((a) => a.correct).length,
    averageMs: answered.length ? answered.reduce((sum, a) => sum + a.ms, 0) / answered.length : null,
  };
}

export const KNOWN_BOX = 3;

/** Words seen at least once, and words in Known or above (the PRD's 1,200-word target). */
export function wordTotals(states: Iterable<WordSchedule>): { seen: number; known: number } {
  let seen = 0;
  let known = 0;
  for (const s of states) {
    if (s.seen > 0) seen++;
    if (s.box >= KNOWN_BOX) known++;
  }
  return { seen, known };
}
