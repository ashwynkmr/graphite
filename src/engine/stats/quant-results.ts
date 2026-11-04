// Scores a finished drill. Nothing here runs during a session: results only at the end (0007).
import { matchNumeric } from '../matching/numeric-answer';
import { Rational } from '../matching/rational';
import type { Difficulty, Topic } from '../generators/types';
import type { PlayableQuestion } from '../sessions/questions';

export const SLOW_FACTOR = 1.5;
export const CARELESS_FACTOR = 0.5;

export type ItemStatus = 'correct' | 'wrong' | 'skipped' | 'not-reached';
export type ItemFlag = 'slow' | 'careless';

export interface ScoredItem {
  index: number;
  question: PlayableQuestion;
  mode: 'typed' | 'mcq';
  /** What the user gave; null = skipped, undefined = not reached. */
  answer: string | null | undefined;
  status: ItemStatus;
  ms: number;
  flags: ItemFlag[];
}

export interface Tally {
  correct: number;
  total: number;
}

export interface QuantResults {
  items: ScoredItem[];
  correct: number;
  total: number;
  accuracy: number;
  totalMs: number;
  avgMs: number;
  byTopic: Partial<Record<Topic, Tally>>;
  byDifficulty: Partial<Record<Difficulty, Tally>>;
  byMode: Partial<Record<'typed' | 'mcq', Tally>>;
}

/** Labelled tallies, lowest score first. On a tie, the one with more questions, then by label. */
export function weakestFirst<T extends Tally>(rows: [string, T][]): [string, T][] {
  return [...rows].sort(([a, x], [b, y]) => x.correct / x.total - y.correct / y.total || y.total - x.total || a.localeCompare(b));
}

/** Is this answer right? MCQ answers are the chosen option's text; typed answers go through matching. */
export function isCorrect(q: Pick<PlayableQuestion, 'answer' | 'rounding'>, answer: string | null | undefined): boolean {
  if (answer === null || answer === undefined) return false;
  const target = Rational.parse(q.answer);
  return target !== null && matchNumeric(answer, target, q.rounding) === 'correct';
}

export function statusOf(q: Pick<PlayableQuestion, 'answer' | 'rounding'>, answer: string | null | undefined): ItemStatus {
  if (answer === undefined) return 'not-reached';
  if (answer === null || answer.trim() === '') return 'skipped';
  return isCorrect(q, answer) ? 'correct' : 'wrong';
}

export function flagsFor(status: ItemStatus, ms: number, targetSec: number): ItemFlag[] {
  const target = targetSec * 1000;
  if (status === 'correct' && ms > SLOW_FACTOR * target) return ['slow'];
  if (status === 'wrong' && ms < CARELESS_FACTOR * target) return ['careless'];
  return [];
}

function bump<K extends string | number>(map: Partial<Record<K, Tally>>, key: K, correct: boolean) {
  const t = map[key] ?? { correct: 0, total: 0 };
  t.total++;
  if (correct) t.correct++;
  map[key] = t;
}

export function scoreQuant(
  entries: readonly { question: PlayableQuestion; mode: 'typed' | 'mcq'; answer: string | null | undefined; ms: number }[],
): QuantResults {
  const items: ScoredItem[] = entries.map((e, index) => {
    const status = statusOf(e.question, e.answer);
    return { index, question: e.question, mode: e.mode, answer: e.answer, status, ms: e.ms, flags: flagsFor(status, e.ms, e.question.targetSec) };
  });
  const byTopic: QuantResults['byTopic'] = {};
  const byDifficulty: QuantResults['byDifficulty'] = {};
  const byMode: QuantResults['byMode'] = {};
  for (const it of items) {
    const ok = it.status === 'correct';
    bump(byTopic, it.question.topic, ok);
    bump(byDifficulty, it.question.difficulty, ok);
    bump(byMode, it.mode, ok);
  }
  const correct = items.filter((i) => i.status === 'correct').length;
  const answered = items.filter((i) => i.status !== 'not-reached');
  const totalMs = items.reduce((a, i) => a + i.ms, 0);
  return {
    items,
    correct,
    total: items.length,
    accuracy: items.length ? correct / items.length : 0,
    totalMs,
    avgMs: answered.length ? totalMs / answered.length : 0,
    byTopic,
    byDifficulty,
    byMode,
  };
}
