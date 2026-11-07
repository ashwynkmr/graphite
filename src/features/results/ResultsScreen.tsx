import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { loadBank } from '../../content/bank';
import type { SessionRow } from '../../data/db';
import { getSession } from '../../data/repo/quant-sessions';
import type { Difficulty, Topic } from '../../engine/generators/types';
import { resolveQuestion } from '../../engine/sessions/questions';
import { scoreQuant, weakestFirst, type QuantResults, type ScoredItem, type Tally } from '../../engine/stats/quant-results';
import { Button } from '../../ui/controls';
import { MathText } from '../../ui/MathText';
import { ReportProblem } from '../../ui/ReportProblem';
import { resultsLine } from '../personal/messages';
import { ResultsNudge } from '../personal/NudgeCard';
import { useProfile } from '../personal/ProfileContext';
import { DIFFICULTY_LABEL, duration, showValue, sprintName, TOPIC_LABEL } from '../quant/display';
import { startDrill, startRetry } from '../quant/startDrill';
import { ShareButton } from '../share/ShareButton';
import { quantShare } from '../share/summary';
import styles from './ResultsScreen.module.css';

function pctText(t: Tally): string {
  return `${t.correct}/${t.total}`;
}

/** Pencil marks for the review list. */
function Mark({ status }: { status: ScoredItem['status'] }) {
  if (status === 'correct') {
    return (
      <svg viewBox="0 0 24 24" className={`${styles.mark} ${styles.good}`} aria-label="Correct">
        <path d="M4 13.5 9.5 19 20 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'wrong') {
    return (
      <svg viewBox="0 0 24 24" className={`${styles.mark} ${styles.bad}`} aria-label="Wrong">
        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={`${styles.mark} ${styles.bad}`} aria-label={status === 'skipped' ? 'Skipped' : 'Not reached'}>
      <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Breakdown({ title, rows }: { title: string; rows: [string, Tally][] }) {
  if (!rows.length) return null;
  return (
    <section className={styles.breakdown}>
      <h3 className={styles.h3}>{title}</h3>
      <ul className={styles.rows}>
        {rows.map(([label, t]) => (
          <li key={label} className={styles.row}>
            <span>{label}</span>
            <span className={styles.ruler} aria-hidden="true">
              {t.correct > 0 && <span style={{ width: `${(t.correct / t.total) * 100}%` }} />}
            </span>
            <span className={`tabular ${styles.rowCount}`}>{pctText(t)}</span>
            <span className="tabular">{Math.round((t.correct / t.total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResultsScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [results, setResults] = useState<QuantResults | null>(null);
  const [onlyMisses, setOnlyMisses] = useState(false);

  useEffect(() => {
    Promise.all([getSession(id), loadBank()]).then(([s, bank]) => {
      if (!s) return navigate('/', { replace: true });
      if (s.status !== 'finished') return navigate(`/quant/session/${id}`, { replace: true });
      setSession(s);
      setResults(
        scoreQuant(
          s.items.map((it, i) => ({
            question: resolveQuestion(it.ref, bank.byId)!,
            mode: it.mode,
            answer: i < s.answers.length ? s.answers[i]!.value : undefined,
            ms: s.answers[i]?.ms ?? 0,
          })),
        ),
      );
    });
  }, [id, navigate]);

  const misses = useMemo(() => results?.items.filter((i) => i.status !== 'correct') ?? [], [results]);

  if (!session || !results) return <div className={styles.loading}>Marking your drill…</div>;

  const slow = results.items.filter((i) => i.flags.includes('slow')).length;
  const careless = results.items.filter((i) => i.flags.includes('careless')).length;
  const notReached = results.items.filter((i) => i.status === 'not-reached').length;
  const shown = onlyMisses ? misses : results.items;

  const retry = async () => {
    const s = await startRetry(session, misses.map((m) => session.items[m.index]!));
    navigate(`/quant/session/${s.id}`);
  };
  const again = async () => {
    const s = await startDrill(session.settings, false);
    navigate(`/quant/session/${s.id}`);
  };

  const kind = session.origin.kind === 'retry' ? 'Retry' : session.origin.kind === 'mistakes' ? 'My mistakes' : session.settings.timer === 'sprint' ? `${sprintName(session.settings.sprintSeconds)} sprint` : 'Quant drill';

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link to="/" className={styles.back}>
          Done
        </Link>
        <span className={styles.kind}>{kind}</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.line}>{resultsLine(profile, results.correct, results.total, session.seed)}</p>
        <div className={styles.score}>
          <span className={`${styles.big} tabular`}>{results.correct}</span>
          <span className={styles.of}>of {results.total}</span>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>Accuracy</dt>
            <dd className="tabular">{Math.round(results.accuracy * 100)}%</dd>
          </div>
          <div>
            <dt>Total time</dt>
            <dd className="tabular">{duration(results.totalMs)}</dd>
          </div>
          <div>
            <dt>Per question</dt>
            <dd className="tabular">{duration(results.avgMs)}</dd>
          </div>
        </dl>
        {(slow > 0 || careless > 0 || notReached > 0) && (
          <p className={styles.flags}>
            {[slow && `${slow} slow but right`, careless && `${careless} fast but wrong (careless?)`, notReached && `${notReached} not reached`].filter(Boolean).join(' · ')}
          </p>
        )}
        {session.levelChanges?.map((c) => (
          <p key={c.topic} className={styles.flags}>
            {TOPIC_LABEL[c.topic]} moves {c.to > c.from ? 'up' : 'down'} to {DIFFICULTY_LABEL[c.to]} next time.
          </p>
        ))}
      </section>

      <div className={styles.actions}>
        {misses.length > 0 && (
          <Button block onClick={retry}>
            Retry {misses.length} wrong
          </Button>
        )}
        <Button block variant="secondary" onClick={again}>
          {session.settings.timer === 'sprint' && session.origin.kind === 'drill' ? 'New sprint' : 'New drill, same settings'}
        </Button>
        <ShareButton card={quantShare(kind, results)} day={session.day} />
      </div>

      <ResultsNudge />

      <Breakdown title="By topic" rows={weakestFirst((Object.entries(results.byTopic) as [Topic, Tally][]).map(([k, t]) => [TOPIC_LABEL[k], t]))} />
      <Breakdown title="By difficulty" rows={(Object.entries(results.byDifficulty) as [string, Tally][]).map(([k, t]) => [DIFFICULTY_LABEL[Number(k) as Difficulty], t])} />
      <Breakdown
        title="Typed vs multiple choice"
        rows={(Object.entries(results.byMode) as ['typed' | 'mcq', Tally][]).map(([k, t]) => [k === 'typed' ? 'Typed' : 'Multiple choice', t])}
      />

      <section className={styles.review}>
        <div className={styles.reviewHead}>
          <h3 className={styles.h3}>Review</h3>
          {misses.length > 0 && misses.length < results.items.length && (
            <button type="button" className={styles.toggle} onClick={() => setOnlyMisses((v) => !v)}>
              {onlyMisses ? 'Show all' : 'Only misses'}
            </button>
          )}
        </div>
        <ol className={styles.list}>
          {shown.map((it) => (
            <li key={it.index} className={styles.item}>
              <Mark status={it.status} />
              <div className={styles.itemBody}>
                <p className={styles.q}>
                  <span className={styles.num}>{it.index + 1}.</span> <MathText text={it.question.prompt} />
                </p>
                <p className={styles.ans}>
                  {it.status === 'correct' ? (
                    <>
                      <strong><MathText text={showValue(it.question, it.question.answer)} /></strong>
                    </>
                  ) : (
                    <>
                      <span className={styles.yours}>{it.status === 'not-reached' ? 'Not reached' : it.status === 'skipped' ? 'Skipped' : <MathText text={showValue(it.question, it.answer)} />}</span>
                      <span aria-hidden="true"> → </span>
                      <strong><MathText text={showValue(it.question, it.question.answer)} /></strong>
                    </>
                  )}
                  <span className={styles.time}>
                    {it.status !== 'not-reached' && duration(it.ms)}
                    {it.flags.includes('slow') && ' · slow'}
                    {it.flags.includes('careless') && ' · careless?'}
                  </span>
                </p>
                <p className={styles.note}>
                  <MathText text={it.question.explain} />
                </p>
                <ReportProblem id={it.question.id} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
