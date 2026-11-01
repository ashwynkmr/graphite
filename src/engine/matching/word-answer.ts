// Type-in vocab answers. Not case-sensitive; one wrong, missing, extra or swapped letter
// on a word of 5+ letters is correct but flagged as a spelling slip.

export type WordResult = 'correct' | 'slip' | 'wrong' | 'skipped';

export interface WordTarget {
  word: string;
  exampleForm?: string;
  variants?: string[];
}

export function normalizeWord(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Optimal string alignment distance: insertions, deletions, substitutions and adjacent swaps. */
export function damerauLevenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(dist[i - 1]![j]! + 1, dist[i]![j - 1]! + 1, dist[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, dist[i - 2]![j - 2]! + 1);
      }
      dist[i]![j] = best;
    }
  }
  return dist[a.length]![b.length]!;
}

export const MIN_SLIP_LENGTH = 5;

export function matchWord(raw: string, target: WordTarget): WordResult {
  const input = normalizeWord(raw);
  if (input === '') return 'skipped';
  const accepted = [target.word, target.exampleForm, ...(target.variants ?? [])]
    .filter((s): s is string => Boolean(s))
    .map(normalizeWord);
  if (accepted.includes(input)) return 'correct';
  const slip = accepted.some((form) => form.length >= MIN_SLIP_LENGTH && damerauLevenshtein(input, form) === 1);
  return slip ? 'slip' : 'wrong';
}
