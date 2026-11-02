import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './controls.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet'; block?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', block, className, ...rest }, ref) {
  return <button ref={ref} type="button" className={[styles.button, styles[variant], block ? styles.block : '', className ?? ''].join(' ')} {...rest} />;
});

export function Chip({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={selected ? `${styles.chip} ${styles.chipOn}` : styles.chip} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? `${styles.segment} ${styles.segmentOn}` : styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled block on a setup screen. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span className={styles.fieldLabel}>{label}</span>
        {hint && <span className={styles.fieldHint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/**
 * Several options that can each be on or off (difficulty). Drawn as toggle chips with a check mark,
 * not as a segmented control, so it's obvious more than one can be chosen. At least one stays on.
 */
export function ToggleGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: readonly T[];
  onChange: (v: T[]) => void;
  /** Columns in the grid; defaults to one row. */
  columns?: number;
}) {
  const toggle = (v: T) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    if (next.length) onChange(options.map((o) => o.value).filter((o) => next.includes(o)));
  };
  return (
    <div className={styles.toggleGroup} role="group" aria-label={label} style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, 1fr)` }}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={String(o.value)} type="button" aria-pressed={on} className={on ? `${styles.toggle} ${styles.toggleOn}` : styles.toggle} onClick={() => toggle(o.value)}>
            <svg viewBox="0 0 16 16" className={styles.check} aria-hidden="true">
              {on ? <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />}
            </svg>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
