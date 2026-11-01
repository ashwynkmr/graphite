import { backupFileName, exportAll } from '../data/export-import';
import { setLastExportAt } from '../data/repo/meta';
import { isIos, isInstalled } from './install';

/**
 * Saves the backup file. An app opened from the iPhone home screen can't download, so it uses the
 * share sheet (Save to Files). Returns false if the user backed out, so the export isn't recorded.
 */
export async function saveBackupFile(now = new Date()): Promise<boolean> {
  const name = backupFileName(now);
  const text = JSON.stringify(await exportAll());
  const file = new File([text], name, { type: 'application/json' });

  if (isIos() && isInstalled() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      return false;
    }
  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  await setLastExportAt(now.getTime());
  return true;
}
