import { describe, expect, it } from 'vitest';
import { addDays } from '../dates';
import { applyGrade, isDue, newSchedule, nextBox, type Box, type Grade, type WordSchedule } from './leitner';

const TODAY = '2026-11-03';
const at = (box: Box, over: Partial<WordSchedule> = {}): WordSchedule => ({
  ...newSchedule('laconic'),
  box,
  dueDay: box === 0 || box === 5 ? null : TODAY,
  ...over,
});

describe('nextBox', () => {
  // Every box × every grade.
  const table: [Box, Grade, Box][] = [
    [0, 'know', 1], [0, 'correct', 1], [0, 'slip', 1], [0, 'unsure', 1], [0, 'review', 1], [0, 'wrong', 1],
    [1, 'know', 2], [1, 'correct', 2], [1, 'slip', 2], [1, 'unsure', 1], [1, 'review', 1], [1, 'wrong', 1],
    [2, 'know', 3], [2, 'correct', 3], [2, 'slip', 3], [2, 'unsure', 2], [2, 'review', 1], [2, 'wrong', 1],
    [3, 'know', 4], [3, 'correct', 4], [3, 'slip', 4], [3, 'unsure', 3], [3, 'review', 1], [3, 'wrong', 1],
    [4, 'know', 5], [4, 'correct', 5], [4, 'slip', 5], [4, 'unsure', 4], [4, 'review', 1], [4, 'wrong', 1],
    [5, 'know', 5], [5, 'correct', 5], [5, 'slip', 5], [5, 'unsure', 5], [5, 'review', 1], [5, 'wrong', 1],
  ];
  it.each(table)('box %i + %s → box %i', (box, grade, expected) => {
    expect(nextBox(box, grade)).toBe(expected);
  });
});

describe('applyGrade due days', () => {
  it.each([
    [0, 'know', addDays(TODAY, 1)], // → box 1, tomorrow
    [1, 'know', addDays(TODAY, 1)], // → box 2, +1
    [2, 'know', addDays(TODAY, 3)], // → box 3, +3
    [3, 'know', addDays(TODAY, 7)], // → box 4, +7
    [4, 'know', null], // → retired
    [3, 'review', addDays(TODAY, 1)], // → box 1, tomorrow
    [3, 'unsure', addDays(TODAY, 1)], // stays in box 3 but due tomorrow
    [4, 'unsure', addDays(TODAY, 1)],
    [5, 'unsure', null], // retired stays retired
  ] as const)('box %i + %s → due %s', (box, grade, due) => {
    expect(applyGrade(at(box), grade, TODAY).schedule.dueDay).toBe(due);
  });

  it('due dates cross month and year boundaries', () => {
    expect(applyGrade(at(3), 'know', '2026-11-28').schedule.dueDay).toBe('2026-12-05');
    expect(applyGrade(at(1), 'know', '2026-12-31').schedule.dueDay).toBe('2027-01-01');
  });
});

describe('applyGrade requeue and counters', () => {
  it('requeues only failing grades', () => {
    expect(applyGrade(at(2), 'review', TODAY).requeue).toBe(true);
    expect(applyGrade(at(2), 'wrong', TODAY).requeue).toBe(true);
    expect(applyGrade(at(0), 'know', TODAY).requeue).toBe(false); // new + Know it: no same-session repeat
    expect(applyGrade(at(0), 'unsure', TODAY).requeue).toBe(false);
    expect(applyGrade(at(2), 'slip', TODAY).requeue).toBe(false);
  });

  it('counts seen and correct, and records the first-seen day once', () => {
    let s = newSchedule('laconic');
    s = applyGrade(s, 'know', TODAY).schedule;
    s = applyGrade(s, 'wrong', addDays(TODAY, 1)).schedule;
    s = applyGrade(s, 'slip', addDays(TODAY, 2)).schedule;
    expect(s).toMatchObject({ seen: 3, correct: 2, lastResult: 'slip', firstSeenDay: TODAY, box: 2 });
  });

  it('leaves starred and round untouched', () => {
    const s = applyGrade(at(2, { starred: true, round: 2 }), 'wrong', TODAY).schedule;
    expect(s.starred).toBe(true);
    expect(s.round).toBe(2);
  });

  it('does not mutate the input', () => {
    const s = at(2);
    applyGrade(s, 'know', TODAY);
    expect(s.box).toBe(2);
  });
});

describe('isDue', () => {
  it('is due when the due day has arrived, in boxes 1–4 only', () => {
    expect(isDue(at(2, { dueDay: TODAY }), TODAY)).toBe(true);
    expect(isDue(at(2, { dueDay: addDays(TODAY, -3) }), TODAY)).toBe(true);
    expect(isDue(at(2, { dueDay: addDays(TODAY, 1) }), TODAY)).toBe(false);
    expect(isDue(at(0), TODAY)).toBe(false);
    expect(isDue(at(5), TODAY)).toBe(false);
  });

  it('a card graded late at night is due the next calendar day, not 24 hours later', () => {
    const s = applyGrade(at(1), 'unsure', '2026-11-03').schedule;
    expect(isDue(s, '2026-11-03')).toBe(false);
    expect(isDue(s, '2026-11-04')).toBe(true);
  });
});
