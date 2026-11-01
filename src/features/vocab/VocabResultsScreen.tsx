import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Word } from '../../content/schema';
import { loadWords } from '../../content/words';
import type { VocabSessionRow } from '../../data/db';
import { getVocabSession } from '../../data/repo/vocab';
import { isPassing } from '../../engine/scheduling/leitner';
import { gradeVocab, type VocabMode } from '../../engine/sessions/vocab-builder';
import { scoreVocab, type VocabResults, type VocabScoredItem } from '../../engine/stats/vocab-results';
import { Button } from '../../ui/controls';
import { vocabResultsLine } from '../personal/messages';
import { useProfile } from '../personal/ProfileContext';
import { duration } from '../quant/display';
import r from '../results/ResultsScreen.module.css';
import { sentence } from './display';
import { redoVocab, startVocab } from './startVocab';
import styles from './VocabResultsScreen.module.css';

const MODE_LABEL: Record<VocabMode, string> = { flashcard: 'Flashcards', mcq: 'Multiple choice', blank: 'Fill the blank', typein: 'Type-in' };

/** Practice types of a session; sessions saved before the multi-select stored a single `mode`. */
function modesOf(s: VocabSessionRow): VocabMode[] {
  return s.settings.modes ?? [(s.settings as { mode?: VocabMode }).mode ?? 'flashcard'];
}

function Mark({ grade }: { grade: VocabScoredItem['grade'] }) {
  if (isPassing(grade)) {
    return (
      <svg viewBox="0 0 24 24" className={`${r.mark} ${r.good}`} aria-label={grade === 'slip' ? 'Right, with a spelling slip' : 'Right'}>
        <path d="M4 13.5 9.5 19 20 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (grade === 'unsure') {
    return (
      <svg viewBox="0 0 24 24" className={`${r.mark} ${styles.unsure}`} aria-label="Unsure">
        <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={`${r.mark} ${r.bad}`} aria-label={grade === 'review' ? 'Review' : 'Missed'}>
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

type Group = 'missed' | 'unsure' | 'right';

const GROUPS: { id: Group; label: string }[] = [
  { id: 'missed', label: 'Missed' },
  { id: 'unsure', label: 'Unsure' },
  { id: 'right', label: 'Got right' },
];

function groupOf(grade: VocabScoredItem['grade']): Group {
  if (isPassing(grade)) return 'right';
  return grade === 'unsure' ? 'unsure' : 'missed';
}

export function VocabResultsScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [session, setSession] = useState<VocabSessionRow | null>(null);
  const [words, setWords] = useState<ReadonlyMap<string, Word> | null>(null);
  const [results, setResults] = useState<VocabResults | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([getVocabSession(id), loadWords()]).then(([s, book]) => {
      if (!s) return navigate('/vocab', { replace: true });
      if (s.status !== 'finished') return navigate(`/vocab/session/${id}`, { replace: true });
      setSession(s);
      setWords(book.byId);
      setResults(
        scoreVocab(
          s.answers.map((a, i) => {
            const item = s.items[i]!;
            return { index: i, wordId: item.wordId, grade: gradeVocab(item, book.byId.get(item.wordId)!, a.value), flashcard: item.kind === 'flashcard', ms: a.ms, answer: a.value };
          }),
          s.items.map((it) => Boolean(it.requeued)),
        ),
      );
    });
  }, [id, navigate]);

  if (!session || !words || !results) return <div className={r.loading}>Marking your cards…</div>;

  const modes = modesOf(session);
  // One row per word: its last showing (a requeued flashcard's second mark is the one that counts).
  const lastByWord = new Map<string, VocabScoredItem>();
  for (const it of results.items) lastByWord.set(it.wordId, it);
  const rows = [...lastByWord.values()].sort((a, b) => a.index - b.index);
  const toReview = rows.filter((it) => !isPassing(it.grade)).length;
  // Missed words first, for a second look while they're fresh; then unsure; then the ones you knew.
  const groups = GROUPS.map((g) => ({ ...g, items: rows.filter((it) => groupOf(it.grade) === g.id) })).filter((g) => g.items.length);

  const redo = async () => {
    setStarting(true);
    const s = await redoVocab(
      rows.filter((it) => !isPassing(it.grade)).map((it) => it.wordId),
      session.settings,
    );
    if (s) navigate(`/vocab/session/${s.id}`);
    else setStarting(false);
  };

  const again = async () => {
    setStarting(true);
    const s = await startVocab({ ...session.settings, modes });
    if (s) navigate(`/vocab/session/${s.id}`);
    else navigate('/vocab');
  };

  return (
    <main className={r.page}>
      <header className={r.top}>
        <Link to="/" className={r.back}>
          Done
        </Link>
        <span className={r.kind}>{modes.length > 1 ? 'Mixed practice' : MODE_LABEL[modes[0]!]}</span>
      </header>

      <section className={r.hero}>
        <p className={r.line}>{vocabResultsLine(profile, results.correct, results.total, session.seed)}</p>
        {results.flashcards > 0 && results.total > 0 && <p className={styles.part}>Flashcards</p>}
        {results.flashcards > 0 && (
          <dl className={`${r.stats} ${styles.marks}`}>
            <div>
              <dt>Know it</dt>
              <dd className="tabular">{results.marks.know}</dd>
            </div>
            <div>
              <dt>Unsure</dt>
              <dd className="tabular">{results.marks.unsure}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd className="tabular">{results.marks.review}</dd>
            </div>
          </dl>
        )}
        {results.flashcards > 0 && results.total > 0 && <p className={styles.part}>Quiz cards</p>}
        {results.total > 0 && (
          <>
            <div className={r.score}>
              <span className={`${r.big} tabular`}>{results.correct}</span>
              <span className={r.of}>of {results.total}</span>
            </div>
            <dl className={r.stats}>
              <div>
                <dt>Accuracy</dt>
                <dd className="tabular">{results.total ? Math.round((results.correct / results.total) * 100) : 0}%</dd>
              </div>
              <div>
                <dt>Total time</dt>
                <dd className="tabular">{duration(results.totalMs)}</dd>
              </div>
              <div>
                <dt>Per card</dt>
                <dd className="tabular">{duration(results.avgMs)}</dd>
              </div>
            </dl>
            {results.slips > 0 && <p className={r.flags}>{results.slips === 1 ? '1 spelling slip, counted as right' : `${results.slips} spelling slips, counted as right`}</p>}
          </>
        )}
        {toReview > 0 && <p className={r.flags}>{toReview === 1 ? '1 word comes back tomorrow.' : `${toReview} words come back tomorrow.`}</p>}
      </section>

      <div className={r.actions}>
        {toReview > 0 && (
          <Button block onClick={redo} disabled={starting}>
            {toReview === 1 ? 'Redo this word' : `Redo these ${toReview} words`}
          </Button>
        )}
        <Button block variant={toReview > 0 ? 'secondary' : undefined} onClick={again} disabled={starting}>
          {starting ? 'Shuffling…' : 'Another session, same settings'}
        </Button>
        <Button block variant={toReview > 0 ? 'quiet' : 'secondary'} onClick={() => navigate('/vocab')}>
          Change settings
        </Button>
      </div>

      <section className={r.review}>
        <div className={r.reviewHead}>
          <h3 className={r.h3}>Words</h3>
        </div>
        {groups.map((g) => (
          <div key={g.id}>
            <p className={styles.part}>
              {g.label} · {g.items.length}
            </p>
            <ol className={r.list}>
              {g.items.map((it) => {
                const w = words.get(it.wordId)!;
                const showYours = !it.flashcard && !isPassing(it.grade);
                return (
                  <li key={it.index} className={r.item}>
                    <Mark grade={it.grade} />
                    <div className={r.itemBody}>
                      <p className={styles.word}>
                        {w.word} <span className={styles.pos}>{w.pos}</span>
                      </p>
                      <p className={r.note}>{sentence(w.meaning)}</p>
                      {showYours && <p className={r.ans}>{it.answer === null ? 'Skipped' : <span className={r.yours}>{it.answer}</span>}</p>}
                      {it.grade === 'slip' && <p className={r.ans}>Typed “{it.answer}”, a spelling slip</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </section>
    </main>
  );
}
