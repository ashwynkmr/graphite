import { useEffect, useRef } from 'react';
import { isValidPartialInput } from '../engine/matching/numeric-answer';
import styles from './Keypad.module.css';

/** 4 × 4 layout: digits on the left, editing keys on the right, a wide 0 under the thumb. */
const KEYS: { key: string; label: string; aria: string; wide?: boolean }[] = [
  ...['7', '8', '9'].map((k) => ({ key: k, label: k, aria: k })),
  { key: 'back', label: '⌫', aria: 'delete' },
  ...['4', '5', '6'].map((k) => ({ key: k, label: k, aria: k })),
  { key: '.', label: '.', aria: 'decimal point' },
  ...['1', '2', '3'].map((k) => ({ key: k, label: k, aria: k })),
  { key: '/', label: '⁄', aria: 'fraction slash' },
  { key: '-', label: '−', aria: 'minus' },
  { key: '0', label: '0', aria: '0', wide: true },
];

interface KeypadProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

/** Thumb-reachable numeric keypad. Refuses keys that would make the answer invalid. */
export function Keypad({ value, onChange, onSubmit, onSkip }: KeypadProps) {
  // Fast typing can fire several keys before React re-renders, so read and write through a ref.
  const current = useRef(value);
  current.current = value;
  const set = (v: string) => {
    current.current = v;
    onChange(v);
  };
  const press = (k: string) => {
    const v = current.current;
    if (k === 'back') return set(v.slice(0, -1));
    // Minus toggles the sign of the whole answer.
    if (k === '-') return set(v.startsWith('-') ? v.slice(1) : `-${v}`);
    if (isValidPartialInput(v + k)) set(v + k);
  };

  // Physical keyboard on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9./]$/.test(e.key)) press(e.key);
      else if (e.key === '-') press('-');
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') onSubmit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={styles.pad}>
      <div className={styles.grid}>
        {KEYS.map((k) => (
          <button key={k.key} type="button" className={k.wide ? `${styles.key} ${styles.wide}` : styles.key} onClick={() => press(k.key)} aria-label={k.aria}>
            {k.label}
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.skip} onClick={onSkip}>
          Skip
        </button>
        <button type="button" className={styles.submit} onClick={onSubmit} disabled={!value || value === '-'}>
          Submit
        </button>
      </div>
    </div>
  );
}
