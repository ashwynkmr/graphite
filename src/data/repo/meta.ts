// Settings, profile and bookkeeping, stored as key/value rows in `meta`.
import { DEFAULT_EXAM_DAY, type Day } from '../../engine/dates';
import type { PlannedWake } from '../../engine/scheduling/reminder-plan';
import { choosableModes } from '../../engine/sessions/vocab-builder';
import type { AdaptiveLevels } from '../../engine/sessions/adaptive';
import type { Difficulty, Topic } from '../../engine/generators/types';
import { db, type GraphiteDB, type QuantSettings, type VocabSettings } from '../db';

export interface Settings {
  examDay: Day;
  goals: { newWords: number; quantQuestions: number };
  /** Last-used quant setup, remembered between drills. */
  quant: QuantSettings;
  /** The setup last used for each topic drilled on its own (0043). */
  quantByTopic: Partial<Record<Topic, Omit<QuantSettings, 'topics'>>>;
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
  adaptive: false,
  length: 20,
  answerMode: 'mix',
  timer: 'per-set',
  secondsPerQuestion: 45,
  sprintSeconds: 300,
};

/** The same setup for a drill of set length: retries, mistake drills and suggestions are never sprints. */
export function fixedLength(settings: QuantSettings, length: number): QuantSettings {
  return { ...settings, length, timer: settings.timer === 'sprint' ? 'per-set' : settings.timer };
}

export const DEFAULT_VOCAB: VocabSettings = { modes: ['flashcard'], deck: 'today', length: 50, difficulties: [2], adaptive: false };

/** Fills defaults, and upgrades settings saved before practice types became a multi-select or type-in went. */
export function normalizeVocab(stored: Partial<VocabSettings> | undefined): VocabSettings {
  const vocab = { ...DEFAULT_VOCAB, ...stored };
  const legacy = (stored as { mode?: VocabSettings['modes'][number] } | undefined)?.mode;
  if (legacy && !stored?.modes?.length) vocab.modes = [legacy];
  delete (vocab as { mode?: unknown }).mode;
  vocab.modes = choosableModes(vocab.modes);
  if (!vocab.difficulties?.length) vocab.difficulties = [2];
  return vocab;
}

export const DEFAULT_SETTINGS: Settings = {
  examDay: DEFAULT_EXAM_DAY,
  goals: { newWords: 200, quantQuestions: 100 },
  quant: DEFAULT_QUANT,
  quantByTopic: {},
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

const ADAPTIVE_KEY = 'adaptiveLevels';

export async function getAdaptiveLevels(d: GraphiteDB = db): Promise<AdaptiveLevels> {
  return get<AdaptiveLevels>(ADAPTIVE_KEY, {}, d);
}

export async function setAdaptiveLevels(levels: AdaptiveLevels, d: GraphiteDB = db): Promise<void> {
  await put(ADAPTIVE_KEY, levels, d);
}

/** The last release whose What's New screen was seen on this device (0048). */
export async function getWhatsNewSeen(d: GraphiteDB = db): Promise<string | null> {
  return get<string | null>('whatsNewSeen', null, d);
}

export async function setWhatsNewSeen(release: string, d: GraphiteDB = db): Promise<void> {
  await put('whatsNewSeen', release, d);
}

/** Set on the name prompt and cleared once the tutorial is finished or skipped: nobody who had the app before it is owed one. */
export async function getTutorialOwed(d: GraphiteDB = db): Promise<boolean> {
  return get<boolean>('tutorialOwed', false, d);
}

export async function setTutorialOwed(owed: boolean, d: GraphiteDB = db): Promise<void> {
  await put('tutorialOwed', owed, d);
}

const ROUND_KEY = 'vocabRound';
const ROUND_DECLINED_KEY = 'vocabRoundDeclined';

/** The vocab round under way; 1 is the first pass through the deck. */
export async function getVocabRound(d: GraphiteDB = db): Promise<number> {
  return get<number>(ROUND_KEY, 1, d);
}

export async function setVocabRound(round: number, d: GraphiteDB = db): Promise<void> {
  await put(ROUND_KEY, round, d);
}

/** The round Home was last told "Not now" about, so it doesn't ask again. */
export async function getRoundDeclined(d: GraphiteDB = db): Promise<number> {
  return get<number>(ROUND_DECLINED_KEY, 0, d);
}

export async function setRoundDeclined(round: number, d: GraphiteDB = db): Promise<void> {
  await put(ROUND_DECLINED_KEY, round, d);
}

/** Levels and rounds come from study data, so Reset progress clears them. */
export async function clearStudyMeta(d: GraphiteDB = db): Promise<void> {
  await d.meta.bulkDelete([ADAPTIVE_KEY, ROUND_KEY, ROUND_DECLINED_KEY]);
}

export const DEFAULT_REMINDER_TIME = '19:00';

/** The daily reminder's local time. Whether reminders are on is the browser's push subscription. */
export async function getReminderTime(d: GraphiteDB = db): Promise<string> {
  return get<string>('reminderTime', DEFAULT_REMINDER_TIME, d);
}

export async function setReminderTime(time: string, d: GraphiteDB = db): Promise<void> {
  await put('reminderTime', time, d);
}

/** Whether a user the personal notes open for wants them. On by default; theirs to turn off. */
export async function getNotesOn(d: GraphiteDB = db): Promise<boolean> {
  return get<boolean>('notesOn', true, d);
}

export async function setNotesOn(on: boolean, d: GraphiteDB = db): Promise<void> {
  await put('notesOn', on, d);
}

/** How many personal notes have been shown, so none repeats until all have appeared. */
export async function nextNoteCount(d: GraphiteDB = db): Promise<number> {
  const count = await get<number>('noteCount', 0, d);
  await put('noteCount', count + 1, d);
  return count;
}

export async function getReminderPlan(d: GraphiteDB = db): Promise<PlannedWake[]> {
  return get<PlannedWake[]>('reminderPlan', [], d);
}

export async function setReminderPlan(plan: PlannedWake[], d: GraphiteDB = db): Promise<void> {
  await put('reminderPlan', plan, d);
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
