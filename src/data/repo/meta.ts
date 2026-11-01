// Settings, profile and bookkeeping, stored as key/value rows in `meta`.
import { DEFAULT_EXAM_DAY, type Day } from '../../engine/dates';
import { choosableModes } from '../../engine/sessions/vocab-builder';
import type { Difficulty } from '../../engine/generators/types';
import { db, type GraphiteDB, type QuantSettings, type VocabSettings } from '../db';

export interface Settings {
  examDay: Day;
  goals: { newWords: number; quantQuestions: number };
  /** Last-used quant setup, remembered between drills. */
  quant: QuantSettings;
  /** Last-used vocab setup. */
  vocab: VocabSettings;
  theme: 'system' | 'light' | 'dark';
}

/** Who's studying. Stays on this device (0019, 0020). */
export interface Profile {
  name: string;
}

export const DEFAULT_QUANT: QuantSettings = {
  topics: 'mixed',
  difficulties: [2],
  length: 20,
  answerMode: 'mix',
  timer: 'per-set',
  secondsPerQuestion: 45,
};

export const DEFAULT_VOCAB: VocabSettings = { modes: ['flashcard'], deck: 'today', length: 50 };

/** Fills defaults, and upgrades settings saved before practice types became a multi-select or type-in went. */
export function normalizeVocab(stored: Partial<VocabSettings> | undefined): VocabSettings {
  const vocab = { ...DEFAULT_VOCAB, ...stored };
  const legacy = (stored as { mode?: VocabSettings['modes'][number] } | undefined)?.mode;
  if (legacy && !stored?.modes?.length) vocab.modes = [legacy];
  delete (vocab as { mode?: unknown }).mode;
  vocab.modes = choosableModes(vocab.modes);
  return vocab;
}

export const DEFAULT_SETTINGS: Settings = {
  examDay: DEFAULT_EXAM_DAY,
  goals: { newWords: 200, quantQuestions: 100 },
  quant: DEFAULT_QUANT,
  vocab: DEFAULT_VOCAB,
  theme: 'system',
};

async function get<T>(key: string, fallback: T, d: GraphiteDB = db): Promise<T> {
  const row = await d.meta.get(key);
  return row ? (row.value as T) : fallback;
}

async function put(key: string, value: unknown, d: GraphiteDB = db): Promise<void> {
  await d.meta.put({ key, value });
}

/** Fills defaults, and upgrades settings saved before difficulty became a multi-select. */
export function normalizeQuant(stored: Partial<QuantSettings> | undefined): QuantSettings {
  const quant = { ...DEFAULT_QUANT, ...stored };
  const legacy = (stored as { difficulty?: Difficulty } | undefined)?.difficulty;
  if (legacy && !stored?.difficulties?.length) quant.difficulties = [legacy];
  delete (quant as { difficulty?: Difficulty }).difficulty;
  return quant;
}

export async function getSettings(d: GraphiteDB = db): Promise<Settings> {
  const stored = await get<Partial<Settings>>('settings', {}, d);
  return { ...DEFAULT_SETTINGS, ...stored, quant: normalizeQuant(stored.quant), vocab: normalizeVocab(stored.vocab), goals: { ...DEFAULT_SETTINGS.goals, ...stored.goals } };
}

export async function updateSettings(patch: Partial<Settings>, d: GraphiteDB = db): Promise<Settings> {
  const next = { ...(await getSettings(d)), ...patch };
  await put('settings', next, d);
  return next;
}

export async function getProfile(d: GraphiteDB = db): Promise<Profile | null> {
  return get<Profile | null>('profile', null, d);
}

export async function saveProfile(profile: Profile, d: GraphiteDB = db): Promise<void> {
  await put('profile', { name: profile.name.trim() }, d);
}

export const DEFAULT_REMINDER_TIME = '19:00';

/** The daily reminder's local time. Whether reminders are on is the browser's push subscription. */
export async function getReminderTime(d: GraphiteDB = db): Promise<string> {
  return get<string>('reminderTime', DEFAULT_REMINDER_TIME, d);
}

export async function setReminderTime(time: string, d: GraphiteDB = db): Promise<void> {
  await put('reminderTime', time, d);
}

/** Reminders shown lately, and the paused session that has had its one nudge. Stays on the device. */
export interface ReminderLog {
  sentAt: number[];
  nudgedSessionId: string | null;
}

const LOG_KEEP_MS = 2 * 24 * 60 * 60 * 1000;

export async function getReminderLog(d: GraphiteDB = db): Promise<ReminderLog> {
  return get<ReminderLog>('reminderLog', { sentAt: [], nudgedSessionId: null }, d);
}

export async function logReminderSent(at: number, pausedSessionId: string | null, d: GraphiteDB = db): Promise<void> {
  const log = await getReminderLog(d);
  await put('reminderLog', { sentAt: [...log.sentAt.filter((t) => at - t < LOG_KEEP_MS), at], nudgedSessionId: pausedSessionId ?? log.nudgedSessionId }, d);
}

export async function getLastExportAt(d: GraphiteDB = db): Promise<number | null> {
  return get<number | null>('lastExportAt', null, d);
}

export async function setLastExportAt(at: number, d: GraphiteDB = db): Promise<void> {
  await put('lastExportAt', at, d);
}
