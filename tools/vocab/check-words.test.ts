import { describe, expect, it } from 'vitest';
import type { Word } from '../../src/content/schema';
import { checkWords, stemOf, type RankedRef } from './check-words';

const ranked: RankedRef[] = [
  { rank: 1, word: 'enervate', tier: 1 },
  { rank: 2, word: 'venerate', tier: 1 },
  { rank: 3, word: 'lucid', tier: 1 },
  { rank: 4, word: 'opaque', tier: 1 },
  { rank: 5, word: 'exacerbate', tier: 1 },
  { rank: 6, word: 'mitigate', tier: 1 },
];

const enervate: Word = {
  id: 'enervate',
  word: 'enervate',
  pos: 'verb',
  meaning: 'to drain of energy or strength',
  example: 'The humid afternoon enervated the hikers.',
  exampleForm: 'enervated',
  synonyms: ['exhaust', 'weaken'],
  confusables: ['venerate', 'exacerbate', 'mitigate'],
  tier: 1,
  rank: 1,
};

const check = (patch: Partial<Word>) => checkWords([{ ...enervate, ...patch }], ranked);

describe('stemOf', () => {
  it('keeps enough of the word to match its inflections', () => {
    expect(stemOf('enervate')).toBe('enerv');
    expect('enervating'.startsWith(stemOf('enervate'))).toBe(true);
    expect(stemOf('fawn')).toBe('faw');
  });
});

describe('checkWords', () => {
  it('passes a good entry', () => {
    expect(check({})).toEqual([]);
  });

  it('checks the sentence-equivalence partner', () => {
    expect(check({ equivalent: 'enervate' })).toEqual(['enervate: equivalent is the headword']);
    expect(check({ equivalent: 'lucid' })).toEqual(['enervate: equivalent "lucid" is not in the deck']);
  });

  it('catches the headword inside the meaning', () => {
    expect(check({ meaning: 'to make enervated' })).toEqual(['enervate: meaning uses the headword']);
  });

  it('needs the example form in the sentence, as a whole word', () => {
    expect(check({ example: 'The heat drained the hikers.' })[0]).toMatch(/doesn't contain/);
    expect(check({ exampleForm: 'tired', example: 'The hikers were tired.' })[0]).toMatch(/doesn't share the stem/);
  });

  it('wants one full sentence', () => {
    expect(check({ example: 'the heat enervated them' })).toContain('enervate: example should be one full sentence');
  });

  it('checks rank, tier and order against the deck', () => {
    expect(check({ rank: 2 })).toEqual(expect.arrayContaining([expect.stringMatching(/rank\/tier 2\/1 should be 1\/1/), expect.stringMatching(/no gaps/)]));
  });

  it('rejects confusables outside the deck, repeated or equal to the headword', () => {
    expect(check({ confusables: ['venerate', 'exacerbate', 'invigorate'] })).toEqual(['enervate: confusable "invigorate" is not in the deck']);
    expect(check({ confusables: ['venerate', 'venerate', 'mitigate'] })).toContain('enervate: repeated confusable');
    expect(check({ confusables: ['enervate', 'venerate', 'mitigate'] })).toContain('enervate: confusable is the headword');
  });

  it('checks a confusable part of speech once that word has an entry', () => {
    const venerate: Word = { ...enervate, id: 'venerate', word: 'venerate', pos: 'adjective', rank: 2, meaning: 'to respect deeply', example: 'They venerate her.', exampleForm: 'venerate', confusables: ['enervate', 'lucid', 'opaque'] };
    const errs = checkWords([enervate, venerate], ranked);
    expect(errs).toContain('enervate: confusable "venerate" is a adjective, not a verb');
  });

  it('lets an adverb borrow look-alikes from other parts of speech', () => {
    const adverb: Word = { ...enervate, pos: 'adverb', confusables: ['venerate', 'exacerbate', 'mitigate'] };
    const venerate: Word = { ...enervate, id: 'venerate', word: 'venerate', pos: 'adjective', rank: 2, meaning: 'to respect deeply', example: 'They venerate her.', exampleForm: 'venerate', confusables: ['lucid', 'opaque', 'mitigate'] };
    expect(checkWords([adverb, venerate], ranked).filter((e) => e.includes(' is a '))).toEqual([]);
  });

  it('rejects a confusable that lists the word as its synonym', () => {
    const venerate: Word = { ...enervate, id: 'venerate', word: 'venerate', rank: 2, meaning: 'to respect deeply', example: 'They venerate her.', exampleForm: 'venerate', synonyms: ['revere', 'enervate'], confusables: ['lucid', 'opaque', 'mitigate'] };
    expect(checkWords([enervate, venerate], ranked)).toContain('enervate: confusable "venerate" lists "enervate" as a synonym');
  });

  it('rejects duplicate ids and synonyms', () => {
    expect(checkWords([enervate, enervate], ranked)).toContain('enervate: duplicate id');
    expect(check({ synonyms: ['sap', 'Sap'] })).toContain('enervate: repeated synonym');
  });
});
