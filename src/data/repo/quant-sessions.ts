// Quant sessions on disk. Every answer is one transaction across sessions, quantAttempts,
// seen and mistakes: all writes land or none do (TRD "Write path").
import { toDay } from '../../engine/dates';
import { elapsed, itemMs, nextItem, pause, startClock } from '../../engine/sessions/clock';
import { mistakeChange } from '../../engine/sessions/mistakes';
import type { PlannedItem } from '../../engine/sessions/quant-builder';
import { refId, type PlayableQuestion } from '../../engine/sessions/questions';
import { nextLevel, START_LEVEL } from '../../engine/sessions/adaptive';
import { flagsFor, statusOf } from '../../engine/stats/quant-results';
import { db, type AnySession, type GraphiteDB, type LevelChange, type QuantAttemptRow, type QuantSettings, type SessionRow } from '../db';
import { getAdaptiveLevels, setAdaptiveLevels } from './meta';

export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function newSessionId(): string {
  return crypto.randomUUID();
}

function limitFor(settings: QuantSettings, items: number): number | null {
  if (settings.timer === 'sprint') return settings.sprintMinutes * 60_000;
  return settings.timer === 'per-set' ? settings.secondsPerQuestion * items * 1000 : null;
}

export async function createQuantSession(
  args: { settings: QuantSettings; items: PlannedItem[]; origin: SessionRow['origin']; seed: number; now?: number },
  d: GraphiteDB = db,
): Promise<SessionRow> {
  const now = args.now ?? Date.now();
  const session: SessionRow = {
    id: newSessionId(),
    type: 'quant',
    status: 'active',
    day: toDay(new Date(now)),
    startedAt: now,
    seed: args.seed,
    settings: args.settings,
    origin: args.origin,
    items: args.items,
    answers: [],
    cursor: 0,
    timer: startClock(now),
    limitMs: limitFor(args.settings, args.items.length),
  };
  await d.sessions.add(session);
  return session;
}

export async function getSession(id: string, d: GraphiteDB = db): Promise<SessionRow | undefined> {
  const s = await d.sessions.get(id);
  return s?.type === 'quant' ? s : undefined;
}

/** The session (quant or vocab) to offer on Home, if any. Sessions older than 24 hours are abandoned first. */
export async function getResumable(now = Date.now(), d: GraphiteDB = db): Promise<AnySession | null> {
  const active = await d.sessions.where('status').equals('active').toArray();
  let newest: AnySession | null = null;
  for (const s of active) {
    if (now - s.startedAt > STALE_AFTER_MS) await d.sessions.update(s.id, { status: 'abandoned' });
    else if (!newest || s.startedAt > newest.startedAt) newest = s;
  }
  return newest;
}

export async function discardSession(id: string, d: GraphiteDB = db): Promise<void> {
  await d.sessions.update(id, { status: 'abandoned' });
}

/** Persists clock changes (pause on hide). */
export async function saveClock(session: SessionRow, d: GraphiteDB = db): Promise<void> {
  await d.sessions.update(session.id, { timer: session.timer });
}

async function logAttempt(
  d: GraphiteDB,
  session: SessionRow,
  index: number,
  question: PlayableQuestion,
  answer: string | null | undefined,
  ms: number,
): Promise<void> {
  const status = statusOf(question, answer);
  const flags: QuantAttemptRow['flags'] = [...flagsFor(status, ms, question.targetSec)];
  if (status === 'skipped') flags.push('skipped');
  if (status === 'not-reached') flags.push('not-reached');
  const id = refId(session.items[index]!.ref);
  const correct = status === 'correct';
  await d.quantAttempts.add({
    sessionId: session.id,
    questionId: id,
    topic: question.topic,
    difficulty: question.difficulty,
    day: session.day,
    mode: session.items[index]!.mode,
    answer: answer ?? null,
    correct,
    ms,
    flags,
    underTarget: correct && ms < question.targetSec * 1000,
  });
  if (status !== 'not-reached') await d.seen.put({ questionId: id, lastSeenDay: session.day });
  const existing = await d.mistakes.get(['quant', id]);
  const change = mistakeChange(existing?.correctStreak, correct);
  if (change.kind === 'put') await d.mistakes.put({ kind: 'quant', refId: id, addedAt: existing?.addedAt ?? Date.now(), correctStreak: change.correctStreak });
  if (change.kind === 'remove') await d.mistakes.delete(['quant', id]);
}

/** Records the answer to the current item (null = skip) and moves on. Returns the updated session. */
export async function recordAnswer(
  session: SessionRow,
  question: PlayableQuestion,
  value: string | null,
  now = Date.now(),
  d: GraphiteDB = db,
): Promise<SessionRow> {
  const index = session.cursor;
  const ms = itemMs(session.timer, now);
  const next: SessionRow = {
    ...session,
    answers: [...session.answers, { value: value && value.trim() ? value : null, ms }],
    cursor: index + 1,
    timer: nextItem(session.timer, now),
  };
  await d.transaction('rw', [d.sessions, d.quantAttempts, d.seen, d.mistakes], async () => {
    await d.sessions.put(next);
    await logAttempt(d, next, index, question, next.answers[index]!.value, ms);
  });
  return next;
}

/** After an Adaptive drill: moves each of its topics by that topic's answers in Adaptive drills at its current level. */
async function moveLevels(d: GraphiteDB, session: SessionRow): Promise<LevelChange[]> {
  const levels = await getAdaptiveLevels(d);
  const adaptiveIds = new Set(
    (await d.sessions.where('type').equals('quant').toArray()).filter((s) => s.type === 'quant' && s.settings.adaptive && s.origin.kind === 'drill').map((s) => s.id),
  );
  const played = await d.quantAttempts.where('sessionId').equals(session.id).toArray();
  const changes: LevelChange[] = [];
  for (const topic of new Set(played.map((a) => a.topic))) {
    const current = levels[topic] ?? { level: START_LEVEL, sinceAttemptId: 0 };
    const rows = (await d.quantAttempts.where('topic').equals(topic).sortBy('id')).filter(
      (a) => adaptiveIds.has(a.sessionId) && a.id! > current.sinceAttemptId && a.difficulty === current.level && !a.flags.includes('not-reached'),
    );
    const level = nextLevel(
      current.level,
      rows.map((a) => ({ correct: a.correct, underTarget: a.underTarget === true })),
    );
    if (level !== current.level) {
      // Answers at the old level say nothing about this one.
      levels[topic] = { level, sinceAttemptId: rows[rows.length - 1]!.id! };
      changes.push({ topic, from: current.level, to: level });
    }
  }
  if (changes.length) await setAdaptiveLevels(levels, d);
  return changes;
}

/**
 * Ends the session: items never answered are logged as not reached (and go to the mistake log),
 * the score is stored, and the clock stops. A sprint counts only what was answered: its other
 * questions were never meant to be reached.
 */
export async function finishSession(
  session: SessionRow,
  questions: PlayableQuestion[],
  endedBy: NonNullable<SessionRow['endedBy']>,
  now = Date.now(),
  d: GraphiteDB = db,
): Promise<SessionRow> {
  const correct = session.answers.filter((a, i) => statusOf(questions[i]!, a.value) === 'correct').length;
  const items = session.settings.timer === 'sprint' ? session.items.slice(0, session.answers.length) : session.items;
  const done: SessionRow = {
    ...session,
    items,
    status: 'finished',
    finishedAt: now,
    endedBy,
    timer: { ...pause(session.timer, now), elapsedMs: elapsed(session.timer, now) },
    score: { correct, total: items.length },
  };
  await d.transaction('rw', [d.sessions, d.quantAttempts, d.seen, d.mistakes, d.meta], async () => {
    await d.sessions.put(done);
    for (let i = session.answers.length; i < items.length; i++) {
      await logAttempt(d, done, i, questions[i]!, undefined, 0);
    }
    if (done.settings.adaptive && done.origin.kind === 'drill') {
      const changes = await moveLevels(d, done);
      if (changes.length) {
        done.levelChanges = changes;
        await d.sessions.put(done);
      }
    }
  });
  return done;
}

/** Last day each question was shown, for the 7-day no-repeat rule. */
export async function lastSeenMap(d: GraphiteDB = db): Promise<Map<string, string>> {
  const rows = await d.seen.toArray();
  return new Map(rows.map((r) => [r.questionId, r.lastSeenDay]));
}

export async function finishedSessions(d: GraphiteDB = db): Promise<SessionRow[]> {
  const rows = await d.sessions.where('status').equals('finished').toArray();
  return rows.filter((s): s is SessionRow => s.type === 'quant');
}
