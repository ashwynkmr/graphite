// The words for a suggestion, on Home and in the daily reminder.
import type { Nudge } from '../../engine/stats/nudge';
import { TOPIC_LABEL } from '../quant/display';

export function nudgeText(n: Nudge): string {
  switch (n.kind) {
    case 'weak':
      return `${TOPIC_LABEL[n.topic]} was your weakest last time (${Math.round(n.accuracy * 100)}%). Do 20 more?`;
    case 'due':
      return `${n.count} ${n.count === 1 ? 'word is' : 'words are'} due today.`;
    case 'slow':
      return `${TOPIC_LABEL[n.topic]}: right but slow. Try a timed set.`;
    case 'idle':
      return 'Nothing logged today yet. A 5-minute drill keeps the streak.';
  }
}

export interface ReminderFacts {
  name: string | null;
  paused: { type: 'quant' | 'vocab'; cursor: number; total: number } | null;
  nudge: Nudge | null;
  studiedToday: boolean;
  streak: number;
  daysAway: number;
  hour: number;
}

const STREAK_WARNING_HOUR = 21;
const STREAK_WORTH_SAVING = 2;
const AWAY_AFTER_DAYS = 2;

/** The reminder's message, written on the phone from the phone's own data. Whatever woke it, this says what matters most now. */
export function reminderText({ name, paused, nudge, studiedToday, streak, daysAway, hour }: ReminderFacts): string {
  const who = name ? `, ${name}` : '';
  if (paused) return `You left ${paused.type === 'vocab' ? 'a vocab session' : 'a drill'} at ${paused.cursor} of ${paused.total}. Pick it up?`;
  if (!studiedToday && streak >= STREAK_WORTH_SAVING && hour >= STREAK_WARNING_HOUR) return `Your ${streak}-day streak ends at midnight. A quick drill saves it.`;
  if (daysAway >= AWAY_AFTER_DAYS) return `${daysAway} days away${who}. ${nudge ? nudgeText(nudge) : 'A short session gets you going again.'}`;
  if (nudge) return nudgeText(nudge);
  return studiedToday ? `Good work today${who}. Room for one more?` : `Time for a session${who}.`;
}
