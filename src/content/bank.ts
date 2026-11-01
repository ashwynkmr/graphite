// The question bank, loaded on first use so Home opens fast. It's precached with the app,
// so this works offline after the first visit.
import type { BankQuestion } from '../engine/sessions/questions';

export interface Bank {
  questions: BankQuestion[];
  byId: ReadonlyMap<string, BankQuestion>;
}

let loading: Promise<Bank> | null = null;

export function loadBank(): Promise<Bank> {
  loading ??= import('../../content/questions.json').then((m) => {
    const questions = m.default as unknown as BankQuestion[];
    return { questions, byId: new Map(questions.map((q) => [q.id, q])) };
  });
  return loading;
}
