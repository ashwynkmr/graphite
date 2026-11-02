import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import bankJson from '../../../content/questions.json';
import { buildQuantItems } from '../../engine/sessions/quant-builder';
import { refId, resolveQuestion, type BankQuestion } from '../../engine/sessions/questions';
import { GraphiteDB } from '../db';
import { DEFAULT_QUANT, getAdaptiveLevels, getVocabRound, setAdaptiveLevels, setVocabRound } from './meta';
import { resetProgress } from '../export-import';
import { createQuantSession, finishSession, getResumable, getSession, recordAnswer, STALE_AFTER_MS } from './quant-sessions';

const bank = bankJson as unknown as BankQuestion[];
const byId = new Map(bank.map((q) => [q.id, q]));
let n = 0;
let d: GraphiteDB;

beforeEach(async () => {
  d = new GraphiteDB(`sessions-${++n}`);
  await d.open();
});
afterEach(() => d.delete());

async function newSession(length = 4, now = 1_000_000) {
  const items = buildQuantItems({ bank, topics: ['percents'], difficulties: [1], length, answerMode: 'typed', today: '2026-11-01', seed: 1, lastSeen: new Map() });
  const s = await createQuantSession({ settings: { ...DEFAULT_QUANT, length }, items, origin: { kind: 'drill' }, seed: 1, now }, d);
  return { s, questions: items.map((i) => resolveQuestion(i.ref, byId)!) };
}

describe('quant sessions on disk', () => {
  it('autosaves after every answer and resumes where it left off', async () => {
    const { s, questions } = await newSession();
    const after1 = await recordAnswer(s, questions[0]!, questions[0]!.answer, 1_010_000, d);
    // Simulate a reload: read it back fresh.
    const reloaded = (await getSession(s.id, d))!;
    expect(reloaded.cursor).toBe(1);
    expect(reloaded.answers[0]).toEqual({ value: questions[0]!.answer, ms: 10_000 });
    expect(after1.timer.itemStartedAtMs).toBe(10_000);
    expect(await d.quantAttempts.count()).toBe(1);
    expect(await d.seen.get(refId(s.items[0]!.ref))).toBeTruthy();
  });

  it('logs wrong and skipped answers to the mistake log and clears after two correct', async () => {
    const { s, questions } = await newSession();
    let cur = await recordAnswer(s, questions[0]!, '999999', 1_005_000, d);
    cur = await recordAnswer(cur, questions[1]!, null, 1_006_000, d);
    expect(await d.mistakes.count()).toBe(2);
    const id = refId(s.items[0]!.ref);
    expect((await d.mistakes.get(['quant', id]))!.correctStreak).toBe(0);
    expect(cur.answers[1]!.value).toBeNull();
  });

  it('finishing marks the rest not reached, logs them as mistakes, and stores the score', async () => {
    const { s, questions } = await newSession(4);
    const cur = await recordAnswer(s, questions[0]!, questions[0]!.answer, 1_005_000, d);
    const done = await finishSession(cur, questions, 'timeout', 1_200_000, d);
    expect(done).toMatchObject({ status: 'finished', endedBy: 'timeout', score: { correct: 1, total: 4 } });
    const attempts = await d.quantAttempts.toArray();
    expect(attempts.filter((a) => a.flags.includes('not-reached'))).toHaveLength(3);
    expect(await d.mistakes.count()).toBe(3);
    // Not-reached questions don't count as seen.
    expect(await d.seen.count()).toBe(1);
  });

  it('offers the newest active session to resume and abandons ones older than 24 hours', async () => {
    const old = await newSession(4, 0);
    const fresh = await newSession(4, STALE_AFTER_MS);
    const resumable = await getResumable(STALE_AFTER_MS + 1000, d);
    expect(resumable!.id).toBe(fresh.s.id);
    expect((await getSession(old.s.id, d))!.status).toBe('abandoned');
  });
});

describe('sprints', () => {
  async function sprint(answered: number) {
    const items = buildQuantItems({ bank, topics: ['percents'], difficulties: [1], length: 50, answerMode: 'typed', today: '2026-11-10', seed: 3, lastSeen: new Map() });
    const questions = items.map((i) => resolveQuestion(i.ref, byId)!);
    let s = await createQuantSession({ settings: { ...DEFAULT_QUANT, timer: 'sprint', sprintMinutes: 2 }, items, origin: { kind: 'drill' }, seed: 3, now: 1000 }, d);
    for (let i = 0; i < answered; i++) s = await recordAnswer(s, questions[i]!, questions[i]!.answer, 2000 + i, d);
    return { s, questions };
  }

  it('runs on a clock of its chosen minutes', async () => {
    const { s } = await sprint(0);
    expect(s.limitMs).toBe(120_000);
  });

  it('counts only what was answered, and logs nothing for the questions never reached', async () => {
    const { s, questions } = await sprint(3);
    const done = await finishSession(s, questions, 'timeout', 5000, d);
    expect(done.score).toEqual({ correct: 3, total: 3 });
    expect(done.items).toHaveLength(3);
    expect(await d.quantAttempts.count()).toBe(3);
    expect(await d.mistakes.count()).toBe(0);
    expect(await d.seen.count()).toBe(3);
  });

  it('finishes cleanly with nothing answered', async () => {
    const { s, questions } = await sprint(0);
    const done = await finishSession(s, questions, 'timeout', 5000, d);
    expect(done.score).toEqual({ correct: 0, total: 0 });
    expect(await d.mistakes.count()).toBe(0);
  });
});

describe('Adaptive levels', () => {
  /** A finished drill on one topic, answering `right` correctly and quickly and the rest wrongly. */
  async function drill(length: number, right: number, over: { adaptive?: boolean; origin?: 'drill' | 'retry'; level?: 1 | 2 | 3 } = {}) {
    const level = over.level ?? 2;
    const items = buildQuantItems({ bank, topics: ['percents'], difficulties: [level], length, answerMode: 'typed', today: '2026-11-10', seed: ++n, lastSeen: new Map() });
    const questions = items.map((i) => resolveQuestion(i.ref, byId)!);
    let s = await createQuantSession(
      { settings: { ...DEFAULT_QUANT, adaptive: over.adaptive ?? true, length }, items, origin: over.origin === 'retry' ? { kind: 'retry', of: 'x' } : { kind: 'drill' }, seed: 1, now: 1000 },
      d,
    );
    for (let i = 0; i < length; i++) s = await recordAnswer(s, questions[i]!, i < right ? questions[i]!.answer : '9999', 1000 + i, d);
    return finishSession(s, questions, 'completed', 90_000, d);
  }

  it('moves a topic up after 8 of 10 quick and correct, and says so on the session', async () => {
    const done = await drill(10, 8);
    expect(done.levelChanges).toEqual([{ topic: 'percents', from: 2, to: 3 }]);
    expect((await getSession(done.id, d))!.levelChanges).toEqual(done.levelChanges);
    expect((await getAdaptiveLevels(d)).percents?.level).toBe(3);
  });

  it('moves a topic down after 5 of 10 wrong', async () => {
    await drill(10, 5);
    expect((await getAdaptiveLevels(d)).percents?.level).toBe(1);
  });

  it('adds up answers across drills, but holds until there are enough', async () => {
    expect((await drill(4, 4)).levelChanges).toBeUndefined();
    expect((await drill(4, 4)).levelChanges).toEqual([{ topic: 'percents', from: 2, to: 3 }]);
  });

  it('starts counting again after a move, so one good drill can’t jump two levels', async () => {
    await setAdaptiveLevels({ percents: { level: 1, sinceAttemptId: 0 } }, d);
    await drill(10, 10, { level: 1 });
    expect((await getAdaptiveLevels(d)).percents?.level).toBe(2);
    expect((await drill(2, 2, { level: 2 })).levelChanges).toBeUndefined();
    expect((await getAdaptiveLevels(d)).percents?.level).toBe(2);
  });

  it('ignores retries and drills not played on Adaptive', async () => {
    await drill(10, 10, { adaptive: false });
    await drill(10, 10, { origin: 'retry' });
    expect(await getAdaptiveLevels(d)).toEqual({});
    expect((await drill(4, 4)).levelChanges).toBeUndefined();
  });

  it('Reset progress clears the levels and the vocab round', async () => {
    await drill(10, 8);
    await setVocabRound(3, d);
    await resetProgress(d);
    expect(await getAdaptiveLevels(d)).toEqual({});
    expect(await getVocabRound(d)).toBe(1);
  });
});
