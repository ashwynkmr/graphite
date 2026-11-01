import { describe, expect, it } from 'vitest';
import bankJson from '../../../content/questions.json';
import { addDays } from '../dates';
import { elapsed, itemMs, nextItem, pause, remaining, resume, startClock } from './clock';
import { mistakeChange } from './mistakes';
import { buildQuantItems, NO_REPEAT_DAYS, rebuildItems, type QuantBuildInput } from './quant-builder';
import { parseRefId, refId, resolveQuestion, type BankQuestion } from './questions';

const bank = bankJson as unknown as BankQuestion[];
const bankById = new Map(bank.map((q) => [q.id, q]));
const TODAY = '2026-11-10';

const input = (over: Partial<QuantBuildInput> = {}): QuantBuildInput => ({
  bank,
  topics: ['percents', 'ratios', 'rates'],
  difficulties: [2],
  length: 20,
  answerMode: 'mix',
  today: TODAY,
  seed: 42,
  lastSeen: new Map(),
  ...over,
});

describe('buildQuantItems', () => {
  it('builds the requested length, round-robin across topics, with no duplicates', () => {
    const items = buildQuantItems(input());
    expect(items).toHaveLength(20);
    const ids = items.map((i) => refId(i.ref));
    expect(new Set(ids).size).toBe(20);
    const topics = items.map((i) => resolveQuestion(i.ref, bankById)!.topic);
    expect(new Set(topics.slice(0, 3)).size).toBe(3);
    for (const q of items.map((i) => resolveQuestion(i.ref, bankById)!)) expect(q.difficulty).toBe(2);
  });

  it('mixes several difficulties when more than one is chosen', () => {
    const items = buildQuantItems(input({ difficulties: [1, 2], length: 30 }));
    const levels = new Set(items.map((i) => resolveQuestion(i.ref, bankById)!.difficulty));
    expect([...levels].sort()).toEqual([1, 2]);
  });

  it('is deterministic for a seed', () => {
    expect(buildQuantItems(input())).toEqual(buildQuantItems(input()));
    expect(buildQuantItems(input({ seed: 43 }))).not.toEqual(buildQuantItems(input()));
  });

  it('never repeats a question seen in the last 7 days', () => {
    const lastSeen = new Map<string, string>();
    for (const q of bank) if (q.topic === 'percents' && q.difficulty === 2) lastSeen.set(q.id, addDays(TODAY, -(NO_REPEAT_DAYS - 1)));
    const items = buildQuantItems(input({ topics: ['percents'], lastSeen, length: 10 }));
    expect(items).toHaveLength(10);
    // Every percents question was seen 6 days ago, so all must be live-generated.
    expect(items.every((i) => i.ref.kind === 'gen')).toBe(true);
  });

  it('prefers never-seen questions, then the longest-unseen', () => {
    const pool = bank.filter((q) => q.topic === 'ratios' && q.difficulty === 2);
    const lastSeen = new Map<string, string>();
    pool.slice(0, pool.length - 3).forEach((q, i) => lastSeen.set(q.id, addDays(TODAY, -(NO_REPEAT_DAYS + (i % 5)))));
    const items = buildQuantItems(input({ topics: ['ratios'], lastSeen, length: 5 }));
    const fresh = items.slice(0, 3).map((i) => refId(i.ref));
    expect(fresh.every((id) => !lastSeen.has(id))).toBe(true);
  });

  it('respects the answer mode', () => {
    const typed = buildQuantItems(input({ answerMode: 'typed', topics: ['arithmetic', 'estimation'] }));
    expect(typed.every((i) => i.mode === 'typed' && !i.choices)).toBe(true);
    expect(typed.map((i) => resolveQuestion(i.ref, bankById)!).some((q) => q.mcqOnly)).toBe(false);
    const mcq = buildQuantItems(input({ answerMode: 'mcq' }));
    expect(mcq.every((i) => i.mode === 'mcq' && i.choices?.length === 5)).toBe(true);
  });

  it('Mix is about half multiple choice, and estimation is always multiple choice', () => {
    const items = buildQuantItems(input({ topics: ['arithmetic', 'percents', 'money', 'estimation'], length: 40 }));
    const mcqShare = items.filter((i) => i.mode === 'mcq').length / items.length;
    expect(mcqShare).toBeGreaterThan(0.35);
    expect(mcqShare).toBeLessThan(0.8);
    for (const i of items) if (resolveQuestion(i.ref, bankById)!.topic === 'estimation') expect(i.mode).toBe('mcq');
  });

  it('shown choices are a shuffle of the question choices', () => {
    for (const i of buildQuantItems(input({ answerMode: 'mcq' }))) {
      const q = resolveQuestion(i.ref, bankById)!;
      expect([...i.choices!].sort()).toEqual([...q.choices!].sort());
    }
  });

  it('retry rebuilds exactly the given items', () => {
    const items = buildQuantItems(input()).slice(0, 4);
    const retry = rebuildItems(items, 7);
    expect(retry.map((i) => refId(i.ref))).toEqual(items.map((i) => refId(i.ref)));
  });
});

describe('question refs', () => {
  it('round-trips generated refs and rebuilds them exactly', () => {
    const ref = { kind: 'gen' as const, templateId: 'pct-of', difficulty: 2 as const, seed: 123456 };
    expect(parseRefId(refId(ref))).toEqual(ref);
    expect(resolveQuestion(ref, bankById)).toEqual(resolveQuestion(ref, bankById));
    expect(parseRefId('pct-of-m-0001')).toEqual({ kind: 'bank', id: 'pct-of-m-0001' });
  });
});

describe('clock', () => {
  it('counts active time and pauses while hidden', () => {
    let c = startClock(1000);
    expect(elapsed(c, 6000)).toBe(5000);
    c = pause(c, 6000);
    expect(elapsed(c, 60_000)).toBe(5000); // phone locked for a minute
    c = resume(c, 60_000);
    expect(elapsed(c, 62_000)).toBe(7000);
    c = nextItem(c, 62_000);
    expect(itemMs(c, 65_000)).toBe(3000);
    expect(remaining(c, 10_000, 65_000)).toBe(0);
    expect(remaining(c, 20_000, 65_000)).toBe(10_000);
  });

  it('pause and resume are idempotent', () => {
    const c = pause(pause(startClock(0), 10), 50);
    expect(c.elapsedMs).toBe(10);
    expect(resume(resume(c, 100), 200).activeSince).toBe(100);
  });
});

describe('mistake log', () => {
  it('adds misses, clears after two correct in a row, resets on a miss', () => {
    expect(mistakeChange(undefined, false)).toEqual({ kind: 'put', correctStreak: 0 });
    expect(mistakeChange(undefined, true)).toEqual({ kind: 'none' });
    expect(mistakeChange(0, true)).toEqual({ kind: 'put', correctStreak: 1 });
    expect(mistakeChange(1, true)).toEqual({ kind: 'remove' });
    expect(mistakeChange(1, false)).toEqual({ kind: 'put', correctStreak: 0 });
  });
});
