import { describe, expect, it } from 'vitest';
import type { Word } from '../../content/schema';
import { newSchedule, type WordSchedule } from '../scheduling/leitner';
import { scoreVocab } from '../stats/vocab-results';
import wordsJson from '../../../content/words.json';
import { blankOutEquiv, buildPracticeQueue, choosableModes, equivAnswer, equivChoices, VOCAB_MODES, blankOut, buildVocabQueue, CHOICES, deckCounts, distractors, gradeVocab, inflected, introducedOn, planVocabItems } from './vocab-builder';

const TODAY = '2026-11-02';

function word(id: string, rank: number, extra: Partial<Word> = {}): Word {
  return {
    id,
    word: id,
    pos: 'adjective',
    meaning: `meaning of ${rank}`,
    example: `The ${id} one was there.`,
    exampleForm: id,
    synonyms: ['a', 'b'],
    confusables: [],
    tier: 1,
    rank,
    ...extra,
  };
}

const words = Array.from({ length: 12 }, (_, i) => word(`w${String.fromCharCode(97 + i)}`, i + 1));
const pool = new Map(words.map((w) => [w.id, w]));

function state(id: string, patch: Partial<WordSchedule>): [string, WordSchedule] {
  return [id, { ...newSchedule(id), ...patch }];
}

describe('buildVocabQueue', () => {
  const states = new Map([
    state('wc', { box: 2, dueDay: '2026-11-01', firstSeenDay: '2026-10-31' }),
    state('wa', { box: 1, dueDay: TODAY, firstSeenDay: '2026-11-01' }),
    state('wb', { box: 3, dueDay: '2026-11-05', firstSeenDay: '2026-10-30', starred: true }),
    state('wd', { box: 1, dueDay: '2026-11-01', firstSeenDay: TODAY, starred: true }),
  ]);

  it('puts due words first (lowest box, then most overdue), then new words in rank order', () => {
    expect(buildVocabQueue({ words, states, deck: 'today', length: 6, today: TODAY, newLeft: 200 })).toEqual(['wd', 'wa', 'wc', 'we', 'wf', 'wg']);
  });

  it('caps new words at what is left of the daily goal', () => {
    expect(buildVocabQueue({ words, states, deck: 'today', length: 20, today: TODAY, newLeft: 2 })).toEqual(['wd', 'wa', 'wc', 'we', 'wf']);
    expect(buildVocabQueue({ words, states, deck: 'new', length: 20, today: TODAY, newLeft: 0 })).toEqual([]);
  });

  it('new deck takes only unseen words; starred deck is weakest box first', () => {
    expect(buildVocabQueue({ words, states, deck: 'new', length: 3, today: TODAY, newLeft: 200 })).toEqual(['we', 'wf', 'wg']);
    expect(buildVocabQueue({ words, states, deck: 'starred', length: 10, today: TODAY, newLeft: 200 })).toEqual(['wd', 'wb']);
  });

  it('counts each deck and the words introduced today', () => {
    expect(deckCounts(words, states, TODAY, 200)).toEqual({ due: 3, fresh: 8, starred: 2 });
    expect(deckCounts(words, states, TODAY, 5)).toMatchObject({ fresh: 5 });
    expect(introducedOn(states, TODAY)).toBe(1);
  });
});

describe('multiple choice', () => {
  const target = word('wa', 1, { confusables: ['wb', 'zz-unwritten', 'wc'], pos: 'verb' });
  const verbs = new Map([...pool, ['wa', target], ['wd', word('wd', 4, { pos: 'verb' })], ['we', word('we', 5, { pos: 'verb', tier: 2 })]]);

  it('uses confusables first, then the same part of speech', () => {
    const ds = distractors(target, 'word', verbs, 7);
    expect(ds).toHaveLength(CHOICES - 1);
    expect(ds.slice(0, 3)).toEqual(['wb', 'zz-unwritten', 'wc']);
    expect(ds[3]).toBe('wd');
  });

  it('never offers a synonym, in either direction', () => {
    const quiet = word('reticent', 1, { synonyms: ['taciturn', 'reserved'] });
    const p = new Map([
      ['reticent', quiet],
      ['taciturn', word('taciturn', 2)],
      ['laconic', word('laconic', 3, { synonyms: ['reticent', 'terse'] })],
      ...words.map((x) => [x.id, x] as const),
    ]);
    for (let seed = 0; seed < 20; seed++) {
      const ds = distractors(quiet, 'blank', p, seed);
      expect(ds).not.toContain('taciturn');
      expect(ds).not.toContain('laconic');
    }
  });

  it('only offers written words when the options are meanings', () => {
    const ds = distractors(target, 'meaning', verbs, 7);
    expect(ds).not.toContain('zz-unwritten');
    expect(ds.every((id) => verbs.has(id))).toBe(true);
  });

  it('builds five shuffled choices with the answer exactly once, reproducibly', () => {
    const items = planVocabItems(['wa', 'wb', 'wc'], ['mcq', 'blank'], verbs, 42);
    for (const it of items) {
      expect(it.choices).toHaveLength(CHOICES);
      expect(new Set(it.choices).size).toBe(CHOICES);
      expect(it.choices!.filter((c) => c === it.wordId)).toHaveLength(1);
    }
    expect(planVocabItems(['wa', 'wb', 'wc'], ['mcq', 'blank'], verbs, 42)).toEqual(items);
  });

  it('asks fill-the-blank for inflected sentences too, and says so', () => {
    const past = word('enervate', 1, { example: 'The heat enervated us.', exampleForm: 'enervated' });
    expect(inflected(past)).toBe(true);
    expect(inflected(word('lucid', 2))).toBe(false);
    const p = new Map([...pool, ['enervate', past]]);
    expect(planVocabItems(['enervate'], ['blank'], p, 5)[0]!.kind).toBe('blank');
  });

  it('flashcard and type-in cards carry no choices', () => {
    expect(planVocabItems(['wa'], ['flashcard'], pool, 1)).toEqual([{ wordId: 'wa', kind: 'flashcard' }]);
    expect(planVocabItems(['wa'], ['typein'], pool, 1)).toEqual([{ wordId: 'wa', kind: 'typein' }]);
  });

  it('no longer offers type-in, and drops it from saved choices', () => {
    expect(VOCAB_MODES).toEqual(['flashcard', 'mcq', 'blank', 'equiv']);
    expect(choosableModes(['mcq', 'typein', 'blank'])).toEqual(['mcq', 'blank']);
    expect(choosableModes(['typein'])).toEqual(['flashcard']);
    expect(choosableModes([])).toEqual(['flashcard']);
  });

  describe('sentence equivalence', () => {
    const deck = wordsJson as Word[];
    const byId = new Map(deck.map((w) => [w.id, w]));
    const synonyms = (a: Word, b: Word) => a.synonyms.includes(b.id) || b.synonyms.includes(a.id);
    const paired = deck.filter((w) => w.equivalent);

    it('builds six distinct options with exactly one right pair, for every pair in the deck', () => {
      expect(paired.length).toBeGreaterThan(600);
      for (const w of paired) {
        const partner = byId.get(w.equivalent!)!;
        const choices = equivChoices(w, partner, byId, w.rank);
        expect(new Set(choices).size).toBe(6);
        expect(choices).toEqual(expect.arrayContaining([w.id, partner.id]));
        const options = choices.map((c) => byId.get(c)!);
        expect(options.every((o) => o.pos === w.pos)).toBe(true);
        const links = options.flatMap((a, i) => options.slice(i + 1).filter((b) => synonyms(a, b)));
        expect(links.length, w.id).toBeLessThanOrEqual(1);
      }
    });

    it('accepts only the exact pair, in either order', () => {
      const w = paired[0]!;
      const item = planVocabItems([w.id], ['equiv'], byId, 3)[0]!;
      expect(item.kind).toBe('equiv');
      const wrong = item.choices!.find((c) => c !== w.id && c !== w.equivalent)!;
      expect(gradeVocab(item, w, equivAnswer(w.id, w.equivalent!))).toBe('correct');
      expect(gradeVocab(item, w, equivAnswer(w.equivalent!, w.id))).toBe('correct');
      expect(gradeVocab(item, w, equivAnswer(w.id, wrong))).toBe('wrong');
      expect(gradeVocab(item, w, w.id)).toBe('wrong');
      expect(gradeVocab(item, w, null)).toBe('wrong');
    });

    it('asks a word with no partner another chosen way', () => {
      const lone = deck.find((w) => !w.equivalent)!;
      expect(planVocabItems([lone.id], ['equiv'], byId, 1)[0]!.kind).toBe('blank');
      expect(planVocabItems([lone.id], ['equiv', 'flashcard'], byId, 1)[0]!.kind).toMatch(/blank|flashcard/);
    });

    it('takes paired words first in an equivalence-only session, keeping its size', () => {
      const args = { words: deck, states: new Map(), deck: 'new' as const, length: 50, today: '2026-11-01' as never, newLeft: 200 };
      const only = buildPracticeQueue(args, ['equiv']);
      expect(only).toHaveLength(50);
      expect(only.every((id) => byId.get(id)!.equivalent)).toBe(true);
      expect(buildPracticeQueue(args, ['equiv', 'flashcard'])).toEqual(buildVocabQueue(args));
    });

    it('never lets the article give an option away', () => {
      const w = { ...paired[0]!, example: 'It was an odd idea.', exampleForm: 'odd' };
      expect(blankOutEquiv(w)).toBe('It was a(n) _____ idea.');
      expect(blankOutEquiv({ ...w, example: 'An odd idea.' })).toBe('A(n) _____ idea.');
      expect(blankOutEquiv({ ...w, example: 'Quite odd ideas.' })).toBe('Quite _____ ideas.');
    });
  });

  it('spreads the chosen practice types evenly over the session', () => {
    const ids = words.map((w) => w.id);
    const items = planVocabItems(ids, ['flashcard', 'blank'], pool, 9);
    const flash = items.filter((i) => i.kind === 'flashcard').length;
    expect(flash).toBe(6);
    expect(items.filter((i) => i.kind === 'blank')).toHaveLength(6);
    expect(new Set(items.map((i) => i.kind))).toEqual(new Set(['flashcard', 'blank']));
  });

  it('choices asks word-to-meaning or meaning-to-word, never blanks', () => {
    const kinds = new Set(planVocabItems(words.map((w) => w.id), ['mcq'], pool, 4).map((i) => i.kind));
    expect([...kinds].every((k) => k === 'meaning' || k === 'word')).toBe(true);
  });
});

describe('blankOut', () => {
  const w = word('enervate', 1, { example: 'The humid afternoon Enervated the hikers.', exampleForm: 'enervated' });
  it('blanks the word, or keeps its first letter as a hint', () => {
    expect(blankOut(w)).toBe('The humid afternoon _____ the hikers.');
    expect(blankOut(w, true)).toBe('The humid afternoon E_____ the hikers.');
  });
});

describe('gradeVocab', () => {
  const w = word('enervate', 1, { exampleForm: 'enervated' });
  it('grades flashcard marks, choices and typed words', () => {
    expect(gradeVocab({ wordId: w.id, kind: 'flashcard' }, w, 'unsure')).toBe('unsure');
    expect(gradeVocab({ wordId: w.id, kind: 'word' }, w, 'enervate')).toBe('correct');
    expect(gradeVocab({ wordId: w.id, kind: 'word' }, w, 'venerate')).toBe('wrong');
    expect(gradeVocab({ wordId: w.id, kind: 'typein' }, w, 'Enervated')).toBe('correct');
    expect(gradeVocab({ wordId: w.id, kind: 'typein' }, w, 'enervte')).toBe('slip');
    expect(gradeVocab({ wordId: w.id, kind: 'typein' }, w, 'energize')).toBe('wrong');
  });

  it('counts a skip as wrong', () => {
    expect(gradeVocab({ wordId: w.id, kind: 'typein' }, w, null)).toBe('wrong');
    expect(gradeVocab({ wordId: w.id, kind: 'meaning' }, w, null)).toBe('wrong');
  });
});

describe('scoreVocab', () => {
  it('scores quiz cards, tallies flashcard marks, and counts a requeued card once', () => {
    const r = scoreVocab(
      [
        { index: 0, wordId: 'a', grade: 'know', flashcard: true, ms: 1000, answer: 'know' },
        { index: 1, wordId: 'b', grade: 'review', flashcard: true, ms: 2000, answer: 'review' },
        { index: 2, wordId: 'c', grade: 'correct', flashcard: false, ms: 1000, answer: 'c' },
        { index: 3, wordId: 'd', grade: 'wrong', flashcard: false, ms: 1000, answer: null },
        { index: 4, wordId: 'b', grade: 'know', flashcard: true, ms: 3000, answer: 'know' },
      ],
      [false, false, false, false, true],
    );
    expect(r).toMatchObject({ total: 2, correct: 1, flashcards: 2, marks: { know: 1, unsure: 0, review: 1 }, totalMs: 8000, avgMs: 1600 });
  });
});
