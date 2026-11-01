import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadBank } from '../../content/bank';
import type { SessionRow } from '../../data/db';
import { finishSession, getSession, recordAnswer, saveClock } from '../../data/repo/quant-sessions';
import { pause, remaining, resume } from '../../engine/sessions/clock';
import { resolveQuestion, type PlayableQuestion } from '../../engine/sessions/questions';
import { ChoiceList } from '../../ui/ChoiceList';
import { EndConfirm } from '../../ui/EndConfirm';
import { Keypad } from '../../ui/Keypad';
import { MathText } from '../../ui/MathText';
import { clock, showValue } from './display';
import styles from './DrillScreen.module.css';

/** One question per screen. No right/wrong is ever shown here (0007). */
export function DrillScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [questions, setQuestions] = useState<PlayableQuestion[]>([]);
  const [input, setInput] = useState('');
  const [choice, setChoice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const busy = useRef(false);
  const sessionRef = useRef<SessionRow | null>(null);
  sessionRef.current = session;

  // Load, and resume the clock.
  useEffect(() => {
    let live = true;
    Promise.all([getSession(id), loadBank()]).then(async ([s, bank]) => {
      if (!live) return;
      if (!s || s.status !== 'active') return navigate(s?.status === 'finished' ? `/results/${id}` : '/', { replace: true });
      const qs = s.items.map((it) => resolveQuestion(it.ref, bank.byId)!);
      const resumed = { ...s, timer: resume(s.timer, Date.now()) };
      await saveClock(resumed);
      setQuestions(qs);
      setSession(resumed);
    });
    return () => {
      live = false;
    };
  }, [id, navigate]);

  // Pause the clock whenever the app is hidden (phone locked, app switched, tab closed).
  useEffect(() => {
    const onVis = () => {
      const s = sessionRef.current;
      if (!s) return;
      const t = Date.now();
      const next = { ...s, timer: document.hidden ? pause(s.timer, t) : resume(s.timer, t) };
      setSession(next);
      void saveClock(next);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onVis);
      const s = sessionRef.current;
      if (s && s.status === 'active') void saveClock({ ...s, timer: pause(s.timer, Date.now()) });
    };
  }, []);

  const finish = useCallback(
    async (s: SessionRow, endedBy: NonNullable<SessionRow['endedBy']>) => {
      await finishSession(s, questions, endedBy);
      navigate(`/results/${s.id}`, { replace: true });
    },
    [questions, navigate],
  );

  // Redraw the clock; end a timed set at zero.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const s = sessionRef.current;
      if (s && s.limitMs !== null && !busy.current && remaining(s.timer, s.limitMs, t) <= 0) {
        busy.current = true;
        void finish(s, 'timeout');
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finish]);

  const submit = async (value: string | null) => {
    const s = sessionRef.current;
    if (!s || busy.current) return;
    busy.current = true;
    const next = await recordAnswer(s, questions[s.cursor]!, value);
    setInput('');
    setChoice(null);
    if (next.cursor >= next.items.length) {
      await finish(next, 'completed');
      return;
    }
    setSession(next);
    busy.current = false;
  };

  const endEarly = async () => {
    const s = sessionRef.current;
    if (!s || busy.current) return;
    busy.current = true;
    await finish(s, 'ended-early');
  };

  if (!session || !questions.length) return <div className={styles.loading}>Opening your drill…</div>;

  const item = session.items[session.cursor]!;
  const q = questions[session.cursor]!;
  const timeText = session.limitMs !== null ? clock(remaining(session.timer, session.limitMs, now)) : null;
  const low = session.limitMs !== null && remaining(session.timer, session.limitMs, now) < 30_000;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.headerBtn} onClick={() => navigate('/')} aria-label="Pause and go home">
          Pause
        </button>
        <div className={styles.progress}>
          <span className="tabular">
            {session.cursor + 1} / {session.items.length}
          </span>
          <div className={styles.bar} aria-hidden="true">
            <div className={styles.fill} style={{ width: `${(session.cursor / session.items.length) * 100}%` }} />
          </div>
        </div>
        <span className={`${styles.timer} tabular ${low ? styles.low : ''}`} aria-label={timeText ? `Time left ${timeText}` : 'Untimed'}>
          {timeText ?? ''}
        </span>
      </header>

      <main className={styles.body}>
        <div className={styles.card}>
          <p className={styles.prompt}>
            <MathText text={q.prompt} />
          </p>
          {item.mode === 'typed' && (
            <div className={styles.answerLine} aria-live="polite">
              {q.unit?.prefix && <span className={styles.unit}>{q.unit.prefix}</span>}
              <span className={`${styles.typed} tabular`}>{input ? input.replace('-', '−').replace('/', '⁄') : <span className={styles.caret}>|</span>}</span>
              {q.unit?.suffix && <span className={styles.unit}>{q.unit.suffix}</span>}
            </div>
          )}
          {q.rounding && <p className={styles.hint}>Round to the nearest {q.rounding === 'whole' ? 'whole number' : q.rounding}.</p>}
        </div>
      </main>

      <footer className={styles.footer}>
        {confirmingEnd ? (
          <EndConfirm message="End this drill? Unanswered questions count as not reached." endLabel="End drill" onKeep={() => setConfirmingEnd(false)} onEnd={endEarly} />
        ) : (
          <>
        {item.mode === 'typed' ? (
          <Keypad value={input} onChange={setInput} onSubmit={() => input && input !== '-' && submit(input)} onSkip={() => submit(null)} />
        ) : (
          <ChoiceList
            choices={item.choices!.map((c) => ({ value: c, label: showValue(q, c) }))}
            selected={choice}
            onSelect={setChoice}
            onSubmit={() => choice && submit(choice)}
            onSkip={() => submit(null)}
          />
        )}
            <button type="button" className={styles.end} onClick={() => setConfirmingEnd(true)}>
              End drill
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
