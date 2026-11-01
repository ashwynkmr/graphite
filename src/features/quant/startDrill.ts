import { loadBank } from '../../content/bank';
import type { QuantSettings, SessionRow } from '../../data/db';
import { getSettings, normalizeQuant, updateSettings } from '../../data/repo/meta';
import { quantMistakes } from '../../data/repo/mistakes';
import { createQuantSession, lastSeenMap } from '../../data/repo/quant-sessions';
import { toDay } from '../../engine/dates';
import { TOPICS } from '../../engine/generators/types';
import { buildMistakeItems, buildQuantItems, rebuildItems, type PlannedItem } from '../../engine/sessions/quant-builder';
import { resolveQuestion } from '../../engine/sessions/questions';

function freshSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Builds a drill from the bank and saves it. Remembers the settings for next time. */
export async function startDrill(input: QuantSettings, remember = true): Promise<SessionRow> {
  const settings = normalizeQuant(input);
  const [bank, lastSeen] = await Promise.all([loadBank(), lastSeenMap()]);
  const seed = freshSeed();
  const items = buildQuantItems({
    bank: bank.questions,
    topics: settings.topics === 'mixed' ? TOPICS : settings.topics,
    difficulties: settings.difficulties,
    length: settings.length,
    answerMode: settings.answerMode,
    today: toDay(new Date()),
    seed,
    lastSeen,
  });
  if (remember) await updateSettings({ quant: settings });
  return createQuantSession({ settings, items, origin: { kind: 'drill' }, seed });
}

/** Retry wrong ones: exactly the given items, choices reshuffled. */
export async function startRetry(from: SessionRow, items: PlannedItem[]): Promise<SessionRow> {
  const seed = freshSeed();
  return createQuantSession({
    settings: { ...from.settings, length: items.length },
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
  return createQuantSession({ settings: { ...all.quant, answerMode: 'mix', length: items.length }, items, origin: { kind: 'mistakes' }, seed });
}
