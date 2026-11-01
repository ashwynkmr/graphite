// Shared paths, quotas and file I/O for the question-bank scripts.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Question } from '../../src/content/schema';
import type { Difficulty, Topic } from '../../src/engine/generators/types';

export const BANK_PATH = resolve(import.meta.dirname, '../../content/questions.json');

/** Generated questions per topic and difficulty (about 1,200 in all; hand-written problems come later). */
export const QUOTA: Record<Topic, number> = {
  arithmetic: 45,
  fractions: 45,
  percents: 55,
  ratios: 45,
  averages: 40,
  rates: 45,
  money: 45,
  exponents: 40,
  estimation: 40,
};

/** Validation floor per topic × difficulty pair. */
export const MIN_PER_PAIR = 40;

export const DIFF_LETTER: Record<Difficulty, string> = { 1: 'e', 2: 'm', 3: 'h' };

export function readBank(): unknown {
  return JSON.parse(readFileSync(BANK_PATH, 'utf8'));
}

/** One question per line: compact, and diffs stay readable. */
export function writeBank(questions: Question[]): void {
  writeFileSync(BANK_PATH, `[\n${questions.map((q) => JSON.stringify(q)).join(',\n')}\n]\n`);
}
