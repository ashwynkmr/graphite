import { useCallback, useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import styles from './Dial.module.css';

/** Width of one value on the dial, in px. Keep in step with `.item` in Dial.module.css. */
const ITEM = 60;

/**
 * A horizontal number dial: swipe and it snaps to the value under the centre mark.
 * Values curve away from the centre like a drum turning, and each small tick is one step of 1.
 * Uses native scroll-snap so momentum feels right on iPhone; acts as a slider for keyboards and screen readers.
 */
export function Dial({ label, values, value, onChange, format }: { label: string; values: readonly number[]; value: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const show = format ?? String;
  const track = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const settle = useRef<number>();
  // The index the dial is at or heading to, so an outside value change can tell whether it needs to move.
  const at = useRef(-1);
  const index = Math.max(0, values.indexOf(value));

  // Turn each value around the vertical axis by its distance from the centre.
  const paint = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    items.current.forEach((item) => {
      if (!item) return;
      const d = item.offsetLeft + ITEM / 2 - centre;
      const turn = Math.max(-70, Math.min(70, d / 2.4));
      item.style.transform = `rotateY(${-turn}deg)`;
      item.style.opacity = String(Math.max(0.15, 1 - Math.abs(d) / 170));
    });
  }, []);

  const scrollTo = useCallback((i: number, smooth: boolean) => {
    const el = track.current;
    if (!el) return;
    at.current = i;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: i * ITEM, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }, []);

  // Follow the value when it changes from outside (settings load) without fighting a swipe in progress.
  useLayoutEffect(() => {
    if (at.current === index) return;
    scrollTo(index, false);
    paint();
  }, [index, scrollTo, paint]);

  useEffect(() => {
    paint();
    return () => window.clearTimeout(settle.current);
  }, [paint]);

  const onScroll = () => {
    paint();
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = track.current;
      if (!el) return;
      const i = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollLeft / ITEM)));
      at.current = i;
      const v = values[i] ?? value;
      if (v !== value) onChange(v);
    }, 90);
  };

  const step = (by: number) => {
    const i = Math.max(0, Math.min(values.length - 1, index + by));
    if (i === index) return;
    onChange(values[i] ?? value);
    scrollTo(i, true);
  };

  const onKey = (e: KeyboardEvent) => {
    const by = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (by) {
      e.preventDefault();
      step(by);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const i = e.key === 'Home' ? 0 : values.length - 1;
      onChange(values[i] ?? value);
      scrollTo(i, true);
    }
  };

  return (
    <div className={styles.dial}>
      <div
        ref={track}
        className={styles.track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        aria-valuenow={value}
        aria-valuetext={show(value)}
        onScroll={onScroll}
        onKeyDown={onKey}
      >
        {values.map((v, i) => (
          <button
            key={v}
            ref={(b) => {
              items.current[i] = b;
            }}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={v === value ? `${styles.item} ${styles.itemOn}` : styles.item}
            onClick={() => {
              onChange(v);
              scrollTo(i, true);
            }}
          >
            <span className={`${styles.num} ${format ? styles.compact : ''} tabular`}>{show(v)}</span>
          </button>
        ))}
      </div>
      <span className={styles.mark} aria-hidden="true" />
    </div>
  );
}
