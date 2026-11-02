import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { loadBank } from '../../content/bank';
import { loadWords } from '../../content/words';
import { getSettings } from '../../data/repo/meta';
import { loadMistakeLog } from '../../data/repo/mistakes';
import { TOPICS, type Topic } from '../../engine/generators/types';
import { CLEAR_AFTER } from '../../engine/sessions/mistakes';
import { parseRefId, resolveQuestion } from '../../engine/sessions/questions';
import { Button, Chip, Segmented } from '../../ui/controls';
import { MathText } from '../../ui/MathText';
import { ReportProblem } from '../../ui/ReportProblem';
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

const WORD_KINDS = ['review', 'quiz'] as const;
type WordKind = (typeof WORD_KINDS)[number];
const WORD_KIND_LABEL: Record<WordKind, string> = { review: 'Marked Review', quiz: 'Missed in a quiz' };
const wordKindOf = (mode: string | undefined): WordKind => (mode === 'flashcard' ? 'review' : 'quiz');

function Streak({ count }: { count: number }) {
  if (count === 0) return null;
  return <span className={`${styles.streak} tabular`}>{count} of {CLEAR_AFTER} correct</span>;
}

export function MistakesScreen() {
  const navigate = useNavigate();
  const { data } = useAsync(load);
  const [tab, setTab] = useState<'quant' | 'words'>('quant');
  const [starting, setStarting] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [wordKind, setWordKind] = useState<WordKind | null>(null);

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

  // A filter that's emptied (the last one cleared) falls back to showing everything.
  const topics = TOPICS.filter((t) => data.quant.some((m) => m.question.topic === t));
  const activeTopic = topic && topics.includes(topic) ? topic : null;
  const quantShown = activeTopic ? data.quant.filter((m) => m.question.topic === activeTopic) : data.quant;
  const kinds = WORD_KINDS.filter((k) => data.words.some((m) => wordKindOf(m.miss?.mode) === k));
  const activeKind = wordKind && kinds.includes(wordKind) ? wordKind : null;
  const wordsShown = activeKind ? data.words.filter((m) => wordKindOf(m.miss?.mode) === activeKind) : data.words;

  const shown = tab === 'quant' ? quantShown.length : wordsShown.length;
  const count = tab === 'quant' ? quantCount : wordCount;
  const size = Math.min(shown, tab === 'quant' ? data.drillLength : data.sessionLength);

  const drill = async () => {
    setStarting(true);
    const session = tab === 'quant' ? await startMistakeDrill(activeTopic ? quantShown.map((m) => m.row.refId) : undefined) : await startMistakeVocab(activeKind ? wordsShown.map((m) => m.row.refId) : undefined);
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

      {tab === 'quant' && topics.length > 1 && (
        <div className={styles.filters}>
          {topics.map((t) => (
            <Chip key={t} selected={activeTopic === t} onClick={() => setTopic(activeTopic === t ? null : t)}>
              {TOPIC_LABEL[t]}
            </Chip>
          ))}
        </div>
      )}
      {tab === 'words' && kinds.length > 1 && (
        <div className={styles.filters}>
          {kinds.map((k) => (
            <Chip key={k} selected={activeKind === k} onClick={() => setWordKind(activeKind === k ? null : k)}>
              {WORD_KIND_LABEL[k]}
            </Chip>
          ))}
        </div>
      )}

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
          {quantShown.map(({ row, miss, question }) => (
            <li key={row.refId} className={styles.item}>
              <p className={styles.meta}>
                <span>{TOPIC_LABEL[question.topic]}</span>
                <Streak count={row.correctStreak} />
              </p>
              <p className={styles.prompt}>
                <MathText text={question.prompt} />
              </p>
              <dl className={`${styles.answers} tabular`}>
                <div>
                  <dt>You</dt>
                  <dd>{!miss || miss.flags.includes('not-reached') ? 'Not reached' : miss.answer === null ? 'Skipped' : <MathText text={showValue(question, miss.answer)} />}</dd>
                </div>
                <div>
                  <dt>Answer</dt>
                  <dd>
                    <MathText text={showValue(question, question.answer)} />
                  </dd>
                </div>
                {miss && miss.ms > 0 && (
                  <div>
                    <dt>Time</dt>
                    <dd>{duration(miss.ms)}</dd>
                  </div>
                )}
              </dl>
              <p className={styles.explain}>
                <MathText text={question.explain} />
              </p>
              <ReportProblem id={row.refId} />
            </li>
          ))}
        </ul>
      )}

      {tab === 'words' && (
        <ul className={styles.list}>
          {wordsShown.map(({ row, miss, word }) => (
            <li key={row.refId} className={styles.item}>
              <p className={styles.meta}>
                <span>{WORD_KIND_LABEL[wordKindOf(miss?.mode)]}</span>
                <Streak count={row.correctStreak} />
              </p>
              <p className={styles.word}>
                {word.word} <span className={styles.pos}>{POS_SHORT[word.pos]}</span>
              </p>
              <p className={styles.explain}>{sentence(word.meaning)}</p>
              <ReportProblem id={row.refId} />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
