import { describe, expect, it } from 'vitest';
import { isValidPartialInput, matchNumeric, parseNumericInput } from './numeric-answer';
import { R } from './rational';

describe('matchNumeric: no rounding rule', () => {
  it.each([
    // [input, answer, expected]
    ['0.5', '1/2', 'correct'],
    ['.5', '1/2', 'correct'],
    ['1/2', '0.5', 'correct'],
    ['2/4', '1/2', 'correct'],
    ['0.50', '1/2', 'correct'],
    ['1,200', '1200', 'correct'],
    ['1 200', '1200', 'correct'],
    ['1200.0', '1200', 'correct'],
    [' 45 ', '45', 'correct'],
    ['-2.5', '-5/2', 'correct'],
    ['−2.5', '-5/2', 'correct'], // typographic minus
    ['-.5', '-1/2', 'correct'],
    ['7/12', '7/12', 'correct'],
    ['14/24', '7/12', 'correct'],
    ['2.5', '-2.5', 'wrong'], // minus is required
    ['0.583', '7/12', 'wrong'], // a repeating answer needs the exact fraction
    ['44', '45', 'wrong'],
    ['abc', '45', 'wrong'],
    ['1/0', '45', 'wrong'],
    ['', '45', 'skipped'],
    ['   ', '45', 'skipped'],
    [',', '45', 'skipped'],
  ])('%j vs %s → %s', (input, answer, expected) => {
    expect(matchNumeric(input, R(answer))).toBe(expected);
  });
});

describe('matchNumeric: with a rounding rule', () => {
  it.each([
    ['3.5', '3.456', 'tenth', 'correct'],
    ['3.50', '3.456', 'tenth', 'correct'],
    ['7/2', '3.456', 'tenth', 'correct'], // equals the rounded value exactly
    ['3.46', '3.456', 'tenth', 'wrong'], // more precise is still wrong
    ['3.456', '3.456', 'tenth', 'wrong'],
    ['3.4', '3.456', 'tenth', 'wrong'],
    ['67', '200/3', 'whole', 'correct'],
    ['66.7', '200/3', 'whole', 'wrong'],
    ['0.33', '1/3', 'hundredth', 'correct'],
    ['-3.5', '-3.45', 'tenth', 'correct'],
    ['', '1/3', 'hundredth', 'skipped'],
  ] as const)('%j vs %s to the nearest %s → %s', (input, answer, rounding, expected) => {
    expect(matchNumeric(input, R(answer), rounding)).toBe(expected);
  });
});

describe('parseNumericInput', () => {
  it('returns null for blank and invalid input', () => {
    expect(parseNumericInput('')).toBeNull();
    expect(parseNumericInput('1..2')).toBeNull();
    expect(parseNumericInput('12')?.toString()).toBe('12');
  });
});

describe('isValidPartialInput', () => {
  it.each(['', '-', '.', '-.', '12', '12.', '12.5', '.5', '3/', '3/8', '-3/8', '-3/'])('allows %j', (s) => {
    expect(isValidPartialInput(s)).toBe(true);
  });

  it.each(['1.2.3', '1-', '--1', '/', '1//2', '1/2/3', '1.5/2', '1/2.5', '-/', 'a', '1 2', '/3'])(
    'refuses %j',
    (s) => {
      expect(isValidPartialInput(s)).toBe(false);
    },
  );
});
