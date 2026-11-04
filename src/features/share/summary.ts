// What a share says, as plain data: the image card and the text summary are both drawn from this.
// The user's name and individual answers stay off it.
import type { Topic } from '../../engine/generators/types';
import { weakestFirst, type QuantResults, type Tally } from '../../engine/stats/quant-results';
import type { StudyHistory } from '../../engine/stats/trends';
import type { VocabResults } from '../../engine/stats/vocab-results';
import { duration, TOPIC_LABEL } from '../quant/display';

export interface ShareRow {
  label: string;
  /** The count behind the percentage, such as 3/4. A row with no count shows only its percentage. */
  count?: string;
  /** How much of the whole this row is, 0 to 1. */
  share: number;
}

export interface ShareCard {
  kind: string;
  /** The big number and what follows it: 18, 'of 20'. */
  score: { value: number; of: string };
  stats: { label: string; value: string }[];
  rows: ShareRow[];
  /** A history card's small bar chart, one value a day. */
  bars?: { label: string; values: number[] };
  text: string;
}

/** As many topic rows as fit on the card. A session with more folds the strongest into one row. */
const MAX_TOPIC_ROWS = 7;
const percent = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) : 0);

/**
 * Weakest topic first; on a tie, the one with more questions. Every question lands in a row, so the
 * rows always add up to the score, and the folded row is last because it holds the strongest topics.
 */
function topicRows(byTopic: QuantResults['byTopic']): ShareRow[] {
  const topics = weakestFirst((Object.entries(byTopic) as [Topic, Tally][]).map(([t, x]) => [TOPIC_LABEL[t], x]));
  const row = ([label, x]: [string, Tally]): ShareRow => ({ label, count: `${x.correct}/${x.total}`, share: x.correct / x.total });
  if (topics.length <= MAX_TOPIC_ROWS) return topics.map(row);
  const rest = topics.slice(MAX_TOPIC_ROWS - 1).reduce((sum, [, x]) => ({ correct: sum.correct + x.correct, total: sum.total + x.total }), { correct: 0, total: 0 });
  return [...topics.slice(0, MAX_TOPIC_ROWS - 1).map(row), row(['Other topics', rest])];
}

export function quantShare(kind: string, r: QuantResults): ShareCard {
  const rows = topicRows(r.byTopic);
  const topicText = rows.map((x) => `${x.label.toLowerCase()} ${x.count}`).join(', ');
  return {
    kind,
    score: { value: r.correct, of: `of ${r.total}` },
    stats: [
      { label: 'Accuracy', value: `${percent(r.correct, r.total)}%` },
      { label: 'Total time', value: duration(r.totalMs) },
      { label: 'Per question', value: duration(r.avgMs) },
    ],
    rows,
    text: ['Graphite', kind, `${r.correct}/${r.total} (${percent(r.correct, r.total)}%)`, `avg ${duration(r.avgMs)}`, topicText].filter(Boolean).join(' · '),
  };
}

export function vocabShare(kind: string, r: VocabResults): ShareCard {
  const cards = r.flashcards;
  const known = `${r.marks.know} of ${cards} known`;
  const rows: ShareRow[] = cards
    ? [
        { label: 'Know it', count: String(r.marks.know), share: r.marks.know / cards },
        { label: 'Unsure', count: String(r.marks.unsure), share: r.marks.unsure / cards },
        { label: 'Review', count: String(r.marks.review), share: r.marks.review / cards },
      ]
    : [];
  const quiz = r.total > 0;
  return {
    kind,
    score: quiz ? { value: r.correct, of: `of ${r.total}` } : { value: r.marks.know, of: `of ${cards} known` },
    stats: [
      quiz ? { label: 'Accuracy', value: `${percent(r.correct, r.total)}%` } : { label: 'Cards', value: String(cards) },
      { label: 'Total time', value: duration(r.totalMs) },
      { label: 'Per card', value: duration(r.avgMs) },
    ],
    rows,
    text: ['Graphite', kind, quiz ? `${r.correct}/${r.total} (${percent(r.correct, r.total)}%)` : known, `avg ${duration(r.avgMs)}`, quiz && cards ? `flashcards ${known}` : ''].filter(Boolean).join(' · '),
  };
}

/** A 7- or 14-day summary. The name and individual answers stay off it, as on every card. */
export function historyShare(h: StudyHistory): ShareCard {
  const kind = `Last ${h.days} days`;
  const accuracy = `${percent(h.correct, h.answered)}%`;
  const weakest = h.weakest.map((t) => `${TOPIC_LABEL[t.topic].toLowerCase()} ${Math.round(t.accuracy * 100)}%`).join(', ');
  return {
    kind,
    score: { value: h.answered, of: h.answered === 1 ? 'question' : 'questions' },
    stats: [
      { label: 'Accuracy', value: h.answered ? accuracy : '—' },
      { label: 'New words', value: String(h.newWords) },
      { label: 'Study days', value: `${h.studyDays} of ${h.days}` },
    ],
    rows: h.weakest.map((t) => ({ label: TOPIC_LABEL[t.topic], share: t.accuracy })),
    bars: { label: 'Questions a day', values: h.perDay },
    text: ['Graphite', kind, `${h.answered} questions${h.answered ? ` (${accuracy})` : ''}`, h.avgMs !== null && `avg ${duration(h.avgMs)}`, `${h.newWords} new words`, `${h.studyDays} of ${h.days} days studied`, weakest && `to work on: ${weakest}`].filter(Boolean).join(' · '),
  };
}

/** The line at the foot of the card; null once the exam has passed. */
export function examLine(daysLeft: number | null): string | null {
  if (daysLeft === null) return null;
  if (daysLeft === 0) return 'GRE day';
  return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to the GRE`;
}

/** '2026-11-03' → 'Nov 3'. */
export function shortDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function dayText(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
