import { useRef, useState } from 'react';
import { saveBackupFile } from '../../app/backup-file';
import { isPersisted } from '../../app/storage';
import { applyTheme } from '../../app/theme';
import { useAsync } from '../../app/useAsync';
import { checkBackup, importAll, type Backup, type ImportError } from '../../data/export-import';
import { getLastExportAt, getSettings } from '../../data/repo/meta';
import { Button } from '../../ui/controls';
import { Wordmark } from '../../ui/Wordmark';
import { useProfile } from '../personal/ProfileContext';
import styles from './SettingsScreen.module.css';

function ImportErrorText({ error }: { error: ImportError }) {
  if (error === 'newer-version') {
    return (
      <>
        This backup is from a newer version of <Wordmark />. Update the app first.
      </>
    );
  }
  return (
    <>
      This file is not a <Wordmark /> backup.
    </>
  );
}

const shortDate = (at: number) => new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export function BackupSection({ onRestored }: { onRestored: () => void }) {
  const { reload: reloadProfile } = useProfile();
  const fileInput = useRef<HTMLInputElement>(null);
  const { data: lastExportAt, reload: reloadExport } = useAsync(getLastExportAt);
  const { data: persisted } = useAsync(isPersisted);
  const [error, setError] = useState<ImportError | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [status, setStatus] = useState('');

  const choose = async (file: File) => {
    setError(null);
    setStatus('');
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      setError('not-a-backup');
      return;
    }
    const check = checkBackup(raw);
    if (check.ok) setPending(check.backup);
    else setError(check.error);
  };

  const restore = async () => {
    if (!pending) return;
    const res = await importAll(pending);
    setPending(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    applyTheme((await getSettings()).theme);
    await reloadProfile();
    onRestored();
    reloadExport();
    setStatus('Progress restored.');
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Backup</h2>
      <p className={styles.hint}>
        Progress lives only on this device. Export it to a file to keep it safe or move it to another device.
        {lastExportAt ? ` Last export ${shortDate(lastExportAt)}.` : ' No export yet.'}
        {persisted === false && ' This browser may clear stored data if the device runs low on space.'}
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={async () => {
            setError(null);
            if (await saveBackupFile()) {
              reloadExport();
              setStatus('Backup saved.');
            }
          }}
        >
          Export
        </Button>
        <Button variant="secondary" onClick={() => fileInput.current?.click()}>
          Import
        </Button>
      </div>
      <input
        ref={fileInput}
        className={styles.fileInput}
        type="file"
        accept=".json,application/json"
        aria-label="Backup file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void choose(file);
        }}
      />
      {error && (
        <p className={styles.status} role="alert">
          <ImportErrorText error={error} />
        </p>
      )}
      {pending && (
        <div className={styles.panel} role="alertdialog" aria-label="Replace progress">
          <p className={styles.panelTitle}>Replace everything on this device with the backup from {shortDate(pending.exportedAt)}?</p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button onClick={restore}>Replace</Button>
          </div>
        </div>
      )}
      {status && <p className={styles.status}>{status}</p>}
    </section>
  );
}
