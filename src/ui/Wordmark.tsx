import styles from './Wordmark.module.css';

/** The app's name as it appears on screen, gRAPHITE: a small g, drawn larger than the capitals after it. */
export function Wordmark() {
  return (
    <span className={styles.wordmark} role="img" aria-label="Graphite">
      <span className={styles.g}>g</span>
      <span className={styles.rest}>raphite</span>
    </span>
  );
}
