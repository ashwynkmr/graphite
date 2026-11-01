import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface ScreenProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children?: ReactNode;
}

/** Standard tab screen: serif title, optional small label above, optional action at top right. */
export function Screen({ title, eyebrow, action, children }: ScreenProps) {
  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <div>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.title}>{title}</h1>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Quiet placeholder for screens that arrive in a later build step. */
export function ComingSoon({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
