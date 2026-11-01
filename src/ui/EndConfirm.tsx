import { Button } from './controls';
import styles from './EndConfirm.module.css';

/** Asks before ending a session early. Drawn in the page: some in-app browsers silently refuse window.confirm. */
export function EndConfirm({ message, endLabel, onKeep, onEnd }: { message: string; endLabel: string; onKeep: () => void; onEnd: () => void }) {
  return (
    <div className={styles.wrap} role="alertdialog" aria-label={endLabel}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" block onClick={onKeep}>
          Keep going
        </Button>
        <Button block onClick={onEnd}>
          {endLabel}
        </Button>
      </div>
    </div>
  );
}
