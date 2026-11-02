import { useState } from 'react';
import { setTutorialOwed, setWhatsNewSeen } from '../../data/repo/meta';
import { Button } from '../../ui/controls';
import { Wordmark } from '../../ui/Wordmark';
import { useProfile } from '../personal/ProfileContext';
import { RELEASE } from '../whatsnew/WhatsNewScreen';
import styles from './OnboardingScreen.module.css';

/** First run: ask for a name. Stored only on this device. */
export function OnboardingScreen() {
  const { save } = useProfile();
  const [name, setName] = useState('');
  const ready = name.trim().length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>
          <Wordmark />
        </p>
        <h1 className={styles.title}>Hello. What should we call you?</h1>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            // Everything is new to a new user: no news owed, now or next time, but a quick tour is.
            if (ready) void Promise.all([setWhatsNewSeen(RELEASE), setTutorialOwed(true)]).then(() => save({ name }));
          }}
        >
          <label className={styles.label} htmlFor="name">
            First name
          </label>
          <input
            id="name"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={24}
            placeholder="Your name"
            autoFocus
          />
          <p className={styles.preview}>“You’ve got this{name.trim() ? `, ${name.trim()}` : ''}.”</p>
          <Button type="submit" block disabled={!ready}>
            Start studying
          </Button>
          <p className={styles.note}>Your name stays on this device. Change it any time in Settings.</p>
        </form>
      </div>
    </main>
  );
}
