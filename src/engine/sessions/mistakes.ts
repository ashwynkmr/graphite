// Mistake log rules (TRD "Mistake log"): wrong, skipped and not-reached answers are added;
// a logged item leaves after 2 correct answers in a row; a miss resets its streak.

export const CLEAR_AFTER = 2;

export type MistakeChange = { kind: 'none' } | { kind: 'put'; correctStreak: number } | { kind: 'remove' };

/** What happens to the log entry for an item after one answer. `existing` is its current streak, if logged. */
export function mistakeChange(existing: number | undefined, correct: boolean): MistakeChange {
  if (!correct) return { kind: 'put', correctStreak: 0 };
  if (existing === undefined) return { kind: 'none' };
  const streak = existing + 1;
  return streak >= CLEAR_AFTER ? { kind: 'remove' } : { kind: 'put', correctStreak: streak };
}
