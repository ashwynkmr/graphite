import { useMemo, useState } from 'react';
import { useAsync } from '../../app/useAsync';
import { loadWords } from '../../content/words';
import { loadProgress } from '../../data/repo/stats';
import { toDay } from '../../engine/dates';
import { TOPICS, type Topic } from '../../engine/generators/types';
import { BOX_GROUPS, type BoxGroup } from '../../engine/sessions/word-browse';
import { dailyQuant, newWordsPerDay, studyHistory, topicStats, wordStages } from '../../engine/stats/trends';
import { Field, Segmented } from '../../ui/controls';
import { Screen } from '../../ui/Screen';
import { DIFFICULTY_LABEL, duration, TOPIC_LABEL } from '../quant/display';
import { ShareButton } from '../share/ShareButton';
import { historyShare } from '../share/summary';
import { DayChart } from './DayChart';
import styles from './ProgressScreen.module.css';

async function load() {
  const today = toDay(new Date());
  const [progress, book] = await Promise.all([loadProgress(today), loadWords()]);
  return { ...progress, deck: book.words.length, today };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}

const count = (n: number) => n.toLocaleString('en-US');
const percent = (v: number) => `${Math.round(v * 100)}%`;

const STAGE_LABEL: Record<BoxGroup, string> = { new: 'New', learning: 'Learning', known: 'Known', retired: 'Retired' };

/** A round top for the chart's scale: 34 → 40, 130 → 150. */
function niceMax(v: number): number {
  if (v <= 10) return 10;
  const unit = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 5, 10].map((n) => (n * unit) / 2).find((s) => Math.ceil(v / s) <= 4) ?? unit;
  return Math.ceil(v / step) * step;
}

export function ProgressScreen() {
  const { data } = useAsync(load);
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [span, setSpan] = useState<7 | 14>(7);

  const view = useMemo(() => {
    if (!data) return null;
    const { attempts, states, today, deck } = data;
    const points = dailyQuant(attempts, today, undefined, topic === 'all' ? null : topic);
    const slowest = Math.max(0, ...points.map((p) => (p.avgMs ?? 0) / 1000));
    const newWords = newWordsPerDay(states.values(), today);
    return {
      points,
      slowest: niceMax(slowest),
      newWords,
      mostNew: niceMax(Math.max(0, ...newWords.map((d) => d.count))),
      topics: topicStats(attempts, today),
      stages: wordStages(states.values(), deck),
    };
  }, [data, topic]);

  const history = useMemo(() => (data ? studyHistory(data.attempts, data.states.values(), data.studiedDays, data.today, span) : null), [data, span]);

  if (!data || !view || !history) return <Screen title="Progress" />;
  const { streak, quant, words, sessions, deck, levels, today } = data;
  const showLevels = Object.keys(levels).length > 0;

  return (
    <Screen title="Progress">
      <div className={styles.cards}>
        <div className={styles.card}>
          <b className={`${styles.big} ${styles.current} tabular`}>{streak.current}</b>
          <span>day streak</span>
        </div>
        <div className={styles.card}>
          <b className={`${styles.big} tabular`}>{streak.best}</b>
          <span>best streak</span>
        </div>
      </div>

      {sessions === 0 && <p className={styles.empty}>Finish a session and your totals and trends start here.</p>}

      <section className={styles.section}>
        <h2>Last 14 days</h2>
        <label className={styles.pick}>
          <span className={styles.pickLabel}>Show</span>
          <select className={styles.select} value={topic} onChange={(e) => setTopic(e.target.value as Topic | 'all')}>
            <option value="all">All topics</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {TOPIC_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <DayChart
          title="Accuracy"
          kind="line"
          max={1}
          ticks={[0, 0.5, 1]}
          tickText={percent}
          days={view.points.map((p) => ({ day: p.day, value: p.accuracy, text: p.accuracy === null ? 'no answers' : `${percent(p.accuracy)} of ${p.answered}` }))}
        />
        <DayChart
          title="Seconds a question"
          kind="line"
          max={view.slowest}
          ticks={[0, view.slowest / 2, view.slowest]}
          tickText={(v) => `${Math.round(v)}s`}
          days={view.points.map((p) => ({ day: p.day, value: p.avgMs === null ? null : p.avgMs / 1000, text: p.avgMs === null ? 'no answers' : duration(p.avgMs) }))}
        />
      </section>

      {view.topics.length > 0 && (
        <section className={styles.section}>
          <h2>By topic</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col" className={styles.num}>
                  Right
                </th>
                <th scope="col" className={styles.num}>
                  Time
                </th>
                {showLevels && (
                  <th scope="col" className={styles.num}>
                    Level
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="tabular">
              {view.topics.map((t) => (
                <tr key={t.topic}>
                  <th scope="row">
                    {TOPIC_LABEL[t.topic]}
                    {t.weakest && <span className={styles.weakest}>Weakest</span>}
                  </th>
                  <td className={styles.num}>{percent(t.accuracy)}</td>
                  <td className={styles.num}>{duration(t.avgMs)}</td>
                  {showLevels && <td className={styles.num}>{levels[t.topic] ? DIFFICULTY_LABEL[levels[t.topic]!.level] : 'Medium'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className={styles.section}>
        <h2>Vocab</h2>
        <ul className={styles.stages}>
          {BOX_GROUPS.map((g) => (
            <li key={g} className={styles.stage}>
              <span>{STAGE_LABEL[g]}</span>
              <span className={styles.stageBar} aria-hidden="true">
                <span style={{ width: `${(view.stages[g] / deck) * 100}%` }} />
              </span>
              <span className="tabular">{count(view.stages[g])}</span>
            </li>
          ))}
        </ul>
        <DayChart
          title="New words a day"
          kind="bar"
          max={view.mostNew}
          ticks={[0, view.mostNew / 2, view.mostNew]}
          tickText={(v) => String(Math.round(v))}
          days={view.newWords.map((d) => ({ day: d.day, value: d.count, text: `${count(d.count)} new` }))}
        />
      </section>

      <section className={styles.section}>
        <h2>All time</h2>
        <dl className={styles.rows}>
          <Row label="Questions answered" value={count(quant.answered)} />
          <Row label="Accuracy" value={quant.answered ? `${Math.round((quant.correct / quant.answered) * 100)}%` : '—'} />
          <Row label="Average time" value={quant.averageMs === null ? '—' : duration(quant.averageMs)} />
          <Row label="Words seen" value={`${count(words.seen)} of ${count(deck)}`} />
          <Row label="Known or better" value={count(words.known)} />
          <Row label="Study days" value={count(streak.studyDays)} />
          <Row label="Sessions finished" value={count(sessions)} />
        </dl>
      </section>

      {sessions > 0 && (
        <section className={styles.section}>
          <h2>Share your history</h2>
          <Field label="Days">
            <Segmented
              label="Days to share"
              value={span}
              onChange={setSpan}
              options={[
                { value: 7, label: '7 days' },
                { value: 14, label: '14 days' },
              ]}
            />
          </Field>
          <ShareButton card={historyShare(history)} day={today} />
        </section>
      )}
    </Screen>
  );
}
