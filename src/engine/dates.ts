// Local-date helpers. Days are 'YYYY-MM-DD' strings in the user's own timezone, so streaks
// and the countdown follow the user's midnight.

export type Day = string;

export function toDay(date: Date): Day {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayToUtcMs(day: Day): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). DST-safe. */
export function daysBetween(from: Day, to: Day): number {
  return Math.round((dayToUtcMs(to) - dayToUtcMs(from)) / 86_400_000);
}

/** Days left until the exam, or null once the exam day has passed (the countdown hides). */
export function daysToExam(today: Day, examDay: Day): number | null {
  const n = daysBetween(today, examDay);
  return n < 0 ? null : n;
}

export const DEFAULT_EXAM_DAY: Day = '2026-11-24';
