// Browse and search the full word list (US-18). Pure: callers pass words and states.
import type { Word } from '../../content/schema';
import type { Box, WordSchedule } from '../scheduling/leitner';

/** The four stages a word's box is shown as, here and on Progress. */
export type BoxGroup = 'new' | 'learning' | 'known' | 'retired';
export const BOX_GROUPS: readonly BoxGroup[] = ['new', 'learning', 'known', 'retired'];

export function boxGroup(box: Box): BoxGroup {
  if (box === 0) return 'new';
  if (box <= 2) return 'learning';
  return box === 5 ? 'retired' : 'known';
}

export interface BrowseFilter {
  query: string;
  tier: Word['tier'] | null;
  group: BoxGroup | null;
  starredOnly: boolean;
}

/** Best match first: the word's start, anywhere in the word, a synonym, then the meaning. Null if none. */
function matchRank(w: Word, q: string): number | null {
  const word = w.word.toLowerCase();
  if (word.startsWith(q)) return 0;
  if (word.includes(q)) return 1;
  if (w.synonyms.some((s) => s.toLowerCase().includes(q))) return 2;
  return w.meaning.toLowerCase().includes(q) ? 3 : null;
}

/** The words that pass every filter. With no search text, `words` keep their rank order. */
export function browseWords(words: readonly Word[], states: ReadonlyMap<string, WordSchedule>, filter: BrowseFilter): Word[] {
  const q = filter.query.trim().toLowerCase();
  const scored: { w: Word; score: number }[] = [];
  for (const w of words) {
    const s = states.get(w.id);
    if (filter.tier !== null && w.tier !== filter.tier) continue;
    if (filter.group !== null && boxGroup(s?.box ?? 0) !== filter.group) continue;
    if (filter.starredOnly && !s?.starred) continue;
    const score = q ? matchRank(w, q) : 0;
    if (score !== null) scored.push({ w, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.w.rank - b.w.rank).map((x) => x.w);
}
