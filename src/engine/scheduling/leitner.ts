// Leitner boxes with intervals compressed for a 3-week study window.
//
// Box 0 new · 1 learning (tomorrow) · 2 familiar (+1 day) · 3 known (+3) · 4 solid (+7) · 5 retired.
// Know it / correct / spelling slip: box + 1. Review / wrong: box 1, and the card comes back
// at the end of the same session. Unsure: box stays, due tomorrow (a new word moves to box 1).
// See docs/decisions/0015-leitner-edge-cases.md.

import { addDays, type Day } from '../dates';

export type Box = 0 | 1 | 2 | 3 | 4 | 5;

/** Flashcard marks and quiz outcomes. */
export type Grade = 'know' | 'unsure' | 'review' | 'correct' | 'slip' | 'wrong';

export interface WordSchedule {
  wordId: string;
  box: Box;
  /** Day the card is next due; null for new (box 0) and retired (box 5) cards. */
  dueDay: Day | null;
  seen: number;
  correct: number;
  lastResult: Grade | null;
  starred: boolean;
  round: number;
  firstSeenDay: Day | null;
}

export const RETIRED: Box = 5;

/** Days until next review after landing in each box. */
const INTERVAL_DAYS: Record<Box, number | null> = { 0: null, 1: 1, 2: 1, 3: 3, 4: 7, 5: null };

export function newSchedule(wordId: string): WordSchedule {
  return {
    wordId,
    box: 0,
    dueDay: null,
    seen: 0,
    correct: 0,
    lastResult: null,
    starred: false,
    round: 1,
    firstSeenDay: null,
  };
}

export function isPassing(grade: Grade): boolean {
  return grade === 'know' || grade === 'correct' || grade === 'slip';
}

export function isFailing(grade: Grade): boolean {
  return grade === 'review' || grade === 'wrong';
}

export function nextBox(box: Box, grade: Grade): Box {
  if (isPassing(grade)) return Math.min(box + 1, RETIRED) as Box;
  if (isFailing(grade)) return 1;
  return box === 0 ? 1 : box; // unsure
}

export function dueDayFor(box: Box, today: Day): Day | null {
  const days = INTERVAL_DAYS[box];
  return days === null ? null : addDays(today, days);
}

export interface GradeOutcome {
  schedule: WordSchedule;
  /** Show this card again at the end of the current session. */
  requeue: boolean;
}

export function applyGrade(s: WordSchedule, grade: Grade, today: Day): GradeOutcome {
  const box = nextBox(s.box, grade);
  // Unsure keeps the box but always comes back tomorrow, whatever the box interval.
  const dueDay = grade === 'unsure' && box !== RETIRED ? addDays(today, 1) : dueDayFor(box, today);
  return {
    schedule: {
      ...s,
      box,
      dueDay,
      seen: s.seen + 1,
      correct: s.correct + (isPassing(grade) ? 1 : 0),
      lastResult: grade,
      firstSeenDay: s.firstSeenDay ?? today,
    },
    requeue: isFailing(grade),
  };
}

/** Due for review today: boxes 1–4 whose due day has arrived. */
export function isDue(s: WordSchedule, today: Day): boolean {
  return s.box >= 1 && s.box <= 4 && s.dueDay !== null && s.dueDay <= today;
}
