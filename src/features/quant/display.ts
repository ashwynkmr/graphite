// How answers read on screen: commas, $ amounts with cents, fractions with a true minus, units.
import { frac, money, num } from '../../engine/generators/format';
import { Rational } from '../../engine/matching/rational';
import type { Topic } from '../../engine/generators/types';
import type { PlayableQuestion } from '../../engine/sessions/questions';

export function showValue(q: Pick<PlayableQuestion, 'unit' | 'format'>, value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const r = Rational.parse(value);
  if (!r) return value;
  const prefix = q.unit?.prefix ?? '';
  const suffix = q.unit?.suffix ? (q.unit.suffix === '%' || q.unit.suffix === '¢' ? q.unit.suffix : ` ${q.unit.suffix}`) : '';
  if (prefix === '$') return money(r) + suffix;
  const body = q.format === 'fraction' || !r.isTerminating() ? frac(r) : num(r);
  return prefix + body + suffix;
}

export const TOPIC_LABEL: Record<Topic, string> = {
  arithmetic: 'Arithmetic',
  fractions: 'Fractions',
  percents: 'Percents',
  ratios: 'Ratios',
  averages: 'Averages',
  rates: 'Rates',
  money: 'Money',
  exponents: 'Exponents',
  estimation: 'Estimation',
  numbers: 'Number properties',
  statistics: 'Statistics',
  probability: 'Probability',
  algebra: 'Algebra',
  geometry: 'Geometry',
};

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

/** [1, 2] → 'Easy + Medium'. */
export function difficultiesLabel(ds: readonly (1 | 2 | 3)[]): string {
  return [...ds].sort().map((d) => DIFFICULTY_LABEL[d]).join(' + ');
}

/** 75000 → '1:15'. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** A sprint's time on the dial: 90 → '1:30'. */
export function sprintClock(seconds: number): string {
  return clock(seconds * 1000);
}

/** A sprint's time in a sentence: 30 → '30-second', 120 → '2-minute', 90 → '1:30'. */
export function sprintName(seconds: number): string {
  if (seconds < 60) return `${seconds}-second`;
  return seconds % 60 ? sprintClock(seconds) : `${seconds / 60}-minute`;
}

/** 12_400 → '12s'; 75_000 → '1m 15s'. */
export function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
