import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { loadBank } from '../../content/bank';
import { loadWords } from '../../content/words';
import { getSettings } from '../../data/repo/meta';
import { loadMistakeLog } from '../../data/repo/mistakes';
import { CLEAR_AFTER } from '../../engine/sessions/mistakes';
import { parseRefId, resolveQuestion } from '../../engine/sessions/questions';
import { Button, Segmented } from '../../ui/controls';
import { Screen } from '../../ui/Screen';
import { duration, showValue, TOPIC_LABEL } from '../quant/display';
import { startMistakeDrill } from '../quant/startDrill';
import { POS_SHORT, sentence } from '../vocab/display';
import { startMistakeVocab } from '../vocab/startVocab';
import styles from './MistakesScreen.module.css';

async function load() {
  const [log, bank, book, settings] = await Promise.all([loadMistakeLog(), loadBank(), loadWords(), getSettings()]);
  return {
    // A logged question or word that's since left the content files can't be shown or drilled.
    quant: log.quant.flatMap(({ row, miss }) => {
      const question = resolveQuestion(parseRefId(row.refId), bank.byId);
      return question ? [{ row, miss, question }] : [];
    }),
    words: log.words.flatMap(({ row, miss }) => {
      const word = book.byId.get(row.refId);
      return word ? [{ row, miss, word }] : [];
    }),
    drillLength: settings.quant.length,
    sessionLength: settings.vocab.length,
  };
}

function Streak({ count }: { count: number }) {
  if (count === 0) return null;
  return <span className={`${styles.streak} tabular`}>{count} of {CLEAR_AFTER} correct</span>;
}

export function MistakesScreen() {
  const navigate = useNavigate();
  const { data } = useAsync(load);
  const [tab, setTab] = useState<'quant' | 'words'>('quant');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (data && !data.quant.length && data.words.length) setTab('words');
  }, [data]);

  if (!data) return <Screen title="Mistake log" />;

  const quantCount = data.quant.length;
  const wordCount = data.words.length;

  if (!quantCount && !wordCount) {
    return (
      <Screen title="Mistake log">
        <p className={styles.empty}>Nothing here yet. Wrong answers and missed words collect here on their own.</p>
      </Screen>
    );
  }

  const count = tab === 'quant' ? quantCount : wordCount;
  const size = Math.min(count, tab === 'quant' ? data.drillLength : data.sessionLength);

  const drill = async () => {
    setStarting(true);
    const session = tab === 'quant' ? await startMistakeDrill() : await startMistakeVocab();
    if (session) navigate(`/${session.type}/session/${session.id}`);
    else setStarting(false);
  };

  return (
    <Screen title="Mistake log">
      <Segmented
        label="Kind of mistake"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'quant', label: `Quant (${quantCount})` },
          { value: 'words', label: `Words (${wordCount})` },
        ]}
      />

      {count > 0 && (
        <div className={styles.drill}>
          <Button block onClick={drill} disabled={starting}>
            {starting ? 'Building your drill…' : `Drill my mistakes (${size})`}
          </Button>
          <p className={styles.hint}>Oldest first. Each one leaves after {CLEAR_AFTER} correct answers in a row.</p>
        </div>
      )}

      {count === 0 && <p className={styles.empty}>{tab === 'quant' ? 'No quant questions in the log.' : 'No words in the log.'}</p>}

      {tab === 'quant' && (
        <ul className={styles.list}>
          {data.quant.map(({ row, miss, question }) => (
            <li key={row.refId} className={styles.item}>
              <p className={styles.meta}>
                <span>{TOPIC_LABEL[question.topic]}</span>
                <Streak count={row.correctStreak} />
              </p>
              <p className={styles.prompt}>{question.prompt}</p>
              <dl className={`${styles.answers} tabular`}>
                <div>
                  <dt>You</dt>
                  <dd>{!miss || miss.flags.includes('not-reached') ? 'Not reached' : miss.answer === null ? 'Skipped' : showValue(question, miss.answer)}</dd>
                </div>
                <div>
                  <dt>Answer</dt>
                  <dd>{showValue(question, question.answer)}</dd>
                </div>
                {miss && miss.ms > 0 && (
                  <div>
                    <dt>Time</dt>
                    <dd>{duration(miss.ms)}</dd>
                  </div>
                )}
              </dl>
              <p className={styles.explain}>{question.explain}</p>
            </li>
          ))}
        </ul>
      )}

      {tab === 'words' && (
        <ul className={styles.list}>
          {data.words.map(({ row, miss, word }) => (
            <li key={row.refId} className={styles.item}>
              <p className={styles.meta}>
                <span>{miss?.mode === 'flashcard' ? 'Marked Review' : 'Missed in a quiz'}</span>
                <Streak count={row.correctStreak} />
              </p>
              <p className={styles.word}>
                {word.word} <span className={styles.pos}>{POS_SHORT[word.pos]}</span>
              </p>
              <p className={styles.explain}>{sentence(word.meaning)}</p>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
