// Quantitative Comparison: four fixed answers, always in exam order. They're stored as the codes
// 1 to 4, so scoring and the mistake log treat them like any other answer (0053).
import { R, Rational } from '../matching/rational';
import type { Draft } from './types';

export const COMPARE_CHOICES = ['1', '2', '3', '4'];

export const COMPARE_LABELS: Record<string, string> = {
  '1': 'Quantity A is greater',
  '2': 'Quantity B is greater',
  '3': 'The two quantities are equal',
  '4': 'It cannot be determined',
};

export const A_GREATER = 1;
export const B_GREATER = 2;
export const EQUAL = 3;
export const UNDETERMINED = 4;

/** What every tested case says together: a mix of outcomes means it can't be determined. */
export function relationOf(pairs: readonly (readonly [Rational, Rational])[]): number {
  const signs = new Set(pairs.map(([a, b]) => a.cmp(b)));
  if (signs.size !== 1) return UNDETERMINED;
  const sign = [...signs][0];
  return sign === 1 ? A_GREATER : sign === -1 ? B_GREATER : EQUAL;
}

export function compareDraft(given: string, a: string, b: string, relation: number, explain: string): Draft {
  return {
    prompt: `${given ? `${given} ` : ''}Quantity A: ${a}. Quantity B: ${b}.`,
    answer: R(relation),
    format: 'compare',
    mcqOnly: true,
    distractors: [],
    explain,
  };
}

/** Splits a comparison's text back into its parts, to lay them out on screen. */
export function splitCompare(prompt: string): { given: string; a: string; b: string } | null {
  const m = /^(.*?)\s*Quantity A: (.*)\. Quantity B: (.*)\.$/s.exec(prompt);
  return m ? { given: m[1]!, a: m[2]!, b: m[3]! } : null;
}
