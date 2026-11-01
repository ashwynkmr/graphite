import { useState } from 'react';
import { canPromptInstall, isInstalled, isIos, promptInstall } from '../../app/install';
import { Button } from '../../ui/controls';
import styles from './SettingsScreen.module.css';

/** Install button where the browser offers one; the Share-sheet steps on iPhone; nothing once installed. */
export function InstallSection() {
  const [available, setAvailable] = useState(canPromptInstall);
  if (isInstalled()) return null;
  if (!available && !isIos()) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Install</h2>
      {available ? (
        <Button
          variant="secondary"
          onClick={async () => {
            if (await promptInstall()) setAvailable(false);
          }}
        >
          Add to home screen
        </Button>
      ) : (
        <p className={styles.hint}>In Safari, tap Share, then Add to Home Screen. It then opens full-screen and is less likely to lose your progress.</p>
      )}
    </section>
  );
}
