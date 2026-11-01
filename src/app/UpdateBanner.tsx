import { useUpdatePrompt } from './useUpdatePrompt';
import styles from './UpdateBanner.module.css';

/** "Update available" on every tab screen, never inside a drill (sessions sit outside the tab layout). */
export function UpdateBanner() {
  const { needRefresh, reload } = useUpdatePrompt();
  if (!needRefresh) return null;
  return (
    <div className={styles.banner} role="status">
      <span>Update available</span>
      <button type="button" className={styles.action} onClick={reload}>
        Reload
      </button>
    </div>
  );
}
