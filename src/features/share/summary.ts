// What a share says, as plain data: the image card and the text summary are both drawn from this.
// The user's name and individual answers stay off it.
import type { Topic } from '../../engine/generators/types';
import type { QuantResults } from '../../engine/stats/quant-results';
import type { VocabResults } from '../../engine/stats/vocab-results';
import { duration, TOPIC_LABEL } from '../quant/display';

export interface ShareRow {
  label: string;
  value: string;
  /** How much of the row's ticks to fill, 0 to 1. */
  share: number;
}

export interface ShareCard {
  kind: string;
  /** The big number and what follows it: 18, 'of 20'. */
  score: { value: number; of: string };
  stats: { label: string; value: string }[];
  rows: ShareRow[];
  text: string;
}

const TOP_TOPICS = 4;
const percent = (correct: number, total: number) => (total ? Math.round((correct / total) * 100) : 0);

export function quantShare(kind: string, r: QuantResults): ShareCard {
  const topics = (Object.entries(r.byTopic) as [Topic, { correct: number; total: number }][])
    .sort(([a, x], [b, y]) => y.total - x.total || TOPIC_LABEL[a].localeCompare(TOPIC_LABEL[b]))
    .slice(0, TOP_TOPICS);
  const topicText = topics.map(([t, x]) => `${TOPIC_LABEL[t].toLowerCase()} ${x.correct}/${x.total}`).join(', ');
  return {
    kind,
    score: { value: r.correct, of: `of ${r.total}` },
    stats: [
      { label: 'Accuracy', value: `${percent(r.correct, r.total)}%` },
      { label: 'Total time', value: duration(r.totalMs) },
      { label: 'Per question', value: duration(r.avgMs) },
    ],
    rows: topics.map(([t, x]) => ({ label: TOPIC_LABEL[t], value: `${x.correct}/${x.total}`, share: x.correct / x.total })),
    text: ['Graphite', kind, `${r.correct}/${r.total} (${percent(r.correct, r.total)}%)`, `avg ${duration(r.avgMs)}`, topicText].filter(Boolean).join(' · '),
  };
}

export function vocabShare(kind: string, r: VocabResults): ShareCard {
  const cards = r.flashcards;
  const known = `${r.marks.know} of ${cards} known`;
  const rows: ShareRow[] = cards
    ? [
        { label: 'Know it', value: String(r.marks.know), share: r.marks.know / cards },
        { label: 'Unsure', value: String(r.marks.unsure), share: r.marks.unsure / cards },
        { label: 'Review', value: String(r.marks.review), share: r.marks.review / cards },
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

/** The line at the foot of the card; null once the exam has passed. */
export function examLine(daysLeft: number | null): string | null {
  if (daysLeft === null) return null;
  if (daysLeft === 0) return 'GRE day';
  return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to the GRE`;
}

export function dayText(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
