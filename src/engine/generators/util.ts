// Small helpers shared by the topic files.

import { R, Rational } from '../matching/rational';
import type { Rng } from '../rng';
import type { Difficulty } from './types';

/** Pick by difficulty: by(d, easy, medium, hard). */
export function by<T>(d: Difficulty, easy: T, medium: T, hard: T): T {
  return d === 1 ? easy : d === 2 ? medium : hard;
}

/** Random pick from a pool of numbers or decimal strings, as a Rational. */
export function pickR(rng: Rng, pool: readonly (number | string)[]): Rational {
  return R(rng.pick(pool));
}

export function intR(rng: Rng, min: number, max: number): Rational {
  return R(rng.int(min, max));
}

/** Percent as a multiplier: 15 → 0.15. */
export function rate(p: Rational): Rational {
  return p.div(R(100));
}

const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

/** Superscript exponent: sup(-4) → '⁻⁴'. */
export function sup(n: number | bigint): string {
  return String(n).split('').map((c) => SUP[c] ?? c).join('');
}

export function gcdNum(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcmNum(a: number, b: number): number {
  return (a / gcdNum(a, b)) * b;
}

/** Neutral first names for word problems. */
export const NAMES = ['Maya', 'Leo', 'Priya', 'Sam', 'Ana', 'Omar', 'Kenji', 'Zara', 'Ben', 'Ines', 'Tariq', 'Elena'];

/** Fill {slots} in a scenario string. */
export function fill(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => slots[k] ?? `{${k}}`);
}

const SPACINGS = ['0.05', '0.1', '0.25', '0.5', 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000].map(
  (x) => R(x),
);

/**
 * Five evenly spaced estimation options around the true value. The answer is the option
 * nearest the true value, and the true value must sit within 30% of a step of it, so only
 * real estimation finds it. Returns null if no clean spacing works.
 */
export function evenOptions(
  rng: Rng,
  value: Rational,
): { answer: Rational; distractors: Rational[]; step: Rational } | null {
  if (value.cmp(R(0)) <= 0) return null;
  const target = value.div(R(6));
  const start = SPACINGS.findIndex((s) => s.cmp(target) >= 0);
  if (start < 0) return null;
  for (const step of SPACINGS.slice(Math.max(0, start - 1), start + 2)) {
    const k = value.div(step).round('whole');
    const answer = k.mul(step);
    const gap = value.sub(answer);
    const gapAbs = gap.isNegative() ? gap.neg() : gap;
    if (gapAbs.cmp(step.mul(R('0.3'))) > 0) continue;
    const maxBelow = Math.min(4, Number(k.n) - 1); // keep every option positive
    if (maxBelow < 0) continue;
    const below = rng.int(0, maxBelow);
    const opts = Array.from({ length: 5 }, (_, i) => answer.add(step.mul(R(i - below))));
    return { answer, distractors: opts.filter((o) => !o.equals(answer)), step };
  }
  return null;
}
