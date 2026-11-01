import { loadBank } from '../../content/bank';
import type { QuantSettings, SessionRow } from '../../data/db';
import { normalizeQuant, updateSettings } from '../../data/repo/meta';
import { createQuantSession, lastSeenMap } from '../../data/repo/quant-sessions';
import { toDay } from '../../engine/dates';
import { TOPICS } from '../../engine/generators/types';
import { buildQuantItems, rebuildItems, type PlannedItem } from '../../engine/sessions/quant-builder';

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
