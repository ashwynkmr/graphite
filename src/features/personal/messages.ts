// Encouragement copy (0019, 0020). Personalised with the user's name; all lines are original,
// short and about studying. Shown on Home and Results only, never during a session.
import type { Profile } from '../../data/repo/meta';

function name(p: Profile | null): string {
  return p?.name || 'there';
}

/** Stable pick for the day, so Home doesn't change line on every visit. */
function pickForDay<T>(items: readonly T[], day: string): T {
  let h = 0;
  for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return items[h % items.length]!;
}

export function greeting(p: Profile | null, hour: number): string {
  const part = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 22 ? 'Good evening' : 'Late night';
  return `${part}, ${name(p)}.`;
}

export function homeLine(p: Profile | null, day: string, daysLeft: number | null): string {
  const n = name(p);
  const lines = [
    `Small sessions add up, ${n}. Let's do one.`,
    'One focused drill beats an hour of scrolling.',
    'Speed comes from reps. Today’s reps start here.',
    `You don’t need perfect, ${n}. You need practice.`,
    'Show up today and the test gets a little smaller.',
    `Sharp mind, steady pencil. You’ve got this, ${n}.`,
    'Aim for a little faster than yesterday.',
    `The numbers are on your side, ${n}. Go get them.`,
  ];
  if (daysLeft !== null && daysLeft <= 7) lines.push(`${daysLeft} days, ${n}. Every session counts now.`);
  return pickForDay(lines, day);
}

/** Encouragement sized to the score. Low scores focus on the next step, not praise. */
export function resultsLine(p: Profile | null, correct: number, total: number, seed: number): string {
  const acc = total ? correct / total : 0;
  const n = name(p);
  const bands: string[][] = [
    [`${n}, ${correct} of ${total}. That’s the pace.`, `Clean work, ${n}. Keep that rhythm.`, `${correct} of ${total}. You’re ready for harder ones, ${n}.`],
    [`Solid, ${n}. Review the misses and they’ll stick.`, `${correct} of ${total}, ${n}. Close. The review below will get you there.`],
    [`Good effort, ${n}. The review below is where the points are.`, `${n}, every miss you look at now is one you won’t make on test day.`],
    [`Tough set, ${n}. That’s what practice is for.`, `Rough one, ${n}. Read the shortcuts below, then go again.`],
  ];
  const band = acc >= 0.9 ? 0 : acc >= 0.7 ? 1 : acc >= 0.5 ? 2 : 3;
  const options = bands[band]!;
  return options[seed % options.length]!;
}

/**
 * Vocab results. `total` counts quiz cards only; with none (a flashcards-only session) the line is
 * about the next showing, since self-marked cards aren't a score.
 */
export function vocabResultsLine(p: Profile | null, correct: number, total: number, seed: number): string {
  const n = name(p);
  if (total === 0) {
    const lines = [`${n}, every card you marked honestly is a card scheduled right.`, `Done, ${n}. The ones you weren’t sure of come back tomorrow.`, `That’s a stack, ${n}. Words stick on the second and third look.`];
    return lines[seed % lines.length]!;
  }
  const acc = total ? correct / total : 0;
  const bands: string[][] = [
    [`${correct} of ${total}, ${n}. These words are yours.`, `Sharp, ${n}. Time for words further down the list.`],
    [`Solid, ${n}. Read the misses below once more and they’ll stick.`, `${correct} of ${total}, ${n}. A few more looks and they’re yours.`],
    [`Good start, ${n}. The misses come back tomorrow, and you’ll know them better.`, `${n}, every word you read below is one less surprise on test day.`],
    [`New words are meant to be hard, ${n}. Read the list below and go again tomorrow.`, `Tough set, ${n}. That’s exactly what the review is for.`],
  ];
  const band = acc >= 0.9 ? 0 : acc >= 0.7 ? 1 : acc >= 0.5 ? 2 : 3;
  const options = bands[band]!;
  return options[seed % options.length]!;
}
