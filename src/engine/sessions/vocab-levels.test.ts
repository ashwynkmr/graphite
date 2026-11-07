import { describe, expect, it } from 'vitest';
import { EquivSentenceListSchema, WordListSchema, type Word } from '../../content/schema';
import { newSchedule, type Box } from '../scheduling/leitner';
import equivJson from '../../../content/equiv-sentences.json';
import wordsJson from '../../../content/words.json';
import { adaptiveLevel, CHOICES, deckSynonyms, EQUIV_CHOICES, gradeVocab, indexEquivSentences, planLevels, planVocabItems, synonymDistractors, type VocabItem } from './vocab-builder';

const deck = WordListSchema.parse(wordsJson);
const pool: ReadonlyMap<string, Word> = new Map(deck.map((w) => [w.id, w]));
const sentences = indexEquivSentences(EquivSentenceListSchema.parse(equivJson));
const ids = deck.map((w) => w.id);
const at = (level: 1 | 2 | 3) => ids.map(() => level);
const close = (a: Word, b: Word) => a.synonyms.includes(b.id) || b.synonyms.includes(a.id) || a.synonyms.some((x) => b.synonyms.includes(x));

function plan(modes: Parameters<typeof planVocabItems>[1], level: 1 | 2 | 3): VocabItem[] {
  return planVocabItems(ids, modes, pool, 7, sentences, at(level));
}

describe('levels', () => {
  it('maps each Leitner box to a level when adaptive', () => {
    const levels = ([0, 1, 2, 3, 4, 5] as Box[]).map((box) => adaptiveLevel({ ...newSchedule('x'), box }));
    expect(levels).toEqual([1, 1, 2, 2, 3, 3]);
    expect(adaptiveLevel(undefined)).toBe(1);
  });

  it('deals the chosen levels evenly, or follows each word when adaptive', () => {
    const dealt = planLevels(ids.slice(0, 30), { difficulties: [1, 3], adaptive: false }, new Map(), 5);
    expect(dealt.filter((l) => l === 1)).toHaveLength(15);
    expect(dealt.filter((l) => l === 3)).toHaveLength(15);
    expect(planLevels(['a', 'b'], { difficulties: [], adaptive: false }, new Map(), 5)).toEqual([2, 2]);
    const states = new Map([['b', { ...newSchedule('b'), box: 4 as Box }]]);
    expect(planLevels(['a', 'b'], { difficulties: [1], adaptive: true }, states, 5)).toEqual([1, 3]);
  });

  it('leaves Medium exactly as it was before levels', () => {
    const before = planVocabItems(ids.slice(0, 200), ['mcq', 'blank', 'equiv'], pool, 3, sentences);
    const medium = planVocabItems(ids.slice(0, 200), ['mcq', 'blank', 'equiv'], pool, 3, sentences, ids.slice(0, 200).map(() => 2));
    expect(medium).toEqual(before.map((it) => (it.kind === 'flashcard' ? it : { ...it, level: 2 })));
  });

  it('tags quiz cards with their level, not flashcards', () => {
    const items = planVocabItems(ids.slice(0, 20), ['flashcard', 'mcq'], pool, 3, sentences, at(3).slice(0, 20));
    for (const it of items) expect(it.level).toBe(it.kind === 'flashcard' ? undefined : 3);
  });
});

describe('Easy', () => {
  it('asks word → meaning, with wrong options from other parts of speech', () => {
    for (const it of plan(['mcq', 'blank'], 1)) {
      const w = pool.get(it.wordId)!;
      if (it.kind !== 'blank') expect(it.kind).toBe('meaning');
      expect(it.choices).toHaveLength(CHOICES);
      expect(new Set(it.choices).size).toBe(CHOICES);
      for (const c of it.choices!.filter((c) => c !== w.id)) expect(pool.get(c)!.pos).not.toBe(w.pos);
    }
  });

  it('asks sentence equivalence with the right pair among words of other parts of speech', () => {
    for (const it of plan(['equiv'], 1).filter((x) => x.kind === 'equiv')) {
      const w = pool.get(it.wordId)!;
      expect(it.choices).toHaveLength(EQUIV_CHOICES);
      expect(it.choices).toContain(it.partner);
      const wrong = it.choices!.filter((c) => c !== w.id && c !== it.partner);
      for (const c of wrong) expect(pool.get(c)!.pos).not.toBe(w.pos);
      if (w.equivalent) expect(it.sentence).toBeUndefined();
    }
  });
});

describe('Hard', () => {
  const items = plan(['mcq'], 3);

  it('asks closest in meaning whenever the word has a deck synonym, else meaning → word', () => {
    for (const it of items) expect(it.kind).toBe(deckSynonyms(pool.get(it.wordId)!, pool).length ? 'synonym' : 'word');
    expect(items.filter((it) => it.kind === 'synonym').length).toBeGreaterThan(700);
  });

  it('gives closest in meaning exactly one right answer', () => {
    for (const it of items.filter((x) => x.kind === 'synonym')) {
      const w = pool.get(it.wordId)!;
      const answer = pool.get(it.partner!)!;
      expect(answer.pos).toBe(w.pos);
      expect(close(w, answer)).toBe(true);
      expect(it.choices).toHaveLength(CHOICES);
      expect(new Set(it.choices).size).toBe(CHOICES);
      expect(it.choices).not.toContain(w.id);
      for (const c of it.choices!.filter((c) => c !== answer.id)) {
        const o = pool.get(c)!;
        expect(o.pos).toBe(w.pos);
        expect(close(o, w) || close(o, answer)).toBe(false);
      }
    }
  });

  it('tries the word’s look-alikes first', () => {
    const w = pool.get('audacious')!;
    const answer = pool.get('brazen')!;
    expect(synonymDistractors(w, answer, pool, 1).slice(0, 3)).toEqual(w.confusables.filter((c) => !close(pool.get(c)!, w) && !close(pool.get(c)!, answer)).slice(0, 3));
  });

  it('marks closest in meaning on the answer, not the word', () => {
    const it = items.find((x) => x.kind === 'synonym')!;
    const w = pool.get(it.wordId)!;
    expect(gradeVocab(it, w, it.partner!)).toBe('correct');
    expect(gradeVocab(it, w, w.id)).toBe('wrong');
    expect(gradeVocab(it, w, null)).toBe('wrong');
  });

  it('fills the blank in a fresh bank sentence, with its decoys and without the pair word', () => {
    const blanks = plan(['blank'], 3);
    const banked = blanks.filter((it) => it.sentence);
    expect(banked.length).toBeGreaterThan(250);
    const usedIds = banked.map((it) => it.sentenceId);
    expect(new Set(usedIds).size).toBe(usedIds.length);
    for (const it of banked) {
      const s = sentences.get(it.wordId)!.find((x) => x.id === it.sentenceId)!;
      const pair = s.answer.find((id) => id !== it.wordId)!;
      expect(it.sentence).toBe(s.sentence);
      expect([...it.choices!].sort()).toEqual([it.wordId, ...s.decoy, ...s.others].sort());
      expect(it.choices).not.toContain(pair);
      expect(gradeVocab(it, pool.get(it.wordId)!, it.wordId)).toBe('correct');
    }
    for (const it of blanks.filter((x) => !x.sentence)) expect(it.choices).toHaveLength(CHOICES);
  });
});
