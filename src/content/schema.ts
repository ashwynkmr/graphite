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
    format: z.enum(['number', 'fraction']),
    rounding: z.enum(['whole', 'tenth', 'hundredth']).optional(),
    unit: z.object({ prefix: z.string().optional(), suffix: z.string().optional() }).strict().optional(),
    choices: z.array(z.string()).length(5).optional(),
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
