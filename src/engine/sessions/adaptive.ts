// Adaptive difficulty (0043): each topic keeps its own level, moved by its recent answers.
import type { Difficulty, Topic } from '../generators/types';

export const START_LEVEL: Difficulty = 2;
export const WINDOW = 10;
export const MOVE_UP_AT = 8;
export const MOVE_DOWN_AT = 5;

/** A topic's level, and the last attempt that counts for nothing because it came before the level changed. */
export interface TopicLevel {
  level: Difficulty;
  sinceAttemptId: number;
}

export type AdaptiveLevels = Partial<Record<Topic, TopicLevel>>;

export interface AdaptiveAnswer {
  correct: boolean;
  underTarget: boolean;
}

/** Up after 8 of the last 10 are correct and under target time; down after 5 or more of them are wrong. */
export function nextLevel(level: Difficulty, answers: readonly AdaptiveAnswer[]): Difficulty {
  const recent = answers.slice(-WINDOW);
  const fast = recent.filter((a) => a.correct && a.underTarget).length;
  const wrong = recent.filter((a) => !a.correct).length;
  if (fast >= MOVE_UP_AT && level < 3) return (level + 1) as Difficulty;
  if (wrong >= MOVE_DOWN_AT && level > 1) return (level - 1) as Difficulty;
  return level;
}

/** The level each topic is on now. A topic not yet played starts at Medium. */
export function levelsFor(topics: readonly Topic[], levels: AdaptiveLevels): Partial<Record<Topic, Difficulty>> {
  return Object.fromEntries(topics.map((t) => [t, levels[t]?.level ?? START_LEVEL]));
}
