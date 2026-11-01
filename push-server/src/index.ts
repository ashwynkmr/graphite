// Graphite's reminders. It stores a push address and the times the phone asked to be woken, and
// sends an empty wake-up at each. The phone decides the times and writes the message (decision 0037).
import pg from 'pg';
import webpush from 'web-push';
import { buildApp } from './app.js';
import { sendDue } from './sender.js';
import { MemoryStore, PgStore, type Store } from './store.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const CHECK_EVERY_MS = 60_000;
const MAX_SUBSCRIPTIONS = 50;
/** A reminder that can't arrive within this many seconds isn't worth delivering. */
const TTL_SECONDS = 60 * 60;

webpush.setVapidDetails(required('VAPID_SUBJECT'), required('VAPID_PUBLIC_KEY'), required('VAPID_PRIVATE_KEY'));

const databaseUrl = process.env.DATABASE_URL;
const store: Store = databaseUrl ? new PgStore(new pg.Pool({ connectionString: databaseUrl })) : new MemoryStore();
if (!databaseUrl) console.warn('No DATABASE_URL: subscriptions are in memory and a restart loses them.');
await store.init();

const allowedOrigins = required('ALLOWED_ORIGINS').split(',').map((o) => o.trim()).filter(Boolean);
const app = await buildApp({ store, allowedOrigins, maxSubscriptions: MAX_SUBSCRIPTIONS });
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
console.log('Graphite push server listening');

let running = false;
setInterval(async () => {
  // A slow round must not overlap the next one, or a phone could get two reminders.
  if (running) return;
  running = true;
  try {
    const counts = await sendDue(
      store,
      async (sub) => {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, null, { TTL: TTL_SECONDS });
      },
      Date.now(),
    );
    if (counts.sent || counts.removed || counts.failed) console.log('Reminder round', counts);
  } catch (e) {
    console.error('Reminder round failed:', (e as Error).message);
  } finally {
    running = false;
  }
}, CHECK_EVERY_MS);
