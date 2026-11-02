// Zod schemas are the single source of truth for content files; types are inferred.
import { z } from 'zod';
import { TOPICS } from '../engine/generators/types';

export const QuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+-[emh]-\d{4}$/),
    topic: z.enum(TOPICS as [string, ...string[]]),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    kind: z.enum(['calc', 'word']),
    prompt: z.string().min(1),
    answer: z.string().min(1),
    format: z.enum(['number', 'fraction', 'compare']),
    rounding: z.enum(['whole', 'tenth', 'hundredth']).optional(),
    unit: z.object({ prefix: z.string().optional(), suffix: z.string().optional() }).strict().optional(),
    choices: z.array(z.string()).min(4).max(5).optional(),
    mcqOnly: z.boolean().optional(),
    targetSec: z.number().int().positive(),
    explain: z.string().min(1),
    source: z.discriminatedUnion('type', [
      z.object({ type: z.literal('template'), templateId: z.string(), seed: z.number().int().positive() }).strict(),
      z.object({ type: z.literal('handwritten'), calc: z.string().min(1) }).strict(),
    ]),
  })
  .strict();

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionBankSchema = z.array(QuestionSchema);

export const POS = ['noun', 'verb', 'adjective', 'adverb'] as const;

export const WordSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z' -]*[a-z]$/),
    word: z.string().min(2),
    pos: z.enum(POS),
    meaning: z.string().min(1).max(90),
    example: z.string().min(1),
    exampleForm: z.string().min(1),
    synonyms: z.array(z.string().min(1)).min(2).max(3),
    /** A deck word that gives `example` the same meaning, for sentence equivalence. Hand-checked per sentence. */
    equivalent: z.string().min(1).optional(),
    variants: z.array(z.string().min(1)).optional(),
    mnemonic: z.string().min(1).max(90).optional(),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    rank: z.number().int().min(1).max(1500),
    confusables: z.array(z.string().min(1)).length(3),
  })
  .strict();

export type Word = z.infer<typeof WordSchema>;

export const WordListSchema = z.array(WordSchema);

/** An exam-style sentence equivalence question, hand-written and hand-read. All six options are deck words. */
export const EquivSentenceSchema = z
  .object({
    id: z.string().regex(/^se-\d{4}$/),
    sentence: z.string().min(1),
    answer: z.tuple([z.string().min(1), z.string().min(1)]),
    /** Two words that mean the same as each other but don't fit the sentence. */
    decoy: z.tuple([z.string().min(1), z.string().min(1)]),
    others: z.tuple([z.string().min(1), z.string().min(1)]),
  })
  .strict();

export type EquivSentence = z.infer<typeof EquivSentenceSchema>;

export const EquivSentenceListSchema = z.array(EquivSentenceSchema);
