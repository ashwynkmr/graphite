// Pure ranking logic for the vocab deck: normalise list entries, score each headword, take the top N.
// File I/O lives in rank-words.ts so this stays testable.

export type ListWeight = 'core' | 'broad';

export interface SourceList {
  id: string;
  weight: ListWeight;
  words: readonly string[];
}

export interface RankedWord {
  rank: number;
  word: string;
  tier: 1 | 2 | 3;
  score: number;
  /** Core lists containing the word: the main signal. */
  core: number;
  /** Broad lists containing the word: a small tie-breaking bonus. */
  broad: number;
  lists: string[];
}

/** Each broad list adds this much; five broad lists (0.5) never outweigh one more core list. */
export const BROAD_BONUS = 0.1;

/** Ranks 1–500 are tier 1, 501–1,000 tier 2, the rest tier 3 (TRD, content pipeline). */
export const TIER_SIZE = 500;

/** `variant -> headword` lines; `-` as the headword drops the entry. Blank lines and `#` comments are ignored. */
export function parseAliases(text: string): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to] = line.split('->').map((s) => s.trim());
    if (!from || !to) throw new Error(`Bad alias line: "${line}"`);
    map.set(normalize(from) ?? from, to === '-' ? null : (normalize(to) ?? to));
  }
  return map;
}

/**
 * Lowercase, strip accents (naïve → naive), keep the first spelling of "caldron(cauldron)", collapse spaces.
 * Returns null for anything that isn't a word or short phrase (letters, spaces, hyphens, apostrophes).
 */
export function normalize(entry: string): string | null {
  const w = entry
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split('(')[0]!
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  return /^[a-z][a-z' -]*[a-z]$/.test(w) ? w : null;
}

/** FNV-1a: a stable, unbiased order for words with equal scores (alphabetical would favour the A words). */
export function tieHash(word: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < word.length; i++) {
    h ^= word.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface RankResult {
  ranked: RankedWord[];
  /** Entries that normalize() rejected and no alias covered, by list. */
  rejected: { list: string; entry: string }[];
  /** Headwords with a score, before the cut. */
  candidates: number;
}

export function rankWords(lists: readonly SourceList[], aliases: Map<string, string | null>, size: number): RankResult {
  const hits = new Map<string, Set<string>>();
  const rejected: RankResult['rejected'] = [];

  for (const list of lists) {
    for (const entry of list.words) {
      const n = normalize(entry);
      const key = n ?? entry.trim().toLowerCase();
      // null = dropped on purpose by an alias; undefined = unreadable and not covered by one.
      const aliased = aliases.has(key) ? aliases.get(key) : (n ?? undefined);
      if (aliased === null) continue;
      if (aliased === undefined) {
        rejected.push({ list: list.id, entry });
        continue;
      }
      let set = hits.get(aliased);
      if (!set) hits.set(aliased, (set = new Set()));
      set.add(list.id);
    }
  }

  const weightOf = new Map(lists.map((l) => [l.id, l.weight]));
  const scored = [...hits]
    .map(([word, ids]) => {
      const listIds = [...ids].sort();
      const core = listIds.filter((id) => weightOf.get(id) === 'core').length;
      const broad = listIds.length - core;
      return { word, core, broad, score: Math.round((core + broad * BROAD_BONUS) * 10) / 10, lists: listIds };
    })
    // Only words on at least one core (GRE-focused) list can make the deck.
    .filter((w) => w.core > 0)
    .sort((a, b) => b.score - a.score || tieHash(a.word) - tieHash(b.word) || a.word.localeCompare(b.word));

  const ranked = scored.slice(0, size).map((w, i) => ({
    rank: i + 1,
    word: w.word,
    tier: Math.min(3, Math.floor(i / TIER_SIZE) + 1) as 1 | 2 | 3,
    score: w.score,
    core: w.core,
    broad: w.broad,
    lists: w.lists,
  }));

  return { ranked, rejected, candidates: scored.length };
}
