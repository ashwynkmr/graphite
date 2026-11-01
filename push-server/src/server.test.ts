import { PGlite } from '@electric-sql/pglite';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from './app.js';
import { SEND_WINDOW_MS, splitDue } from './schedule.js';
import { sendDue } from './sender.js';
import { MemoryStore, PgStore, type Store } from './store.js';
import { isPushEndpoint, originAllowed, parseSubscription } from './validate.js';

const FCM = 'https://fcm.googleapis.com/fcm/send/abc';
const NOW = 1_800_000_000_000;
const body = (over: object = {}) => ({ subscription: { endpoint: FCM, keys: { p256dh: 'p', auth: 'a' } }, wakeTimes: [NOW + 1000], ...over });
const input = { endpoint: FCM, p256dh: 'p', auth: 'a', wakeTimes: [NOW + 1000] };

describe('schedule', () => {
  it('sends for a time that has just come due and keeps later ones', () => {
    expect(splitDue([100, 200_000_000], 1000)).toEqual({ send: true, remaining: [200_000_000] });
  });

  it('sends once for several due together', () => {
    expect(splitDue([100, 200, 300], 1000)).toEqual({ send: true, remaining: [] });
  });

  it('spends a time too old to help, without sending', () => {
    expect(splitDue([100], 100 + SEND_WINDOW_MS)).toEqual({ send: false, remaining: [] });
    expect(splitDue([100], 99 + SEND_WINDOW_MS).send).toBe(true);
  });

  it('has nothing to send before the time', () => {
    expect(splitDue([5000], 1000)).toEqual({ send: false, remaining: [5000] });
    expect(splitDue([], 1000)).toEqual({ send: false, remaining: [] });
  });
});

describe('validation', () => {
  it('accepts a real subscription', () => {
    expect(parseSubscription(body(), NOW)).toEqual(input);
  });

  it('accepts only the browsers’ push services, so the server can’t be aimed elsewhere', () => {
    for (const ok of [FCM, 'https://web.push.apple.com/x', 'https://updates.push.services.mozilla.com/x', 'https://db5.notify.windows.com/x']) expect(isPushEndpoint(ok), ok).toBe(true);
    for (const bad of ['http://fcm.googleapis.com/x', 'https://evil.example/x', 'https://fcm.googleapis.com.evil.example/x', 'https://fcm.googleapis.com:8443/x', 'https://169.254.169.254/x', 'nonsense', 7, null]) expect(isPushEndpoint(bad), String(bad)).toBe(false);
  });

  it('rejects bad wake times or missing keys', () => {
    for (const wakeTimes of ['soon', [1.5], [-1], ['1'], [NOW + 41 * 86_400_000], Array(33).fill(NOW)]) expect(parseSubscription(body({ wakeTimes }), NOW), String(wakeTimes)).toBeNull();
    expect(parseSubscription(body({ wakeTimes: [] }), NOW)).not.toBeNull();
    expect(parseSubscription(body({ subscription: { endpoint: FCM, keys: {} } }), NOW)).toBeNull();
    expect(parseSubscription(null, NOW)).toBeNull();
  });

  it('matches origins exactly or by subdomain over https', () => {
    const allowed = ['https://ashwynkmr.github.io', '*.trycloudflare.com'];
    expect(originAllowed('https://ashwynkmr.github.io', allowed)).toBe(true);
    expect(originAllowed('https://a-b.trycloudflare.com', allowed)).toBe(true);
    expect(originAllowed('https://evil.example', allowed)).toBe(false);
    expect(originAllowed('https://eviltrycloudflare.com', allowed)).toBe(false);
    expect(originAllowed('http://a.trycloudflare.com', allowed)).toBe(false);
  });
});

function stores(): [string, () => Promise<Store>][] {
  return [
    ['memory', async () => new MemoryStore()],
    [
      'postgres',
      async () => {
        // Real Postgres, compiled to run in-process, so the SQL is tested as written.
        const db = new PGlite();
        const pool = { query: async (text: string, params?: unknown[]) => { const r = await db.query(text, params); return { rows: r.rows, rowCount: r.affectedRows ?? 0 }; } };
        const store = new PgStore(pool as unknown as ConstructorParameters<typeof PgStore>[0]);
        await store.init();
        return store;
      },
    ],
  ];
}

describe.each(stores())('%s store', (_name, make) => {
  it('adds, replaces and removes', async () => {
    const store = await make();
    expect(await store.upsert(input, 5)).toBe(true);
    expect(await store.upsert({ ...input, wakeTimes: [7, 8] }, 5)).toBe(true);
    expect(await store.all()).toEqual([{ ...input, wakeTimes: [7, 8] }]);
    await store.remove(FCM);
    expect(await store.all()).toEqual([]);
  });

  it('refuses a new phone at the cap, but still updates a known one', async () => {
    const store = await make();
    await store.upsert(input, 1);
    expect(await store.upsert({ ...input, endpoint: `${FCM}2` }, 1)).toBe(false);
    expect(await store.upsert({ ...input, wakeTimes: [9] }, 1)).toBe(true);
    expect((await store.all()).map((r) => r.wakeTimes)).toEqual([[9]]);
  });

  it('spends wake times', async () => {
    const store = await make();
    await store.upsert({ ...input, wakeTimes: [1, 2] }, 5);
    await store.setWakeTimes(FCM, [2]);
    expect((await store.all())[0]!.wakeTimes).toEqual([2]);
  });
});

describe('sendDue', () => {
  const now = NOW;
  const due = { ...input, wakeTimes: [NOW - 1000, NOW + 5000] };

  it('sends what’s due and spends it, once', async () => {
    const store = new MemoryStore();
    await store.upsert(due, 5);
    await store.upsert({ ...input, endpoint: `${FCM}2`, wakeTimes: [NOW + 5000] }, 5);
    const send = vi.fn(async () => {});
    expect(await sendDue(store, send, now)).toEqual({ sent: 1, removed: 0, failed: 0 });
    expect(await sendDue(store, send, now)).toEqual({ sent: 0, removed: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect((await store.all())[0]!.wakeTimes).toEqual([NOW + 5000]);
  });

  it('spends a stale time without sending', async () => {
    const store = new MemoryStore();
    await store.upsert({ ...input, wakeTimes: [NOW - SEND_WINDOW_MS] }, 5);
    const send = vi.fn(async () => {});
    expect((await sendDue(store, send, now)).sent).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect((await store.all())[0]!.wakeTimes).toEqual([]);
  });

  it('drops a subscription the phone has ended', async () => {
    const store = new MemoryStore();
    await store.upsert(due, 5);
    const send = vi.fn(async () => Promise.reject(Object.assign(new Error('gone'), { statusCode: 410 })));
    expect(await sendDue(store, send, now)).toEqual({ sent: 0, removed: 1, failed: 0 });
    expect(await store.all()).toEqual([]);
  });

  it('retries after a temporary failure, and one failure doesn’t stop the rest', async () => {
    const store = new MemoryStore();
    await store.upsert(due, 5);
    await store.upsert({ ...due, endpoint: `${FCM}2` }, 5);
    const send = vi.fn<(s: { endpoint: string }) => Promise<void>>(async (s) => {
      if (s.endpoint === FCM) throw Object.assign(new Error('busy'), { statusCode: 503 });
    });
    expect(await sendDue(store, send, now)).toEqual({ sent: 1, removed: 0, failed: 1 });
    expect((await store.all()).find((s) => s.endpoint === FCM)!.wakeTimes).toEqual(due.wakeTimes);
  });
});

describe('http', () => {
  const app = async (max = 5) => {
    const store = new MemoryStore();
    return { store, server: await buildApp({ store, allowedOrigins: ['https://ashwynkmr.github.io'], maxSubscriptions: max }) };
  };

  it('saves and removes a subscription', async () => {
    const { store, server } = await app();
    expect((await server.inject({ method: 'PUT', url: '/subscription', payload: body({ wakeTimes: [Date.now() + 1000] }) })).statusCode).toBe(204);
    expect(await store.all()).toHaveLength(1);
    expect((await server.inject({ method: 'DELETE', url: '/subscription', payload: { endpoint: FCM } })).statusCode).toBe(204);
    expect(await store.all()).toHaveLength(0);
  });

  it('refuses bad input and a full store', async () => {
    const { server } = await app(0);
    expect((await server.inject({ method: 'PUT', url: '/subscription', payload: { endpoint: 'https://evil.example' } })).statusCode).toBe(400);
    expect((await server.inject({ method: 'PUT', url: '/subscription', payload: body({ wakeTimes: [Date.now() + 1000] }) })).statusCode).toBe(503);
  });

  it('grants cross-origin access only to the app', async () => {
    const { server } = await app();
    const headers = (origin: string) => server.inject({ method: 'OPTIONS', url: '/subscription', headers: { origin, 'access-control-request-method': 'PUT' } });
    expect((await headers('https://ashwynkmr.github.io')).headers['access-control-allow-origin']).toBe('https://ashwynkmr.github.io');
    expect((await headers('https://evil.example')).headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers a health check', async () => {
    const { server } = await app();
    expect((await server.inject({ url: '/health' })).json()).toEqual({ ok: true });
  });
});
