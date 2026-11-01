// The written vocab entries, loaded on first use. Precached with the app, so this works offline.
import type { Word } from './schema';

export interface WordBook {
  /** In rank order. */
  words: Word[];
  byId: ReadonlyMap<string, Word>;
}

let loading: Promise<WordBook> | null = null;

export function loadWords(): Promise<WordBook> {
  loading ??= import('../../content/words.json').then((m) => {
    const words = (m.default as Word[]).slice().sort((a, b) => a.rank - b.rank);
    return { words, byId: new Map(words.map((w) => [w.id, w])) };
  });
  return loading;
}
