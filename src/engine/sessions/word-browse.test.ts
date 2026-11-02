import { describe, expect, it } from 'vitest';
import type { Word } from '../../content/schema';
import { newSchedule, type Box, type WordSchedule } from '../scheduling/leitner';
import { boxGroup, browseWords, type BrowseFilter } from './word-browse';

function word(id: string, rank: number, over: Partial<Word> = {}): Word {
  return { id, word: id, pos: 'adjective', meaning: `meaning of ${id}`, example: `${id}.`, exampleForm: id, synonyms: ['aa', 'bb'], tier: 1, rank, confusables: ['x', 'y', 'z'], ...over };
}

const words = [
  word('laconic', 1, { meaning: 'using very few words' }),
  word('terse', 2, { synonyms: ['laconic', 'brief'], tier: 2 }),
  word('bland', 3, { meaning: 'lacking flavor', tier: 2 }),
  word('flavorful', 4, { tier: 3 }),
];

const states = new Map<string, WordSchedule>([
  ['laconic', { ...newSchedule('laconic'), box: 3, starred: true }],
  ['terse', { ...newSchedule('terse'), box: 1 }],
  ['bland', { ...newSchedule('bland'), box: 5 }],
]);

const all: BrowseFilter = { query: '', tier: null, group: null, starredOnly: false };
const ids = (over: Partial<BrowseFilter>) => browseWords(words, states, { ...all, ...over }).map((w) => w.id);

describe('browseWords', () => {
  it('lists everything in rank order with no filters', () => {
    expect(ids({})).toEqual(['laconic', 'terse', 'bland', 'flavorful']);
  });

  it('searches the word, a synonym and the meaning, best match first, ignoring case and spaces', () => {
    expect(ids({ query: 'FLAVOR ' })).toEqual(['flavorful', 'bland']);
    expect(ids({ query: 'laconic' })).toEqual(['laconic', 'terse']);
    expect(ids({ query: 'few words' })).toEqual(['laconic']);
    expect(ids({ query: 'zzz' })).toEqual([]);
  });

  it('filters by tier, stage and star, and combines them with search', () => {
    expect(ids({ tier: 2 })).toEqual(['terse', 'bland']);
    expect(ids({ group: 'new' })).toEqual(['flavorful']);
    expect(ids({ group: 'known' })).toEqual(['laconic']);
    expect(ids({ starredOnly: true })).toEqual(['laconic']);
    expect(ids({ tier: 2, query: 'lacking' })).toEqual(['bland']);
  });
});

describe('boxGroup', () => {
  it('groups the six boxes into four stages', () => {
    expect(([0, 1, 2, 3, 4, 5] as Box[]).map(boxGroup)).toEqual(['new', 'learning', 'learning', 'known', 'known', 'retired']);
  });
});
