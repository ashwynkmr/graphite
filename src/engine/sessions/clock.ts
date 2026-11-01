// Session clock from timestamps, never interval ticks (TRD "Timer"). The visible time is
// elapsedMs + (now − activeSince). Hiding the app absorbs the running time and stops the clock,
// so a locked phone or closed tab doesn't burn time.

export interface Clock {
  elapsedMs: number;
  activeSince: number | null;
  /** Elapsed time when the current item appeared. */
  itemStartedAtMs: number;
}

export function startClock(now: number): Clock {
  return { elapsedMs: 0, activeSince: now, itemStartedAtMs: 0 };
}

export function elapsed(c: Clock, now: number): number {
  return c.elapsedMs + (c.activeSince === null ? 0 : Math.max(0, now - c.activeSince));
}

export function pause(c: Clock, now: number): Clock {
  return c.activeSince === null ? c : { ...c, elapsedMs: elapsed(c, now), activeSince: null };
}

export function resume(c: Clock, now: number): Clock {
  return c.activeSince === null ? { ...c, activeSince: now } : c;
}

/** Time on the current item so far, excluding paused time. */
export function itemMs(c: Clock, now: number): number {
  return elapsed(c, now) - c.itemStartedAtMs;
}

/** Marks the start of the next item. */
export function nextItem(c: Clock, now: number): Clock {
  return { ...c, itemStartedAtMs: elapsed(c, now) };
}

/** Milliseconds left on a per-set limit (never negative). */
export function remaining(c: Clock, limitMs: number, now: number): number {
  return Math.max(0, limitMs - elapsed(c, now));
}
