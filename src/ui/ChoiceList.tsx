import { useEffect } from 'react';
import styles from './ChoiceList.module.css';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface ChoiceListProps {
  choices: { value: string; label: string }[];
  selected: string | null;
  onSelect: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}

/** Five options, A–E. Keys 1–5 or A–E select; Enter submits. Selection is neutral: no right or wrong shown. */
export function ChoiceList({ choices, selected, onSelect, onSubmit, onSkip }: ChoiceListProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = '12345'.indexOf(e.key) >= 0 ? '12345'.indexOf(e.key) : LETTERS.indexOf(e.key.toUpperCase());
      if (i >= 0 && choices[i]) onSelect(choices[i]!.value);
      else if (e.key === 'Enter' && selected) onSubmit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={styles.wrap}>
      <ul className={styles.list} role="radiogroup" aria-label="Answer choices">
        {choices.map((c, i) => (
          <li key={c.value}>
            <button
              type="button"
              role="radio"
              aria-checked={selected === c.value}
              className={selected === c.value ? `${styles.choice} ${styles.on}` : styles.choice}
              onClick={() => onSelect(c.value)}
            >
              <span className={styles.letter}>{LETTERS[i]}</span>
              <span className={styles.text}>{c.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <button type="button" className={styles.skip} onClick={onSkip}>
          Skip
        </button>
        <button type="button" className={styles.submit} onClick={onSubmit} disabled={!selected}>
          Submit
        </button>
      </div>
    </div>
  );
}
