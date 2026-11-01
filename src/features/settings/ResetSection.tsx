import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveBackupFile } from '../../app/backup-file';
import { turnOffReminder } from '../../app/reminders';
import { applyTheme } from '../../app/theme';
import { resetAll, resetProgress } from '../../data/export-import';
import { Button } from '../../ui/controls';
import { useProfile } from '../personal/ProfileContext';
import styles from './SettingsScreen.module.css';

type Level = 'progress' | 'everything';

const COPY: Record<Level, { title: string; body: string }> = {
  progress: {
    title: 'Reset progress',
    body: 'Clears drills, answers, vocab boxes, stars, the mistake log and streaks. Keeps your name and settings.',
  },
  everything: {
    title: 'Reset everything',
    body: 'Clears all progress, your name and your settings, and goes back to the first screen, as on a fresh install.',
  },
};

const CONFIRM_WORD = 'reset';

/** Two levels (PRD v0.6). Both ask on the page: some in-app browsers silently refuse window.confirm. */
export function ResetSection({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate();
  const { reload } = useProfile();
  const [level, setLevel] = useState<Level | null>(null);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState('');
  const [exported, setExported] = useState(false);

  const open = (l: Level) => {
    setLevel(l);
    setTyped('');
    setStatus('');
    setExported(false);
  };

  const confirm = async () => {
    if (level === 'progress') {
      await resetProgress();
      setLevel(null);
      setStatus('Progress cleared.');
      return;
    }
    // Stop reminders first: a fresh install shouldn't keep buzzing.
    await turnOffReminder();
    await resetAll();
    applyTheme('system');
    onReset();
    navigate('/');
    await reload();
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Reset</h2>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => open('progress')}>
          Reset progress
        </Button>
        <Button variant="secondary" onClick={() => open('everything')}>
          Reset everything
        </Button>
      </div>
      {level && (
        <div className={styles.panel} role="alertdialog" aria-label={COPY[level].title}>
          <p className={styles.panelTitle}>{COPY[level].title}</p>
          <p className={styles.hint}>{COPY[level].body} This can't be undone without an export file.</p>
          <Button variant="secondary" onClick={async () => setExported(await saveBackupFile())}>
            {exported ? 'Backup saved' : 'Export first'}
          </Button>
          <label className={styles.hint}>
            Type {CONFIRM_WORD} to confirm
            <input
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setLevel(null)}>
              Cancel
            </Button>
            <Button disabled={typed.trim().toLowerCase() !== CONFIRM_WORD} onClick={confirm}>
              Reset
            </Button>
          </div>
        </div>
      )}
      {status && <p className={styles.status}>{status}</p>}
    </section>
  );
}
