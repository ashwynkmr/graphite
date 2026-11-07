import { describe, expect, it } from 'vitest';
import published from './notes.sealed.json';
import { normalizeName, openNotes, openNoteSets, sealNotes, type NoteSet, type SealedNotes } from './sealed-notes';

const set = (from: string, ...notes: string[]): NoteSet => ({ from, notes });

describe('sealed notes', () => {
  it('opens for any listed name, however it is typed', async () => {
    const sealed = await sealNotes(set('Pat', 'one', 'two'), ['Alex', 'Sam']);
    expect(await openNotes(sealed, 'Alex')).toEqual(set('Pat', 'one', 'two'));
    expect(await openNotes(sealed, '  sam ')).toEqual(set('Pat', 'one', 'two'));
    expect(await openNotes(sealed, 'ALEX')).toEqual(set('Pat', 'one', 'two'));
  });

  it('stays shut for anyone else', async () => {
    const sealed = await sealNotes(set('Pat', 'one'), ['Alex']);
    expect(await openNotes(sealed, 'Sam')).toBeNull();
    expect(await openNotes(sealed, '')).toBeNull();
  });

  it('gives each name its own notes and sender', async () => {
    const sets = [await sealNotes(set('Pat', 'for alex'), ['Alex']), await sealNotes(set('Alex', 'for pat'), ['Pat'])];
    expect(await openNoteSets(sets, 'alex')).toEqual(set('Pat', 'for alex'));
    expect(await openNoteSets(sets, 'Pat')).toEqual(set('Alex', 'for pat'));
    expect(await openNoteSets(sets, 'Sam')).toBeNull();
  });

  it('keeps the text, the sender and the names out of the published form', async () => {
    const text = JSON.stringify(await sealNotes(set('Pat', 'a secret note'), ['Alex']));
    expect(text).not.toMatch(/secret|alex|pat\b/i);
  });

  it('never opens for a common name in the file the app ships', async () => {
    for (const name of ['Test', 'Ashwyn', 'there']) expect(await openNoteSets(published as SealedNotes[], name), name).toBeNull();
  });

  it('normalizes names', () => {
    expect(normalizeName(' ÁlEx ')).toBe('álex');
  });
});
