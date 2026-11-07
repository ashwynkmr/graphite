import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconSettings } from '../../app/icons';
import { requestPersistence } from '../../app/storage';
import { useAsync } from '../../app/useAsync';
import type { AnySession } from '../../data/db';
import { fixedLength, getSettings, setRoundDeclined } from '../../data/repo/meta';
import { discardSession, getResumable } from '../../data/repo/quant-sessions';
import { loadHome } from '../../data/repo/stats';
import { daysBetween, daysToExam, toDay, type Day } from '../../engine/dates';
import type { Nudge } from '../../engine/stats/nudge';
import type { GoalRow } from '../../engine/stats/progress';
import { Button } from '../../ui/controls';
import { greeting, homeLine } from '../personal/messages';
import { followNudge, NudgeCard } from '../personal/NudgeCard';
import { nudgeText } from '../personal/nudgeText';
import { useProfile } from '../personal/ProfileContext';
import { duration } from '../quant/display';
import { startDrill } from '../quant/startDrill';
import { ReminderCard } from '../reminders/ReminderCard';
import { roundToOffer, startVocab } from '../vocab/startVocab';
import styles from './HomeScreen.module.css';
import { Tally } from './Tally';

const BACKUP_REMINDER_DAYS = 3;
const DAY_MS = 86_400_000;

function dayLabel(day: Day, today: Day): string {
  const ago = daysBetween(day, today);
  if (ago === 0) return 'today';
  if (ago === 1) return 'yesterday';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function LastSession({ session, today }: { session: AnySession; today: Day }) {
  const score = session.score ? `${session.score.correct} of ${session.score.total} · ` : '';
  const kind = session.type === 'vocab' ? 'Vocab' : 'Quant';
  return (
    <Link to={session.type === 'vocab' ? `/vocab/results/${session.id}` : `/results/${session.id}`} className={styles.last}>
      <span className={styles.lastLabel}>Last session</span>
      <span className="tabular">
        {kind} {score}
        {duration(session.timer.elapsedMs)} · {dayLabel(session.day, today)}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function TodayRow({ label, row }: { label: string; row: GoalRow }) {
  return (
    <div className={styles.row}>
      <span>{label}</span>
      <b className="tabular">
        {row.done} / {row.goal}
      </b>
      <Tally row={row} />
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const now = new Date();
  const today = toDay(now);
  const { data: settings } = useAsync(getSettings);
  const { data: resumable, reload: reloadResumable } = useAsync(() => getResumable());
  const { data: home } = useAsync(() => loadHome(today, now.getHours()));
  const [starting, setStarting] = useState(false);
  const { data: offeredRound, reload: reloadRound } = useAsync(roundToOffer);

  const days = settings ? daysToExam(today, settings.examDay) : null;

  useEffect(() => {
    if (home?.hasProgress) void requestPersistence();
  }, [home?.hasProgress]);

  const drill = async (patch: Partial<NonNullable<typeof settings>['quant']>) => {
    if (!settings) return;
    setStarting(true);
    const s = await startDrill({ ...fixedLength(settings.quant, 20), topics: 'mixed', answerMode: 'mix', ...patch }, false);
    navigate(`/quant/session/${s.id}`);
  };

  const vocab = async (deck?: 'today') => {
    if (!settings) return;
    setStarting(true);
    const s = await startVocab(deck ? { ...settings.vocab, deck } : settings.vocab);
    // The chosen deck is empty: setup shows what is available instead.
    navigate(s ? `/vocab/session/${s.id}` : '/vocab');
  };

  const startNudge = async (n: Nudge) => {
    setStarting(true);
    navigate(await followNudge(n));
  };

  const exportDaysAgo = home?.lastExportAt ? Math.floor((now.getTime() - home.lastExportAt) / DAY_MS) : null;
  const remindBackup = home?.hasProgress && (exportDaysAgo === null || exportDaysAgo >= BACKUP_REMINDER_DAYS);

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

      <ReminderCard />

      {offeredRound && !resumable && (
        <div className={styles.resume}>
          <div>
            <p className={styles.resumeTitle}>You've seen every word. Start Round {offeredRound}?</p>
            <p className={styles.resumeMeta}>All 1,500 again, weakest first.</p>
          </div>
          <div className={styles.resumeActions}>
            <Button
              variant="quiet"
              onClick={async () => {
                await setRoundDeclined(offeredRound);
                reloadRound();
              }}
            >
              Not now
            </Button>
            <Button
              onClick={async () => {
                if (!settings) return;
                const s = await startVocab({ ...settings.vocab, deck: 'round' });
                if (s) navigate(`/vocab/session/${s.id}`);
              }}
            >
              Start Round {offeredRound}
            </Button>
          </div>
        </div>
      )}

      {resumable && (
        <div className={styles.resume}>
          <div>
            <p className={styles.resumeTitle}>{resumable.type === 'vocab' ? 'Vocab session in progress' : 'Drill in progress'}</p>
            <p className={styles.resumeMeta}>
              {resumable.type === 'quant' && resumable.settings.timer === 'sprint' ? `${resumable.cursor} answered · clock paused` : `${resumable.cursor} of ${resumable.items.length} ${resumable.type === 'vocab' ? 'cards done' : 'answered · clock paused'}`}
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

      <div className={styles.cards}>
        {days !== null && (
          <div className={styles.card}>
            <b className={`${styles.big} ${styles.days} tabular`}>{days}</b>
            <span>{days === 1 ? 'day to go' : 'days to go'}</span>
          </div>
        )}
        <div className={days === null ? `${styles.card} ${styles.wide}` : styles.card}>
          <b className={`${styles.big} tabular`}>{home?.streak.current ?? 0}</b>
          <span>day streak</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={() => drill({})} disabled={!settings || starting}>
          Quick drill
        </Button>
        <Button variant="secondary" onClick={() => vocab()} disabled={!settings || starting}>
          Continue vocab
        </Button>
      </div>

      {home && (
        <section className={styles.today} aria-label="Today">
          <h2 className={styles.todayTitle}>Today</h2>
          <TodayRow label="Words due" row={home.plan.due} />
          <TodayRow label="New words" row={home.plan.newWords} />
          <TodayRow label="Quant" row={home.plan.quant} />
        </section>
      )}

      {home?.nudge && !resumable && <NudgeCard text={nudgeText(home.nudge)} action="Start" disabled={!settings || starting} onAction={() => startNudge(home.nudge!)} />}

      {home?.last && <LastSession session={home.last} today={today} />}

      {remindBackup && (
        <Link to="/settings" className={styles.backup}>
          {exportDaysAgo === null ? 'No backup yet. Export your progress in Settings.' : `Last backup ${exportDaysAgo} days ago. Export again in Settings.`}
        </Link>
      )}
    </section>
  );
}
