// Which wake-ups are due. The server holds no rules about studying: the phone sends the times.

/** A late wake-up still helps; one hours late, after a long outage, doesn't. */
export const SEND_WINDOW_MS = 30 * 60 * 1000;

/** At most one send per round, however many times have come due; the rest are spent. */
export function splitDue(wakeTimes: readonly number[], now: number): { send: boolean; remaining: number[] } {
  const due = wakeTimes.filter((t) => t <= now);
  return { send: due.some((t) => now - t < SEND_WINDOW_MS), remaining: wakeTimes.filter((t) => t > now) };
}
