// The Progress dashboard's numbers, from attempts and word states (US-14). Pure, computed on demand.
import { addDays, daysBetween, type Day } from '../dates';
import type { Topic } from '../generators/types';
import type { WordSchedule } from '../scheduling/leitner';
import { BOX_GROUPS, boxGroup, type BoxGroup } from '../sessions/word-browse';

export const TREND_DAYS = 14;
export const WEAKEST_COUNT = 3;
/** Fewer answers than this say too little to call a topic weak. */
export const WEAKEST_MIN_ANSWERS = 10;

export interface TrendAttempt {
  topic: Topic;
  day: Day;
  correct: boolean;
  ms: number;
  flags: readonly string[];
}

export interface DayPoint {
  day: Day;
  answered: number;
  correct: number;
  /** Null on a day with no answers, so a chart leaves a gap rather than drawing a zero. */
  accuracy: number | null;
  avgMs: number | null;
}

/** The `days` days ending today, oldest first. */
export function lastDays(today: Day, days: number): Day[] {
  return Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
}

const answeredOnly = <T extends TrendAttempt>(attempts: readonly T[]) => attempts.filter((a) => !a.flags.includes('not-reached'));

/** One point per day, for all topics or one. Questions never reached took no time and weren't answered. */
export function dailyQuant(attempts: readonly TrendAttempt[], today: Day, days: number = TREND_DAYS, topic: Topic | null = null): DayPoint[] {
  const rows = answeredOnly(attempts).filter((a) => topic === null || a.topic === topic);
  return lastDays(today, days).map((day) => {
    const onDay = rows.filter((a) => a.day === day);
    const correct = onDay.filter((a) => a.correct).length;
    return {
      day,
      answered: onDay.length,
      correct,
      accuracy: onDay.length ? correct / onDay.length : null,
      avgMs: onDay.length ? onDay.reduce((sum, a) => sum + a.ms, 0) / onDay.length : null,
    };
  });
}

export interface TopicStat {
  topic: Topic;
  answered: number;
  accuracy: number;
  avgMs: number;
  weakest: boolean;
}

/** Topics answered in the window, weakest first. The lowest three with enough answers are marked. */
export function topicStats(attempts: readonly TrendAttempt[], today: Day, days: number = TREND_DAYS): TopicStat[] {
  const window = new Set(lastDays(today, days));
  const byTopic = new Map<Topic, TrendAttempt[]>();
  for (const a of answeredOnly(attempts)) {
    if (!window.has(a.day)) continue;
    byTopic.set(a.topic, [...(byTopic.get(a.topic) ?? []), a]);
  }
  const stats = [...byTopic].map(([topic, rows]) => ({
    topic,
    answered: rows.length,
    accuracy: rows.filter((a) => a.correct).length / rows.length,
    avgMs: rows.reduce((sum, a) => sum + a.ms, 0) / rows.length,
    weakest: false,
  }));
  stats.sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered || a.topic.localeCompare(b.topic));
  let marked = 0;
  for (const s of stats) {
    if (marked < WEAKEST_COUNT && s.answered >= WEAKEST_MIN_ANSWERS && s.accuracy < 1) {
      s.weakest = true;
      marked++;
    }
  }
  return stats;
}

/** Words at each stage. A word with no state, or never shown, is new. */
export function wordStages(states: Iterable<WordSchedule>, deck: number): Record<BoxGroup, number> {
  const counts = Object.fromEntries(BOX_GROUPS.map((g) => [g, 0])) as Record<BoxGroup, number>;
  let tracked = 0;
  for (const s of states) {
    counts[boxGroup(s.box)]++;
    tracked++;
  }
  counts.new += Math.max(0, deck - tracked);
  return counts;
}

/** New words first shown on each day. */
export function newWordsPerDay(states: Iterable<WordSchedule>, today: Day, days: number = TREND_DAYS): { day: Day; count: number }[] {
  const counts = new Map<Day, number>();
  for (const s of states) if (s.firstSeenDay) counts.set(s.firstSeenDay, (counts.get(s.firstSeenDay) ?? 0) + 1);
  return lastDays(today, days).map((day) => ({ day, count: counts.get(day) ?? 0 }));
}

export interface StudyHistory {
  days: number;
  answered: number;
  correct: number;
  avgMs: number | null;
  /** The same number of days just before these. Null with too few answers to compare fairly. */
  previous: { answered: number; correct: number; avgMs: number } | null;
  newWords: number;
  /** New words a day, counting only days since studying began. */
  wordsPerDay: number;
  studyDays: number;
  /** Each day in the window, oldest first, and whether it had a finished session. */
  calendar: { day: Day; studied: boolean }[];
  perDay: number[];
  weakest: TopicStat[];
  /** The strongest topic with enough answers, unless it is also the weakest. */
  best: TopicStat | null;
}

const pointTotals = (points: readonly DayPoint[]) => {
  const answered = points.reduce((sum, p) => sum + p.answered, 0);
  const totalMs = points.reduce((sum, p) => sum + (p.avgMs ?? 0) * p.answered, 0);
  return { answered, correct: points.reduce((sum, p) => sum + p.correct, 0), avgMs: answered ? totalMs / answered : null };
};

/** What a 7- or 14-day share says. `studiedDays` are the days with a finished session. */
export function studyHistory(attempts: readonly TrendAttempt[], states: Iterable<WordSchedule>, studiedDays: readonly Day[], today: Day, days: number): StudyHistory {
  const points = dailyQuant(attempts, today, days * 2);
  const now = pointTotals(points.slice(days));
  const before = pointTotals(points.slice(0, days));
  const window = lastDays(today, days);
  const studied = new Set(studiedDays);
  const newWords = newWordsPerDay(states, today, days).reduce((sum, d) => sum + d.count, 0);
  const firstDay = [...studied].sort()[0];
  const activeDays = firstDay ? Math.min(days, Math.max(1, daysBetween(firstDay, today) + 1)) : days;
  const topics = topicStats(attempts, today, days);
  const weakest = topics.filter((t) => t.weakest);
  const strongest = topics.filter((t) => t.answered >= WEAKEST_MIN_ANSWERS).sort((a, b) => b.accuracy - a.accuracy || b.answered - a.answered)[0];
  return {
    days,
    ...now,
    previous: before.answered >= WEAKEST_MIN_ANSWERS ? { answered: before.answered, correct: before.correct, avgMs: before.avgMs! } : null,
    newWords,
    wordsPerDay: Math.round(newWords / activeDays),
    studyDays: window.filter((d) => studied.has(d)).length,
    calendar: window.map((day) => ({ day, studied: studied.has(day) })),
    perDay: points.slice(days).map((p) => p.answered),
    weakest,
    best: strongest && strongest.topic !== weakest[0]?.topic ? strongest : null,
  };
}

/** New words a day needed to see the whole deck by the exam. Null with no days left to plan. */
export function wordsNeededPerDay(seen: number, deck: number, daysLeft: number | null): number | null {
  if (daysLeft === null || daysLeft === 0) return null;
  return Math.ceil(Math.max(0, deck - seen) / daysLeft);
}
