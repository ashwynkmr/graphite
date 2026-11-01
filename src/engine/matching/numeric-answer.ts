// Typed quant answers. Equivalent forms are correct (0.5 = .5 = 1/2 = 2/4, 1,200 = 1200).
// With a rounding rule, only the rounded value is correct (3.46 is wrong when 3.5 is asked).

import { Rational, type Rounding } from './rational';

export type NumericResult = 'correct' | 'wrong' | 'skipped';

/** Trim, drop commas and spaces, map the typographic minus to '-'. */
export function normalizeNumericInput(raw: string): string {
  return raw.replace(/[\s,]/g, '').replace(/[−–]/g, '-');
}

/** Parses typed input; null if blank or not a number the keypad can produce. */
export function parseNumericInput(raw: string): Rational | null {
  const s = normalizeNumericInput(raw);
  return s === '' ? null : Rational.parse(s);
}

export function matchNumeric(raw: string, answer: Rational, rounding?: Rounding): NumericResult {
  if (normalizeNumericInput(raw) === '') return 'skipped';
  const value = parseNumericInput(raw);
  if (!value) return 'wrong';
  const target = rounding ? answer.round(rounding) : answer;
  return value.equals(target) ? 'correct' : 'wrong';
}

/**
 * True if `s` could still become a valid answer by typing more. The keypad uses this to
 * refuse keys that would make the input invalid (a second '.', '-' after a digit, '/' twice).
 */
export function isValidPartialInput(s: string): boolean {
  return /^-?(\d*\.?\d*|\d+\/\d*)$/.test(s);
}
