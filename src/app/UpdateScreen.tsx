import { useState } from 'react';
import { Button } from '../ui/controls';
import styles from './UpdateScreen.module.css';

/** Replaces the whole app when a new build is ready and no session is active. */
export function UpdateScreen({ onUpdate }: { onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);
  const update = () => {
    setUpdating(true);
    onUpdate();
  };
  return (
    <div className={styles.page} role="alertdialog" aria-modal="true" aria-labelledby="update-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Graphite</p>
        <h1 id="update-title" className={styles.title}>
          We sharpened the pencil.
        </h1>
        <p className={styles.body}>A fresher Graphite is ready. It won't take a second, and all your progress stays right where you left it.</p>
      </div>
      <Button block onClick={update} disabled={updating}>
        {updating ? 'One second…' : 'Update now'}
      </Button>
    </div>
  );
}
