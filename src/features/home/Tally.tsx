import { filledStrokes, type GoalRow } from '../../engine/stats/progress';
import styles from './Tally.module.css';

const GATES = 5;
const STROKES_PER_GATE = 5;
const STROKES = ['M4 3v14', 'M10 3v14', 'M16 3v14', 'M22 3v14', 'M1 15 26 5'];

/** Progress as pencil tally marks: five gates of five strokes, the fifth stroke crossing the other four. */
export function Tally({ row }: { row: GoalRow }) {
  const filled = filledStrokes(row, GATES * STROKES_PER_GATE);
  return (
    <span className={styles.tally} aria-hidden="true">
      {Array.from({ length: GATES }, (_, g) => (
        <svg key={g} viewBox="0 0 28 20" className={styles.gate}>
          {STROKES.map((d, s) => (
            <path key={s} d={d} className={g * STROKES_PER_GATE + s < filled ? styles.on : undefined} />
          ))}
        </svg>
      ))}
    </span>
  );
}
