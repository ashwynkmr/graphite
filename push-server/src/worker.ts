// Graphite's reminder service. It stores a push address and the times the phone asked to be woken,
// and sends an empty wake-up at each. The phone decides the times and writes the message (0037, 0038).
import { sendEmptyPush } from './push';
import { sendDue } from './sender';
import { D1Store, type Store } from './store';
import { isPushEndpoint, originAllowed, parseSubscription } from './validate';

export interface Env {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ALLOWED_ORIGINS: string;
}

const MAX_SUBSCRIPTIONS = 20;
const BODY_LIMIT_BYTES = 4096;
const REQUESTS_PER_MINUTE = 30;

/** Best effort: each running copy counts on its own. The cap and the address checks are the real limits. */
const recent = new Map<string, { minute: number; count: number }>();

export function overLimit(ip: string, now: number): boolean {
  const minute = Math.floor(now / 60_000);
  const entry = recent.get(ip);
  if (recent.size > 1000) recent.clear();
  if (!entry || entry.minute !== minute) {
    recent.set(ip, { minute, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > REQUESTS_PER_MINUTE;
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  if (!origin || !originAllowed(origin, allowed)) return { Vary: 'Origin' };
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'PUT, DELETE', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' };
}

const json = (status: number, body: unknown, headers: Record<string, string>) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

async function readBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > BODY_LIMIT_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function handleRequest(request: Request, env: Env, store: Store, now = Date.now()): Promise<Response> {
  const cors = corsHeaders(request, env);
  const { pathname } = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method === 'GET' && pathname === '/health') return json(200, { ok: true }, cors);
  if (pathname !== '/subscription') return json(404, { error: 'not found' }, cors);
  if (overLimit(request.headers.get('CF-Connecting-IP') ?? 'local', now)) return json(429, { error: 'slow down' }, cors);

  if (request.method === 'PUT') {
    const input = parseSubscription(await readBody(request), now);
    if (!input) return json(400, { error: 'invalid' }, cors);
    const saved = await store.upsert(input, MAX_SUBSCRIPTIONS);
    return saved ? new Response(null, { status: 204, headers: cors }) : json(503, { error: 'full' }, cors);
  }
  if (request.method === 'DELETE') {
    const endpoint = ((await readBody(request)) as { endpoint?: unknown } | null)?.endpoint;
    if (!isPushEndpoint(endpoint)) return json(400, { error: 'invalid' }, cors);
    await store.remove(endpoint);
    return new Response(null, { status: 204, headers: cors });
  }
  return json(405, { error: 'not allowed' }, cors);
}

async function readyStore(env: Env): Promise<Store> {
  const store = new D1Store(env.DB);
  await store.init();
  return store;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env, await readyStore(env));
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const vapid = { publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT };
    const now = Date.now();
    ctx.waitUntil(
      readyStore(env)
        .then((store) => sendDue(store, (sub) => sendEmptyPush(sub.endpoint, vapid, now), now))
        .then((counts) => {
          if (counts.sent || counts.removed || counts.failed) console.log('Reminder round', counts);
        }),
    );
  },
};
