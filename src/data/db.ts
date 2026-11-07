// The on-device database. One Dexie database, `graphite`. Timestamps are epoch ms;
// "day" values are local 'YYYY-MM-DD' strings so streaks follow the user's midnight.
import Dexie, { type EntityTable } from 'dexie';
import type { Day } from '../engine/dates';
import type { Difficulty, Topic } from '../engine/generators/types';
import type { Box, Grade } from '../engine/scheduling/leitner';
import type { Clock } from '../engine/sessions/clock';
import type { PlannedItem } from '../engine/sessions/quant-builder';
import type { VocabDeck, VocabItem, VocabMode } from '../engine/sessions/vocab-builder';

export const SCHEMA_VERSION = 1;

export type AnswerMode = 'typed' | 'mcq';

/** A question in a session: a bank or live-generated ref, its answer mode and shown choice order. */
export type QuantItem = PlannedItem;

export interface QuantSettings {
  topics: Topic[] | 'mixed';
  /** One or more levels, mixed together in the drill. */
  difficulties: Difficulty[];
  /** Each topic at its own level, in place of `difficulties` (0043). */
  adaptive: boolean;
  length: number;
  answerMode: 'typed' | 'mcq' | 'mix';
  timer: 'per-set' | 'sprint' | 'untimed';
  secondsPerQuestion: number;
  sprintSeconds: number;
}

/** A topic's Adaptive level changing because of this session. */
export interface LevelChange {
  topic: Topic;
  from: Difficulty;
  to: Difficulty;
}

/** What the user has entered for the current item; `null` = skipped, undefined = not reached. */
export interface ItemAnswer {
  value: string | null;
  /** Time on this item, ms, excluding paused time. */
  ms: number;
}

/** A quant drill. (Vocab sessions share the table; see VocabSessionRow.) */
export interface SessionRow {
  id: string;
  type: 'quant';
  status: 'active' | 'finished' | 'abandoned';
  day: Day;
  startedAt: number;
  finishedAt?: number;
  seed: number;
  settings: QuantSettings;
  /** Where this session came from: a normal drill, a retry of another session, or the mistake log. */
  origin: { kind: 'drill' } | { kind: 'retry'; of: string } | { kind: 'mistakes' };
  items: QuantItem[];
  answers: ItemAnswer[];
  cursor: number;
  timer: Clock;
  /** Time limit in ms for a timed set or sprint; null when untimed. */
  limitMs: number | null;
  endedBy?: 'completed' | 'timeout' | 'ended-early';
  score?: { correct: number; total: number };
  levelChanges?: LevelChange[];
}

export interface VocabSettings {
  /** One or more practice types, mixed card by card. */
  modes: VocabMode[];
  deck: VocabDeck;
  length: number;
  /** How hard quiz cards are asked: one or more levels mixed, unless adaptive. Flashcards are the same at every level. */
  difficulties: Difficulty[];
  /** Each word asked by how well it is known, instead of the chosen levels. */
  adaptive: boolean;
  /** On a session from the Round deck: the round its answers count towards. */
  round?: number;
}

/** A vocab session. Untimed; the clock only records time per card. */
export interface VocabSessionRow {
  id: string;
  type: 'vocab';
  status: 'active' | 'finished' | 'abandoned';
  day: Day;
  startedAt: number;
  finishedAt?: number;
  seed: number;
  settings: VocabSettings;
  items: VocabItem[];
  answers: ItemAnswer[];
  cursor: number;
  timer: Clock;
  endedBy?: 'completed' | 'ended-early';
  score?: { correct: number; total: number };
}

export type AnySession = SessionRow | VocabSessionRow;

export interface QuantAttemptRow {
  id?: number;
  sessionId: string;
  questionId: string;
  topic: Topic;
  difficulty: Difficulty;
  day: Day;
  mode: AnswerMode;
  answer: string | null;
  correct: boolean;
  ms: number;
  flags: ('slow' | 'careless' | 'not-reached' | 'skipped')[];
  /** Correct within the question's target time. Missing on attempts from before Adaptive. */
  underTarget?: boolean;
}

export interface WordStateRow {
  wordId: string;
  box: Box;
  dueDay: Day | null;
  seen: number;
  correct: number;
  lastResult: Grade | null;
  /** 0/1 rather than boolean, because IndexedDB can't index booleans. */
  starred: 0 | 1;
  round: number;
  firstSeenDay: Day | null;
}

export interface WordAttemptRow {
  id?: number;
  sessionId: string;
  wordId: string;
  day: Day;
  mode: 'flashcard' | 'mcq' | 'typein';
  answer: string | null;
  correct: boolean;
  slip: boolean;
  ms: number;
}

export interface MistakeRow {
  kind: 'quant' | 'word';
  /** Question id (bank id, or 'gen:<template>:<difficulty>:<seed>') or word id. */
  refId: string;
  addedAt: number;
  correctStreak: number;
}

export interface SeenRow {
  questionId: string;
  lastSeenDay: Day;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export class GraphiteDB extends Dexie {
  sessions!: EntityTable<AnySession, 'id'>;
  quantAttempts!: EntityTable<QuantAttemptRow, 'id'>;
  wordStates!: EntityTable<WordStateRow, 'wordId'>;
  wordAttempts!: EntityTable<WordAttemptRow, 'id'>;
  mistakes!: Dexie.Table<MistakeRow, [string, string]>;
  seen!: EntityTable<SeenRow, 'questionId'>;
  meta!: EntityTable<MetaRow, 'key'>;

  constructor(name = 'graphite') {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      sessions: 'id, type, status, day, startedAt',
      quantAttempts: '++id, sessionId, questionId, topic, day, [topic+difficulty]',
      wordStates: 'wordId, box, dueDay, starred, round',
      wordAttempts: '++id, sessionId, wordId, day',
      mistakes: '[kind+refId], kind, addedAt',
      seen: 'questionId, lastSeenDay',
      meta: 'key',
    });
  }
}

export const TABLES = ['sessions', 'quantAttempts', 'wordStates', 'wordAttempts', 'mistakes', 'seen', 'meta'] as const;
export type TableName = (typeof TABLES)[number];

export const db = new GraphiteDB();
