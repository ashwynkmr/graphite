import { Miniflare } from 'miniflare';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { sendEmptyPush, signVapid } from './push';
import { SEND_WINDOW_MS, splitDue } from './schedule';
import { sendDue } from './sender';
import { D1Store, MemoryStore, type Store } from './store';
import { isPushEndpoint, originAllowed, parseSubscription } from './validate';
import { handleRequest, overLimit, type Env } from './worker';

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

  it('accepts only the browsers’ push services, so the service can’t be aimed elsewhere', () => {
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

// Cloudflare's own database engine, running locally, so the SQL is tested as written.
let mf: Miniflare;
let db: D1Database;
beforeAll(async () => {
  mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("ok") } }', d1Databases: ['DB'] });
  db = (await mf.getD1Database('DB')) as unknown as D1Database;
});
afterAll(() => mf.dispose());

function stores(): [string, () => Promise<Store>][] {
  return [
    ['memory', async () => new MemoryStore()],
    [
      'D1',
      async () => {
        await db.prepare('DROP TABLE IF EXISTS subscriptions').run();
        const store = new D1Store(db);
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
  const due = { ...input, wakeTimes: [NOW - 1000, NOW + 5000] };

  it('sends what’s due and spends it, once', async () => {
    const store = new MemoryStore();
    await store.upsert(due, 5);
    await store.upsert({ ...input, endpoint: `${FCM}2`, wakeTimes: [NOW + 5000] }, 5);
    const send = vi.fn(async () => {});
    expect(await sendDue(store, send, NOW)).toEqual({ sent: 1, removed: 0, failed: 0 });
    expect(await sendDue(store, send, NOW)).toEqual({ sent: 0, removed: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect((await store.all())[0]!.wakeTimes).toEqual([NOW + 5000]);
  });

  it('spends a stale time without sending', async () => {
    const store = new MemoryStore();
    await store.upsert({ ...input, wakeTimes: [NOW - SEND_WINDOW_MS] }, 5);
    const send = vi.fn(async () => {});
    expect((await sendDue(store, send, NOW)).sent).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect((await store.all())[0]!.wakeTimes).toEqual([]);
  });

  it('drops a subscription the phone has ended', async () => {
    const store = new MemoryStore();
    await store.upsert(due, 5);
    const send = vi.fn(async () => Promise.reject(Object.assign(new Error('gone'), { statusCode: 410 })));
    expect(await sendDue(store, send, NOW)).toEqual({ sent: 0, removed: 1, failed: 0 });
    expect(await store.all()).toEqual([]);
  });

  it('retries after a temporary failure, and one failure doesn’t stop the rest', async () => {
    const store = new MemoryStore();
    await store.upsert(due, 5);
    await store.upsert({ ...due, endpoint: `${FCM}2` }, 5);
    const send = vi.fn<(s: { endpoint: string }) => Promise<void>>(async (s) => {
      if (s.endpoint === FCM) throw Object.assign(new Error('busy'), { statusCode: 503 });
    });
    expect(await sendDue(store, send, NOW)).toEqual({ sent: 1, removed: 0, failed: 1 });
    expect((await store.all()).find((s) => s.endpoint === FCM)!.wakeTimes).toEqual(due.wakeTimes);
  });
});

describe('empty push', () => {
  const toB64 = (b: ArrayBuffer | Uint8Array) => Buffer.from(b as ArrayBuffer).toString('base64url');
  async function keys() {
    const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const raw = (await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer;
    const jwk = (await crypto.subtle.exportKey('jwk', pair.privateKey)) as JsonWebKey;
    return { pair, vapid: { publicKey: toB64(raw), privateKey: jwk.d!, subject: 'https://example.com/x' } };
  }

  it('signs a token the public key verifies, for the push service’s origin', async () => {
    const { pair, vapid } = await keys();
    const token = await signVapid('https://fcm.googleapis.com', vapid, NOW);
    const [h, c, s] = token.split('.') as [string, string, string];
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
    expect(JSON.parse(Buffer.from(c, 'base64url').toString())).toEqual({ aud: 'https://fcm.googleapis.com', exp: NOW / 1000 + 43_200, sub: 'https://example.com/x' });
  });

  it('posts with no message body', async () => {
    const { vapid } = await keys();
    const send = vi.fn(async () => new Response(null, { status: 201 }));
    await sendEmptyPush(FCM, vapid, NOW, send as unknown as typeof fetch);
    const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(FCM);
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>).Authorization).toContain(`k=${vapid.publicKey}`);
  });

  it('reports the status when refused, so a gone phone can be dropped', async () => {
    const { vapid } = await keys();
    await expect(sendEmptyPush(FCM, vapid, NOW, (async () => new Response(null, { status: 410 })) as unknown as typeof fetch)).rejects.toMatchObject({ statusCode: 410 });
  });
});

describe('http', () => {
  const env = { ALLOWED_ORIGINS: 'https://ashwynkmr.github.io' } as Env;
  const req = (method: string, path: string, payload?: unknown, headers: Record<string, string> = {}) =>
    new Request(`https://x.dev${path}`, { method, body: payload === undefined ? undefined : JSON.stringify(payload), headers: { 'CF-Connecting-IP': `ip-${Math.random()}`, ...headers } });

  it('saves and removes a subscription', async () => {
    const store = new MemoryStore();
    expect((await handleRequest(req('PUT', '/subscription', body()), env, store, NOW)).status).toBe(204);
    expect(await store.all()).toHaveLength(1);
    expect((await handleRequest(req('DELETE', '/subscription', { endpoint: FCM }), env, store, NOW)).status).toBe(204);
    expect(await store.all()).toHaveLength(0);
  });

  it('refuses bad input and oversize bodies', async () => {
    const store = new MemoryStore();
    expect((await handleRequest(req('PUT', '/subscription', { endpoint: 'https://evil.example' }), env, store, NOW)).status).toBe(400);
    expect((await handleRequest(req('PUT', '/subscription', { pad: 'x'.repeat(5000), ...body() }), env, store, NOW)).status).toBe(400);
    expect((await handleRequest(new Request('https://x.dev/subscription', { method: 'PUT', body: 'not json' }), env, store, NOW)).status).toBe(400);
    expect(await store.all()).toEqual([]);
  });

  it('grants cross-origin access only to the app', async () => {
    const headers = async (origin: string) => (await handleRequest(req('OPTIONS', '/subscription', undefined, { Origin: origin }), env, new MemoryStore(), NOW)).headers;
    expect((await headers('https://ashwynkmr.github.io')).get('Access-Control-Allow-Origin')).toBe('https://ashwynkmr.github.io');
    expect((await headers('https://evil.example')).get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('answers a health check', async () => {
    const response = await handleRequest(req('GET', '/health'), env, new MemoryStore(), NOW);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('slows down a flood from one address, per minute', () => {
    const results = Array.from({ length: 31 }, () => overLimit('flood', NOW));
    expect(results.slice(0, 30).every((r) => !r)).toBe(true);
    expect(results[30]).toBe(true);
    expect(overLimit('flood', NOW + 60_000)).toBe(false);
  });
});
