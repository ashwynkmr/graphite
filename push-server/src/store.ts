import type { SubscriptionInput } from './validate';

export type SubscriptionRow = SubscriptionInput;

export interface Store {
  init(): Promise<void>;
  /** Adds or replaces. Returns false when the store is full and this endpoint is new. */
  upsert(input: SubscriptionInput, max: number): Promise<boolean>;
  remove(endpoint: string): Promise<void>;
  all(): Promise<SubscriptionRow[]>;
  /** Spends the times up to now. A plan that arrived meanwhile keeps its later times. */
  setWakeTimes(endpoint: string, wakeTimes: number[]): Promise<void>;
}

/** Local testing only: a restart loses everything. */
export class MemoryStore implements Store {
  private rows = new Map<string, SubscriptionRow>();

  async init() {}

  async upsert(input: SubscriptionInput, max: number) {
    if (!this.rows.has(input.endpoint) && this.rows.size >= max) return false;
    this.rows.set(input.endpoint, { ...input });
    return true;
  }

  async remove(endpoint: string) {
    this.rows.delete(endpoint);
  }

  async all() {
    return [...this.rows.values()];
  }

  async setWakeTimes(endpoint: string, wakeTimes: number[]) {
    const row = this.rows.get(endpoint);
    if (row) row.wakeTimes = wakeTimes;
  }
}

/** Cloudflare's database. One statement for the cap, so two phones signing up together can't both pass. */
export class D1Store implements Store {
  constructor(private db: D1Database) {}

  async init() {
    await this.db.prepare(
      `CREATE TABLE IF NOT EXISTS subscriptions (
        endpoint TEXT PRIMARY KEY,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        wake_times TEXT NOT NULL
      )`,
    ).run();
  }

  async upsert(input: SubscriptionInput, max: number) {
    const result = await this.db.prepare(
      `INSERT INTO subscriptions (endpoint, p256dh, auth, wake_times)
       SELECT ?1, ?2, ?3, ?4
       WHERE EXISTS (SELECT 1 FROM subscriptions WHERE endpoint = ?1)
          OR (SELECT COUNT(*) FROM subscriptions) < ?5
       ON CONFLICT (endpoint) DO UPDATE SET
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         wake_times = excluded.wake_times`,
    ).bind(input.endpoint, input.p256dh, input.auth, JSON.stringify(input.wakeTimes), max).run();
    return result.meta.changes > 0;
  }

  async remove(endpoint: string) {
    await this.db.prepare('DELETE FROM subscriptions WHERE endpoint = ?1').bind(endpoint).run();
  }

  async all() {
    const { results } = await this.db.prepare('SELECT * FROM subscriptions').all<{ endpoint: string; p256dh: string; auth: string; wake_times: string }>();
    return results.map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, wakeTimes: JSON.parse(r.wake_times) as number[] }));
  }

  async setWakeTimes(endpoint: string, wakeTimes: number[]) {
    await this.db.prepare('UPDATE subscriptions SET wake_times = ?2 WHERE endpoint = ?1').bind(endpoint, JSON.stringify(wakeTimes)).run();
  }
}
