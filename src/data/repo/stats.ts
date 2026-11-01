// What Home and Progress show, gathered from the tables. The rules are in engine/stats.
import type { Day } from '../../engine/dates';
import { isDue } from '../../engine/scheduling/leitner';
import { pickNudge, type Nudge } from '../../engine/stats/nudge';
import { quantTotals, streaks, todayPlan, wordTotals, type QuantTotals, type Streaks, type TodayPlan } from '../../engine/stats/progress';
import { db, type AnySession, type GraphiteDB } from '../db';
import { getLastExportAt, getSettings } from './meta';
import { loadWordStates } from './vocab';

/** A session ended before its first answer has nothing in it: no streak day, no last session. */
async function finishedWithAnswers(d: GraphiteDB): Promise<AnySession[]> {
  const rows = await d.sessions.where('status').equals('finished').toArray();
  return rows.filter((s) => s.answers.length > 0);
}

export interface HomeData {
  plan: TodayPlan;
  streak: Streaks;
  nudge: Nudge | null;
  last: AnySession | null;
  lastExportAt: number | null;
  hasProgress: boolean;
}

export async function loadHome(today: Day, hour: number, d: GraphiteDB = db): Promise<HomeData> {
  const [sessions, states, settings, attempts, wordsToday, lastExportAt] = await Promise.all([
    finishedWithAnswers(d),
    loadWordStates(d),
    getSettings(d),
    d.quantAttempts.toArray(),
    d.wordAttempts.where('day').equals(today).toArray(),
    getLastExportAt(d),
  ]);
  const newestFirst = [...sessions].sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const quantAnsweredToday = attempts.filter((a) => a.day === today && !a.flags.includes('not-reached')).length;
  let dueWords = 0;
  for (const s of states.values()) if (isDue(s, today)) dueWords++;
  return {
    plan: todayPlan({ states, wordsAttemptedToday: wordsToday.map((a) => a.wordId), quantAnsweredToday, goals: settings.goals, today }),
    streak: streaks(sessions.map((s) => s.day), today),
    nudge: pickNudge({
      attempts,
      drillIds: newestFirst.filter((s) => s.type === 'quant' && s.origin.kind === 'drill').map((s) => s.id),
      dueWords,
      studiedToday: sessions.some((s) => s.day === today),
      hour,
    }),
    last: newestFirst[0] ?? null,
    lastExportAt,
    hasProgress: sessions.length > 0,
  };
}

export interface ProgressData {
  streak: Streaks;
  sessions: number;
  quant: QuantTotals;
  words: { seen: number; known: number };
}

export async function loadProgress(today: Day, d: GraphiteDB = db): Promise<ProgressData> {
  const [sessions, attempts, states] = await Promise.all([finishedWithAnswers(d), d.quantAttempts.toArray(), loadWordStates(d)]);
  return {
    streak: streaks(sessions.map((s) => s.day), today),
    sessions: sessions.length,
    quant: quantTotals(attempts),
    words: wordTotals(states.values()),
  };
}
