import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../app/useAsync';
import { loadResultsNudge } from '../../data/repo/stats';
import { toDay } from '../../engine/dates';
import type { Nudge } from '../../engine/stats/nudge';
import { fixedLength, getSettings } from '../../data/repo/meta';
import { Button } from '../../ui/controls';
import { startDrill } from '../quant/startDrill';
import { startVocab } from '../vocab/startVocab';
import { nudgeText, pausedText } from './nudgeText';
import styles from './NudgeCard.module.css';

/** One line of advice with one button. Only ever outside a session. */
export function NudgeCard({ text, action, disabled, onAction }: { text: string; action: string; disabled?: boolean; onAction: () => void }) {
  return (
    <div className={styles.nudge}>
      <p className={styles.text}>{text}</p>
      <Button variant="secondary" onClick={onAction} disabled={disabled}>
        {action}
      </Button>
    </div>
  );
}

/** Starts what a suggestion suggests, and says where to go. */
export async function followNudge(n: Nudge): Promise<string> {
  const { quant, vocab } = await getSettings();
  if (n.kind === 'due') {
    const s = await startVocab({ ...vocab, deck: 'today' });
    // The deck emptied meanwhile: setup shows what is available instead.
    return s ? `/vocab/session/${s.id}` : '/vocab';
  }
  const base = { ...fixedLength(quant, 20), topics: 'mixed' as const, answerMode: 'mix' as const };
  const s =
    n.kind === 'weak'
      ? await startDrill({ ...base, topics: [n.topic] }, false)
      : n.kind === 'slow'
        ? await startDrill({ ...base, topics: [n.topic], timer: 'per-set' }, false)
        : await startDrill({ ...fixedLength(quant, 5), topics: 'mixed', answerMode: 'mix' }, false);
  return `/quant/session/${s.id}`;
}

/** What to do next, at the foot of a results screen: a paused session first, then the usual suggestion. */
export function ResultsNudge() {
  const navigate = useNavigate();
  const { data } = useAsync(() => {
    const now = new Date();
    return loadResultsNudge(toDay(now), now.getHours());
  });
  if (!data) return null;
  const { paused, nudge } = data;
  if (paused) {
    return <NudgeCard text={pausedText({ type: paused.type, cursor: paused.cursor, total: paused.items.length, sprint: paused.type === 'quant' && paused.settings.timer === 'sprint' })} action="Resume" onAction={() => navigate(`/${paused.type}/session/${paused.id}`)} />;
  }
  if (!nudge) return null;
  return <NudgeCard text={nudgeText(nudge)} action="Start" onAction={async () => navigate(await followNudge(nudge))} />;
}
