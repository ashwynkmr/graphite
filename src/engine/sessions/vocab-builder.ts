// Vocab session builder (TRD "Vocab session builder"): which words a session shows, in what order,
// how each is asked, and how an answer is graded. Pure: callers pass words, states and the day.
import type { Word } from '../../content/schema';
import type { Day } from '../dates';
import { matchWord } from '../matching/word-answer';
import { mulberry32 } from '../rng';
import { isDue, type Grade, type WordSchedule } from '../scheduling/leitner';

/** Practice types; a session can mix several. `mcq` asks word → meaning or meaning → word. `equiv` is sentence equivalence. */
export type PracticeMode = 'flashcard' | 'mcq' | 'blank' | 'equiv';
/** `typein` is retired: it can't be chosen now, but sessions saved before that still open and read. */
export type VocabMode = PracticeMode | 'typein';
export const VOCAB_MODES: readonly PracticeMode[] = ['flashcard', 'mcq', 'blank', 'equiv'];

/** The modes that can still be chosen; flashcards when none of them are left. */
export function choosableModes(modes: readonly VocabMode[]): PracticeMode[] {
  const kept = modes.filter((m): m is PracticeMode => m !== 'typein');
  return kept.length ? kept : ['flashcard'];
}

export type VocabDeck = 'today' | 'new' | 'starred';
/** Multiple choice asks one of three ways: word → meaning, meaning → word, or fill the blank. */
export type McqKind = 'meaning' | 'word' | 'blank';
export type ItemKind = 'flashcard' | 'typein' | 'equiv' | McqKind;

export interface VocabItem {
  wordId: string;
  kind: ItemKind;
  /** Word ids, already shuffled; for multiple choice and sentence equivalence. */
  choices?: string[];
  /** Sentence equivalence: the word that pairs with `wordId`. */
  partner?: string;
  /** A flashcard marked Review, shown again at the end of the same session (once). */
  requeued?: boolean;
}

export const CHOICES = 5;
export const EQUIV_CHOICES = 6;

/** States are optional per word: a word with no state is new. */
type States = ReadonlyMap<string, WordSchedule>;

const isNew = (s: WordSchedule | undefined) => !s || s.box === 0;

/** Due words: lowest box first, then the longest overdue, then rank. */
function dueWords(words: readonly Word[], states: States, today: Day): Word[] {
  return words
    .filter((w) => {
      const s = states.get(w.id);
      return s !== undefined && isDue(s, today);
    })
    .sort((a, b) => {
      const sa = states.get(a.id)!;
      const sb = states.get(b.id)!;
      return sa.box - sb.box || (sa.dueDay ?? '').localeCompare(sb.dueDay ?? '') || a.rank - b.rank;
    });
}

export interface DeckCounts {
  due: number;
  /** New words available today: unseen words, capped by what's left of the daily goal. */
  fresh: number;
  starred: number;
}

export function deckCounts(words: readonly Word[], states: States, today: Day, newLeft: number): DeckCounts {
  const unseen = words.filter((w) => isNew(states.get(w.id))).length;
  return {
    due: dueWords(words, states, today).length,
    fresh: Math.max(0, Math.min(unseen, newLeft)),
    starred: words.filter((w) => states.get(w.id)?.starred).length,
  };
}

/** Words that have had their first showing today, for the daily new-word cap. */
export function introducedOn(states: States, today: Day): number {
  let n = 0;
  for (const s of states.values()) if (s.firstSeenDay === today) n++;
  return n;
}

/**
 * The session queue, as word ids. Today: due words first, then new words in rank order up to
 * the daily cap. New: only new words. Starred: starred words, weakest box first.
 * `words` must be in rank order.
 */
export function buildVocabQueue(args: { words: readonly Word[]; states: States; deck: VocabDeck; length: number; today: Day; newLeft: number }): string[] {
  const { words, states, deck, length, today, newLeft } = args;
  const fresh = () => words.filter((w) => isNew(states.get(w.id))).slice(0, Math.max(0, newLeft));
  let picked: Word[];
  if (deck === 'starred') {
    picked = words.filter((w) => states.get(w.id)?.starred).sort((a, b) => (states.get(a.id)!.box - states.get(b.id)!.box) || a.rank - b.rank);
  } else if (deck === 'new') {
    picked = fresh();
  } else {
    picked = [...dueWords(words, states, today), ...fresh()];
  }
  return picked.slice(0, length).map((w) => w.id);
}

/**
 * The queue for the chosen practice types. A sentence-equivalence-only session takes words that have
 * a partner first, and tops up from the usual queue only when the deck runs out of them.
 */
export function buildPracticeQueue(args: Parameters<typeof buildVocabQueue>[0], modes: readonly VocabMode[]): string[] {
  const all = buildVocabQueue(args);
  if (modes.length !== 1 || modes[0] !== 'equiv') return all;
  const paired = buildVocabQueue({ ...args, words: args.words.filter((w) => w.equivalent) });
  return [...new Set([...paired, ...all])].slice(0, all.length);
}

/**
 * True when the sentence uses an inflected form (enervated, platitudes). Fill-the-blank still works:
 * every option is the same part of speech in its base form, so the grammar gives nothing away.
 */
export function inflected(w: Word): boolean {
  return w.exampleForm.toLowerCase() !== w.word.toLowerCase();
}

/**
 * Four wrong options: the word's confusables first, then words of the same part of speech and tier,
 * then any same part of speech, then anything. Word → meaning needs written entries (it shows their
 * meanings); the other kinds only show words, so any confusable id will do. A synonym of the word, in
 * either direction, is never offered: it would be a second right answer.
 */
export function distractors(w: Word, kind: McqKind, pool: ReadonlyMap<string, Word>, seed: number): string[] {
  const rng = mulberry32(seed);
  const out: string[] = [];
  const synonym = (id: string) => w.synonyms.includes(id) || Boolean(pool.get(id)?.synonyms.includes(w.id));
  const add = (id: string) => {
    if (out.length < CHOICES - 1 && id !== w.id && !out.includes(id) && !synonym(id)) out.push(id);
  };
  for (const c of w.confusables) if (kind !== 'meaning' || pool.has(c)) add(c);
  const others = rng.shuffle([...pool.values()].filter((o) => o.id !== w.id));
  for (const o of others) if (o.pos === w.pos && o.tier === w.tier) add(o.id);
  for (const o of others) if (o.pos === w.pos) add(o.id);
  for (const o of others) add(o.id);
  return out;
}

/** Whether either word lists the other as a synonym. */
function linked(a: Word, b: Word): boolean {
  return a.synonyms.includes(b.id) || b.synonyms.includes(a.id);
}

/**
 * Six options: the pair, plus four words of the same part of speech that are not synonyms of the pair
 * or of each other, so exactly one pair can be right. Look-alikes of either word come first.
 */
export function equivChoices(w: Word, partner: Word, pool: ReadonlyMap<string, Word>, seed: number): string[] {
  const rng = mulberry32(seed);
  const picked: Word[] = [];
  const add = (o: Word | undefined) => {
    if (!o || picked.length === EQUIV_CHOICES - 2 || o.pos !== w.pos) return;
    if ([w, partner, ...picked].some((x) => x.id === o.id || linked(x, o))) return;
    picked.push(o);
  };
  for (const id of rng.shuffle([...w.confusables, ...partner.confusables])) add(pool.get(id));
  for (const o of rng.shuffle([...pool.values()])) add(o);
  return rng.shuffle([w.id, partner.id, ...picked.map((o) => o.id)]);
}

/** A two-word answer as stored; `|` can't appear in a word id. */
export function equivAnswer(a: string, b: string): string {
  return `${a}|${b}`;
}

/**
 * How each word is asked. The chosen practice types are spread evenly over the session (dealt in turn,
 * then shuffled), so two types give about half each. Choice order is shuffled with the seed.
 */
export function planVocabItems(ids: readonly string[], modes: readonly VocabMode[], pool: ReadonlyMap<string, Word>, seed: number): VocabItem[] {
  const rng = mulberry32(seed);
  const chosen = modes.length ? modes : (['flashcard'] as const);
  const dealt = rng.shuffle(ids.map((_, i) => chosen[i % chosen.length]!));
  return ids.map((wordId, i) => {
    const w = pool.get(wordId);
    const partner = w?.equivalent ? pool.get(w.equivalent) : undefined;
    let mode = dealt[i]!;
    if (mode === 'equiv') {
      if (w && partner) return { wordId, kind: 'equiv', partner: partner.id, choices: equivChoices(w, partner, pool, seed + i + 1) };
      // No partner for this word: ask it another chosen way.
      mode = chosen.find((m) => m !== 'equiv') ?? 'blank';
    }
    if (mode === 'flashcard' || mode === 'typein') return { wordId, kind: mode };
    if (!w) throw new Error(`No entry for ${wordId}`);
    const kind: McqKind = mode === 'blank' ? 'blank' : rng.pick(['meaning', 'word'] as const);
    const choices = rng.shuffle([wordId, ...distractors(w, kind, pool, seed + i + 1)]);
    return { wordId, kind, choices };
  });
}

/** The example sentence with the word blanked out; `hint` keeps the first letter (type-in). */
export function blankOut(w: Word, hint = false): string {
  const form = w.exampleForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return w.example.replace(new RegExp(`\\b${form}\\b`, 'i'), (m) => (hint ? `${m[0]}${'_'.repeat(5)}` : '_____'));
}

/** The blanked sentence for sentence equivalence: "a(n)" so the article doesn't rule out an option. */
export function blankOutEquiv(w: Word): string {
  return blankOut(w).replace(/\b(a|an) _____/i, (m) => `${m[0]}(n) _____`);
}

/**
 * The Leitner grade for one answer. Flashcard values are the marks themselves; multiple choice is
 * the chosen word id; sentence equivalence is both chosen ids, and only the exact pair counts, as on
 * the exam; type-in is the typed text. A skip (null) counts as wrong.
 */
export function gradeVocab(item: VocabItem, w: Word, value: string | null): Grade {
  if (item.kind === 'flashcard') return value === 'know' || value === 'unsure' || value === 'review' ? value : 'review';
  if (value === null) return 'wrong';
  if (item.kind === 'typein') {
    const r = matchWord(value, w);
    return r === 'correct' ? 'correct' : r === 'slip' ? 'slip' : 'wrong';
  }
  if (item.kind === 'equiv') {
    const chosen = new Set(value.split('|'));
    return chosen.size === 2 && chosen.has(w.id) && chosen.has(item.partner!) ? 'correct' : 'wrong';
  }
  return value === w.id ? 'correct' : 'wrong';
}
