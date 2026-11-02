// Pure checks for content/equiv-sentences.json. validate-words.ts does the file I/O.
// A test can't tell whether a decoy pair also fits a sentence, so each sentence is read by hand as well.
import type { EquivSentence, Word } from '../../src/content/schema';

export const EQUIV_BLANK = '_____';
/** The longest sentence that still fits a 375 × 664 screen with all six options and the buttons. */
export const EQUIV_MAX_CHARS = 190;

/** Every problem found, as "id: message". */
export function checkEquivSentences(sentences: readonly EquivSentence[], words: readonly Word[]): string[] {
  const errors: string[] = [];
  const byId = new Map(words.map((w) => [w.id, w]));
  const examples = new Set(words.map((w) => w.example.toLowerCase()));
  const ids = new Set<string>();
  const texts = new Set<string>();
  const linked = (a: string, b: string) => Boolean(byId.get(a)?.synonyms.includes(b) || byId.get(b)?.synonyms.includes(a));

  for (const s of sentences) {
    const fail = (msg: string) => errors.push(`${s.id}: ${msg}`);
    const options = [...s.answer, ...s.decoy, ...s.others];

    if (ids.has(s.id)) fail('duplicate id');
    ids.add(s.id);
    if (texts.has(s.sentence)) fail('duplicate sentence');
    texts.add(s.sentence);
    if (s.sentence.split(EQUIV_BLANK).length !== 2) fail('needs exactly one blank');
    if (/\b(a|an) _____/i.test(s.sentence)) fail('write a(n) before the blank, so the article rules nothing out');
    if (s.sentence.length > EQUIV_MAX_CHARS) fail(`too long for the screen (${s.sentence.length} characters)`);
    if (examples.has(s.sentence.toLowerCase())) fail("repeats a word's example sentence");
    if (new Set(options).size !== options.length) fail('repeats an option');

    const missing = options.filter((o) => !byId.has(o));
    for (const o of missing) fail(`"${o}" is not in the deck`);
    if (missing.length) continue;

    if (new Set(options.map((o) => byId.get(o)!.pos)).size > 1) fail('options are not all the same part of speech');
    const lower = s.sentence.toLowerCase();
    for (const o of options) if (new RegExp(`\\b${o}\\b`).test(lower)) fail(`the sentence uses its own option "${o}"`);
    // A listed synonym of a right word would be a second right answer.
    for (const a of s.answer) for (const o of [...s.decoy, ...s.others]) if (linked(a, o)) fail(`"${o}" is a listed synonym of the right word "${a}"`);
    // The two spare words can't form a pair with each other or with a decoy.
    for (const o of s.others) {
      if (s.others.some((x) => x !== o && linked(x, o))) fail(`spare words "${s.others.join('", "')}" are listed synonyms`);
      for (const d of s.decoy) if (linked(d, o)) fail(`"${o}" is a listed synonym of the decoy "${d}"`);
    }
  }
  return errors;
}
