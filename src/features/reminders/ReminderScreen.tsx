import { useEffect, useState } from 'react';
import { reminderState, reminderSupport, turnOnReminder, type TurnOnResult } from '../../app/reminders';
import { getReminderTime } from '../../data/repo/meta';
import { Button, Field } from '../../ui/controls';
import { Wordmark } from '../../ui/Wordmark';
import styles from './ReminderScreen.module.css';

/** '19:00' → '7 pm', '07:30' → '7:30 am'. */
export function spokenTime(time: string): string {
  const [h = 19, m = 0] = time.split(':').map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

export const TURN_ON_PROBLEM: Record<Exclude<TurnOnResult, 'on'>, string> = {
  blocked: 'Notifications are blocked for this app. Allow them in your phone’s settings, then try again.',
  offline: 'Could not turn it on. Check your connection and try again.',
};

/** Whether this phone can have reminders, now or once installed, and doesn't yet. */
export async function remindersOff(): Promise<boolean> {
  const support = reminderSupport();
  if (support === 'needs-install') return true;
  return support === 'ok' && !(await reminderState()).on;
}

/**
 * The full-screen offer (0059): shown once after What's New to anyone without reminders, and from
 * Home's card on iPhone, where reminders need the app on the Home Screen first.
 */
export function ReminderScreen({ onDone, doneLabel }: { onDone: () => void; doneLabel: string }) {
  const support = reminderSupport();
  const [time, setTime] = useState('19:00');
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    void getReminderTime().then(setTime);
  }, []);

  const turnOn = async () => {
    setBusy(true);
    setProblem('');
    const result = await turnOnReminder(time);
    if (result === 'on') setOn(true);
    else setProblem(TURN_ON_PROBLEM[result]);
    setBusy(false);
  };

  return (
    <main className={styles.page}>
      <header>
        <p className={styles.eyebrow}>
          <Wordmark />
        </p>
        <h1 className={styles.title}>{on ? 'Reminders are on' : 'Keep your streak going'}</h1>
      </header>

      {on ? (
        <p className={styles.text}>You’ll get a nudge around {spokenTime(time)}. Change the time or turn them off in Settings.</p>
      ) : (
        <>
          <ul className={styles.points}>
            <li>A nudge at your usual study time</li>
            <li>Quiet once you’ve studied that day</li>
            <li>At most 2 a day</li>
          </ul>
          {support === 'ok' ? (
            <Field label="Your usual study time">
              <input className={`${styles.input} tabular`} type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} />
            </Field>
          ) : (
            <>
              <p className={styles.text}>One step first: add Graphite to your Home Screen.</p>
              <ol className={styles.steps}>
                <li>Back up first: Settings, then Export. The Home Screen app starts empty.</li>
                <li>In Safari, tap Share, then Add to Home Screen.</li>
                <li>Open Graphite from your Home Screen and import your backup in Settings.</li>
                <li>Turn on reminders there.</li>
              </ol>
            </>
          )}
          {problem && (
            <p className={styles.problem} role="alert">
              {problem}
            </p>
          )}
        </>
      )}

      <div className={styles.done}>
        {!on && support === 'ok' && (
          <Button block onClick={turnOn} disabled={busy}>
            {busy ? 'One moment…' : 'Turn on reminders'}
          </Button>
        )}
        <Button block variant={on || support !== 'ok' ? undefined : 'quiet'} onClick={onDone}>
          {on || support !== 'ok' ? doneLabel : 'Not now'}
        </Button>
      </div>
    </main>
  );
}
