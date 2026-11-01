import { splitDue } from './schedule';
import type { Store, SubscriptionRow } from './store';

export type Send = (sub: SubscriptionRow) => Promise<void>;

/** Sends what's due. Returns counts only: push addresses never reach the logs. */
export async function sendDue(store: Store, send: Send, now: number): Promise<{ sent: number; removed: number; failed: number }> {
  const counts = { sent: 0, removed: 0, failed: 0 };
  for (const sub of await store.all()) {
    const { send: isDue, remaining } = splitDue(sub.wakeTimes, now);
    if (remaining.length === sub.wakeTimes.length) continue;
    if (!isDue) {
      // Everything that came due is too old to be useful.
      await store.setWakeTimes(sub.endpoint, remaining);
      continue;
    }
    try {
      await send(sub);
      await store.setWakeTimes(sub.endpoint, remaining);
      counts.sent++;
    } catch (e) {
      // 404 and 410 mean the phone dropped this subscription for good. Anything else retries next minute.
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await store.remove(sub.endpoint);
        counts.removed++;
      } else {
        counts.failed++;
      }
    }
  }
  return counts;
}
