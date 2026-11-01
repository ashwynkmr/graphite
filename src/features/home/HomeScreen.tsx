import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconSettings } from '../../app/icons';
import { useAsync } from '../../app/useAsync';
import { getSettings } from '../../data/repo/meta';
import { discardSession, getResumable } from '../../data/repo/quant-sessions';
import { daysToExam, toDay } from '../../engine/dates';
import { Button } from '../../ui/controls';
import { greeting, homeLine } from '../personal/messages';
import { useProfile } from '../personal/ProfileContext';
import { difficultiesLabel } from '../quant/display';
import { startDrill } from '../quant/startDrill';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { data: settings } = useAsync(getSettings);
  const { data: resumable, reload: reloadResumable } = useAsync(() => getResumable());
  const [starting, setStarting] = useState(false);

  const now = new Date();
  const today = toDay(now);
  const days = settings ? daysToExam(today, settings.examDay) : null;

  const quickDrill = async () => {
    if (!settings) return;
    setStarting(true);
    // Quick drill: 20 mixed questions, Mix answers, at the user's current level (PRD US-02).
    const s = await startDrill({ ...settings.quant, topics: 'mixed', length: 20, answerMode: 'mix' }, false);
    navigate(`/quant/session/${s.id}`);
  };

  return (
    <section className={styles.home}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{greeting(profile, now.getHours())}</h1>
          <p className={styles.line}>{homeLine(profile, today, days)}</p>
        </div>
        <Link to="/settings" className={styles.iconLink} aria-label="Settings">
          <IconSettings />
        </Link>
      </header>

      {resumable && (
        <div className={styles.resume}>
          <div>
            <p className={styles.resumeTitle}>{resumable.type === 'vocab' ? 'Vocab session in progress' : 'Drill in progress'}</p>
            <p className={styles.resumeMeta}>
              {resumable.cursor} of {resumable.items.length} {resumable.type === 'vocab' ? 'cards done' : 'answered · clock paused'}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <Button
              variant="quiet"
              onClick={async () => {
                await discardSession(resumable.id);
                reloadResumable();
              }}
            >
              Discard
            </Button>
            <Button onClick={() => navigate(`/${resumable.type}/session/${resumable.id}`)}>Resume</Button>
          </div>
        </div>
      )}

      {days !== null && (
        <div className={styles.countdown}>
          <span className={`${styles.days} tabular`}>{days}</span>
          <span className={styles.daysLabel}>{days === 1 ? 'day to go' : 'days to go'}</span>
        </div>
      )}

      <div className={styles.quick}>
        <Button block onClick={quickDrill} disabled={!settings || starting}>
          {starting ? 'Building your drill…' : 'Quick drill'}
        </Button>
        <p className={styles.quickMeta}>20 mixed questions · {settings ? difficultiesLabel(settings.quant.difficulties) : ''} · about 15 minutes</p>
        <Link to="/quant" className={styles.custom}>
          Choose topics and settings
        </Link>
      </div>
    </section>
  );
}
