import { loadWords } from '../../content/words';
import type { VocabSessionRow, VocabSettings } from '../../data/db';
import { getRoundDeclined, getSettings, getVocabRound, setVocabRound, updateSettings } from '../../data/repo/meta';
import { wordMistakes } from '../../data/repo/mistakes';
import { createVocabSession, loadWordStates } from '../../data/repo/vocab';
import { toDay } from '../../engine/dates';
import { mulberry32 } from '../../engine/rng';
import { buildPracticeQueue, choosableModes, deckCounts, introducedOn, planVocabItems, roundStatus, type DeckCounts, type RoundStatus } from '../../engine/sessions/vocab-builder';

const DECK_SIZE = 1500;

function freshSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export interface VocabOverview {
  counts: DeckCounts;
  /** Written entries so far (the deck grows by batch). */
  written: number;
  newGoal: number;
  newLeft: number;
  round: RoundStatus;
}

/** What each deck holds right now, for the setup screen. */
export async function vocabOverview(): Promise<VocabOverview> {
  const [book, states, settings, current] = await Promise.all([loadWords(), loadWordStates(), getSettings(), getVocabRound()]);
  const today = toDay(new Date());
  const newLeft = Math.max(0, settings.goals.newWords - introducedOn(states, today));
  return { counts: deckCounts(book.words, states, today, newLeft), written: book.words.length, newGoal: settings.goals.newWords, newLeft, round: roundStatus(book.words, states, current) };
}

/** The round for Home to offer, unless it was turned down. Skips loading the word list until every word could have been seen. */
export async function roundToOffer(): Promise<number | null> {
  const [states, current, declined] = await Promise.all([loadWordStates(), getVocabRound(), getRoundDeclined()]);
  if (states.size < DECK_SIZE) return null;
  const { offer } = roundStatus((await loadWords()).words, states, current);
  return offer !== null && offer > declined ? offer : null;
}

/** Builds a session from the chosen deck and saves it. Returns null when the deck is empty. */
export async function startVocab(chosen: VocabSettings): Promise<VocabSessionRow | null> {
  const settings: VocabSettings = { ...chosen, modes: choosableModes(chosen.modes) };
  const [book, states, all] = await Promise.all([loadWords(), loadWordStates(), getSettings()]);
  const today = toDay(new Date());
  const newLeft = Math.max(0, all.goals.newWords - introducedOn(states, today));
  let round: number | undefined;
  if (settings.deck === 'round') {
    const status = roundStatus(book.words, states, await getVocabRound());
    round = status.offer ?? status.current;
    // Starting the deck when a round is on offer is what starts that round.
    if (status.offer) await setVocabRound(status.offer);
  }
  const ids = buildPracticeQueue({ words: book.words, states, deck: settings.deck, length: settings.length, today, newLeft, round }, settings.modes);
  await updateSettings({ vocab: settings });
  if (!ids.length) return null;
  const seed = freshSeed();
  return createVocabSession({ settings: round ? { ...settings, round } : settings, items: planVocabItems(ids, settings.modes, book.byId, seed), seed });
}

/**
 * A flashcard round of just the given words (the ones missed or unsure last time), in a fresh
 * order. The user's saved settings are left alone, so "Another session" still means the usual one.
 */
export async function redoVocab(wordIds: readonly string[], base: VocabSettings): Promise<VocabSessionRow | null> {
  if (!wordIds.length) return null;
  const book = await loadWords();
  const seed = freshSeed();
  const settings: VocabSettings = { ...base, modes: ['flashcard'], deck: base.deck === 'round' ? 'today' : base.deck, round: undefined };
  const ids = mulberry32(seed).shuffle([...wordIds]);
  return createVocabSession({ settings, items: planVocabItems(ids, settings.modes, book.byId, seed), seed });
}

/** Drill my mistakes: the oldest logged words, up to the usual session length, in the usual practice types. */
export async function startMistakeVocab(): Promise<VocabSessionRow | null> {
  const [book, mistakes, all] = await Promise.all([loadWords(), wordMistakes(), getSettings()]);
  const ids = [...mistakes].sort((a, b) => a.addedAt - b.addedAt).map((m) => m.refId).filter((id) => book.byId.has(id)).slice(0, all.vocab.length);
  if (!ids.length) return null;
  const seed = freshSeed();
  const settings: VocabSettings = { ...all.vocab, length: ids.length, deck: all.vocab.deck === 'round' ? 'today' : all.vocab.deck };
  return createVocabSession({ settings, items: planVocabItems(ids, settings.modes, book.byId, seed), seed });
}
