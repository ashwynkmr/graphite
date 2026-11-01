import { useAsync } from '../../app/useAsync';
import { loadWords } from '../../content/words';
import { loadProgress } from '../../data/repo/stats';
import { toDay } from '../../engine/dates';
import { Screen } from '../../ui/Screen';
import { duration } from '../quant/display';
import styles from './ProgressScreen.module.css';

async function load() {
  const [progress, book] = await Promise.all([loadProgress(toDay(new Date())), loadWords()]);
  return { ...progress, deck: book.words.length };
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

export function ProgressScreen() {
  const { data } = useAsync(load);
  if (!data) return <Screen title="Progress" />;
  const { streak, quant, words, sessions, deck } = data;

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

      {sessions === 0 && <p className={styles.empty}>Finish a session and your totals start here.</p>}

      <section className={styles.section}>
        <h2>Quant</h2>
        <dl className={styles.rows}>
          <Row label="Questions answered" value={count(quant.answered)} />
          <Row label="Accuracy" value={quant.answered ? `${Math.round((quant.correct / quant.answered) * 100)}%` : '—'} />
          <Row label="Average time" value={quant.averageMs === null ? '—' : duration(quant.averageMs)} />
        </dl>
      </section>

      <section className={styles.section}>
        <h2>Vocab</h2>
        <dl className={styles.rows}>
          <Row label="Words seen" value={`${count(words.seen)} of ${count(deck)}`} />
          <Row label="Known or better" value={count(words.known)} />
        </dl>
      </section>

      <section className={styles.section}>
        <h2>All study</h2>
        <dl className={styles.rows}>
          <Row label="Study days" value={count(streak.studyDays)} />
          <Row label="Sessions finished" value={count(sessions)} />
        </dl>
      </section>
    </Screen>
  );
}
