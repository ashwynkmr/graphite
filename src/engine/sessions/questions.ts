// A question as the app uses it, whether it came from the bank or was generated live.
import { finalize } from '../generators/finalize';
import { TEMPLATE_BY_ID } from '../generators/index';
import type { Difficulty, GeneratedQuestion, Topic } from '../generators/types';

export interface PlayableQuestion extends GeneratedQuestion {
  id: string;
}

export type QuestionRef = { kind: 'bank'; id: string } | { kind: 'gen'; templateId: string; difficulty: Difficulty; seed: number };

/** Bank questions as loaded from content/questions.json (only the fields the engine needs are required). */
export interface BankQuestion extends PlayableQuestion {
  topic: Topic;
  difficulty: Difficulty;
}

/** Stable string id for any ref: the bank id, or 'gen:<template>:<difficulty>:<seed>'. */
export function refId(ref: QuestionRef): string {
  return ref.kind === 'bank' ? ref.id : `gen:${ref.templateId}:${ref.difficulty}:${ref.seed}`;
}

export function parseRefId(id: string): QuestionRef {
  if (!id.startsWith('gen:')) return { kind: 'bank', id };
  const [, templateId, d, seed] = id.split(':');
  return { kind: 'gen', templateId: templateId!, difficulty: Number(d) as Difficulty, seed: Number(seed) };
}

/** Turns a ref into a question; generated ones are rebuilt exactly from template + seed. */
export function resolveQuestion(ref: QuestionRef, bankById: ReadonlyMap<string, BankQuestion>): PlayableQuestion | null {
  if (ref.kind === 'bank') return bankById.get(ref.id) ?? null;
  const template = TEMPLATE_BY_ID.get(ref.templateId);
  if (!template) return null;
  const res = finalize(template, ref.difficulty, ref.seed);
  return res.ok ? { id: refId(ref), ...res.question } : null;
}
