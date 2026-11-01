import { describe, expect, it } from 'vitest';
import { R } from '../matching/rational';
import { finalize } from './finalize';
import type { Draft, Template } from './types';

const fake = (draft: Partial<Draft>): Template => ({
  id: 'fake',
  topic: 'arithmetic',
  kind: 'calc',
  difficulties: [1],
  generate: () => ({ prompt: 'p = ?', answer: R(100), explain: 'because', distractors: [], ...draft }),
});

describe('finalize distractor rules (0018)', () => {
  it('keeps choices when at least two named mistakes survive', () => {
    const res = finalize(fake({ distractors: [R(90), R(110)] }), 1, 1);
    expect(res.ok && res.question.choices).toHaveLength(5);
  });

  it('drops choices (typed only) when fewer than two named mistakes survive', () => {
    const res = finalize(fake({ distractors: [R(90)] }), 1, 1);
    expect(res.ok && res.question.choices).toBeUndefined();
  });

  it('rejects an MCQ-only question without enough named mistakes', () => {
    const res = finalize(fake({ distractors: [R(90)], mcqOnly: true }), 1, 1);
    expect(res).toEqual({ ok: false, reason: 'not-enough-choices' });
  });

  it('drops options more than 12× away from the answer, but keeps ×10 slips', () => {
    const res = finalize(fake({ distractors: [R(1000), R(10), R(5000), R(2), R(95)] }), 1, 1);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.question.choices).toContain('1000');
    expect(res.question.choices).toContain('10');
    expect(res.question.choices).not.toContain('5000');
    expect(res.question.choices).not.toContain('2');
  });

  it('exact choices (estimation) skip the floor and the band', () => {
    const res = finalize(fake({ distractors: [R(1), R(10), R(1000), R(10000)], exactChoices: true, mcqOnly: true }), 1, 1);
    expect(res.ok && res.question.choices).toHaveLength(5);
  });
});
