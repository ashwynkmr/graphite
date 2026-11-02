import { loadBank } from '../../content/bank';
import type { QuantSettings, SessionRow } from '../../data/db';
import { fixedLength, getAdaptiveLevels, getSettings, normalizeQuant, updateSettings } from '../../data/repo/meta';
import { quantMistakes } from '../../data/repo/mistakes';
import { createQuantSession, lastSeenMap } from '../../data/repo/quant-sessions';
import { toDay } from '../../engine/dates';
import { TOPICS } from '../../engine/generators/types';
import { levelsFor } from '../../engine/sessions/adaptive';
import { buildMistakeItems, buildQuantItems, rebuildItems, sprintLength, type PlannedItem } from '../../engine/sessions/quant-builder';
import { resolveQuestion } from '../../engine/sessions/questions';

function freshSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Builds a drill from the bank and saves it. Remembers the settings for next time. */
export async function startDrill(input: QuantSettings, remember = true): Promise<SessionRow> {
  const settings = normalizeQuant(input);
  const [bank, lastSeen, levels] = await Promise.all([loadBank(), lastSeenMap(), getAdaptiveLevels()]);
  const seed = freshSeed();
  const topics = settings.topics === 'mixed' ? TOPICS : settings.topics;
  const items = buildQuantItems({
    bank: bank.questions,
    topics,
    difficulties: settings.difficulties,
    levels: settings.adaptive ? levelsFor(topics, levels) : undefined,
    length: settings.timer === 'sprint' ? sprintLength(settings.sprintMinutes) : settings.length,
    answerMode: settings.answerMode,
    today: toDay(new Date()),
    seed,
    lastSeen,
  });
  if (remember) await rememberSetup(settings);
  return createQuantSession({ settings, items, origin: { kind: 'drill' }, seed });
}

/** Saves the setup for next time, and for this topic if it was drilled on its own. */
async function rememberSetup(settings: QuantSettings): Promise<void> {
  const { quantByTopic } = await getSettings();
  const only = settings.topics !== 'mixed' && settings.topics.length === 1 ? settings.topics[0]! : null;
  if (!only) {
    await updateSettings({ quant: settings });
    return;
  }
  const { topics: _topics, ...setup } = settings;
  await updateSettings({ quant: settings, quantByTopic: { ...quantByTopic, [only]: setup } });
}

/** Retry wrong ones: exactly the given items, choices reshuffled. */
export async function startRetry(from: SessionRow, items: PlannedItem[]): Promise<SessionRow> {
  const seed = freshSeed();
  return createQuantSession({
    settings: fixedLength(from.settings, items.length),
    items: rebuildItems(items, seed),
    origin: { kind: 'retry', of: from.id },
    seed,
  });
}

/** Drill my mistakes: the oldest logged questions, up to the usual drill length. Null when none can be served. */
export async function startMistakeDrill(): Promise<SessionRow | null> {
  const [bank, mistakes, all] = await Promise.all([loadBank(), quantMistakes(), getSettings()]);
  const seed = freshSeed();
  const items = buildMistakeItems({ mistakes, resolve: (ref) => resolveQuestion(ref, bank.byId), length: all.quant.length, seed });
  if (!items.length) return null;
  return createQuantSession({ settings: { ...fixedLength(all.quant, items.length), answerMode: 'mix' }, items, origin: { kind: 'mistakes' }, seed });
}
