// The one suggestion on Home (PRD "Study nudges", priorities 2-5). A paused drill, priority 1, is
// the resume banner. Computed from the user's own finished drills; never shown during a session.
import type { Topic } from '../generators/types';

export const NUDGE_SESSIONS = 3;
export const NUDGE_MIN_ANSWERS = 10;
/** A topic at or above the PRD's 90% accuracy target isn't weak, even if it's the lowest. */
export const WEAK_BELOW = 0.9;
/** "Right but slow": at least this share of a topic's correct answers were flagged slow. */
export const SLOW_SHARE = 0.5;
export const EVENING_HOUR = 18;

export type Nudge =
  | { kind: 'weak'; topic: Topic; accuracy: number }
  | { kind: 'due'; count: number }
  | { kind: 'slow'; topic: Topic }
  | { kind: 'idle' };

export interface NudgeAttempt {
  sessionId: string;
  topic: Topic;
  correct: boolean;
  flags: readonly string[];
}

export interface NudgeInput {
  attempts: readonly NudgeAttempt[];
  /** Finished normal drills, newest first. Retries and mistake drills would skew a topic's accuracy. */
  drillIds: readonly string[];
  dueWords: number;
  studiedToday: boolean;
  hour: number;
}

/**
 * Each topic's answers from the last 3 drills that included it, reaching further back until it has
 * 10 answers: a 20-question mixed drill gives each of the 9 topics only about 2. Topics with too few are dropped.
 */
function recentByTopic(attempts: readonly NudgeAttempt[], drillIds: readonly string[]): Map<Topic, NudgeAttempt[]> {
  const bySession = new Map<string, NudgeAttempt[]>();
  for (const a of attempts) {
    if (a.flags.includes('not-reached')) continue;
    const list = bySession.get(a.sessionId);
    if (list) list.push(a);
    else bySession.set(a.sessionId, [a]);
  }
  const recent = new Map<Topic, NudgeAttempt[]>();
  const sessionsUsed = new Map<Topic, number>();
  for (const id of drillIds) {
    const inSession = new Map<Topic, NudgeAttempt[]>();
    for (const a of bySession.get(id) ?? []) inSession.set(a.topic, [...(inSession.get(a.topic) ?? []), a]);
    for (const [topic, list] of inSession) {
      const used = sessionsUsed.get(topic) ?? 0;
      const sofar = recent.get(topic) ?? [];
      if (used >= NUDGE_SESSIONS && sofar.length >= NUDGE_MIN_ANSWERS) continue;
      sessionsUsed.set(topic, used + 1);
      recent.set(topic, [...sofar, ...list]);
    }
  }
  for (const [topic, list] of recent) if (list.length < NUDGE_MIN_ANSWERS) recent.delete(topic);
  return recent;
}

export function pickNudge(input: NudgeInput): Nudge | null {
  const recent = recentByTopic(input.attempts, input.drillIds);

  let weakest: { topic: Topic; accuracy: number } | null = null;
  for (const [topic, list] of recent) {
    const accuracy = list.filter((a) => a.correct).length / list.length;
    if (accuracy < WEAK_BELOW && (!weakest || accuracy < weakest.accuracy)) weakest = { topic, accuracy };
  }
  if (weakest) return { kind: 'weak', ...weakest };

  if (input.dueWords > 0) return { kind: 'due', count: input.dueWords };

  let slowest: { topic: Topic; share: number } | null = null;
  for (const [topic, list] of recent) {
    const right = list.filter((a) => a.correct);
    const share = right.length ? right.filter((a) => a.flags.includes('slow')).length / right.length : 0;
    if (share >= SLOW_SHARE && (!slowest || share > slowest.share)) slowest = { topic, share };
  }
  if (slowest) return { kind: 'slow', topic: slowest.topic };

  if (!input.studiedToday && input.hour >= EVENING_HOUR) return { kind: 'idle' };
  return null;
}
