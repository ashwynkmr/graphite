// Vocab sessions and word states on disk. Every answer is one transaction across sessions,
// wordAttempts, wordStates and mistakes: all writes land or none do (TRD "Write path").
import type { Word } from '../../content/schema';
import { toDay } from '../../engine/dates';
import { applyGrade, isFailing, isPassing, newSchedule, type WordSchedule } from '../../engine/scheduling/leitner';
import { elapsed, itemMs, nextItem, pause, startClock } from '../../engine/sessions/clock';
import { mistakeChange } from '../../engine/sessions/mistakes';
import { gradeVocab, type VocabItem } from '../../engine/sessions/vocab-builder';
import { db, type GraphiteDB, type VocabSessionRow, type VocabSettings, type WordAttemptRow, type WordStateRow } from '../db';
import { newSessionId } from './quant-sessions';

function toSchedule(r: WordStateRow): WordSchedule {
  return { ...r, starred: r.starred === 1 };
}

function toRow(s: WordSchedule): WordStateRow {
  return { ...s, starred: s.starred ? 1 : 0 };
}

export async function loadWordStates(d: GraphiteDB = db): Promise<Map<string, WordSchedule>> {
  const rows = await d.wordStates.toArray();
  return new Map(rows.map((r) => [r.wordId, toSchedule(r)]));
}

export async function createVocabSession(
  args: { settings: VocabSettings; items: VocabItem[]; seed: number; now?: number },
  d: GraphiteDB = db,
): Promise<VocabSessionRow> {
  const now = args.now ?? Date.now();
  const session: VocabSessionRow = {
    id: newSessionId(),
    type: 'vocab',
    status: 'active',
    day: toDay(new Date(now)),
    startedAt: now,
    seed: args.seed,
    settings: args.settings,
    items: args.items,
    answers: [],
    cursor: 0,
    timer: startClock(now),
  };
  await d.sessions.add(session);
  return session;
}

export async function getVocabSession(id: string, d: GraphiteDB = db): Promise<VocabSessionRow | undefined> {
  const s = await d.sessions.get(id);
  return s?.type === 'vocab' ? s : undefined;
}

export async function saveVocabClock(session: VocabSessionRow, d: GraphiteDB = db): Promise<void> {
  await d.sessions.update(session.id, { timer: session.timer });
}

const ATTEMPT_MODE: Record<VocabItem['kind'], WordAttemptRow['mode']> = {
  flashcard: 'flashcard',
  typein: 'typein',
  equiv: 'mcq',
  meaning: 'mcq',
  word: 'mcq',
  blank: 'mcq',
};

/**
 * Records the answer to the current card (null = skip) and moves on. Updates the word's box,
 * logs the attempt, and adds or clears the word in the mistake log. Nothing is requeued, so a
 * session is exactly the size the user chose; missed words come back on the Leitner schedule.
 */
export async function recordVocabAnswer(
  session: VocabSessionRow,
  word: Word,
  value: string | null,
  now = Date.now(),
  d: GraphiteDB = db,
): Promise<VocabSessionRow> {
  const index = session.cursor;
  const item = session.items[index]!;
  const ms = itemMs(session.timer, now);
  const grade = gradeVocab(item, word, value);
  const answer = value && value.trim() ? value.trim() : null;
  const next: VocabSessionRow = {
    ...session,
    answers: [...session.answers, { value: answer, ms }],
    cursor: index + 1,
    timer: nextItem(session.timer, now),
  };

  await d.transaction('rw', [d.sessions, d.wordAttempts, d.wordStates, d.mistakes], async () => {
    await d.sessions.put(next);
    await d.wordAttempts.add({
      sessionId: session.id,
      wordId: word.id,
      day: session.day,
      mode: ATTEMPT_MODE[item.kind],
      answer,
      correct: isPassing(grade),
      slip: grade === 'slip',
      ms,
    });
    const stored = await d.wordStates.get(word.id);
    const { schedule } = applyGrade(stored ? toSchedule(stored) : newSchedule(word.id), grade, session.day);
    await d.wordStates.put(toRow(schedule));
    // Unsure is neither right nor wrong: the mistake log is left alone.
    if (isPassing(grade) || isFailing(grade)) {
      const existing = await d.mistakes.get(['word', word.id]);
      const change = mistakeChange(existing?.correctStreak, isPassing(grade));
      if (change.kind === 'put') await d.mistakes.put({ kind: 'word', refId: word.id, addedAt: existing?.addedAt ?? now, correctStreak: change.correctStreak });
      if (change.kind === 'remove') await d.mistakes.delete(['word', word.id]);
    }
  });
  return next;
}

/** Ends the session. Cards never reached are simply not shown: their words keep their boxes. */
export async function finishVocabSession(
  session: VocabSessionRow,
  words: ReadonlyMap<string, Word>,
  endedBy: NonNullable<VocabSessionRow['endedBy']>,
  now = Date.now(),
  d: GraphiteDB = db,
): Promise<VocabSessionRow> {
  let correct = 0;
  let total = 0;
  session.answers.forEach((a, i) => {
    const item = session.items[i]!;
    if (item.requeued) return;
    total++;
    if (isPassing(gradeVocab(item, words.get(item.wordId)!, a.value))) correct++;
  });
  const done: VocabSessionRow = {
    ...session,
    status: 'finished',
    finishedAt: now,
    endedBy,
    timer: { ...pause(session.timer, now), elapsedMs: elapsed(session.timer, now) },
    score: { correct, total },
  };
  await d.sessions.put(done);
  return done;
}

/** Stars or unstars a word (the user's own hard-words list). Works on words not yet seen. */
export async function setStarred(wordId: string, starred: boolean, d: GraphiteDB = db): Promise<void> {
  await d.transaction('rw', d.wordStates, async () => {
    const stored = await d.wordStates.get(wordId);
    const s = stored ? toSchedule(stored) : newSchedule(wordId);
    await d.wordStates.put(toRow({ ...s, starred }));
  });
}
