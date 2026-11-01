import { forwardRef, useImperativeHandle, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import styles from './SwipeCard.module.css';

export type SwipeMark = 'review' | 'know' | 'unsure';

export interface SwipeCardHandle {
  /** Flies the card off in the mark's direction, then reports it (buttons and arrow keys). */
  fling: (mark: SwipeMark) => void;
}

/** How far a drag must go to count, px. */
const THRESHOLD_X = 90;
const THRESHOLD_UP = 80;
/** Movement under this is a tap (flip), not a drag. */
const TAP_SLOP = 8;
const FLY_MS = 220;

/** The glyph for each mark: cross, tick, question mark. Shared by the swipe stamps and the buttons. */
export function MarkIcon({ mark }: { mark: SwipeMark }) {
  return (
    <svg viewBox="0 0 48 48" className={styles.icon} aria-hidden="true">
      {mark === 'review' && <path d="M16 16l16 16M32 16 16 32" />}
      {mark === 'know' && <path d="M14 25l7 7 13-15" />}
      {mark === 'unsure' && (
        <>
          <path d="M18.5 18.5a5.5 5.5 0 1 1 8.2 4.8c-1.7 1-2.7 2.2-2.7 4.2v1" />
          <circle cx="24" cy="34.5" r="0.6" />
        </>
      )}
    </svg>
  );
}

const FLY_TO: Record<SwipeMark, { x: number; y: number; r: number }> = {
  review: { x: -1.4, y: 0.05, r: -18 },
  know: { x: 1.4, y: 0.05, r: 18 },
  unsure: { x: 0, y: -1.2, r: 0 },
};

/**
 * A flashcard you can swipe: right = Know it, left = Review, up = Unsure. Tap flips it.
 * The overlays show the user's own mark as they drag; they never say whether the answer was right.
 */
export const SwipeCard = forwardRef<
  SwipeCardHandle,
  { flipped: boolean; onFlip: () => void; onMark: (m: SwipeMark) => void; corner?: ReactNode; front: ReactNode; back: ReactNode; nudge?: boolean }
>(function SwipeCard({ flipped, onFlip, onMark, corner, front, back, nudge }, ref) {
    const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
    // A one-time sway that shows the card can move; stops the moment the user touches it.
    const [nudging, setNudging] = useState(Boolean(nudge));
    const [flying, setFlying] = useState<SwipeMark | null>(null);
    const start = useRef<{ x: number; y: number; id: number } | null>(null);
    const done = useRef(false);

    const fling = (mark: SwipeMark) => {
      if (done.current) return;
      done.current = true;
      setFlying(mark);
      window.setTimeout(() => onMark(mark), FLY_MS);
    };
    useImperativeHandle(ref, () => ({ fling }));

    const markFor = (x: number, y: number): SwipeMark | null => {
      if (-y > THRESHOLD_UP && -y > Math.abs(x)) return 'unsure';
      if (x > THRESHOLD_X) return 'know';
      if (x < -THRESHOLD_X) return 'review';
      return null;
    };

    const onDown = (e: PointerEvent<HTMLDivElement>) => {
      if (done.current) return;
      setNudging(false);
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrag({ x: 0, y: 0, active: true });
    };
    const onMove = (e: PointerEvent<HTMLDivElement>) => {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      // Down drags don't mean anything; keep them small.
      setDrag({ x: e.clientX - s.x, y: Math.min(e.clientY - s.y, 24), active: true });
    };
    const onUp = (e: PointerEvent<HTMLDivElement>) => {
      const s = start.current;
      if (!s || s.id !== e.pointerId) return;
      start.current = null;
      const x = e.clientX - s.x;
      const y = e.clientY - s.y;
      setDrag({ x: 0, y: 0, active: false });
      if (Math.hypot(x, y) < TAP_SLOP) return onFlip();
      const mark = markFor(x, Math.min(y, 24));
      if (mark) {
        setDrag({ x, y: Math.min(y, 24), active: false });
        fling(mark);
      }
    };

    // Overlay strength follows the drag, so the mark fades in as you commit to it.
    const { x, y } = drag;
    const strength = (m: SwipeMark) => {
      if (flying) return flying === m ? 1 : 0;
      if (m === 'know') return Math.max(0, Math.min(1, x / THRESHOLD_X));
      if (m === 'review') return Math.max(0, Math.min(1, -x / THRESHOLD_X));
      return -y > Math.abs(x) ? Math.max(0, Math.min(1, -y / THRESHOLD_UP)) : 0;
    };

    const to = flying ? FLY_TO[flying] : null;
    const transform = to
      ? `translate(${to.x * 100}vw, ${to.y * 100}vh) rotate(${to.r}deg)`
      : `translate(${x}px, ${y}px) rotate(${x / 18}deg)`;

    return (
      <div className={styles.wrap}>
        <div
          className={`${styles.card} ${drag.active ? styles.dragging : ''} ${nudging ? styles.nudge : ''}`}
          onAnimationEnd={() => setNudging(false)}
          style={{ transform, transitionDuration: flying ? `${FLY_MS}ms` : undefined }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="button"
          tabIndex={-1}
          aria-label={flipped ? 'Card back. Swipe right if you knew it, left to review, up if unsure.' : 'Tap to show the meaning'}
        >
          <div className={`${styles.inner} ${flipped ? styles.flipped : ''}`}>
            <div className={`${styles.face} ${styles.front}`}>{front}</div>
            <div className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
              {back}
            </div>
          </div>

          {corner && (
            <div className={styles.corner} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
              {corner}
            </div>
          )}
        </div>
        {(['review', 'know', 'unsure'] as const).map((m) => (
          <span key={m} className={`${styles.stamp} ${styles[m]}`} style={{ opacity: strength(m) * 0.85 }} aria-hidden="true">
            <MarkIcon mark={m} />
          </span>
        ))}
      </div>
    );
});
