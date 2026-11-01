import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import wordsJson from '../../../content/words.json';
import type { Word } from '../../content/schema';
import { planVocabItems } from '../../engine/sessions/vocab-builder';
import { GraphiteDB } from '../db';
import { DEFAULT_VOCAB } from './meta';
import { getResumable } from './quant-sessions';
import { createVocabSession, finishVocabSession, getVocabSession, loadWordStates, recordVocabAnswer, setStarred } from './vocab';

const words = wordsJson as Word[];
const byId = new Map(words.map((w) => [w.id, w]));
const NOW = new Date(2026, 10, 2, 9).getTime();
let n = 0;
let d: GraphiteDB;

beforeEach(async () => {
  d = new GraphiteDB(`vocab-${++n}`);
  await d.open();
});
afterEach(() => d.delete());

async function session(mode: 'flashcard' | 'mcq' | 'typein', ids: string[]) {
  return createVocabSession({ settings: { ...DEFAULT_VOCAB, modes: [mode] }, items: planVocabItems(ids, [mode], byId, 3), seed: 3, now: NOW }, d);
}

describe('vocab sessions on disk', () => {
  it('moves words through the boxes and logs each attempt', async () => {
    let s = await session('flashcard', ['audacious', 'malleable', 'enervate']);
    s = await recordVocabAnswer(s, byId.get('audacious')!, 'know', NOW + 1000, d);
    s = await recordVocabAnswer(s, byId.get('malleable')!, 'unsure', NOW + 2000, d);
    await recordVocabAnswer(s, byId.get('enervate')!, 'review', NOW + 3000, d);
    const states = await loadWordStates(d);
    expect(states.get('audacious')).toMatchObject({ box: 1, dueDay: '2026-11-03', firstSeenDay: '2026-11-02' });
    expect(states.get('malleable')).toMatchObject({ box: 1, dueDay: '2026-11-03' });
    expect(states.get('enervate')).toMatchObject({ box: 1, lastResult: 'review' });
    expect(await d.wordAttempts.count()).toBe(3);
    expect((await d.wordAttempts.toArray()).map((a) => a.ms)).toEqual([1000, 1000, 1000]);
  });

  it('brings a Review flashcard back once at the end, and not twice', async () => {
    let s = await session('flashcard', ['audacious', 'malleable']);
    s = await recordVocabAnswer(s, byId.get('audacious')!, 'review', NOW, d);
    expect(s.items.map((i) => [i.wordId, Boolean(i.requeued)])).toEqual([
      ['audacious', false],
      ['malleable', false],
      ['audacious', true],
    ]);
    s = await recordVocabAnswer(s, byId.get('malleable')!, 'know', NOW, d);
    s = await recordVocabAnswer(s, byId.get('audacious')!, 'review', NOW, d);
    expect(s.items).toHaveLength(3);
  });

  it('never requeues a missed quiz word, so nothing hints it was wrong', async () => {
    let s = await session('typein', ['audacious', 'malleable']);
    s = await recordVocabAnswer(s, byId.get('audacious')!, 'courageous', NOW, d);
    expect(s.items).toHaveLength(2);
    expect((await loadWordStates(d)).get('audacious')).toMatchObject({ box: 1, lastResult: 'wrong' });
  });

  it('adds missed words to the mistake log and clears them after two right answers', async () => {
    let s = await session('typein', ['audacious', 'audacious', 'audacious']);
    s = await recordVocabAnswer(s, byId.get('audacious')!, null, NOW, d);
    expect(await d.mistakes.get(['word', 'audacious'])).toMatchObject({ correctStreak: 0 });
    s = await recordVocabAnswer(s, byId.get('audacious')!, 'audacious', NOW, d);
    expect(await d.mistakes.get(['word', 'audacious'])).toMatchObject({ correctStreak: 1 });
    await recordVocabAnswer(s, byId.get('audacious')!, 'audacius', NOW, d);
    expect(await d.mistakes.get(['word', 'audacious'])).toBeUndefined();
  });

  it('scores first showings, finishes, and is offered for resume while active', async () => {
    let s = await session('mcq', ['audacious', 'malleable', 'enervate']);
    expect((await getResumable(NOW + 1000, d))?.id).toBe(s.id);
    s = await recordVocabAnswer(s, byId.get('audacious')!, 'audacious', NOW, d);
    s = await recordVocabAnswer(s, byId.get('malleable')!, null, NOW, d);
    const done = await finishVocabSession(s, byId, 'ended-early', NOW + 5000, d);
    expect(done).toMatchObject({ status: 'finished', score: { correct: 1, total: 2 } });
    expect((await getVocabSession(s.id, d))?.status).toBe('finished');
    expect(await getResumable(NOW + 6000, d)).toBeNull();
  });

  it('stars words, including ones not yet seen, without changing their box', async () => {
    await setStarred('cogent', true, d);
    expect((await loadWordStates(d)).get('cogent')).toMatchObject({ starred: true, box: 0 });
    await setStarred('cogent', false, d);
    expect((await loadWordStates(d)).get('cogent')?.starred).toBe(false);
  });
});
