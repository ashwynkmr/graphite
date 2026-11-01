import type pg from 'pg';
import type { SubscriptionInput } from './validate.js';

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

/** Prefixed table, so it can share a database with another app on the same free plan. */
export class PgStore implements Store {
  constructor(private pool: Pick<pg.Pool, 'query'>) {}

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS graphite_push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        wake_times JSONB NOT NULL
      )`);
  }

  async upsert(input: SubscriptionInput, max: number) {
    // One statement, so two phones signing up together can't both pass the cap check.
    const result = await this.pool.query(
      `INSERT INTO graphite_push_subscriptions (endpoint, p256dh, auth, wake_times)
       SELECT $1::text, $2::text, $3::text, $4::jsonb
       WHERE EXISTS (SELECT 1 FROM graphite_push_subscriptions WHERE endpoint = $1::text)
          OR (SELECT COUNT(*) FROM graphite_push_subscriptions) < $5::int
       ON CONFLICT (endpoint) DO UPDATE SET
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         wake_times = EXCLUDED.wake_times`,
      [input.endpoint, input.p256dh, input.auth, JSON.stringify(input.wakeTimes), max],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async remove(endpoint: string) {
    await this.pool.query('DELETE FROM graphite_push_subscriptions WHERE endpoint = $1', [endpoint]);
  }

  async all() {
    const result = await this.pool.query<{ endpoint: string; p256dh: string; auth: string; wake_times: number[] }>('SELECT * FROM graphite_push_subscriptions');
    return result.rows.map((r) => ({ endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, wakeTimes: r.wake_times }));
  }

  async setWakeTimes(endpoint: string, wakeTimes: number[]) {
    await this.pool.query('UPDATE graphite_push_subscriptions SET wake_times = $2::jsonb WHERE endpoint = $1', [endpoint, JSON.stringify(wakeTimes)]);
  }
}
