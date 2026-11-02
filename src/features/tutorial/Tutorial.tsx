import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { setTutorialOwed } from '../../data/repo/meta';
import { Button } from '../../ui/controls';
import styles from './Tutorial.module.css';

export const useTutorial = create<{ open: boolean; start: () => void; close: () => void }>((set) => ({
  open: false,
  start: () => set({ open: true }),
  close: () => set({ open: false }),
}));

/** One stop per tab, on the real screen. Nothing here starts a session or writes study data. */
const STEPS = [
  { to: '/', title: 'Home', text: 'Your plan for today, the days left to your exam, and a suggestion for what to do next. Settings is the icon at the top.' },
  { to: '/quant', title: 'Quant', text: 'Timed mental-math drills. Choose your topics, difficulty and length. You see your score at the end, never during.' },
  { to: '/vocab', title: 'Vocab', text: 'All 1,500 GRE words, as flashcards and quizzes. You can browse and search them here too.' },
  { to: '/mistakes', title: 'Mistakes', text: 'Anything you miss lands here. Drill it, and it clears after two right answers in a row.' },
  { to: '/progress', title: 'Progress', text: 'Your trends and weakest topics. All of it stays on this device.' },
];

/** The guided walk: dims the app, lights each tab in turn (0050). */
export function Tutorial() {
  const close = useTutorial((s) => s.close);
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<DOMRect | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = STEPS[index]!;
  const last = index === STEPS.length - 1;

  useEffect(() => {
    navigate(step.to, { replace: true });
    next.current?.focus();
  }, [step.to, navigate]);

  useLayoutEffect(() => {
    const measure = () => setHole(document.querySelector(`[data-tab="${step.to}"]`)?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step.to]);

  const finish = () => {
    close();
    void setTutorialOwed(false);
    navigate('/', { replace: true });
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Quick tour"
      onKeyDown={(e) => {
        if (e.key === 'Escape') finish();
      }}
    >
      {hole ? (
        <div className={styles.hole} style={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height }} />
      ) : (
        <div className={styles.dim} />
      )}
      <div className={styles.tip}>
        <p className={styles.count}>
          {index + 1} of {STEPS.length}
        </p>
        <h2 className={styles.title}>{step.title}</h2>
        <p className={styles.text} aria-live="polite">
          {step.text}
        </p>
        <div className={styles.actions}>
          {!last && (
            <Button variant="quiet" onClick={finish}>
              Skip
            </Button>
          )}
          <Button ref={next} className={styles.next} onClick={() => (last ? finish() : setIndex(index + 1))}>
            {last ? 'Start studying' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
