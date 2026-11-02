import { describe, expect, it } from 'vitest';
import wordsJson from '../../../content/words.json';
import type { Word } from '../../content/schema';
import { splitExample } from './display';

describe('splitExample', () => {
  it('finds the form as a whole word, whatever its case', () => {
    expect(splitExample('Terse replies. A terser one.', 'terse')).toEqual({ before: '', word: 'Terse', after: ' replies. A terser one.' });
    expect(splitExample('He spoke laconically.', 'laconically')).toEqual({ before: 'He spoke ', word: 'laconically', after: '.' });
  });

  it('gives null when the form is missing', () => {
    expect(splitExample('Nothing here.', 'terse')).toBeNull();
  });

  it('finds the word in every example in the deck', () => {
    for (const w of wordsJson as Word[]) expect(splitExample(w.example, w.exampleForm), w.id).not.toBeNull();
  });
});
