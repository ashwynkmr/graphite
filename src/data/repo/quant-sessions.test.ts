import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import bankJson from '../../../content/questions.json';
import { buildQuantItems } from '../../engine/sessions/quant-builder';
import { refId, resolveQuestion, type BankQuestion } from '../../engine/sessions/questions';
import { GraphiteDB } from '../db';
import { DEFAULT_QUANT } from './meta';
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
