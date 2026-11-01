import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GraphiteDB, TABLES } from './db';
import { exportAll, importAll, resetAll } from './export-import';
import { getProfile, getSettings, saveProfile, updateSettings } from './repo/meta';

let n = 0;
let a: GraphiteDB;
let b: GraphiteDB;

beforeEach(async () => {
  a = new GraphiteDB(`test-a-${++n}`);
  b = new GraphiteDB(`test-b-${n}`);
  await a.open();
  await b.open();
});

afterEach(async () => {
  await a.delete();
  await b.delete();
});

async function seed(d: GraphiteDB) {
  await saveProfile({ name: ' Ashwyn ' }, d);
  await updateSettings({ examDay: '2026-11-24', theme: 'dark' }, d);
  await d.quantAttempts.bulkAdd([
    { sessionId: 's1', questionId: 'pct-of-e-0001', topic: 'percents', difficulty: 1, day: '2026-11-01', mode: 'typed', answer: '42', correct: true, ms: 9000, flags: [] },
    { sessionId: 's1', questionId: 'ar-mul-m-0003', topic: 'arithmetic', difficulty: 2, day: '2026-11-01', mode: 'mcq', answer: null, correct: false, ms: 3000, flags: ['skipped'] },
  ]);
  await d.mistakes.add({ kind: 'quant', refId: 'ar-mul-m-0003', addedAt: 1, correctStreak: 0 });
  await d.seen.bulkAdd([{ questionId: 'pct-of-e-0001', lastSeenDay: '2026-11-01' }]);
  await d.wordStates.add({ wordId: 'laconic', box: 2, dueDay: '2026-11-02', seen: 1, correct: 1, lastResult: 'know', starred: 1, round: 1, firstSeenDay: '2026-11-01' });
}

describe('export and import', () => {
  it('round-trips every table exactly', async () => {
    await seed(a);
    const backup = await exportAll(a, 123);
    expect(backup).toMatchObject({ app: 'graphite', schemaVersion: 1, exportedAt: 123 });

    // Survives JSON, like a real file.
    const res = await importAll(JSON.parse(JSON.stringify(backup)), b);
    expect(res).toEqual({ ok: true, rows: 7 });
    for (const t of TABLES) {
      expect(await b.table(t).toArray(), t).toEqual(await a.table(t).toArray());
    }
    expect(await getProfile(b)).toEqual({ name: 'Ashwyn' });
    expect((await getSettings(b)).theme).toBe('dark');
  });

  it('replaces existing data rather than merging', async () => {
    await seed(a);
    await b.quantAttempts.add({ sessionId: 'old', questionId: 'x', topic: 'rates', difficulty: 3, day: '2026-10-30', mode: 'typed', answer: '1', correct: false, ms: 1, flags: [] });
    await importAll(await exportAll(a), b);
    expect(await b.quantAttempts.where('sessionId').equals('old').count()).toBe(0);
  });

  it('rejects files that are not Graphite backups and leaves data alone', async () => {
    await seed(b);
    expect(await importAll({ hello: 'world' }, b)).toEqual({ ok: false, error: 'This file is not a Graphite backup.' });
    expect(await importAll({ app: 'graphite', schemaVersion: 99, exportedAt: 1, tables: Object.fromEntries(TABLES.map((t) => [t, []])) }, b)).toMatchObject({ ok: false });
    expect(await b.quantAttempts.count()).toBe(2);
  });

  it('reset clears everything', async () => {
    await seed(a);
    await resetAll(a);
    for (const t of TABLES) expect(await a.table(t).count()).toBe(0);
    expect(await getProfile(a)).toBeNull();
  });
});

describe('settings', () => {
  it('fills defaults and merges updates', async () => {
    const s = await getSettings(a);
    expect(s.quant).toMatchObject({ topics: 'mixed', difficulties: [2], length: 20, answerMode: 'mix' });
    await updateSettings({ quant: { ...s.quant, topics: ['percents', 'ratios'] } }, a);
    expect((await getSettings(a)).quant.topics).toEqual(['percents', 'ratios']);
  });

  it('upgrades a saved single difficulty to the multi-select', async () => {
    await a.meta.put({ key: 'settings', value: { quant: { topics: 'mixed', difficulty: 3, length: 10, answerMode: 'typed', timer: 'untimed', secondsPerQuestion: 45 } } });
    const q = (await getSettings(a)).quant;
    expect(q.difficulties).toEqual([3]);
    expect('difficulty' in q).toBe(false);
  });
});
