// What a share says, as plain data: the image card and the text summary are both drawn from this.
// The user's name and individual answers stay off it.
import type { Topic } from '../../engine/generators/types';
import { weakestFirst, type QuantResults, type Tally } from '../../engine/stats/quant-results';
import { wordsNeededPerDay, type StudyHistory } from '../../engine/stats/trends';
import type { VocabResults } from '../../engine/stats/vocab-results';
import { duration, TOPIC_LABEL } from '../quant/display';

export interface ShareRow {
  label: string;
  /** The count behind the percentage, such as 3/4. A row with no count shows only its percentage. */
  count?: string;
  /** How much of the whole this row is, 0 to 1. */
  share: number;
}

export interface ResultCard {
  kind: string;
  /** The big number and what follows it: 18, 'of 20'. */
  score: { value: number; of: string };
  stats: { label: string; value: string }[];
  rows: ShareRow[];
  text: string;
}

/** The Progress share: a report card with the countdown on top, then Quant and Verbal side by side. */
export interface ReportCard {
  kind: string;
  daysLeft: number | null;
  calendar: { letter: string; studied: boolean }[];
  studied: string;
  quant: {
    /** 0 to 1; null with no questions answered. */
    accuracy: number | null;
    previous: number | null;
    line: string;
    rows: { label: string; value: string }[];
  };
  verbal: {
    seen: number;
    deck: number;
    rows: { label: string; value: string }[];
  };
  note: string;
  text: string;
}

export type ShareCard = ResultCard | ReportCard;

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

export function quantShare(kind: string, r: QuantResults): ResultCard {
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

export function vocabShare(kind: string, r: VocabResults): ResultCard {
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

const NOT_ENOUGH = 'Not enough yet';
const count = (n: number) => n.toLocaleString('en-US');

function dayLetter(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return 'SMTWTFS'[new Date(y!, m! - 1, d!).getDay()]!;
}

/** What the Quant column says under its number: how this compares with the days before. */
function comparisonLine(h: StudyHistory): string {
  if (!h.answered) return 'No questions yet';
  if (!h.previous) return 'Got right';
  const now = percent(h.correct, h.answered);
  const then = percent(h.previous.correct, h.previous.answered);
  const before = h.days === 7 ? 'last week' : 'before';
  if (now === then) return `Same as ${before}`;
  return `${now > then ? 'Up' : 'Down'} from ${then}% ${before}`;
}

/** A short note worked out from the numbers, so it never says more than they do. */
function teacherNote(h: StudyHistory, needed: number | null): string {
  const parts: string[] = [];
  if (h.answered && h.previous) {
    const change = percent(h.correct, h.answered) - percent(h.previous.correct, h.previous.answered);
    const faster = h.previous.avgMs - h.avgMs! >= 1000;
    if (change > 0) parts.push(faster ? 'More right, and faster.' : 'More right than before.');
    else if (change < 0) parts.push(faster ? 'Faster, with fewer right.' : 'Fewer right than before.');
    else if (faster) parts.push('Faster than before.');
  }
  const focus = h.weakest[0] ? TOPIC_LABEL[h.weakest[0].topic] : null;
  const gap = needed === null ? 0 : needed - h.wordsPerDay;
  const words = gap > 0 ? `${gap} more ${gap === 1 ? 'word' : 'words'} a day` : null;
  if (focus && words) parts.push(`${focus} next, and ${words}.`);
  else if (focus) parts.push(`${focus} next.`);
  else if (words) parts.push(`${words[0]!.toUpperCase()}${words.slice(1)}.`);
  if (needed && gap <= 0 && h.wordsPerDay > 0) parts.push('Words on pace.');
  return parts.length ? parts.join(' ') : 'Not enough answers yet to say more.';
}

/** A 7- or 14-day report. The name and individual answers stay off it, as on every card. */
export function historyShare(h: StudyHistory, words: { seen: number; known: number; deck: number }, daysLeft: number | null): ReportCard {
  const kind = `Report card · Last ${h.days} days`;
  const accuracy = h.answered ? h.correct / h.answered : null;
  const needed = wordsNeededPerDay(words.seen, words.deck, daysLeft);
  const topic = (t: { topic: keyof typeof TOPIC_LABEL; accuracy: number } | null | undefined) => (t ? `${TOPIC_LABEL[t.topic]}, ${Math.round(t.accuracy * 100)}%` : NOT_ENOUGH);
  const studied = `Studied ${h.studyDays} of ${h.days} days`;
  const line = comparisonLine(h);
  const neededText = needed === null ? null : needed === 0 ? 'All words seen' : `${count(needed)} a day`;
  return {
    kind,
    daysLeft,
    calendar: h.calendar.map((d) => ({ letter: dayLetter(d.day), studied: d.studied })),
    studied,
    quant: {
      accuracy,
      previous: h.previous ? h.previous.correct / h.previous.answered : null,
      line,
      rows: [
        { label: 'Questions', value: h.answered ? `${count(h.answered)}, at ${duration(h.avgMs!)} each` : '0' },
        { label: 'Best topic', value: topic(h.best) },
        { label: 'Needs work', value: topic(h.weakest[0]) },
      ],
    },
    verbal: {
      seen: words.seen,
      deck: words.deck,
      rows: [
        { label: 'Learning', value: `${count(h.wordsPerDay)} a day` },
        ...(neededText ? [{ label: 'Needed for the GRE', value: neededText }] : []),
        { label: 'Know well', value: `${count(words.known)} ${words.known === 1 ? 'word' : 'words'}` },
      ],
    },
    note: teacherNote(h, needed),
    text: [
      'Graphite',
      `Last ${h.days} days`,
      examLine(daysLeft),
      studied.toLowerCase(),
      h.answered ? `Quant ${h.correct}/${h.answered} (${percent(h.correct, h.answered)}%)${h.previous ? `, ${line.toLowerCase()}` : ''}, avg ${duration(h.avgMs!)}` : 'Quant: no questions yet',
      h.best && `best ${TOPIC_LABEL[h.best.topic].toLowerCase()} ${Math.round(h.best.accuracy * 100)}%`,
      h.weakest[0] && `needs work ${TOPIC_LABEL[h.weakest[0].topic].toLowerCase()} ${Math.round(h.weakest[0].accuracy * 100)}%`,
      `Verbal ${count(words.seen)} of ${count(words.deck)} words seen, ${count(words.known)} known well`,
      `learning ${count(h.wordsPerDay)} a day${needed ? `, needs ${count(needed)}` : ''}`,
    ].filter(Boolean).join(' · '),
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
