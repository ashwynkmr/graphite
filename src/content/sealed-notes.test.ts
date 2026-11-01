import { describe, expect, it } from 'vitest';
import published from './notes.sealed.json';
import { normalizeName, openNotes, sealNotes, type SealedNotes } from './sealed-notes';

describe('sealed notes', () => {
  it('opens for any listed name, however it is typed', async () => {
    const sealed = await sealNotes(['one', 'two'], ['Alex', 'Sam']);
    expect(await openNotes(sealed, 'Alex')).toEqual(['one', 'two']);
    expect(await openNotes(sealed, '  sam ')).toEqual(['one', 'two']);
    expect(await openNotes(sealed, 'ALEX')).toEqual(['one', 'two']);
  });

  it('stays shut for anyone else', async () => {
    const sealed = await sealNotes(['one'], ['Alex']);
    expect(await openNotes(sealed, 'Sam')).toBeNull();
    expect(await openNotes(sealed, '')).toBeNull();
  });

  it('keeps the text and names out of the published form', async () => {
    const text = JSON.stringify(await sealNotes(['a secret note'], ['Alex']));
    expect(text).not.toMatch(/secret|alex/i);
  });

  it('never opens for a common name in the file the app ships', async () => {
    for (const name of ['Test', 'Ashwyn', 'there']) expect(await openNotes(published as SealedNotes, name), name).toBeNull();
  });

  it('normalizes names', () => {
    expect(normalizeName(' ÁlEx ')).toBe('álex');
  });
});
