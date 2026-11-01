// Pure checks for content/words.json (TRD, vocab checks). validate-words.ts does the file I/O.
import type { Word } from '../../src/content/schema';

export interface RankedRef {
  rank: number;
  word: string;
  tier: 1 | 2 | 3;
}

/** The part of a word an inflection keeps: enervate → enerv, so enervated and enervating both match. */
export function stemOf(word: string): string {
  return word.slice(0, Math.max(3, word.length - 3)).toLowerCase();
}

/** Every problem found, as "id: message". Entries must cover ranks 1..N with no gaps (N grows by batch). */
export function checkWords(words: readonly Word[], ranked: readonly RankedRef[]): string[] {
  const errors: string[] = [];
  const fail = (id: string, msg: string) => errors.push(`${id}: ${msg}`);
  const deck = new Map(ranked.map((r) => [r.word, r]));
  const byId = new Map<string, Word>();

  for (const w of words) {
    if (byId.has(w.id)) fail(w.id, 'duplicate id');
    byId.set(w.id, w);
  }

  words.forEach((w, i) => {
    const ref = deck.get(w.id);
    if (w.word !== w.id) fail(w.id, `word "${w.word}" differs from id`);
    if (!ref) fail(w.id, 'not in ranked-words.json');
    else if (ref.rank !== w.rank || ref.tier !== w.tier) fail(w.id, `rank/tier ${w.rank}/${w.tier} should be ${ref.rank}/${ref.tier}`);
    if (w.rank !== i + 1) fail(w.id, `entry ${i + 1} has rank ${w.rank}; keep entries in rank order with no gaps`);

    const stem = stemOf(w.word);
    if (w.meaning.toLowerCase().includes(stem)) fail(w.id, 'meaning uses the headword');
    if (!w.exampleForm.toLowerCase().startsWith(stem)) fail(w.id, `exampleForm "${w.exampleForm}" doesn't share the stem "${stem}"`);
    const form = w.exampleForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${form}\\b`, 'i').test(w.example)) fail(w.id, `example doesn't contain "${w.exampleForm}" as a word`);
    if (!/^[A-Z"']/.test(w.example) || !/[.!?]["']?$/.test(w.example)) fail(w.id, 'example should be one full sentence');

    const syn = w.synonyms.map((s) => s.toLowerCase());
    if (new Set(syn).size !== syn.length) fail(w.id, 'repeated synonym');
    if (syn.some((s) => s === w.id)) fail(w.id, 'synonym is the headword');

    if (new Set(w.confusables).size !== w.confusables.length) fail(w.id, 'repeated confusable');
    for (const c of w.confusables) {
      if (c === w.id) fail(w.id, 'confusable is the headword');
      else if (!deck.has(c)) fail(w.id, `confusable "${c}" is not in the deck`);
      else {
        // Checked once the confusable has its own entry; by the last batch every one does.
        const other = byId.get(c);
        // Adverbs are exempt: the deck has only three, too few to fill three look-alikes each.
        if (other && other.pos !== w.pos && w.pos !== 'adverb') fail(w.id, `confusable "${c}" is a ${other.pos}, not a ${w.pos}`);
        // A look-alike that lists this word as its synonym would be a second right answer.
        if (other?.synonyms.some((s) => s.toLowerCase() === w.id)) fail(w.id, `confusable "${c}" lists "${w.id}" as a synonym`);
      }
      if (syn.includes(c)) fail(w.id, `"${c}" is both a synonym and a confusable`);
    }
  });

  // Run after the loop: a partner may rank below its word. Whether it fits the sentence is hand-checked.
  for (const w of words) {
    if (!w.equivalent) continue;
    const other = byId.get(w.equivalent);
    if (w.equivalent === w.id) fail(w.id, 'equivalent is the headword');
    else if (!other) fail(w.id, `equivalent "${w.equivalent}" is not in the deck`);
    else {
      if (other.pos !== w.pos) fail(w.id, `equivalent "${w.equivalent}" is a ${other.pos}, not a ${w.pos}`);
      if (!w.synonyms.includes(other.id) && !other.synonyms.includes(w.id)) fail(w.id, `equivalent "${w.equivalent}" is not a listed synonym either way`);
      if (w.confusables.includes(other.id)) fail(w.id, `"${w.equivalent}" is both the equivalent and a confusable`);
    }
  }

  return errors;
}
