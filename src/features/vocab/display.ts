import type { Word } from '../../content/schema';

export const POS_SHORT: Record<Word['pos'], string> = { noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.' };

/** Meanings are stored lowercase without a full stop; on a card they read as a sentence. */
export function sentence(s: string): string {
  const t = s.trim();
  return t ? t[0]!.toUpperCase() + t.slice(1) + (/[.!?)]$/.test(t) ? '' : '.') : t;
}
