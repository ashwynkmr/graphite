// Turns a hand-written problem into a finished question. The answer and wrong options are
// expressions worked out by the evaluator, never typed values. Lives apart from the templates:
// only the content tools use it, and the app reads the finished bank.
import { evaluate, literals } from '../matching/calc';
import { R, Rational, type Rounding } from '../matching/rational';
import { mulberry32 } from '../rng';
import { finishDraft, type FinalizeResult } from './finalize';
import type { Difficulty, Topic, Unit } from './types';

export interface HandwrittenProblem {
  id: string;
  topic: Topic;
  difficulty: Difficulty;
  prompt: string;
  /** The exact working, as arithmetic. */
  calc: string;
  /** Workings of real mistakes (0018). Unused for estimation, whose options are evenly spaced. */
  wrong: string[];
  explain: string;
  format?: 'number' | 'fraction';
  rounding?: Rounding;
  unit?: Unit;
  /** Estimation: the option spacing. The answer is the exact value rounded to this. */
  nearest?: string;
  targetSec?: number;
}

/** A stable seed from the id, so the option order never changes between builds. */
export function seedFor(id: string): number {
  let hash = 2166136261;
  for (const ch of id) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash || 1;
}

export function estimateAnswer(p: Pick<HandwrittenProblem, 'calc' | 'nearest'>): Rational {
  const step = R(p.nearest!);
  return evaluate(p.calc).div(step).round('whole').mul(step);
}

export function buildHandwritten(p: HandwrittenProblem): FinalizeResult {
  const rng = mulberry32(seedFor(p.id));
  const answer = p.nearest ? estimateAnswer(p) : evaluate(p.calc);
  let distractors: Rational[];
  if (p.nearest) {
    const step = R(p.nearest);
    // Five evenly spaced options, with the answer in a varying place so its position gives nothing
    // away, and low enough that no option falls to zero or below.
    const stepsUp = answer.div(step).toNumber();
    const place = Math.min(rng.int(0, 4), Math.max(0, Math.floor(stepsUp) - 1));
    distractors = [0, 1, 2, 3, 4].filter((i) => i !== place).map((i) => answer.add(step.mul(R(i - place))));
  } else {
    distractors = p.wrong.map(evaluate);
  }
  return finishDraft(
    {
      prompt: p.prompt,
      answer,
      format: p.format,
      rounding: p.rounding,
      unit: p.unit,
      distractors,
      explain: p.explain,
      mcqOnly: p.nearest ? true : undefined,
      exactChoices: p.nearest ? true : undefined,
      targetSec: p.targetSec,
    },
    { topic: p.topic, kind: 'word' },
    p.difficulty,
    rng,
  );
}

/** Small numbers and units that needn't appear as digits: "half", "dozen", "per cent", "an hour". */
const WORDLESS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '24', '60', '100', '1000']);

function numbersIn(text: string): Rational[] {
  const out: Rational[] = [];
  // "10¹¹" is 10 and then 11, not 1011.
  const plain = text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (run) => ` ${[...run].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')} `);
  for (const m of plain.replace(/(\d),(\d)/g, '$1$2').match(/\d+\/\d+|\d+(?:\.\d+)?|\.\d+/g) ?? []) {
    const r = Rational.parse(m);
    if (r) out.push(r);
  }
  return out;
}

/**
 * What a formula's arithmetic can't prove: that it belongs to this prompt. Each check catches a
 * different slip: a number typed wrong in the working, an explanation reaching a different answer,
 * or an estimate so near the midpoint of two options that both look right.
 */
export function problemIssues(p: HandwrittenProblem): string[] {
  const issues: string[] = [];
  const inPrompt = numbersIn(p.prompt);
  for (const n of literals(p.calc)) {
    if (!WORDLESS.has(n) && !inPrompt.some((x) => x.equals(R(n)))) issues.push(`calc uses ${n}, which isn't in the prompt`);
  }
  const answer = p.nearest ? estimateAnswer(p) : evaluate(p.calc);
  const final = p.rounding ? answer.round(p.rounding) : answer;
  if (!numbersIn(p.explain).some((x) => x.equals(final))) issues.push(`explanation doesn't reach the answer (${final.toDecimalString() ?? final.toFractionString()})`);
  if (p.nearest) {
    const off = evaluate(p.calc).sub(answer);
    const distance = off.isNegative() ? off.neg() : off;
    if (distance.cmp(R(p.nearest).mul(R('0.35'))) > 0) issues.push('exact value is too near the midpoint of two options');
    if (!/about|closest|roughly|approximately|estimate/i.test(p.prompt)) issues.push('estimation prompt should say it wants an estimate');
  } else if (p.wrong.length < 3) {
    issues.push('needs at least 3 worked mistakes');
  }
  if (p.explain.length > 90) issues.push('explanation is over 90 characters');
  return issues;
}
