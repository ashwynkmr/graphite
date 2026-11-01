import { useEffect, useState } from 'react';
import styles from './ChoiceList.module.css';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface PairChoiceListProps {
  choices: string[];
  onSubmit: (a: string, b: string) => void;
  onSkip: () => void;
}

/** Six options; choose exactly two, so markers are square (round means pick one). A third tap replaces the older pick. Selection is neutral: no right or wrong shown. */
export function PairChoiceList({ choices, onSubmit, onSkip }: PairChoiceListProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (v: string) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v].slice(-2)));
  const [a, b] = selected;
  const submit = () => {
    if (a && b) onSubmit(a, b);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = '123456'.indexOf(e.key) >= 0 ? '123456'.indexOf(e.key) : LETTERS.indexOf(e.key.toUpperCase());
      if (i >= 0 && choices[i]) toggle(choices[i]!);
      else if (e.key === 'Enter') submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={styles.wrap}>
      <ul className={styles.list} aria-label="Choose two words">
        {choices.map((c, i) => {
          const on = selected.includes(c);
          return (
            <li key={c}>
              <button type="button" aria-pressed={on} className={`${styles.choice} ${styles.compact} ${on ? styles.on : ''}`} onClick={() => toggle(c)}>
                <span className={`${styles.letter} ${styles.square}`}>{LETTERS[i]}</span>
                <span className={styles.text}>{c}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className={styles.actions}>
        <button type="button" className={styles.skip} onClick={onSkip}>
          Skip
        </button>
        <button type="button" className={styles.submit} onClick={submit} disabled={selected.length !== 2}>
          Submit
        </button>
      </div>
    </div>
  );
}
