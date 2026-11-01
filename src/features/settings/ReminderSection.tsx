import { useEffect, useState } from 'react';
import { changeReminderTime, reminderState, reminderSupport, turnOffReminder, turnOnReminder } from '../../app/reminders';
import { useAsync } from '../../app/useAsync';
import { Button, Field } from '../../ui/controls';
import styles from './SettingsScreen.module.css';

/** Reminders that follow how the user is studying, off until asked for. Studying works the same without them. */
export function ReminderSection() {
  const support = reminderSupport();
  const { data: state } = useAsync(reminderState);
  const [on, setOn] = useState(false);
  const [time, setTime] = useState('19:00');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (state) {
      setOn(state.on);
      setTime(state.time);
    }
  }, [state]);

  if (support === 'not-configured' || support === 'unsupported') return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Reminders</h2>
      {support === 'needs-install' ? (
        <p className={styles.hint}>On iPhone, add Graphite to your Home Screen and open it from there. You can turn on reminders then.</p>
      ) : (
        <>
          <Field label="Your usual study time">
            <input
              className={`${styles.input} ${styles.date} tabular`}
              type="time"
              value={time}
              onChange={async (e) => {
                const next = e.target.value;
                if (!next) return;
                setTime(next);
                setNote('');
                if (on && !(await changeReminderTime(next))) setNote('Could not save that time. Check your connection and try again.');
              }}
            />
          </Field>
          <Button
            variant="secondary"
            disabled={busy || !state}
            onClick={async () => {
              setBusy(true);
              setNote('');
              if (on) {
                await turnOffReminder();
                setOn(false);
              } else {
                const result = await turnOnReminder(time);
                setOn(result === 'on');
                if (result === 'blocked') setNote('Notifications are blocked for this app. Allow them in your phone’s settings, then try again.');
                if (result === 'offline') setNote('Could not turn it on. Check your connection and try again.');
              }
              setBusy(false);
            }}
          >
            {busy ? 'One moment…' : on ? 'Turn off reminders' : 'Turn on reminders'}
          </Button>
          <p className={styles.hint}>Reminders follow how you study: quiet once you’ve studied that day, a nudge for a paused drill or a streak about to end, and fewer if you’ve been away. At most 2 a day.</p>
          <p className={styles.hint}>A small server keeps your phone’s push address and the times to wake it, which can show when you study. Your results stay on this device, and your phone writes each message itself.</p>
          {note && (
            <p className={styles.status} role="alert">
              {note}
            </p>
          )}
        </>
      )}
    </section>
  );
}
