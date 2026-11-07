import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reminderSupport, turnOnReminder } from '../../app/reminders';
import { useAsync } from '../../app/useAsync';
import { getReminderCardHiddenUntil, getReminderTime, setReminderCardHiddenUntil } from '../../data/repo/meta';
import { addDays, toDay } from '../../engine/dates';
import { Button } from '../../ui/controls';
import { remindersOff, spokenTime, TURN_ON_PROBLEM } from './ReminderScreen';
import styles from './ReminderCard.module.css';

/** Days Not now hides the card for. */
const SNOOZE_DAYS = 3;

async function cardState(): Promise<{ time: string } | null> {
  const [off, hiddenUntil, time] = await Promise.all([remindersOff(), getReminderCardHiddenUntil(), getReminderTime()]);
  return off && (!hiddenUntil || hiddenUntil <= toDay(new Date())) ? { time } : null;
}

/** Top of Home while reminders are off (0059). Turn on asks for permission straight from the tap. */
export function ReminderCard() {
  const navigate = useNavigate();
  const { data, reload } = useAsync(cardState);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  if (!data) return null;
  // On iPhone in Safari there is nothing to turn on yet; the screen shows the Home Screen steps.
  const iphone = reminderSupport() === 'needs-install';

  const turnOn = async () => {
    if (iphone) return navigate('/reminders');
    setBusy(true);
    setProblem('');
    const result = await turnOnReminder(data.time);
    setBusy(false);
    if (result === 'on') reload();
    else setProblem(TURN_ON_PROBLEM[result]);
  };

  return (
    <div className={styles.card}>
      <div>
        <p className={styles.title}>Reminders are off</p>
        <p className={styles.meta}>Get a nudge at {spokenTime(data.time)}, quiet once you’ve studied.</p>
        {problem && (
          <p className={styles.meta} role="alert">
            {problem}
          </p>
        )}
      </div>
      <div className={styles.actions}>
        <Button
          variant="quiet"
          onClick={async () => {
            await setReminderCardHiddenUntil(addDays(toDay(new Date()), SNOOZE_DAYS));
            reload();
          }}
        >
          Not now
        </Button>
        <Button onClick={turnOn} disabled={busy}>
          {busy ? 'One moment…' : 'Turn on'}
        </Button>
      </div>
    </div>
  );
}
