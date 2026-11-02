import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startClock } from '../../engine/sessions/clock';
import { GraphiteDB, type QuantAttemptRow, type SessionRow } from '../db';
import { DEFAULT_QUANT } from './meta';
import { loadMistakeLog } from './mistakes';
import { loadHome, loadProgress, loadResultsNudge } from './stats';

const TODAY = '2026-11-10';
let n = 0;
let d: GraphiteDB;

beforeEach(async () => {
  d = new GraphiteDB(`stats-${++n}`);
  await d.open();
});
afterEach(() => d.delete());

function session(id: string, day: string, over: Partial<SessionRow> = {}): SessionRow {
  return {
    id,
    type: 'quant',
    status: 'finished',
    day,
    startedAt: 1,
    finishedAt: 2,
    seed: 1,
    settings: DEFAULT_QUANT,
    origin: { kind: 'drill' },
    items: [],
    answers: [{ value: '1', ms: 1000 }],
    cursor: 1,
    timer: startClock(1),
    limitMs: null,
    ...over,
  };
}

function attempt(sessionId: string, correct: boolean, over: Partial<QuantAttemptRow> = {}): QuantAttemptRow {
  return { sessionId, questionId: 'q', topic: 'fractions', difficulty: 2, day: TODAY, mode: 'typed', answer: '1', correct, ms: 1000, flags: [], ...over };
}

describe('loadHome', () => {
  it('starts empty', async () => {
    const home = await loadHome(TODAY, 10, d);
    expect(home).toMatchObject({ nudge: null, last: null, hasProgress: false, streak: { current: 0 } });
    expect(home.plan.quant).toEqual({ done: 0, goal: 100 });
  });

  it('counts a day only for a session with answers, and picks the latest as the last session', async () => {
    await d.sessions.bulkAdd([
      session('old', '2026-11-09', { finishedAt: 5 }),
      session('new', TODAY, { finishedAt: 9 }),
      session('empty', '2026-11-08', { finishedAt: 20, answers: [] }),
      session('live', TODAY, { status: 'active', finishedAt: undefined }),
    ]);
    const home = await loadHome(TODAY, 10, d);
    expect(home.streak).toEqual({ current: 2, best: 2, studyDays: 2 });
    expect(home.last?.id).toBe('new');
  });

  it('counts today’s answered questions, leaving out the never reached and other days', async () => {
    await d.quantAttempts.bulkAdd([attempt('s', true), attempt('s', false, { flags: ['skipped'] }), attempt('s', false, { flags: ['not-reached'] }), attempt('s', true, { day: '2026-11-09' })]);
    expect((await loadHome(TODAY, 10, d)).plan.quant.done).toBe(2);
  });

  it('bases the weak-topic nudge on normal drills only', async () => {
    await d.sessions.bulkAdd([session('retry', TODAY, { origin: { kind: 'retry', of: 'x' } }), session('drill', TODAY, { origin: { kind: 'drill' } })]);
    await d.quantAttempts.bulkAdd(Array.from({ length: 10 }, () => attempt('retry', false)));
    expect((await loadHome(TODAY, 10, d)).nudge).toBeNull();
    await d.quantAttempts.bulkAdd(Array.from({ length: 10 }, () => attempt('drill', false)));
    expect((await loadHome(TODAY, 10, d)).nudge).toEqual({ kind: 'weak', topic: 'fractions', accuracy: 0 });
  });

  it('suggests due words', async () => {
    await d.wordStates.add({ wordId: 'laconic', box: 2, dueDay: TODAY, seen: 1, correct: 1, lastResult: 'know', starred: 0, round: 1, firstSeenDay: '2026-11-08' });
    const home = await loadHome(TODAY, 10, d);
    expect(home.nudge).toEqual({ kind: 'due', count: 1 });
    expect(home.plan.due).toEqual({ done: 0, goal: 1 });
  });
});

describe('loadProgress', () => {
  it('adds up totals across sessions', async () => {
    await d.sessions.add(session('s', TODAY));
    await d.quantAttempts.bulkAdd([attempt('s', true), attempt('s', false)]);
    await d.wordStates.add({ wordId: 'laconic', box: 3, dueDay: TODAY, seen: 3, correct: 3, lastResult: 'know', starred: 0, round: 1, firstSeenDay: '2026-11-08' });
    expect(await loadProgress(TODAY, d)).toMatchObject({
      streak: { current: 1, best: 1, studyDays: 1 },
      sessions: 1,
      quant: { answered: 2, correct: 1, averageMs: 1000 },
      words: { seen: 1, known: 1 },
    });
  });
});

describe('loadMistakeLog', () => {
  it('lists oldest first with each item’s latest wrong answer', async () => {
    await d.mistakes.bulkAdd([
      { kind: 'quant', refId: 'b', addedAt: 20, correctStreak: 0 },
      { kind: 'quant', refId: 'a', addedAt: 10, correctStreak: 1 },
      { kind: 'word', refId: 'laconic', addedAt: 5, correctStreak: 0 },
    ]);
    await d.quantAttempts.bulkAdd([attempt('s', false, { questionId: 'a', answer: 'first' }), attempt('s', false, { questionId: 'a', answer: 'second' }), attempt('s', true, { questionId: 'a', answer: 'right' })]);
    await d.wordAttempts.add({ sessionId: 's', wordId: 'laconic', day: TODAY, mode: 'flashcard', answer: 'review', correct: false, slip: false, ms: 1 });
    const log = await loadMistakeLog(d);
    expect(log.quant.map((q) => q.row.refId)).toEqual(['a', 'b']);
    expect(log.quant[0]!.miss?.answer).toBe('second');
    expect(log.quant[1]!.miss).toBeUndefined();
    expect(log.words[0]!.miss?.answer).toBe('review');
  });
});

describe('loadResultsNudge', () => {
  it('puts a paused session ahead of everything else', async () => {
    await d.sessions.add(session('paused', TODAY, { status: 'active', startedAt: Date.now(), cursor: 3 }));
    const { paused, nudge } = await loadResultsNudge(TODAY, 12, d);
    expect(paused?.id).toBe('paused');
    expect(nudge).toBeNull();
  });

  it('otherwise gives the usual suggestion, and never the evening prompt after studying', async () => {
    await d.sessions.add(session('done', TODAY));
    expect(await loadResultsNudge(TODAY, 20, d)).toEqual({ paused: null, nudge: null });
    await d.wordStates.add({ wordId: 'laconic', box: 1, dueDay: TODAY, seen: 1, correct: 0, lastResult: 'review', starred: 0, round: 1, firstSeenDay: TODAY });
    expect((await loadResultsNudge(TODAY, 20, d)).nudge).toEqual({ kind: 'due', count: 1 });
  });
});
