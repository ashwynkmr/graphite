// Reading the mistake log. Writes happen with each answer, in the session repos.
import { db, type GraphiteDB, type MistakeRow, type QuantAttemptRow, type WordAttemptRow } from '../db';

export function quantMistakes(d: GraphiteDB = db): Promise<MistakeRow[]> {
  return d.mistakes.where('kind').equals('quant').toArray();
}

export function wordMistakes(d: GraphiteDB = db): Promise<MistakeRow[]> {
  return d.mistakes.where('kind').equals('word').toArray();
}

/** The latest wrong attempt for each id, by insertion order. */
function lastMisses<T extends { id?: number; correct: boolean }>(attempts: readonly T[], idOf: (a: T) => string): Map<string, T> {
  const misses = new Map<string, T>();
  for (const a of [...attempts].sort((x, y) => (x.id ?? 0) - (y.id ?? 0))) if (!a.correct) misses.set(idOf(a), a);
  return misses;
}

export interface MistakeLog {
  /** Oldest first, the order Drill my mistakes takes them in. */
  quant: { row: MistakeRow; miss: QuantAttemptRow | undefined }[];
  words: { row: MistakeRow; miss: WordAttemptRow | undefined }[];
}

export async function loadMistakeLog(d: GraphiteDB = db): Promise<MistakeLog> {
  const rows = (await d.mistakes.orderBy('addedAt').toArray()) as MistakeRow[];
  const quantRows = rows.filter((r) => r.kind === 'quant');
  const wordRows = rows.filter((r) => r.kind === 'word');
  const quantMiss = lastMisses(await d.quantAttempts.where('questionId').anyOf(quantRows.map((r) => r.refId)).toArray(), (a) => a.questionId);
  const wordMiss = lastMisses(await d.wordAttempts.where('wordId').anyOf(wordRows.map((r) => r.refId)).toArray(), (a) => a.wordId);
  return {
    quant: quantRows.map((row) => ({ row, miss: quantMiss.get(row.refId) })),
    words: wordRows.map((row) => ({ row, miss: wordMiss.get(row.refId) })),
  };
}
