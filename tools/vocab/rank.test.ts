import { describe, expect, it } from 'vitest';
import { BROAD_BONUS, normalize, parseAliases, rankWords, tieHash, type SourceList } from './rank';

describe('normalize', () => {
  it('lowercases, trims and strips accents', () => {
    expect(normalize('  Naïve ')).toBe('naive');
    expect(normalize('précis')).toBe('precis');
    expect(normalize('Blasé')).toBe('blase');
  });

  it('keeps the first spelling of a parenthesised pair', () => {
    expect(normalize('caldron(cauldron)')).toBe('caldron');
  });

  it('keeps phrases, hyphens and apostrophes', () => {
    expect(normalize('status  quo')).toBe('status quo');
    expect(normalize('laissez-faire')).toBe('laissez-faire');
  });

  it('rejects things that are not words', () => {
    expect(normalize('e.g.')).toBeNull();
    expect(normalize('')).toBeNull();
    expect(normalize('42')).toBeNull();
    expect(normalize('a')).toBeNull();
  });
});

describe('parseAliases', () => {
  it('maps variants to headwords and drops with -', () => {
    const a = parseAliases('# comment\n\nMachinations -> machination\ne.g. -> -\n');
    expect(a.get('machinations')).toBe('machination');
    expect(a.get('e.g.')).toBeNull();
    expect(a.size).toBe(2);
  });

  it('throws on a malformed line', () => {
    expect(() => parseAliases('oops')).toThrow(/Bad alias line/);
  });
});

describe('tieHash', () => {
  it('is stable', () => {
    expect(tieHash('laconic')).toBe(tieHash('laconic'));
    expect(tieHash('laconic')).not.toBe(tieHash('lacuna'));
  });
});

describe('rankWords', () => {
  const lists: SourceList[] = [
    { id: 'a', weight: 'core', words: ['Laconic', 'zeal', 'aspersions', 'e.g.', 'abate'] },
    { id: 'b', weight: 'core', words: ['laconic', 'zeal', 'aspersion'] },
    { id: 'c', weight: 'core', words: ['laconic'] },
    { id: 'x', weight: 'broad', words: ['zeal', 'abate', 'obscure', '???'] },
  ];
  const aliases = parseAliases('aspersions -> aspersion\ne.g. -> -');

  it('scores one per core list plus a small bonus per broad list', () => {
    const { ranked } = rankWords(lists, aliases, 10);
    const by = Object.fromEntries(ranked.map((r) => [r.word, r]));
    expect(by.laconic).toMatchObject({ core: 3, broad: 0, score: 3 });
    expect(by.zeal).toMatchObject({ core: 2, broad: 1, score: 2 + BROAD_BONUS });
    expect(by.abate).toMatchObject({ core: 1, broad: 1, score: 1.1 });
  });

  it('merges aliases, so a list counts once per headword', () => {
    const { ranked } = rankWords(lists, aliases, 10);
    expect(ranked.find((r) => r.word === 'aspersion')).toMatchObject({ core: 2, lists: ['a', 'b'] });
    expect(ranked.some((r) => r.word === 'aspersions')).toBe(false);
  });

  it('leaves out words found only on broad lists', () => {
    const { ranked, candidates } = rankWords(lists, aliases, 10);
    expect(ranked.some((r) => r.word === 'obscure')).toBe(false);
    expect(candidates).toBe(4);
  });

  it('reports entries it could not read, and skips dropped ones silently', () => {
    const { rejected } = rankWords(lists, aliases, 10);
    expect(rejected).toEqual([{ list: 'x', entry: '???' }]);
  });

  it('orders by score, numbers ranks from 1 and cuts at the size', () => {
    const { ranked } = rankWords(lists, aliases, 2);
    expect(ranked.map((r) => [r.rank, r.word])).toEqual([
      [1, 'laconic'],
      [2, 'zeal'],
    ]);
  });

  it('assigns tiers in blocks of 500', () => {
    const words = Array.from({ length: 1200 }, (_, i) => `w${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26) % 26)}${String.fromCharCode(97 + Math.floor(i / 676))}`);
    const { ranked } = rankWords([{ id: 'a', weight: 'core', words }], new Map(), 1200);
    expect(ranked[499]?.tier).toBe(1);
    expect(ranked[500]?.tier).toBe(2);
    expect(ranked[1000]?.tier).toBe(3);
  });

  it('breaks ties the same way every run', () => {
    const one = rankWords(lists, aliases, 10).ranked.map((r) => r.word);
    const two = rankWords([...lists].reverse(), aliases, 10).ranked.map((r) => r.word);
    expect(two).toEqual(one);
  });
});
