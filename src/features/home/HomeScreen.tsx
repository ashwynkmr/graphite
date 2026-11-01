import { Link } from 'react-router-dom';
import { DEFAULT_EXAM_DAY, daysToExam, toDay } from '../../engine/dates';
import { IconSettings } from '../../app/icons';
import { useUpdatePrompt } from '../../app/useUpdatePrompt';
import { ComingSoon, Screen } from '../../ui/Screen';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const days = daysToExam(toDay(new Date()), DEFAULT_EXAM_DAY);
  const { needRefresh, reload } = useUpdatePrompt();

  return (
    <Screen
      title="Graphite"
      action={
        <Link to="/settings" className={styles.iconLink} aria-label="Settings">
          <IconSettings />
        </Link>
      }
    >
      {needRefresh && (
        <div className={styles.banner} role="status">
          <span>Update available</span>
          <button type="button" className={styles.bannerAction} onClick={reload}>
            Reload
          </button>
        </div>
      )}

      {days !== null && (
        <div className={styles.countdown}>
          <span className={`${styles.days} tabular`}>{days}</span>
          <span className={styles.daysLabel}>{days === 1 ? 'day to go' : 'days to go'}</span>
        </div>
      )}

      <ComingSoon>Quick drill and today's plan arrive in the next build.</ComingSoon>
    </Screen>
  );
}
