// Results for a finished vocab session. Quiz cards are scored; flashcards are tallied by mark
// (a session can mix both).
import type { Grade } from '../scheduling/leitner';
import { isPassing } from '../scheduling/leitner';

export interface VocabScoredItem {
  index: number;
  wordId: string;
  grade: Grade;
  /** Self-marked flashcard, not a quiz question. */
  flashcard: boolean;
  ms: number;
  /** What the user chose or typed (quizzes); null when skipped. */
  answer: string | null;
}

export interface VocabResults {
  items: VocabScoredItem[];
  /** Quiz cards answered (multiple choice, fill the blank, type-in): the score. */
  total: number;
  correct: number;
  /** Flashcards marked (first showings only; a requeued card isn't counted twice). */
  flashcards: number;
  slips: number;
  marks: { know: number; unsure: number; review: number };
  totalMs: number;
  avgMs: number;
}

export function scoreVocab(items: readonly VocabScoredItem[], requeued: readonly boolean[]): VocabResults {
  const first = items.filter((_, i) => !requeued[i]);
  const quiz = first.filter((i) => !i.flashcard);
  const totalMs = items.reduce((t, i) => t + i.ms, 0);
  return {
    items: [...items],
    total: quiz.length,
    correct: quiz.filter((i) => isPassing(i.grade)).length,
    flashcards: first.length - quiz.length,
    slips: quiz.filter((i) => i.grade === 'slip').length,
    marks: {
      know: first.filter((i) => i.grade === 'know').length,
      unsure: first.filter((i) => i.grade === 'unsure').length,
      review: first.filter((i) => i.grade === 'review').length,
    },
    totalMs,
    avgMs: items.length ? Math.round(totalMs / items.length) : 0,
  };
}
