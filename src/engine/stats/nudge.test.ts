import { describe, expect, it } from 'vitest';
import type { Topic } from '../generators/types';
import { pickNudge, type NudgeAttempt, type NudgeInput } from './nudge';

/** `right` correct and `wrong` wrong answers in one session. */
function answers(sessionId: string, topic: Topic, right: number, wrong: number, flags: string[] = []): NudgeAttempt[] {
  return [...Array.from({ length: right }, () => ({ sessionId, topic, correct: true, flags })), ...Array.from({ length: wrong }, () => ({ sessionId, topic, correct: false, flags: [] }))];
}

const base: NudgeInput = { attempts: [], drillIds: [], dueWords: 0, studiedToday: true, hour: 10 };

describe('pickNudge', () => {
  it('has nothing to say to someone who studied and has nothing due', () => {
    expect(pickNudge(base)).toBeNull();
  });

  it('picks the lowest topic under 90%', () => {
    const attempts = [...answers('s1', 'fractions', 6, 4), ...answers('s1', 'percents', 8, 2)];
    expect(pickNudge({ ...base, attempts, drillIds: ['s1'] })).toEqual({ kind: 'weak', topic: 'fractions', accuracy: 0.6 });
  });

  it('needs at least 10 answers', () => {
    expect(pickNudge({ ...base, attempts: answers('s1', 'fractions', 2, 7), drillIds: ['s1'] })).toBeNull();
  });

  it('does not call a topic weak at 90% or above', () => {
    expect(pickNudge({ ...base, attempts: answers('s1', 'fractions', 9, 1), drillIds: ['s1'] })).toBeNull();
  });

  it('looks only at the last 3 drills that included the topic', () => {
    const attempts = [...answers('old', 'fractions', 0, 10), ...answers('a', 'fractions', 10, 0), ...answers('b', 'fractions', 10, 0), ...answers('c', 'fractions', 10, 0)];
    expect(pickNudge({ ...base, attempts, drillIds: ['a', 'b', 'c', 'old'] })).toBeNull();
    expect(pickNudge({ ...base, attempts, drillIds: ['a', 'b', 'old', 'c'] })?.kind).toBe('weak');
  });

  it('reaches past 3 drills until a topic has 10 answers, as mixed drills give each topic only a few', () => {
    const attempts = ['a', 'b', 'c', 'd', 'e'].flatMap((id) => answers(id, 'fractions', 0, 2));
    expect(pickNudge({ ...base, attempts, drillIds: ['a', 'b', 'c', 'd', 'e'] })).toMatchObject({ kind: 'weak', topic: 'fractions' });
    expect(pickNudge({ ...base, attempts, drillIds: ['a', 'b', 'c', 'd'] })).toBeNull();
  });

  it('skips drills that left the topic out when counting back', () => {
    const attempts = [...answers('a', 'percents', 10, 0), ...answers('b', 'percents', 10, 0), ...answers('c', 'percents', 10, 0), ...answers('old', 'fractions', 0, 10)];
    expect(pickNudge({ ...base, attempts, drillIds: ['a', 'b', 'c', 'old'] })).toMatchObject({ kind: 'weak', topic: 'fractions' });
  });

  it('ignores retries and mistake drills, and questions never reached', () => {
    expect(pickNudge({ ...base, attempts: answers('retry', 'fractions', 0, 10), drillIds: [] })).toBeNull();
    const notReached = Array.from({ length: 10 }, () => ({ sessionId: 's1', topic: 'fractions' as Topic, correct: false, flags: ['not-reached'] }));
    expect(pickNudge({ ...base, attempts: [...answers('s1', 'fractions', 5, 0), ...notReached], drillIds: ['s1'] })).toBeNull();
  });

  it('puts due words after a weak topic and before a slow one', () => {
    const slow = answers('s1', 'percents', 10, 0, ['slow']);
    const weak = answers('s1', 'fractions', 5, 5);
    expect(pickNudge({ ...base, attempts: [...slow, ...weak], drillIds: ['s1'], dueWords: 64 })?.kind).toBe('weak');
    expect(pickNudge({ ...base, attempts: slow, drillIds: ['s1'], dueWords: 64 })).toEqual({ kind: 'due', count: 64 });
    expect(pickNudge({ ...base, attempts: slow, drillIds: ['s1'] })).toEqual({ kind: 'slow', topic: 'percents' });
  });

  it('calls a topic slow only when at least half its correct answers were slow', () => {
    const attempts = [...answers('s1', 'percents', 4, 0, ['slow']), ...answers('s1', 'percents', 6, 0)];
    expect(pickNudge({ ...base, attempts, drillIds: ['s1'] })).toBeNull();
  });

  it('asks for a session only by evening, on a day with none', () => {
    expect(pickNudge({ ...base, studiedToday: false, hour: 17 })).toBeNull();
    expect(pickNudge({ ...base, studiedToday: false, hour: 18 })).toEqual({ kind: 'idle' });
    expect(pickNudge({ ...base, studiedToday: true, hour: 20 })).toBeNull();
  });
});
