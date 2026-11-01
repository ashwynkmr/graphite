import { describe, expect, it } from 'vitest';
import { damerauLevenshtein, matchWord, normalizeWord } from './word-answer';

const laconic = { word: 'laconic', exampleForm: 'laconically' };
const judgment = { word: 'judgment', exampleForm: 'judgment', variants: ['judgement'] };
const wane = { word: 'wane', exampleForm: 'waned' };
const abate = { word: 'abate', exampleForm: 'abate' };

describe('damerauLevenshtein', () => {
  it.each([
    ['laconic', 'laconic', 0],
    ['laconic', 'laconik', 1], // substitution
    ['laconic', 'lacnic', 1], // deletion
    ['laconic', 'laconnic', 1], // insertion
    ['laconic', 'lacoinc', 1], // adjacent swap
    ['laconic', 'lacnoic', 1],
    ['laconic', 'lconci', 2],
    ['', 'abc', 3],
    ['abc', '', 3],
  ])('%s → %s = %i', (a, b, n) => {
    expect(damerauLevenshtein(a, b)).toBe(n);
  });
});

describe('normalizeWord', () => {
  it('lowercases, trims and collapses spaces', () => {
    expect(normalizeWord('  Laconic  ')).toBe('laconic');
    expect(normalizeWord('LAISSEZ   faire')).toBe('laissez faire');
  });
});

describe('matchWord', () => {
  it.each([
    ['laconic', laconic, 'correct'],
    ['LACONIC', laconic, 'correct'],
    ['  laconic ', laconic, 'correct'],
    ['laconically', laconic, 'correct'], // the inflected form used in the example
    ['judgement', judgment, 'correct'], // accepted variant
    ['judgment', judgment, 'correct'],
    ['laconik', laconic, 'slip'],
    ['lacoinc', laconic, 'slip'], // swapped letters
    ['laconicaly', laconic, 'slip'], // slip against the inflected form
    ['abte', abate, 'slip'], // 5-letter word forgives one missing letter
    ['lconci', laconic, 'wrong'],
    ['terse', laconic, 'wrong'],
    ['wan', wane, 'wrong'], // short words are not forgiven
    ['wame', wane, 'wrong'],
    ['wained', wane, 'slip'], // but the 5-letter inflection 'waned' is
    ['', laconic, 'skipped'],
    ['   ', laconic, 'skipped'],
  ] as const)('%j → %s', (input, target, expected) => {
    expect(matchWord(input, target)).toBe(expected);
  });

  it('works without exampleForm or variants', () => {
    expect(matchWord('pithy', { word: 'pithy' })).toBe('correct');
    expect(matchWord('pithi', { word: 'pithy' })).toBe('slip');
  });
});
