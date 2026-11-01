// Turns a template draw into a finished question: applies the mental-math guard,
// fixes the answer string, and builds five choices from named mistakes plus near values.

import { R, Rational, type Rounding } from '../matching/rational';
import { mulberry32 } from '../rng';
import type { Difficulty, Draft, GeneratedQuestion, Template } from './types';

export const BASE_TARGET_SEC: Record<Difficulty, number> = { 1: 35, 2: 50, 3: 70 };
const WORD_EXTRA_SEC = 10;

/** Largest significant-digit count allowed in an answer, by difficulty. */
export const MAX_SIG_DIGITS: Record<Difficulty, number> = { 1: 4, 2: 5, 3: 5 };
/** Wrong options that must come from named mistakes rather than near values (0018). */
export const MIN_NAMED_DISTRACTORS = 2;
/** Options further than this factor from the answer rule themselves out (×10 slips stay in). */
const PLAUSIBLE_RATIO = 12;
const MAX_FRACTION_PART = 999n;
const PLACE_BY_DECIMALS: Record<number, Rounding> = { 0: 'whole', 1: 'tenth', 2: 'hundredth' };

export type Rejection =
  | 'template-null'
  | 'repeating-without-rounding'
  | 'too-many-digits'
  | 'fraction-too-big'
  | 'not-enough-choices'
  | 'bad-draft';

export type FinalizeResult = { ok: true; question: GeneratedQuestion } | { ok: false; reason: Rejection };

export function finalize(template: Template, d: Difficulty, seed: number): FinalizeResult {
  const rng = mulberry32(seed);
  const draft = template.generate(rng, d);
  if (!draft) return { ok: false, reason: 'template-null' };
  if (!draft.prompt || !draft.explain) return { ok: false, reason: 'bad-draft' };

  const format = draft.format ?? 'number';
  const final = draft.rounding ? draft.answer.round(draft.rounding) : draft.answer;

  if (format === 'number') {
    if (!final.isTerminating()) return { ok: false, reason: 'repeating-without-rounding' };
    const sig = final.significantDigits();
    if (sig === null || sig > MAX_SIG_DIGITS[d]) return { ok: false, reason: 'too-many-digits' };
  } else if (abs(final.n) > MAX_FRACTION_PART || final.d > MAX_FRACTION_PART) {
    return { ok: false, reason: 'fraction-too-big' };
  }

  const answer = writeAnswer(final, format);
  const { wrong, named } = buildDistractors(draft, final, format);
  let choices: string[] | undefined;
  if (wrong.length === 4 && (draft.exactChoices || named >= MIN_NAMED_DISTRACTORS)) {
    choices = rng.shuffle([answer, ...wrong]);
  } else if (draft.mcqOnly) {
    return { ok: false, reason: 'not-enough-choices' };
  }

  const question: GeneratedQuestion = {
    topic: template.topic,
    difficulty: d,
    kind: template.kind,
    prompt: draft.prompt,
    answer,
    format,
    targetSec: draft.targetSec ?? BASE_TARGET_SEC[d] + (template.kind === 'word' ? WORD_EXTRA_SEC : 0),
    explain: draft.explain,
  };
  if (draft.rounding) question.rounding = draft.rounding;
  if (draft.unit) question.unit = draft.unit;
  if (choices) question.choices = choices;
  if (draft.mcqOnly) question.mcqOnly = true;
  return { ok: true, question };
}

function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

export function writeAnswer(r: Rational, format: 'number' | 'fraction'): string {
  return format === 'fraction' ? r.toFractionString() : r.toDecimalString()!;
}

/** A distractor shown in the same style as the answer, or null if it can't be. */
function asChoiceValue(x: Rational, draft: Draft, final: Rational, format: 'number' | 'fraction'): Rational | null {
  let v = x;
  if (format === 'fraction') {
    if (abs(v.n) > MAX_FRACTION_PART || v.d > MAX_FRACTION_PART) return null;
  } else if (draft.rounding) {
    v = v.round(draft.rounding);
  } else if (!draft.exactChoices) {
    // Same precision as the answer, so an odd-looking decimal never gives a wrong option away.
    // Evenly spaced estimation options are exempt: their spacing is the point.
    const p = final.decimalPlaces()!;
    const vp = v.decimalPlaces();
    if (vp === null || vp > p) {
      const place = PLACE_BY_DECIMALS[p];
      if (!place) return null;
      v = v.round(place);
    }
  }
  if (format === 'number' && !v.isTerminating()) return null;
  if (!draft.exactChoices && final.n !== 0n && v.n !== 0n) {
    const ratio = v.div(final);
    const r = ratio.isNegative() ? ratio.neg() : ratio;
    if (r.cmp(R(PLAUSIBLE_RATIO)) > 0 || r.cmp(R(1, PLAUSIBLE_RATIO)) < 0) return null;
  }
  // A positive answer never sits beside zero or negative options; a negative answer may.
  if (final.cmp(R(0)) > 0 && v.cmp(R(0)) <= 0) return null;
  return v;
}

/** Four wrong options: named mistakes first, then near values. `named` counts the former. */
function buildDistractors(draft: Draft, final: Rational, format: 'number' | 'fraction'): { wrong: string[]; named: number } {
  const seen = new Set<string>([writeAnswer(final, format)]);
  const out: string[] = [];
  const add = (x: Rational) => {
    if (out.length >= 4) return;
    const v = asChoiceValue(x, draft, final, format);
    if (!v || v.equals(final)) return;
    const s = writeAnswer(v, format);
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };
  draft.distractors.forEach(add);
  const named = out.length;
  if (!draft.exactChoices) nearValues(final, format).forEach(add);
  return { wrong: out, named };
}

/** Plausible near misses: a step in the answer's last meaningful place, or ±10%. */
export function nearValues(a: Rational, format: 'number' | 'fraction'): Rational[] {
  if (format === 'fraction') {
    const n = a.n;
    const d = a.d;
    const cands: [bigint, bigint][] = [
      [n + 1n, d],
      [n - 1n, d],
      [n, d + 1n],
      [n, d - 1n],
      [n + 1n, d + 1n],
      [n + 2n, d],
      [d, n === 0n ? 1n : n],
    ];
    return cands.filter(([, dd]) => dd > 0n).map(([nn, dd]) => Rational.of(nn, dd));
  }
  const places = a.decimalPlaces() ?? 2;
  let unit: Rational;
  if (places > 0) {
    unit = R(10).pow(-places);
  } else {
    const digits = (a.n < 0n ? -a.n : a.n).toString().length;
    unit = digits <= 2 ? R(1) : R(10).pow(digits - 2);
  }
  const step = (k: number) => a.add(unit.mul(R(k)));
  return [step(1), step(-1), step(2), step(-2), a.mul(R('1.1')), a.mul(R('0.9')), step(5), step(-5), step(10)];
}
