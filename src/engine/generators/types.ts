import type { Rational, Rounding } from '../matching/rational';
import type { Rng } from '../rng';

export type Topic =
  | 'arithmetic'
  | 'fractions'
  | 'percents'
  | 'ratios'
  | 'averages'
  | 'rates'
  | 'money'
  | 'exponents'
  | 'estimation'
  | 'numbers'
  | 'statistics'
  | 'probability'
  | 'algebra'
  | 'geometry';

export const TOPICS: Topic[] = [
  'arithmetic',
  'fractions',
  'percents',
  'ratios',
  'averages',
  'rates',
  'money',
  'exponents',
  'estimation',
  'numbers',
  'statistics',
  'probability',
  'algebra',
  'geometry',
];

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTIES: Difficulty[] = [1, 2, 3];

export type Kind = 'calc' | 'word';

export interface Unit {
  prefix?: string;
  suffix?: string;
}

/** What a template returns. The answer is computed, never typed. */
export interface Draft {
  prompt: string;
  answer: Rational;
  /** How the answer and choices are written: decimals/integers (default) or fractions. */
  format?: 'number' | 'fraction';
  rounding?: Rounding;
  unit?: Unit;
  /** Wrong answers from named mistakes, most plausible first. */
  distractors: Rational[];
  explain: string;
  mcqOnly?: boolean;
  /** Use exactly these four distractors with no near-value top-up (estimation, compare). */
  exactChoices?: boolean;
  targetSec?: number;
}

export interface Template {
  id: string;
  topic: Topic;
  kind: Kind;
  difficulties: Difficulty[];
  /** Added to a topic already live: takes its own share of the bank, so older questions keep their ids. */
  extra?: boolean;
  /** Pure function of the rng; null rejects this draw. */
  generate(rng: Rng, d: Difficulty): Draft | null;
}

/** A finished question, as stored in content/questions.json (minus the bank id). */
export interface GeneratedQuestion {
  topic: Topic;
  difficulty: Difficulty;
  kind: Kind;
  prompt: string;
  answer: string;
  format: 'number' | 'fraction';
  rounding?: Rounding;
  unit?: Unit;
  choices?: string[];
  mcqOnly?: boolean;
  targetSec: number;
  explain: string;
}
