import { loadWords } from '../../content/words';
import type { VocabSessionRow, VocabSettings } from '../../data/db';
import { getSettings, updateSettings } from '../../data/repo/meta';
import { createVocabSession, loadWordStates } from '../../data/repo/vocab';
import { toDay } from '../../engine/dates';
import { buildVocabQueue, deckCounts, introducedOn, planVocabItems, type DeckCounts } from '../../engine/sessions/vocab-builder';

function freshSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export interface VocabOverview {
  counts: DeckCounts;
  /** Written entries so far (the deck grows by batch). */
  written: number;
  newGoal: number;
  newLeft: number;
}

/** What each deck holds right now, for the setup screen. */
export async function vocabOverview(): Promise<VocabOverview> {
  const [book, states, settings] = await Promise.all([loadWords(), loadWordStates(), getSettings()]);
  const today = toDay(new Date());
  const newLeft = Math.max(0, settings.goals.newWords - introducedOn(states, today));
  return { counts: deckCounts(book.words, states, today, newLeft), written: book.words.length, newGoal: settings.goals.newWords, newLeft };
}

/** Builds a session from the chosen deck and saves it. Returns null when the deck is empty. */
export async function startVocab(settings: VocabSettings): Promise<VocabSessionRow | null> {
  const [book, states, all] = await Promise.all([loadWords(), loadWordStates(), getSettings()]);
  const today = toDay(new Date());
  const newLeft = Math.max(0, all.goals.newWords - introducedOn(states, today));
  const ids = buildVocabQueue({ words: book.words, states, deck: settings.deck, length: settings.length, today, newLeft });
  await updateSettings({ vocab: settings });
  if (!ids.length) return null;
  const seed = freshSeed();
  return createVocabSession({ settings, items: planVocabItems(ids, settings.modes, book.byId, seed), seed });
}
