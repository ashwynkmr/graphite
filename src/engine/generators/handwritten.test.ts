import { describe, expect, it } from 'vitest';
import problemsJson from '../../../content/handwritten.json';
import { R } from '../matching/rational';
import { buildHandwritten, estimateAnswer, problemIssues, seedFor, type HandwrittenProblem } from './handwritten';
import { DIFFICULTIES, TOPICS } from './types';

const problems = problemsJson as unknown as HandwrittenProblem[];

const sample: HandwrittenProblem = {
  id: 'hw-percents-e-9999',
  topic: 'percents',
  difficulty: 1,
  prompt: 'A school has 640 students, and 15% walk. How many walk?',
  calc: '640*15/100',
  wrong: ['640*15/10', '640-640*15/100', '640*25/100'],
  explain: '10% is 64 and 5% is 32; 64 + 32 = 96',
};

describe('buildHandwritten', () => {
  it('works the answer out and builds options from the mistakes', () => {
    const res = buildHandwritten(sample);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.question).toMatchObject({ topic: 'percents', difficulty: 1, kind: 'word', answer: '96', format: 'number' });
    expect(res.question.choices).toHaveLength(5);
    expect(res.question.choices).toEqual(expect.arrayContaining(['96', '960', '544', '160']));
  });

  it('builds the same question every time', () => {
    expect(buildHandwritten(sample)).toEqual(buildHandwritten(sample));
    expect(seedFor('a')).not.toBe(seedFor('b'));
  });

  it('spaces estimation options evenly and keeps them above zero', () => {
    const res = buildHandwritten({ ...sample, topic: 'estimation', calc: '198*4.95', nearest: '100', wrong: [], explain: 'x 1000' });
    if (!res.ok) throw new Error('should build');
    expect(res.question.answer).toBe('1000');
    expect(res.question.mcqOnly).toBe(true);
    const sorted = res.question.choices!.map(Number).sort((a, b) => a - b);
    expect(sorted.every((v, i) => i === 0 || v - sorted[i - 1]! === 100)).toBe(true);
    expect(sorted[0]).toBeGreaterThan(0);
  });

  it('keeps a small estimate’s options above zero wherever the answer lands', () => {
    for (let i = 0; i < 40; i++) {
      const res = buildHandwritten({ ...sample, id: `hw-estimation-e-${i}`, topic: 'estimation', calc: '1.9', nearest: '1', wrong: [], explain: 'x 2' });
      if (!res.ok) throw new Error('should build');
      expect(res.question.choices!.map(Number).every((v) => v > 0)).toBe(true);
    }
  });

  it('rounds an estimate to the option spacing', () => {
    expect(estimateAnswer({ calc: '712/88', nearest: '1' }).equals(R(8))).toBe(true);
  });
});

describe('problemIssues', () => {
  it('passes a sound problem', () => {
    expect(problemIssues(sample)).toEqual([]);
  });

  it('catches a number in the working that is not in the prompt', () => {
    expect(problemIssues({ ...sample, calc: '650*15/100' }).join()).toContain('650');
  });

  it('catches an explanation reaching a different answer', () => {
    expect(problemIssues({ ...sample, explain: '10% is 64; 64 + 30 = 94' }).join()).toContain('answer');
  });

  it('needs enough worked mistakes', () => {
    expect(problemIssues({ ...sample, wrong: ['1'] }).join()).toContain('mistakes');
  });

  it('catches an estimate too near the midpoint of two options', () => {
    const issues = problemIssues({ ...sample, prompt: 'About what is 145?', calc: '145', nearest: '100', wrong: [], explain: 'about 100' });
    expect(issues.join()).toContain('midpoint');
  });

  it('reads superscript powers as separate numbers', () => {
    expect(problemIssues({ ...sample, prompt: 'What is 10¹¹ ÷ 10¹⁰?', calc: '10^11/10^10', explain: 'It is 10' })).toEqual([]);
  });
});

describe('the hand-written problems', () => {
  it('number 300, with every level of the first nine topics covered', () => {
    expect(problems).toHaveLength(300);
    for (const t of TOPICS.slice(0, 9)) for (const d of DIFFICULTIES) expect(problems.some((p) => p.topic === t && p.difficulty === d), `${t} ${d}`).toBe(true);
  });

  it('all build, offer options and pass every check', () => {
    for (const p of problems) {
      const res = buildHandwritten(p);
      expect(res.ok, p.id).toBe(true);
      if (res.ok) expect(res.question.choices, p.id).toHaveLength(5);
      expect(problemIssues(p), p.id).toEqual([]);
    }
  });

  it('have unique ids and prompts', () => {
    expect(new Set(problems.map((p) => p.id)).size).toBe(300);
    expect(new Set(problems.map((p) => p.prompt)).size).toBe(300);
  });

  it('work out every answer from a formula, never a typed value', () => {
    for (const p of problems) expect(/^[\d.]+$/.test(p.calc), p.id).toBe(false);
  });
});
