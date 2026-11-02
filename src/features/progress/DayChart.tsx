import { useState } from 'react';
import type { Day } from '../../engine/dates';
import { shortDay } from '../share/summary';
import styles from './DayChart.module.css';

export interface ChartDay {
  day: Day;
  /** Null leaves a gap: nothing happened that day. */
  value: number | null;
  /** How the value reads, for the line above the chart and for screen readers. */
  text: string;
}

const W = 343;
const H = 112;
const PLOT_LEFT = 34;
const PLOT_TOP = 6;
const PLOT_BOTTOM = H - 20;
const BAR = 10;

/**
 * Fourteen days in one colour, one measure per chart (one axis). Tap a day to read it: a phone has no
 * hover, so the reading sits above the chart and starts on the latest day with data.
 */
export function DayChart({ title, days, kind, max, ticks, tickText }: { title: string; days: ChartDay[]; kind: 'line' | 'bar'; max: number; ticks: readonly number[]; tickText: (v: number) => string }) {
  const [picked, setPicked] = useState<Day | null>(null);
  const latest = [...days].reverse().find((d) => d.value !== null) ?? null;
  const shown = days.find((d) => d.day === picked) ?? latest;
  const step = (W - PLOT_LEFT) / days.length;
  const x = (i: number) => PLOT_LEFT + step * (i + 0.5);
  const y = (v: number) => PLOT_BOTTOM - (v / max) * (PLOT_BOTTOM - PLOT_TOP);
  const shownAt = shown ? days.indexOf(shown) : -1;

  // A line joins neighbouring days only; a gap in study stays a gap.
  const segments: string[] = [];
  days.forEach((d, i) => {
    const next = days[i + 1];
    if (d.value !== null && next?.value !== null && next) segments.push(`M${x(i)} ${y(d.value)}L${x(i + 1)} ${y(next.value!)}`);
  });

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.head}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.reading} tabular`} aria-live="polite">
          {shown ? `${shortDay(shown.day)}: ${shown.text}` : 'Nothing yet'}
        </span>
      </figcaption>
      <div className={styles.plot}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PLOT_LEFT} x2={W} y1={y(t)} y2={y(t)} className={styles.grid} />
              <text x={PLOT_LEFT - 6} y={y(t) + 3.5} textAnchor="end" className={styles.axis}>
                {tickText(t)}
              </text>
            </g>
          ))}
          {shownAt >= 0 && <line x1={x(shownAt)} x2={x(shownAt)} y1={PLOT_TOP} y2={PLOT_BOTTOM} className={styles.cross} />}
          {kind === 'line' && segments.map((d) => <path key={d} d={d} className={styles.line} />)}
          {days.map((d, i) =>
            d.value === null ? null : kind === 'line' ? (
              <circle key={d.day} cx={x(i)} cy={y(d.value)} r={4} className={styles.dot} />
            ) : d.value > 0 ? (
              <path key={d.day} d={`M${x(i) - BAR / 2} ${PLOT_BOTTOM}V${y(d.value) + 4}q0 -4 4 -4h${BAR - 8}q4 0 4 4V${PLOT_BOTTOM}z`} className={styles.bar} />
            ) : null,
          )}
          <text x={PLOT_LEFT} y={H - 4} className={styles.axis}>
            {shortDay(days[0]!.day)}
          </text>
          <text x={W} y={H - 4} textAnchor="end" className={styles.axis}>
            {shortDay(days[days.length - 1]!.day)}
          </text>
        </svg>
        <div className={styles.targets} style={{ left: `${(PLOT_LEFT / W) * 100}%`, gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
          {days.map((d) => (
            <button key={d.day} type="button" className={styles.target} aria-label={`${title}, ${shortDay(d.day)}: ${d.text}`} aria-pressed={shown?.day === d.day} onClick={() => setPicked(d.day)} />
          ))}
        </div>
      </div>
    </figure>
  );
}
