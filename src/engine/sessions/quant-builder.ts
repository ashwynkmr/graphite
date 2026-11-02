// Picks the questions for a drill (TRD "Quant session builder").
//  - Round-robin across the chosen topics.
//  - Never-seen questions first, then those not seen for 7+ days; nothing seen in the last 7 days.
//  - When fewer than 10% of a topic's bank is still available, generate fresh questions live.
//  - Answer mode: Typed, MCQ, or Mix (about half MCQ; estimation is always MCQ).
import { daysBetween, type Day } from '../dates';
import { COMPARE_CHOICES } from '../generators/compare';
import { finalize } from '../generators/finalize';
import { TEMPLATES } from '../generators/index';
import type { Difficulty, Topic } from '../generators/types';
import { mulberry32, type Rng } from '../rng';
import { parseRefId, type BankQuestion, type PlayableQuestion, type QuestionRef } from './questions';

export const NO_REPEAT_DAYS = 7;
export const LIVE_GENERATION_THRESHOLD = 0.1;
const LIVE_SEED_BASE = 100_000;

export type AnswerModeSetting = 'typed' | 'mcq' | 'mix';

export interface PlannedItem {
  ref: QuestionRef;
  mode: 'typed' | 'mcq';
  /** Choices in the order shown (MCQ only). */
  choices?: string[];
}

export interface QuantBuildInput {
  bank: readonly BankQuestion[];
  topics: readonly Topic[];
  /** One or more levels; the drill mixes them. */
  difficulties: readonly Difficulty[];
  /** Adaptive: one level per topic, used in place of `difficulties`. */
  levels?: Partial<Record<Topic, Difficulty>>;
  length: number;
  answerMode: AnswerModeSetting;
  today: Day;
  seed: number;
  /** questionId → last day it was shown. */
  lastSeen: ReadonlyMap<string, Day>;
}

/** Sprint times on the dial: 30 seconds to 15 minutes, in steps of 30 seconds. */
export const SPRINT_SECONDS = Array.from({ length: 30 }, (_, i) => (i + 1) * 30);
const SPRINT_QUESTIONS_PER_MINUTE = 25;

/** How many questions to line up for a sprint: more than anyone could answer in the time. */
export function sprintLength(seconds: number): number {
  return Math.ceil((seconds / 60) * SPRINT_QUESTIONS_PER_MINUTE);
}

/** Typed / MCQ for one question, and its shuffled choices. Null if it can't be served in this mode. */
export function planMode(q: Pick<PlayableQuestion, 'choices' | 'mcqOnly' | 'format'>, setting: AnswerModeSetting, rng: Rng): Omit<PlannedItem, 'ref'> | null {
  // Comparisons have no number to type, and their answers always keep the exam's order.
  if (q.format === 'compare') return { mode: 'mcq', choices: [...COMPARE_CHOICES] };
  const canMcq = Boolean(q.choices);
  let mode: 'typed' | 'mcq';
  if (q.mcqOnly) mode = 'mcq';
  else if (setting === 'typed') mode = 'typed';
  else if (setting === 'mcq') mode = 'mcq';
  else mode = canMcq && rng.chance(0.5) ? 'mcq' : 'typed';
  if (setting === 'typed' && q.mcqOnly) return null;
  if (mode === 'mcq' && !canMcq) return null;
  return mode === 'mcq' ? { mode, choices: rng.shuffle(q.choices!) } : { mode };
}

function availableFor(pool: readonly BankQuestion[], lastSeen: ReadonlyMap<string, Day>, today: Day): BankQuestion[] {
  const fresh: BankQuestion[] = [];
  const stale: { q: BankQuestion; day: Day }[] = [];
  for (const q of pool) {
    const day = lastSeen.get(q.id);
    if (!day) fresh.push(q);
    else if (daysBetween(day, today) >= NO_REPEAT_DAYS) stale.push({ q, day });
  }
  stale.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  return [...fresh, ...stale.map((s) => s.q)];
}

/** A fresh, valid question from the topic's templates, with a seed above the bank's range. */
function generateLive(topic: Topic, difficulties: readonly Difficulty[], rng: Rng, setting: AnswerModeSetting): PlannedItem | null {
  for (let tries = 0; tries < 50; tries++) {
    const difficulty = rng.pick(difficulties);
    const templates = TEMPLATES.filter((t) => t.topic === topic && t.difficulties.includes(difficulty));
    if (!templates.length) continue;
    const template = rng.pick(templates);
    const seed = LIVE_SEED_BASE + rng.int(0, 899_999);
    const res = finalize(template, difficulty, seed);
    if (!res.ok) continue;
    const plan = planMode(res.question, setting, rng);
    if (plan) return { ref: { kind: 'gen', templateId: template.id, difficulty, seed }, ...plan };
  }
  return null;
}

export function buildQuantItems(input: QuantBuildInput): PlannedItem[] {
  const rng = mulberry32(input.seed);
  const topics = rng.shuffle(input.topics);
  const queues = new Map<Topic, BankQuestion[]>();
  const generateFor = new Set<Topic>();
  const difficultiesFor = (topic: Topic): readonly Difficulty[] => {
    const level = input.levels?.[topic];
    return level ? [level] : input.difficulties;
  };
  for (const topic of topics) {
    const allowed = difficultiesFor(topic);
    const pool = input.bank.filter((q) => q.topic === topic && allowed.includes(q.difficulty));
    const available = availableFor(pool, input.lastSeen, input.today);
    // Never-seen first, in random order; then the longest-unseen.
    const fresh = available.filter((q) => !input.lastSeen.has(q.id));
    queues.set(topic, [...rng.shuffle(fresh), ...available.slice(fresh.length)]);
    if (available.length < pool.length * LIVE_GENERATION_THRESHOLD) generateFor.add(topic);
  }

  const items: PlannedItem[] = [];
  const used = new Set<string>();
  let stalled = 0;
  for (let i = 0; items.length < input.length && stalled < topics.length; i++) {
    const topic = topics[i % topics.length]!;
    let item: PlannedItem | null = null;
    if (!generateFor.has(topic)) {
      const queue = queues.get(topic)!;
      while (queue.length && !item) {
        const q = queue.shift()!;
        if (used.has(q.id)) continue;
        const plan = planMode(q, input.answerMode, rng);
        if (plan) {
          item = { ref: { kind: 'bank', id: q.id }, ...plan };
          used.add(q.id);
        }
      }
      if (!item) generateFor.add(topic);
    }
    if (!item) item = generateLive(topic, difficultiesFor(topic), rng, input.answerMode);
    if (item) {
      items.push(item);
      stalled = 0;
    } else {
      stalled++;
    }
  }
  return items;
}

/** Retry wrong ones: exactly the given items again, with choices reshuffled. */
export function rebuildItems(items: readonly PlannedItem[], seed: number): PlannedItem[] {
  const rng = mulberry32(seed);
  return items.map((it) => (it.choices && it.choices.length !== COMPARE_CHOICES.length ? { ...it, choices: rng.shuffle(it.choices) } : { ...it }));
}

/**
 * Drill my mistakes: oldest log items first, up to `length`. Mix answer modes. A logged question
 * that no longer exists (removed from the bank) is left out.
 */
export function buildMistakeItems(args: {
  mistakes: readonly { refId: string; addedAt: number }[];
  resolve: (ref: QuestionRef) => Pick<PlayableQuestion, 'choices' | 'mcqOnly' | 'format'> | null;
  length: number;
  seed: number;
}): PlannedItem[] {
  const rng = mulberry32(args.seed);
  const items: PlannedItem[] = [];
  for (const m of [...args.mistakes].sort((a, b) => a.addedAt - b.addedAt)) {
    if (items.length >= args.length) break;
    const ref = parseRefId(m.refId);
    const q = args.resolve(ref);
    const plan = q && planMode(q, 'mix', rng);
    if (plan) items.push({ ref, ...plan });
  }
  return items;
}
