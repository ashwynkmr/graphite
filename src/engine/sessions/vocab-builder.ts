// Vocab session builder (TRD "Vocab session builder"): which words a session shows, in what order,
// how each is asked, and how an answer is graded. Pure: callers pass words, states and the day.
import type { EquivSentence, Word } from '../../content/schema';
import type { Day } from '../dates';
import type { Difficulty } from '../generators/types';
import { matchWord } from '../matching/word-answer';
import { mulberry32, type Rng } from '../rng';
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

export type VocabDeck = 'today' | 'new' | 'starred' | 'round';
/** Multiple choice asks one of four ways: word → meaning, meaning → word, fill the blank, or closest in meaning (hard). */
export type McqKind = 'meaning' | 'word' | 'blank' | 'synonym';
export type ItemKind = 'flashcard' | 'typein' | 'equiv' | McqKind;

export interface VocabItem {
  wordId: string;
  kind: ItemKind;
  /** Word ids, already shuffled; for multiple choice and sentence equivalence. */
  choices?: string[];
  /** Sentence equivalence: the word that pairs with `wordId`. Closest in meaning: the right answer. */
  partner?: string;
  /** An exam-style bank sentence (sentence equivalence, or fill the blank on Hard): its id and text. Without these the word's own example is asked. */
  sentenceId?: string;
  sentence?: string;
  /** A flashcard marked Review, shown again at the end of the same session (once). */
  requeued?: boolean;
  /** How hard a quiz card was asked. Missing on flashcards and on sessions from before vocab difficulty. */
  level?: Difficulty;
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

const roundOf = (s: WordSchedule | undefined) => s?.round ?? 1;

export interface RoundStatus {
  /** The round under way. Round 1 is the first pass through the deck. */
  current: number;
  /** Words still to go in the current round (none during round 1: new words handle that). */
  left: number;
  /** The next round to offer, once every word has been seen and the current round is done. */
  offer: number | null;
}

export function roundStatus(words: readonly Word[], states: States, current: number): RoundStatus {
  const left = current > 1 ? words.filter((w) => roundOf(states.get(w.id)) < current).length : 0;
  const allSeen = words.length > 0 && words.every((w) => !isNew(states.get(w.id)));
  return { current, left, offer: allSeen && left === 0 ? current + 1 : null };
}

/** A round's order, weakest first: starred, then box 1 up to retired, then rank. */
function roundWords(words: readonly Word[], states: States, round: number): Word[] {
  return words
    .filter((w) => roundOf(states.get(w.id)) < round)
    .sort((a, b) => {
      const sa = states.get(a.id);
      const sb = states.get(b.id);
      return Number(Boolean(sb?.starred)) - Number(Boolean(sa?.starred)) || (sa?.box ?? 0) - (sb?.box ?? 0) || a.rank - b.rank;
    });
}

/**
 * The session queue, as word ids. Today: due words first, then new words in rank order up to
 * the daily cap. New: only new words. Starred: starred words, weakest box first. Round: the words
 * still to go in `round`, weakest first. `words` must be in rank order.
 */
export function buildVocabQueue(args: { words: readonly Word[]; states: States; deck: VocabDeck; length: number; today: Day; newLeft: number; round?: number }): string[] {
  const { words, states, deck, length, today, newLeft } = args;
  const fresh = () => words.filter((w) => isNew(states.get(w.id))).slice(0, Math.max(0, newLeft));
  let picked: Word[];
  if (deck === 'round') {
    picked = roundWords(words, states, args.round ?? 1);
  } else if (deck === 'starred') {
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
 * a partner or a bank sentence first, and tops up from the usual queue only when the deck runs out of them.
 */
export function buildPracticeQueue(args: Parameters<typeof buildVocabQueue>[0], modes: readonly VocabMode[], sentences?: EquivIndex): string[] {
  const all = buildVocabQueue(args);
  if (modes.length !== 1 || modes[0] !== 'equiv') return all;
  const paired = buildVocabQueue({ ...args, words: args.words.filter((w) => w.equivalent || sentences?.has(w.id)) });
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

/** The exam-style sentences each word is a right answer in. */
export type EquivIndex = ReadonlyMap<string, readonly EquivSentence[]>;

export function indexEquivSentences(sentences: readonly EquivSentence[]): EquivIndex {
  const index = new Map<string, EquivSentence[]>();
  for (const s of sentences) for (const id of s.answer) index.set(id, [...(index.get(id) ?? []), s]);
  return index;
}

/** How hard a session asks: one or more levels dealt across the cards, or each word by how well it is known. */
export interface LevelChoice {
  difficulties: readonly Difficulty[];
  adaptive: boolean;
}

/** Adaptive: new and missed words (box 0–1) are asked easy, words getting there (2–3) medium, words known well (4–5) hard. */
export function adaptiveLevel(s: WordSchedule | undefined): Difficulty {
  const box = s?.box ?? 0;
  return box <= 1 ? 1 : box <= 3 ? 2 : 3;
}

/** One level per word: each word's own level when adaptive, otherwise the chosen levels dealt evenly in a shuffled order. */
export function planLevels(ids: readonly string[], choice: LevelChoice, states: States, seed: number): Difficulty[] {
  if (choice.adaptive) return ids.map((id) => adaptiveLevel(states.get(id)));
  const levels = choice.difficulties.length ? choice.difficulties : ([2] as const);
  return mulberry32(seed - 1).shuffle(ids.map((_, i) => levels[i % levels.length]!));
}

/** Words that share a listed synonym mean nearly the same, so neither can be a wrong option for the other. */
function close(a: Word, b: Word): boolean {
  return linked(a, b) || a.synonyms.some((x) => b.synonyms.includes(x));
}

/**
 * Wrong options for an easy question: words of another part of speech, so the wording or the grammar
 * rules them out. None is linked to the words in `keep`.
 */
export function plainDistractors(w: Word, keep: readonly Word[], pool: ReadonlyMap<string, Word>, count: number, seed: number): string[] {
  const out: string[] = [];
  for (const o of mulberry32(seed).shuffle([...pool.values()])) {
    if (out.length === count) break;
    if (o.pos !== w.pos && !keep.some((k) => k.id === o.id || close(k, o))) out.push(o.id);
  }
  return out;
}

/** Deck words of the same part of speech that mean the same as `w`, listed by either word. Closest in meaning asks for one. */
export function deckSynonyms(w: Word, pool: ReadonlyMap<string, Word>): string[] {
  const ids = new Set(w.synonyms.filter((id) => pool.get(id)?.pos === w.pos));
  for (const o of pool.values()) if (o.pos === w.pos && o.synonyms.includes(w.id)) ids.add(o.id);
  ids.delete(w.id);
  return [...ids].sort();
}

/**
 * Four wrong options for closest in meaning: the word's look-alikes and opposites first, then the
 * answer's, then words of the same part of speech and tier, then any of the same part of speech. None
 * is close in meaning to the word or the answer, so only the answer is right.
 */
export function synonymDistractors(w: Word, answer: Word, pool: ReadonlyMap<string, Word>, seed: number): string[] {
  const rng = mulberry32(seed);
  const out: string[] = [];
  const add = (o: Word | undefined) => {
    if (!o || out.length === CHOICES - 1 || o.id === w.id || o.id === answer.id || out.includes(o.id) || close(o, w) || close(o, answer)) return;
    out.push(o.id);
  };
  for (const id of w.confusables) add(pool.get(id));
  for (const id of rng.shuffle([...answer.confusables])) add(pool.get(id));
  const others = rng.shuffle([...pool.values()]);
  for (const o of others) if (o.pos === w.pos && o.tier === w.tier) add(o);
  for (const o of others) if (o.pos === w.pos) add(o);
  return out;
}

/**
 * How each word is asked. The chosen practice types are spread evenly over the session (dealt in turn,
 * then shuffled), so two types give about half each. Choice order is shuffled with the seed. Sentence
 * equivalence uses a bank sentence when the word has one still unused this session, since its partner
 * could otherwise meet the same sentence, then the word's own example and partner.
 *
 * `levels` (one per word) sets how hard each quiz card is. Medium, or no levels, is the original way.
 * Easy asks word → meaning and takes wrong options from other parts of speech, and sentence equivalence
 * uses the word's own example first. Hard asks closest in meaning when the word has a deck synonym, and
 * fill the blank uses an unused bank sentence, whose decoys tempt.
 */
export function planVocabItems(ids: readonly string[], modes: readonly VocabMode[], pool: ReadonlyMap<string, Word>, seed: number, sentences?: EquivIndex, levels?: readonly Difficulty[]): VocabItem[] {
  const rng = mulberry32(seed);
  const chosen = modes.length ? modes : (['flashcard'] as const);
  const dealt = rng.shuffle(ids.map((_, i) => chosen[i % chosen.length]!));
  const used = new Set<string>();
  /** A bank sentence for the word that this session hasn't asked yet. */
  const bankSentence = (wordId: string, itemRng: Rng): EquivSentence | undefined => {
    const unused = (sentences?.get(wordId) ?? []).filter((s) => !used.has(s.id));
    if (!unused.length) return undefined;
    const s = itemRng.pick(unused);
    used.add(s.id);
    return s;
  };
  return ids.map((wordId, i): VocabItem => {
    const w = pool.get(wordId);
    const partner = w?.equivalent ? pool.get(w.equivalent) : undefined;
    const level = levels?.[i];
    const tag = level ? { level } : {};
    const itemSeed = seed + i + 1;
    let mode = dealt[i]!;
    if (mode === 'equiv') {
      const itemRng = mulberry32(itemSeed);
      if (level === 1 && w && partner) return { wordId, kind: 'equiv', partner: partner.id, choices: itemRng.shuffle([wordId, partner.id, ...plainDistractors(w, [w, partner], pool, EQUIV_CHOICES - 2, itemSeed)]), ...tag };
      const s = bankSentence(wordId, itemRng);
      if (s) {
        const pair = s.answer.find((id) => id !== wordId)!;
        const wrong = level === 1 && w ? plainDistractors(w, s.answer.map((id) => pool.get(id)!).filter(Boolean), pool, EQUIV_CHOICES - 2, itemSeed) : [...s.decoy, ...s.others];
        return { wordId, kind: 'equiv', partner: pair, sentenceId: s.id, sentence: s.sentence, choices: itemRng.shuffle([...s.answer, ...wrong]), ...tag };
      }
      if (w && partner) return { wordId, kind: 'equiv', partner: partner.id, choices: equivChoices(w, partner, pool, itemSeed), ...tag };
      // No partner for this word: ask it another chosen way.
      mode = chosen.find((m) => m !== 'equiv') ?? 'blank';
    }
    if (mode === 'flashcard' || mode === 'typein') return { wordId, kind: mode };
    if (!w) throw new Error(`No entry for ${wordId}`);
    if (level === 1) {
      const kind: McqKind = mode === 'blank' ? 'blank' : 'meaning';
      return { wordId, kind, choices: rng.shuffle([wordId, ...plainDistractors(w, [w], pool, CHOICES - 1, itemSeed)]), ...tag };
    }
    if (level === 3 && mode === 'blank') {
      const s = bankSentence(wordId, mulberry32(itemSeed));
      if (s) return { wordId, kind: 'blank', sentenceId: s.id, sentence: s.sentence, choices: rng.shuffle([wordId, ...s.decoy, ...s.others]), ...tag };
    }
    if (level === 3 && mode === 'mcq') {
      const synonyms = deckSynonyms(w, pool);
      if (synonyms.length) {
        const answer = pool.get(mulberry32(itemSeed).pick(synonyms))!;
        return { wordId, kind: 'synonym', partner: answer.id, choices: rng.shuffle([answer.id, ...synonymDistractors(w, answer, pool, itemSeed)]), ...tag };
      }
    }
    const kind: McqKind = mode === 'blank' ? 'blank' : level === 3 ? 'word' : rng.pick(['meaning', 'word'] as const);
    const choices = rng.shuffle([wordId, ...distractors(w, kind, pool, itemSeed)]);
    return { wordId, kind, choices, ...tag };
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
 * the chosen word id (closest in meaning is right on its answer, not the word); sentence equivalence is both chosen ids, and only the exact pair counts, as on
 * the exam; type-in is the typed text. A skip (null) counts as wrong.
 */
export function gradeVocab(item: VocabItem, w: Word, value: string | null): Grade {
  if (item.kind === 'flashcard') return value === 'know' || value === 'unsure' || value === 'review' ? value : 'review';
  if (value === null) return 'wrong';
  if (item.kind === 'typein') {
    const r = matchWord(value, w);
    return r === 'correct' ? 'correct' : r === 'slip' ? 'slip' : 'wrong';
  }
  if (item.kind === 'synonym') return value === item.partner ? 'correct' : 'wrong';
  if (item.kind === 'equiv') {
    const chosen = new Set(value.split('|'));
    return chosen.size === 2 && chosen.has(w.id) && chosen.has(item.partner!) ? 'correct' : 'wrong';
  }
  return value === w.id ? 'correct' : 'wrong';
}
