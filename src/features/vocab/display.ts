import type { Word } from '../../content/schema';

/** A sentence with its word picked out, for showing that word in bold. Null if the form isn't found. */
export function splitExample(example: string, form: string): { before: string; word: string; after: string } | null {
  const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`\\b${escaped}\\b`, 'i').exec(example);
  return m ? { before: example.slice(0, m.index), word: m[0], after: example.slice(m.index + m[0].length) } : null;
}

export const POS_SHORT: Record<Word['pos'], string> = { noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.' };

/** Meanings are stored lowercase without a full stop; on a card they read as a sentence. */
export function sentence(s: string): string {
  const t = s.trim();
  return t ? t[0]!.toUpperCase() + t.slice(1) + (/[.!?)]$/.test(t) ? '' : '.') : t;
}
